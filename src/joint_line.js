//-------------------------------------------------------------------------------------------------
// Line Joint
//
// d = p2 - p1
// n = normalize(perp(d))
// C = dot(n, d)
// Cdot = dot(d, dn/dt) + dot(n dd/dt)
//      = dot(d, cross(w1, n)) + dot(n, v2 + cross(w2, r2) - v1 - cross(w1, r1))
//      = dot(d, cross(w1, n)) + dot(n, v2) + dot(n, cross(w2, r2)) - dot(n, v1) - dot(n, cross(w1, r1))
//      = -dot(n, v1) - dot(cross(d + r1, n), w1) + dot(n, v2) + dot(cross(r2, n), w2)
// J = [ -n, -s1, n, s2 ]
// s1 = cross(r1 + d, n)
// s2 = cross(r2, n)
//
// impulse = JT * lambda = [ -n * lambda, -(s1 * lambda), n * lambda, s2 * lambda ]
//
// Motor rotational constraint
// Cdot = w2 - w1
// J = [ 0, -1, 0, 1 ]
//-------------------------------------------------------------------------------------------------

LineJoint = function(body1, body2, anchor1, anchor2) {
	Joint.call(this, Joint.TYPE_LINE, body1, body2, true);

	// Local anchor points
	this.anchor1 = this.body1.getLocalPoint(anchor1);
	this.anchor2 = this.body2.getLocalPoint(anchor2);

	var d = vec2.sub(anchor2, anchor1);

	// Body1's local line normal
	this.n_local = this.body1.getLocalVector(vec2.normalize(vec2.perp(d)));	
	
   	// Accumulated impulse
	this.lambda_acc = 0;
	this.motorLambda_acc = 0;

	// Motor
	this.motorEnabled = false;
	this.motorSpeed = 0;
	this.maxMotorTorque = 0;
}

LineJoint.prototype = new Joint;
LineJoint.prototype.constructor = LineJoint;

LineJoint.prototype.setWorldAnchor1 = function(anchor1) {
	this.anchor1 = this.body1.getLocalPoint(anchor1);

	var d = vec2.sub(this.getWorldAnchor2(), anchor1);

	this.n_local = this.body1.getLocalVector(vec2.normalize(vec2.perp(d)));
}

LineJoint.prototype.setWorldAnchor2 = function(anchor2) {
	this.anchor2 = this.body2.getLocalPoint(anchor2);

	var d = vec2.sub(anchor2, this.getWorldAnchor1());

	this.n_local = this.body1.getLocalVector(vec2.normalize(vec2.perp(d)));
}

LineJoint.prototype.serialize = function() {
	return {
		"type": "LineJoint",
		"body1": this.body1.id, 
		"body2": this.body2.id,
		"anchor1": this.body1.getWorldPoint(this.anchor1),
		"anchor2": this.body2.getWorldPoint(this.anchor2),
		"collideConnected": this.collideConnected,
		"maxForce": this.maxForce,
		"breakable": this.breakable,
		"motorEnabled": this.motorEnabled,
		"motorSpeed": this.motorSpeed,
		"maxMotorTorque": this.maxMotorTorque
	};
}

LineJoint.prototype.enableMotor = function(flag) {
	this.motorEnabled = flag;
}

LineJoint.prototype.setMotorSpeed = function(speed) {
	this.motorSpeed = speed;
}

LineJoint.prototype.setMaxMotorTorque = function(torque) {
	this.maxMotorTorque = torque;
}

LineJoint.prototype.initSolver = function(dt, warmStarting) {
	var body1 = this.body1;
	var body2 = this.body2;

	// Max impulse
	this.maxImpulse = this.maxForce * dt;	
		
	// Transformed r1, r2
	this.r1 = body1.xf.rotate(vec2.sub(this.anchor1, body1.centroid));
	this.r2 = body2.xf.rotate(vec2.sub(this.anchor2, body2.centroid));	

	// World anchor points
	var p1 = vec2.add(body1.p, this.r1);
	var p2 = vec2.add(body2.p, this.r2);

	// Delta vector between world anchor points
	var d = vec2.sub(p2, p1);

	// r1 + d
	this.r1_d = vec2.add(this.r1, d);

	// World line normal
	this.n = vec2.normalize(vec2.perp(d));
	
	// s1, s2
    this.s1 = vec2.cross(this.r1_d, this.n);
    this.s2 = vec2.cross(this.r2, this.n);

	// invEM = J * invM * JT
    var em_inv = body1.m_inv + body2.m_inv + body1.i_inv * this.s1 * this.s1 + body2.i_inv * this.s2 * this.s2;    
	this.em = em_inv > 0 ? 1 / em_inv : em_inv;

	if (this.motorEnabled) {
		this.maxMotorImpulse = this.maxMotorTorque * dt;

		// invEM2 = J2 * invM * J2T
		var motorEm_inv = body1.i_inv + body2.i_inv;
		this.motorEm = motorEm_inv > 0 ? 1 / motorEm_inv : motorEm_inv;
	}
	else {
		this.motorLambda_acc = 0;
		this.motorEm = 0;
	}
	
	if (warmStarting) {
		// Apply cached constraint impulses
		// V += JT * lambda * invM
		var j = vec2.scale(this.n, this.lambda_acc);

		body1.v.mad(j, -body1.m_inv);
		body1.w -= (this.s1 * this.lambda_acc + this.motorLambda_acc) * body1.i_inv;

		body2.v.mad(j, body2.m_inv);
		body2.w += (this.s2 * this.lambda_acc + this.motorLambda_acc) * body2.i_inv;
	}
	else {
		this.lambda_acc = 0;
		this.motorLambda_acc = 0;
	}
}

LineJoint.prototype.solveVelocityConstraints = function() {
	var body1 = this.body1;
	var body2 = this.body2;

	// Solve motor constraint
	if (this.motorEnabled) {
		// Compute motor impulse
		var cdot = body2.w - body1.w - this.motorSpeed;
		var lambda = -this.motorEm * cdot;

		var motorLambdaOld = this.motorLambda_acc;
		this.motorLambda_acc = Math.clamp(this.motorLambda_acc + lambda, -this.maxMotorImpulse, this.maxMotorImpulse);
		lambda = this.motorLambda_acc - motorLambdaOld;

		// Apply motor impulses
		body1.w -= lambda * body1.i_inv;
		body2.w += lambda * body2.i_inv;
	}

	// Compute lambda for velocity constraint
	// Solve J * invM * JT * lambda = -J * V
   	var cdot = this.n.dot(vec2.sub(body2.v, body1.v)) + this.s2 * body2.w - this.s1 * body1.w;
	var lambda = -this.em * cdot;

	// Accumulate lambda for velocity constraint
	this.lambda_acc += lambda;

	// Apply constraint impulses
	// V += JT * lambda * invM
	var j = vec2.scale(this.n, lambda);

	body1.v.mad(j, -body1.m_inv);
	body1.w -= this.s1 * lambda * body1.i_inv;

	body2.v.mad(j, body2.m_inv);
	body2.w += this.s2 * lambda * body2.i_inv;
}

LineJoint.prototype.solvePositionConstraints = function() {
	var body1 = this.body1;
	var body2 = this.body2;

	// Transformed r1, r2
	var r1 = vec2.rotate(vec2.sub(this.anchor1, body1.centroid), body1.a);
	var r2 = vec2.rotate(vec2.sub(this.anchor2, body2.centroid), body2.a);

	// World anchor points
	var p1 = vec2.add(body1.p, r1);
	var p2 = vec2.add(body2.p, r2);

	// Delta vector between world anchor points
	var d = vec2.sub(p2, p1);

	// r1 + d
	var r1_d = vec2.add(r1, d);

	// World line normal
	var n = vec2.rotate(this.n_local, body1.a);

	// Position constraint
	var c = vec2.dot(n, d);
	var correction = Math.clamp(c, -Joint.MAX_LINEAR_CORRECTION, Joint.MAX_LINEAR_CORRECTION);
	
	// Compute lambda for position constraint
	// Solve J * invM * JT * lambda = -C
   	var s1 = vec2.cross(r1_d, n);
   	var s2 = vec2.cross(r2, n);
   	var em_inv = body1.m_inv + body2.m_inv + body1.i_inv * s1 * s1 + body2.i_inv * s2 * s2;
	var k_inv = em_inv == 0 ? 0 : 1 / em_inv;
	var lambda = k_inv * (-correction);

	// Apply constraint impulses
	// X += JT * lambda * invM * dt
	var j = vec2.scale(n, lambda);

	body1.p.mad(j, -body1.m_inv);
	body1.a -= s1 * lambda * body1.i_inv;

	body2.p.mad(j, body2.m_inv);
	body2.a += s2 * lambda * body2.i_inv;

	return Math.abs(c) < Joint.LINEAR_SLOP;
}

LineJoint.prototype.getReactionForce = function(dt_inv) {
	return vec2.scale(this.n, this.lambda_acc * dt_inv);
}

LineJoint.prototype.getReactionTorque = function(dt_inv) {
	return 0;
}


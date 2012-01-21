//-------------------------------------------------------------------------------------------------
// Mouse Joint
//
// p = attached point, m = mouse point (constant)
// C = p - m
// Cdot = v + cross(w, r)
// J = [ I, -skew(r) ]
//
// JT * lambda = [ lambda_xy, cross(r2, lambda_xy) ]
//-------------------------------------------------------------------------------------------------

MouseJoint = function(mouseBody, body, anchor1, anchor2) {
	if (arguments.length == 0)
		return;

	Joint.call(this, mouseBody, body, true);

	this.anchor1 = anchor1;
	this.anchor2 = anchor2;

	this.frequencyHz = 5;
	this.dampingRatio = 0.8;

	// Accumulated impulse
	this.lambda_acc = new vec2(0, 0);
}

MouseJoint.prototype = new Joint;
MouseJoint.prototype.constructor = MouseJoint;

MouseJoint.prototype.initSolver = function(dt, warmStarting) {
	var body1 = this.body1;
	var body2 = this.body2;

	// Max impulse
	this.maxImpulse = this.maxForce * dt;
		
	// Transformed r
	this.r2 = vec2.rotate(this.anchor2, body2.a);
		
	// invEM = J * invM * JT
	var r2 = this.r2;
	var r2y_i = r2.y * body2.i_inv;
	var k11 = body2.m_inv + r2.y * r2y_i;
	var k12 = -r2.x * r2y_i;
	var k22 = body2.m_inv + r2.x * r2.x * body2.i_inv;
	this.em_inv = new mat2(k11, k12, k12, k22);

	// Position constraint
	var c = vec2.sub(vec2.add(body2.p, this.r2), body1.p);

	// Frequency
	var omega = 2 * Math.PI * this.frequencyHz;

	// Spring stiffness
	var k = body2.m * (omega * omega);

	// Damping coefficients
	var d = body2.m * 2 * this.dampingRatio * omega;

	// Soft constraint formulas
	var gamma = dt * (d + k * dt);
	this.gamma = gamma == 0 ? 0 : 1 / gamma;
	var beta = dt * k * this.gamma;
	this.bias = vec2.scale(c, beta);

	if (warmStarting) {
		// Apply cached impulses
		// V += JT * lambda
		body2.v.mad(this.lambda_acc, body2.m_inv);
		body2.w += vec2.cross(this.r2, this.lambda_acc) * body2.i_inv;
	}
	else {
		this.lambda_acc.set(0, 0);
	}
}

MouseJoint.prototype.solveVelocityConstraints = function() {
	var body1 = this.body1;
	var body2 = this.body2;

	// Compute lambda for velocity constraint
	// Solve J * invM * JT * lambda = -(J * v + beta * C/h + gamma * lambda)
	// in 2D: cross(w, r) = perp(r) * w
   	var cdot = vec2.mad(body2.v, vec2.perp(this.r2), body2.w);
   	var magic = vec2.mad(this.bias, this.lambda_acc, this.gamma);
	var lambda = this.em_inv.solve(vec2.add(cdot, magic).neg());

	// Accumulate lambda for velocity constraint
	var lambda_old = this.lambda_acc;
	this.lambda_acc.addself(lambda);
	if (this.lambda_acc.lengthsq() > this.maxImpulse * this.maxImpulse) {
		this.lambda_acc.scale(this.maxImpulse / this.lambda_acc.length());
	}
	lambda = vec2.sub(this.lambda_acc, lambda_old);

	// Apply impulse
	// V += JT * lambda
	body2.v.mad(lambda, body2.m_inv);
	body2.w += vec2.cross(this.r2, lambda) * body2.i_inv;
}

MouseJoint.prototype.solvePositionConstraints = function() {
	return true;
}

MouseJoint.prototype.getReactionForce = function(dt_inv) {
	return vec2.scale(this.lambda_acc, dt_inv);
}

MouseJoint.prototype.getReactionTorque = function(dt_inv) {
	return 0;
}


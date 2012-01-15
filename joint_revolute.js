//-------------------------------------------------------------------------------------------------
// Revolute Joint (Point-to-Point Joint)
//
// C = p2 - p1
// dC/dt = v2 + cross(w2, r2) - v1 - cross(w1, r1)
//       = -v1 + cross(r1, w1) + v2 - cross(r2, w1)
// J = [ -I, skew(r1), I, -skew(r2) ]
//-------------------------------------------------------------------------------------------------

RevoluteJoint = function(body1, body2, pivot) {
	Joint.call(this, body1, body2, true);

	this.anchor1 = body1.worldToLocal(pivot);
	this.anchor2 = body2.worldToLocal(pivot);

	this.lambda_acc = new vec2(0, 0);

	// angle limit
	this.limitEnabled = false;
	this.limitLowerAngle = 0;
	this.limitUpperAngle = 0;

	// motor
	this.motorEnabled = false;
	this.motorSpeed = 0;
	this.maxMotorTorque = 0;	
}

RevoluteJoint.prototype = new Joint;
RevoluteJoint.prototype.constructor = RevoluteJoint;

RevoluteJoint.prototype.enableMotor = function(flag) {
	this.motorEnabled = flag;
}

RevoluteJoint.prototype.setMortorSpeed = function(speed) {
	this.motorSpeed = speed;
}

RevoluteJoint.prototype.setMaxMotorTorque = function(torque) {
	this.maxMotorTorque = torque;
}

RevoluteJoint.prototype.enableLimit = function(flag) {
	this.limitEnabled = flag;
}

RevoluteJoint.prototype.setLimits = function(lower, upper) {
	this.limitLowerAngle = lower;
	this.limitUpperAngle = upper;
}

RevoluteJoint.prototype.initSolver = function(dt, warmStarting) {
	var body1 = this.body1;
	var body2 = this.body2;

	// transformed r1, r2
	this.r1 = vec2.rotate(this.anchor1, body1.a);
	this.r2 = vec2.rotate(this.anchor2, body2.a);
	
	// K = J * invM * JT
	var sum_m_inv = body1.m_inv + body2.m_inv;
	var r1 = this.r1;
	var r2 = this.r2;
	var r1y_i = r1.y * body1.i_inv;
	var r2y_i = r2.y * body2.i_inv;	
	var k11 = sum_m_inv + r1.y * r1y_i + r2.y * r2y_i;
	var k12 = -r1.x * r1y_i - r2.x * r2y_i;
	var k22 = sum_m_inv + r1.x * r1.x * body1.i_inv + r2.x * r2.x * body2.i_inv;
	this.k = new mat2(k11, k12, k12, k22);
	
	// max impulse
	this.j_max = this.max_force * dt;

	if (warmStarting) {
		// apply cached impulses
		// V += JT * lambda
		body1.v.mad(this.lambda_acc, -body1.m_inv);
		body1.w -= vec2.cross(this.r1, this.lambda_acc) * body1.i_inv;

		body2.v.mad(this.lambda_acc, body2.m_inv);
		body2.w += vec2.cross(this.r2, this.lambda_acc) * body2.i_inv;
	}
	else {
		this.lambda_acc.set(0, 0);
	}
}

RevoluteJoint.prototype.solveVelocityConstraints = function() {
	var body1 = this.body1;
	var body2 = this.body2;

	// compute lambda for velocity constraint
	// solve J * invM * JT * lambda = -J * v
	// in 2D: cross(w, r) = perp(r) * w
	var v1 = vec2.mad(body1.v, vec2.perp(this.r1), body1.w);
   	var v2 = vec2.mad(body2.v, vec2.perp(this.r2), body2.w);
   	var jv = vec2.sub(v2, v1);
	var lambda = this.k.solve(jv.neg());

	// accumulate lambda for velocity constraint
	this.lambda_acc.addself(lambda);

	// apply impulses
	// V += JT * lambda
	body1.v.mad(lambda, -body1.m_inv);
	body1.w -= vec2.cross(this.r1, lambda) * body1.i_inv;

	body2.v.mad(lambda, body2.m_inv);
	body2.w += vec2.cross(this.r2, lambda) * body2.i_inv;
}

RevoluteJoint.prototype.solvePositionConstraints = function() {
	var body1 = this.body1;
	var body2 = this.body2;

	// transformed r1, r2
	var r1 = vec2.rotate(this.anchor1, body1.a);
	var r2 = vec2.rotate(this.anchor2, body2.a);

	// position constraint
	var c = vec2.sub(vec2.add(body2.p, r2), vec2.add(body1.p, r1));
	var correction = vec2.truncate(c, this.max_linear_correction);

	// compute lambda for position constraint
	// solve J * invM * JT * lambda = -C
	var sum_m_inv = body1.m_inv + body2.m_inv;
	var r1y_i = r1.y * body1.i_inv;
	var r2y_i = r2.y * body2.i_inv;	
	var k11 = sum_m_inv + r1.y * r1y_i + r2.y * r2y_i;
	var k12 = -r1.x * r1y_i - r2.x * r2y_i;
	var k22 = sum_m_inv + r1.x * r1.x * body1.i_inv + r2.x * r2.x * body2.i_inv;
	var k = new mat2(k11, k12, k12, k22);
	var lambda = k.solve(correction.neg());
	
	// apply impulses
	// X += JT * lambda * dt
	body1.p.mad(lambda, -body1.m_inv);
	body1.a -= vec2.cross(r1, lambda) * body1.i_inv;

	body2.p.mad(lambda, body2.m_inv);
	body2.a += vec2.cross(r2, lambda) * body2.i_inv;

	return c.length() < Joint.LINEAR_SLOP;
}

RevoluteJoint.prototype.getReactionForce = function(dt_inv) {
	return vec2.scale(this.lambda_acc, dt_inv);
}

RevoluteJoint.prototype.getReactionTorque = function(dt_inv) {
	return 0;
}
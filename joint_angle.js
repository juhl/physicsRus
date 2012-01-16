//-------------------------------------------------------------------------------------------------
// Angle Joint
//
// C = a2 - a1 - refAngle
// dC/dt = w2 - w1
// J = [0, -1, 0, 1]
//
// JT * lambda = [ 0, -lambda, 0, lambda ]
//-------------------------------------------------------------------------------------------------

AngleJoint = function(body1, body2) {
	Joint.call(this, body1, body2, false); // default not to collide with angle joint

	// initial angle difference
	this.refAngle = body2.a - body1.a;

	// accumulated lambda for angular velocity constraint
	this.lambda_acc = 0;
}

AngleJoint.prototype = new Joint;
AngleJoint.prototype.constructor = AngleJoint;

AngleJoint.prototype.initSolver = function(dt, warmStarting) {
	var body1 = this.body1;
	var body2 = this.body2;

	// K = J * invM * JT
	var k = body1.i_inv + body2.i_inv;
	this.k_inv = k == 0 ? 0 : 1 / k;

	// Max impulse
	this.j_max = this.max_force * dt;

	if (warmStarting) {
		// Apply cached impulses
		// V += JT * lambda		
		body1.w -= this.lambda_acc * body1.i_inv;
		body2.w += this.lambda_acc * body2.i_inv;
	}
	else {
		this.lambda_acc = 0;
	}
}

AngleJoint.prototype.solveVelocityConstraints = function() {
	var body1 = this.body1;
	var body2 = this.body2;

	// Compute lambda for velocity constraint
	// Solve J * invM * JT * lambda = -J * v
	var jv = body2.w - body1.w;
	var lambda = this.k_inv * (-jv);

	// Accumulate lambda for angular velocity constraint
	this.lambda_acc += lambda;

	// Apply impulses
	// V += JT * lambda
	body1.w -= lambda * body1.i_inv;
	body2.w += lambda * body2.i_inv;
}

AngleJoint.prototype.solvePositionConstraints = function() {
	var body1 = this.body1;
	var body2 = this.body2;

	// Position (angle) constraint
	var c = body2.a - body1.a - this.refAngle;
	var correction = Math.clamp(c, -this.max_angular_correction, this.max_angular_correction);

	// Compute lambda for position (angle) constraint
	// Solve J * invM * JT * lambda = -C
	var lambda = this.k_inv * (-correction);

	// Apply impulses
	// X += JT * lambda * dt
	body1.a -= lambda * body1.i_inv;
	body2.a += lambda * body2.i_inv;

	return Math.abs(c) < Joint.ANGULAR_SLOP;
}

AngleJoint.prototype.getReactionForce = function(dt_inv) {
	return vec2.zero;
}

AngleJoint.prototype.getReactionTorque = function(dt_inv) {
	return this.lambda_acc * dt_inv;
}
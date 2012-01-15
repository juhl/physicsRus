//-------------------------------------------------------------------------------------------------
// Mouse Joint
//
// p = attached point, m = mouse point (constant)
// C = p - m
// dC/dt = v + cross(w, r)
// J = [ I, -skew(r) ]
//-------------------------------------------------------------------------------------------------

MouseJoint = function(body1, body2, anchor1, anchor2) {
	if (arguments.length == 0)
		return;

	Joint.call(this, body1, body2, true);

	this.anchor1 = anchor1;
	this.anchor2 = anchor2;	

	this.lambda_acc = new vec2(0, 0);
}

MouseJoint.prototype = new Joint;
MouseJoint.prototype.constructor = MouseJoint;

MouseJoint.prototype.initSolver = function(dt, warmStarting) {
	var body1 = this.body1;
	var body2 = this.body2;
		
	// transformed r1, r2
	this.r1 = vec2.rotate(this.anchor1, body1.a);
	this.r2 = vec2.rotate(this.anchor2, body2.a);
		
	// K = J * invM * JT	
	var r1 = this.r1;
	var r2 = this.r2;
	var r2y_i = r2.y * body2.i_inv;
	var k11 = body2.m_inv + r2.y * r2y_i;
	var k12 = -r2.x * r2y_i;
	var k22 = body2.m_inv + r2.x * r2.x * body2.i_inv;
	this.k = new mat2(k11, k12, k12, k22);
	
	// max impulse
	this.j_max = this.max_force * dt;

	if (warmStarting) {
		// apply cached impulses
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

	// compute lambda for velocity constraint	
	// solve J * invM * JT * lambda = -J * v
	// in 2D: cross(w, r) = perp(r) * w
   	var jv = vec2.mad(body2.v, vec2.perp(this.r2), body2.w);
	var lambda = this.k.solve(jv.neg());

	// accumulate lambda for velocity constraint
	this.lambda_acc.addself(lambda);

	// apply impulse
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


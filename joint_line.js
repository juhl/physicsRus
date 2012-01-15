//-------------------------------------------------------------------------------------------------
// Line Joint
//
// d = p2 - p1
// n = normalize(perp(d))
// C = dot(n, d)
// dC/dt = dot(d, dn/dt) + dot(n dd/dt)
//       = dot(d, cross(w1, n)) + dot(n, v2 + cross(w2, r2) - v1 - cross(w1, r1))
//       = dot(d, cross(w1, n)) + dot(n, v2) + dot(n, cross(w2, r2)) - dot(n, v1) - dot(n, cross(w1, r1))
//       = -dot(n, v1) - dot(cross(d + r1, n), w1) + dot(n, v2) + dot(cross(r2, n), w2)
// J = [ -n, -s1, n, s2 ]
// s1 = cross(r1 + d, n)
// s2 = cross(r2, n)
//-------------------------------------------------------------------------------------------------

LineJoint = function(body1, body2, anchor1, anchor2) {
	Joint.call(this, body1, body2, true);

	this.anchor1 = anchor1;
	this.anchor2 = anchor2;

	var p1 = vec2.add(body1.p, vec2.rotate(anchor1, body1.a));
	var p2 = vec2.add(body2.p, vec2.rotate(anchor2, body2.a));

	var d = vec2.sub(p2, p1);

   	// body1's local line normal
   	this.n_local = vec2.normalize(vec2.rotate(vec2.perp(d), -body1.a));

   	// accumulated impulse
	this.lambda_acc = 0;
}

LineJoint.prototype = new Joint;
LineJoint.prototype.constructor = LineJoint;

LineJoint.prototype.initSolver = function(dt, warmStarting) {
	var body1 = this.body1;
	var body2 = this.body2;
		
	// transformed r1, r2
	this.r1 = vec2.rotate(this.anchor1, body1.a);
	this.r2 = vec2.rotate(this.anchor2, body2.a);

	// world anchor points
	var p1 = vec2.add(body1.p, this.r1);
	var p2 = vec2.add(body2.p, this.r2);

	// delta vector between world anchor points
	var d = vec2.sub(p2, p1);

	// r1 + d
	this.r1_d = vec2.add(this.r1, d);

	// world line normal
	this.n = vec2.normalize(vec2.perp(d));
	
	// s1, s2
    this.s1 = vec2.cross(this.r1_d, this.n);
    this.s2 = vec2.cross(this.r2, this.n);

	// K = J * invM * JT
    var k = body1.m_inv + body2.m_inv + body1.i_inv * this.s1 * this.s1 + body2.i_inv * this.s2 * this.s2;
	this.k_inv = k > 0 ? 1 / k : k;
	
	// max impulse
	this.j_max = this.max_force * dt;

	if (warmStarting) {
		// apply cached impulses
		// V += JT * lambda
		var j = vec2.scale(this.n, this.lambda_acc);

		body1.v.mad(j, -body1.m_inv);
		body1.w -= this.s1 * this.lambda_acc * body1.i_inv;

		body2.v.mad(j, body2.m_inv);
		body2.w += this.s2 * this.lambda_acc * body2.i_inv;
	}
	else {
		this.lambda_acc = 0;
	}
}

LineJoint.prototype.solveVelocityConstraints = function() {
	var body1 = this.body1;
	var body2 = this.body2;

	// compute lambda for velocity constraint
	// solve J * invM * JT * lambda = -J * v
   	var jv = this.n.dot(vec2.sub(body2.v, body1.v)) + this.s2 * body2.w - this.s1 * body1.w;
	var lambda = this.k_inv * (-jv);

	// accumulate lambda for velocity constraint
	this.lambda_acc += lambda;

	// apply impulses
	// V += JT * lambda
	var j = vec2.scale(this.n, lambda);

	body1.v.mad(j, -body1.m_inv);
	body1.w -= this.s1 * lambda * body1.i_inv;

	body2.v.mad(j, body2.m_inv);
	body2.w += this.s2 * lambda * body2.i_inv;
}

LineJoint.prototype.solvePositionConstraints = function() {
	var body1 = this.body1;
	var body2 = this.body2;

	// transformed r1, r2
	var r1 = vec2.rotate(this.anchor1, body1.a);
	var r2 = vec2.rotate(this.anchor2, body2.a);

	// world anchor points
	var p1 = vec2.add(body1.p, r1);
	var p2 = vec2.add(body2.p, r2);

	// delta vector between world anchor points
	var d = vec2.sub(p2, p1);

	// r1 + d
	var r1_d = vec2.add(r1, d);

	// world line normal
	var n = vec2.rotate(this.n_local, body1.a);

	// position constraint
	var c = vec2.dot(n, d);
	var correction = Math.clamp(c, -this.max_linear_correction, this.max_linear_correction);
	
	// compute lambda for position constraint		
	// solve J * invM * JT * lambda = -C
   	var s1 = vec2.cross(r1_d, n);
   	var s2 = vec2.cross(r2, n);
   	var k = body1.m_inv + body2.m_inv + body1.i_inv * s1 * s1 + body2.i_inv * s2 * s2;
	var k_inv = k == 0 ? 0 : 1 / k;
	var lambda = k_inv * (-correction);

	// apply impulses
	// X += JT * lambda * dt
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


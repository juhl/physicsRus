//-------------------------------------------------------------------------------------------------
// Weld Joint
//
// Point-to-Point Constraint:
// C = p2 - p1
// dC/dt = v2 + cross(w2, r2) - v1 - cross(w1, r1)
//       = -v1 + cross(r1, w1) + v2 - cross(r2, w1)
// J = [ -I, skew(r1), I, -skew(r2) ]
//
// Anglular Constraint:
// C = a2 - a1
// dC/dt = w2 - w1
// J = [ 0, -1, 0, 1 ]
//
// Block Jacobian Matrix:
// J = [ -I, skew(r1), I, -skew(r2) ]
//     [  0,       -1, 0,         1 ]
//
// JT * lambda = [ -lambda_xy, -(cross(r1, lambda_xy) + lambda_z), lambda_xy, cross(r1, lambda_xy) + lambda_z ]
//-------------------------------------------------------------------------------------------------

WeldJoint = function(body1, body2, pivot) {
	Joint.call(this, body1, body2, true);

	this.anchor1 = body1.worldToLocal(pivot);
	this.anchor2 = body2.worldToLocal(pivot);

	this.lambda_acc = new vec3(0, 0, 0);
}

WeldJoint.prototype = new Joint;
WeldJoint.prototype.constructor = WeldJoint;

WeldJoint.prototype.initSolver = function(dt, warmStarting) {
	var body1 = this.body1;
	var body2 = this.body2;
		
	// Transformed r1, r2
	this.r1 = vec2.rotate(this.anchor1, body1.a);
	this.r2 = vec2.rotate(this.anchor2, body2.a);
	
	// K = J * invM * JT	
	var sum_m_inv = body1.m_inv + body2.m_inv;
	var r1 = this.r1;
	var r2 = this.r2;
	var r1x_i = r1.x * body1.i_inv;
	var r1y_i = r1.y * body1.i_inv;
	var r2x_i = r2.x * body2.i_inv;	
	var r2y_i = r2.y * body2.i_inv;	
	var k11 = sum_m_inv + r1.y * r1y_i + r2.y * r2y_i;	
	var k12 = -r1.x * r1y_i - r2.x * r2y_i;	
	var k13 = -r1y_i - r2y_i;
	var k22 = sum_m_inv + r1.x * r1x_i + r2.x * r2x_i;
	var k23 = r1x_i + r2x_i;
	var k33 = body1.i_inv + body2.i_inv;
	this.k = new mat3(k11, k12, k13, k12, k22, k23, k13, k23, k33);
	
	// Max impulse
	this.j_max = this.max_force * dt;

	if (warmStarting) {
		// Apply cached impulses
		// V += JT * lambda
		var lambda_xy = new vec2(this.lambda_acc.x, this.lambda_acc.y);
		var lambda_z = this.lambda_acc.z;

		body1.v.mad(lambda_xy, -body1.m_inv);
		body1.w -= (vec2.cross(this.r1, lambda_xy) + lambda_z) * body1.i_inv;

		body2.v.mad(lambda_xy, body2.m_inv);
		body2.w += (vec2.cross(this.r2, lambda_xy) + lambda_z) * body2.i_inv;
	}
	else {
		this.lambda_acc.set(0, 0, 0);
	}
}

WeldJoint.prototype.solveVelocityConstraints = function() {
	var body1 = this.body1;
	var body2 = this.body2;

	// Compute lambda for velocity constraint
	// Solve J * invM * JT * lambda = -J * v
	// in 2D: cross(w, r) = perp(r) * w
	var v1 = vec2.mad(body1.v, vec2.perp(this.r1), body1.w);
   	var v2 = vec2.mad(body2.v, vec2.perp(this.r2), body2.w);
   	var jv_xy = vec2.sub(v2, v1);
   	var jv_z = body2.w - body1.w;
   	var jv = vec3.fromVec2(jv_xy, jv_z);
	var lambda = this.k.solve(jv.neg());

	// Accumulate lambda for velocity constraint
	this.lambda_acc.addself(lambda);

	// Apply impulses
	// V += JT * lambda
	var lambda_xy = new vec2(lambda.x, lambda.y);

	body1.v.mad(lambda_xy, -body1.m_inv);
	body1.w -= (vec2.cross(this.r1, lambda_xy) + lambda.z) * body1.i_inv;

	body2.v.mad(lambda_xy, body2.m_inv);
	body2.w += (vec2.cross(this.r2, lambda_xy) + lambda.z) * body2.i_inv;
}

WeldJoint.prototype.solvePositionConstraints = function() {
	var body1 = this.body1;
	var body2 = this.body2;

	// Transformed r1, r2
	var r1 = vec2.rotate(this.anchor1, body1.a);
	var r2 = vec2.rotate(this.anchor2, body2.a);

	// Position constraint
	var c1 = vec2.sub(vec2.add(body2.p, r2), vec2.add(body1.p, r1));
	var c2 = body2.a - body1.a;
	var correction = vec3.fromVec2(
		vec2.truncate(c1, this.max_linear_correction), 
		Math.clamp(c2, -this.max_angular_correction, this.max_angular_correction));

	// Compute lambda for position constraint
	// Solve J * invM * JT * lambda = -C
	var sum_m_inv = body1.m_inv + body2.m_inv;
	var r1x_i = r1.x * body1.i_inv;
	var r1y_i = r1.y * body1.i_inv;
	var r2x_i = r2.x * body2.i_inv;	
	var r2y_i = r2.y * body2.i_inv;
	var k11 = sum_m_inv + r1.y * r1y_i + r2.y * r2y_i;
	var k12 = -r1.x * r1y_i - r2.x * r2y_i;		
	var k13 = -r1y_i - r2y_i;
	var k22 = sum_m_inv + r1.x * r1x_i + r2.x * r2x_i;
	var k23 = r1x_i + r2x_i;
	var k33 = body1.i_inv + body2.i_inv;
	var k = new mat3(k11, k12, k13, k12, k22, k23, k13, k23, k33);
	var lambda = k.solve(correction.neg());
	
	// Apply impulses
	// X += JT * lambda * dt
	var lambda_xy = new vec2(lambda.x, lambda.y);

	body1.p.mad(lambda_xy, -body1.m_inv);
	body1.a -= (vec2.cross(r1, lambda_xy) + lambda.z) * body1.i_inv;

	body2.p.mad(lambda_xy, body2.m_inv);
	body2.a += (vec2.cross(r2, lambda_xy) + lambda.z) * body2.i_inv;

	return c1.length() < Joint.LINEAR_SLOP && Math.abs(c2) <= Joint.ANGULAR_SLOP;
}

WeldJoint.prototype.getReactionForce = function(dt_inv) {
	return vec2.scale(this.lambda_acc.toVec2(), dt_inv);
}

WeldJoint.prototype.getReactionTorque = function(dt_inv) {
	return this.lambda_acc.z * dt_inv;
}
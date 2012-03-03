//-------------------------------------------------------------------------------------------------
// Weld Joint
//
// Point-to-Point Constraint:
// C1 = p2 - p1
// Cdot1 = v2 + cross(w2, r2) - v1 - cross(w1, r1)
//       = -v1 + cross(r1, w1) + v2 - cross(r2, w1)
// J1 = [ -I, skew(r1), I, -skew(r2) ]
//
// Angular Constraint:
// C2 = a2 - a1
// C2dot = w2 - w1
// J2 = [ 0, -1, 0, 1 ]
//
// Block Jacobian Matrix:
// J = [ -I, skew(r1), I, -skew(r2) ]
//     [  0,       -1, 0,         1 ]
//
// JT * lambda = [ -lambda_xy, -(cross(r1, lambda_xy) + lambda_z), lambda_xy, cross(r1, lambda_xy) + lambda_z ]
//-------------------------------------------------------------------------------------------------

WeldJoint = function(body1, body2, anchor) {
	Joint.call(this, Joint.TYPE_WELD, body1, body2, true);
	
	this.anchor1 = this.body1.getLocalPoint(anchor);
	this.anchor2 = this.body2.getLocalPoint(anchor);

	// Accumulated lambda
	this.lambda_acc = new vec3(0, 0, 0);
}

WeldJoint.prototype = new Joint;
WeldJoint.prototype.constructor = WeldJoint;

WeldJoint.prototype.setWorldAnchor1 = function(anchor1) {
	this.anchor1 = this.body1.getLocalPoint(anchor1);
	this.anchor2 = this.body2.getLocalPoint(anchor1);
}

WeldJoint.prototype.setWorldAnchor2 = function(anchor2) {
	this.anchor1 = this.body1.getLocalPoint(anchor2);
	this.anchor2 = this.body2.getLocalPoint(anchor2);	
}

WeldJoint.prototype.serialize = function() {
	return {
		"type": "WeldJoint",
		"body1": this.body1.id, 
		"body2": this.body2.id,
		"anchor1": this.body1.getWorldPoint(this.anchor1),
		"anchor2": this.body2.getWorldPoint(this.anchor2),
		"collideConnected": this.collideConnected,
		"maxForce": this.maxForce,
		"breakable": this.breakable
	};
}

WeldJoint.prototype.initSolver = function(dt, warmStarting) {
	var body1 = this.body1;
	var body2 = this.body2;

	// Max impulse
	this.maxImpulse = this.maxForce * dt;
		
	// Transformed r1, r2
	this.r1 = vec2.rotate(vec2.sub(this.anchor1, body1.centroid), body1.a);
	this.r2 = vec2.rotate(vec2.sub(this.anchor2, body2.centroid), body2.a);	
	
	// invEM = J * invM * JT	
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
	this.em_inv = new mat3(k11, k12, k13, k12, k22, k23, k13, k23, k33);
	
	if (warmStarting) {
		// Apply cached constraint impulses
		// V += JT * lambda * invM
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
   	var cdot1 = vec2.sub(v2, v1);
   	var cdot2 = body2.w - body1.w;
   	var cdot = vec3.fromVec2(cdot1, cdot2);
	var lambda = this.em_inv.solve(cdot.neg());

	// Accumulate lambda for velocity constraint
	this.lambda_acc.addself(lambda);

	// Apply constrint impulses
	// V += JT * lambda * invM
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
	var r1 = vec2.rotate(vec2.sub(this.anchor1, body1.centroid), body1.a);
	var r2 = vec2.rotate(vec2.sub(this.anchor2, body2.centroid), body2.a);

	// Position constraint
	var c1 = vec2.sub(vec2.add(body2.p, r2), vec2.add(body1.p, r1));
	var c2 = body2.a - body1.a;
	var correction = vec3.fromVec2(
		vec2.truncate(c1, Joint.MAX_LINEAR_CORRECTION), 
		Math.clamp(c2, -Joint.MAX_ANGULAR_CORRECTION, Joint.MAX_ANGULAR_CORRECTION));

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
	var em_inv = new mat3(k11, k12, k13, k12, k22, k23, k13, k23, k33);
	var lambda = em_inv.solve(correction.neg());
	
	// Apply constraint impulses
	// X += JT * lambda * invM * dt
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
//-------------------------------------------------------------------------------------------------
// Prismatic Joint
//
// Linear Constraint:
// d = p2 - p1
// n = normalize(perp(d))
// C1 = dot(n, d)
// C1dot = dot(d, dn/dt) + dot(n dd/dt)
//       = dot(d, cross(w1, n)) + dot(n, v2 + cross(w2, r2) - v1 - cross(w1, r1))
//       = dot(d, cross(w1, n)) + dot(n, v2) + dot(n, cross(w2, r2)) - dot(n, v1) - dot(n, cross(w1, r1))
//       = -dot(n, v1) - dot(cross(d + r1, n), w1) + dot(n, v2) + dot(cross(r2, n), w2)
// J1 = [ -n, -s1, n, s2 ]
// s1 = cross(r1 + d, n)
// s2 = cross(r2, n)
//
// Angular Constraint:
// C2 = a2 - a1 - initial_da
// C2dot = w2 - w1
// J2 = [ 0, -1, 0, 1 ]
//
// Block Jacobian Matrix:
// J = [ -n, -s1, n, s2 ]
//     [  0,  -1, 0,  1 ]
//
// JT * lambda = [ -n * lambda_x, -(s1 * lambda_x + lambda_y), n * lambda_x, s2 * lambda_x + lambda_y ]
//-------------------------------------------------------------------------------------------------

PrismaticJoint = function(body1, body2, anchor1, anchor2) {
	Joint.call(this, Joint.TYPE_PRISMATIC, body1, body2, true);

	// Local anchor points
	this.anchor1 = this.body1.getLocalPoint(anchor1);
	this.anchor2 = this.body2.getLocalPoint(anchor2);

	var d = vec2.sub(anchor2, anchor1);

   	// Body1's local line normal
	this.n_local = this.body1.getLocalVector(vec2.normalize(vec2.perp(d)));	

	this.da = body2.a - body1.a;

   	// Accumulated lambda
	this.lambda_acc = new vec2(0, 0);
}

PrismaticJoint.prototype = new Joint;
PrismaticJoint.prototype.constructor = PrismaticJoint;

PrismaticJoint.prototype.setWorldAnchor1 = function(anchor1) {
	// Local anchor points
	this.anchor1 = this.body1.getLocalPoint(anchor1);

	var d = vec2.sub(this.getWorldAnchor2(), anchor1);

	// Body1's local line normal
	this.n_local = this.body1.getLocalVector(vec2.normalize(vec2.perp(d)));	
}

PrismaticJoint.prototype.setWorldAnchor2 = function(anchor2) {
	// Local anchor points
	this.anchor2 = this.body2.getLocalPoint(anchor2);

	var d = vec2.sub(anchor2, this.getWorldAnchor1());

	// Body1's local line normal
	this.n_local = this.body1.getLocalVector(vec2.normalize(vec2.perp(d)));	
}

PrismaticJoint.prototype.serialize = function() {
	return {
		"type": "PrismaticJoint",
		"body1": this.body1.id, 		
		"body2": this.body2.id,
		"anchor1": this.body1.getWorldPoint(this.anchor1),
		"anchor2": this.body2.getWorldPoint(this.anchor2),		
		"collideConnected": this.collideConnected,
		"maxForce": this.maxForce,
		"breakable": this.breakable
	};
}

PrismaticJoint.prototype.initSolver = function(dt, warmStarting) {
	var body1 = this.body1;
	var body2 = this.body2;

	// Max impulse
	this.maxImpulse = this.maxForce * dt;

	// Transformed r1, r2
	this.r1 = vec2.rotate(vec2.sub(this.anchor1, body1.centroid), body1.a);
	this.r2 = vec2.rotate(vec2.sub(this.anchor2, body2.centroid), body2.a);

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
	var s1 = this.s1;
	var s2 = this.s2;
	var s1_i = s1 * body1.i_inv;
	var s2_i = s2 * body2.i_inv;
	var k11 = body1.m_inv + body2.m_inv + s1 * s1_i + s2 * s2_i;
	var k12 = s1_i + s2_i;
	var k22 = body1.i_inv + body2.i_inv;
	this.em_inv = new mat2(k11, k12, k12, k22);
	
	if (warmStarting) {
		// Apply cached impulses
		// V += JT * lambda
		var j = vec2.scale(this.n, this.lambda_acc.x);

		body1.v.mad(j, -body1.m_inv);
		body1.w -= (this.s1 * this.lambda_acc.x + this.lambda_acc.y) * body1.i_inv;

		body2.v.mad(j, body2.m_inv);
		body2.w += (this.s2 * this.lambda_acc.x + this.lambda_acc.y) * body2.i_inv;
	}
	else {
		this.lambda_acc.set(0, 0);
	}
}

PrismaticJoint.prototype.solveVelocityConstraints = function() {
	var body1 = this.body1;
	var body2 = this.body2;

	// Compute lambda for velocity constraint	
	// Solve J * invM * JT * lambda = -J * v
	var cdot1 = this.n.dot(vec2.sub(body2.v, body1.v)) + this.s2 * body2.w - this.s1 * body1.w;
	var cdot2 = body2.w - body1.w;
	var lambda = this.em_inv.solve(new vec2(-cdot1, -cdot2));

	// Accumulate lambda for velocity constraint
	this.lambda_acc.addself(lambda);

	// Apply impulses
	// V += JT * lambda
	var j = vec2.scale(this.n, lambda.x);

	body1.v.mad(j, -body1.m_inv);
	body1.w -= (this.s1 * lambda.x + lambda.y) * body1.i_inv;

	body2.v.mad(j, body2.m_inv);
	body2.w += (this.s2 * lambda.x + lambda.y) * body2.i_inv;
}

PrismaticJoint.prototype.solvePositionConstraints = function() {
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
	var c1 = vec2.dot(n, d);
	var c2 = body2.a - body1.a - this.da;
	var correction = new vec2;
	correction.x = Math.clamp(c1, -Joint.MAX_LINEAR_CORRECTION, Joint.MAX_LINEAR_CORRECTION);
	correction.y = Math.clamp(c2, -Joint.MAX_ANGULAR_CORRECTION, Joint.MAX_ANGULAR_CORRECTION);

	// Compute impulse for position constraint
	// Solve J * invM * JT * lambda = -C
	var s1 = vec2.cross(r1_d, n);
	var s2 = vec2.cross(r2, n);
	var s1_i = s1 * body1.i_inv;
	var s2_i = s2 * body2.i_inv;
	var k11 = body1.m_inv + body2.m_inv + s1 * s1_i + s2 * s2_i;
	var k12 = s1_i + s2_i;
	var k22 = body1.i_inv + body2.i_inv;
	var em_inv = new mat2(k11, k12, k12, k22);
	var lambda = em_inv.solve(correction.neg());

	// Apply impulses
	// X += JT * lambda * dt
	var j = vec2.scale(n, lambda.x);

	body1.p.mad(j, -body1.m_inv);
	body1.a -= (vec2.cross(r1_d, j) + lambda.y) * body1.i_inv;

	body2.p.mad(j, body2.m_inv);
	body2.a += (vec2.cross(r2, j) + lambda.y) * body2.i_inv;

	return Math.abs(c1) <= Joint.LINEAR_SLOP && Math.abs(c2) <= Joint.ANGULAR_SLOP;
}

PrismaticJoint.prototype.getReactionForce = function(dt_inv) {
	return vec2.scale(this.n, this.lambda_acc.x * dt_inv);
}

PrismaticJoint.prototype.getReactionTorque = function(dt_inv) {
	return this.lambda_acc.y * dt_inv;
}
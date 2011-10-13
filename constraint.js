Constraint = function(body1, body2, anchor1, anchor2) {
	this.body1 = body1;
	this.body2 = body2;
	this.anchor1 = anchor1;
	this.anchor2 = anchor2;
}

//------------------------------------------
// Pin Joint
//------------------------------------------

PinJoint = function(body1, body2, anchor1, anchor2) {
	Constraint.call(this, body1, body2, anchor1, anchor2);

	this.restLength = vec2.dist(anchor1, anchor2);
}

PinJoint.prototype = new Constraint;
PinJoint.prototype.constructor = PinJoint;

PinJoint.prototype.preStep = function(dt_inv) {
	this.r1 = vec2.rotate(this.anchor1, this.body1.a);
	this.r2 = vec2.rotate(this.anchor2, this.body2.a);

	var delta = vec2.sub(vec2.add(this.body2.p, this.r2), vec2.add(this.body1.p, this.r1));
	var dist = delta.length();

	this.n = vec2.scale(delta, 1 / dist);

	this.kn_inv = 1 / k_scalar(this.body1, this.body2, this.r1, this.r2, this.n);
}

PinJoint.prototype.applyImpulse = function() {
	var dn = vec2.dot(relative_velocity(this.body1, this.body2, this.r1, this.r2), this.n);
}

//------------------------------------------
// Slide Joint
//------------------------------------------

SlideJoint = function(body1, body2, anchor1, anchor2) {
	Constraint.call(this, body1, body2, anchor1, anchor2);

	this.restLength = vec2.dist(anchor1, anchor2);
}

SlideJoint.prototype = new Constraint;
SlideJoint.prototype.constructor = SlideJoint;

SlideJoint.prototype.preStep = function(dt_inv) {
}

SlideJoint.prototype.applyImpulse = function(dt_inv) {
}

//------------------------------------------
// Pivot Joint
//------------------------------------------

PivotJoint = function(body1, body2, anchor1, anchor2) {
	Constraint.call(this, body1, body2, anchor1, anchor2);

	this.restLength = vec2.dist(anchor1, anchor2);
}

PivotJoint.prototype = new Constraint;
PivotJoint.prototype.constructor = PivotJoint;

PivotJoint.prototype.preStep = function() {
}

PivotJoint.prototype.applyImpulse = function(dt_inv) {
}
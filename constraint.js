Constraint = function(body1, body2, anchor1, anchor2) {
	this.body1 = body1;
	this.body2 = body2;
	this.anchor1 = anchor1;
	this.anchor2 = anchor2;
}

DampedSpring = function(body1, body2, anchor1, anchor2) {
	Constraint.call(this, body1, body2, anchor1, anchor2);
}

DampedSpring.prototype = new Constraint;
DampedSpring.prototype.constructor = DampedSpring;

DampedSpring.prototype.preStep = function(dt_inv) {
}

DampedSpring.prototype.applyImpulse = function() {
}
Constraint = function(body1, body2) {
	this.body1 = body1;
	this.body2 = body2;

	// sepration bias coefficient
	this.bias_coeff = 0.1;

	// max sepration bias
	this.max_bias = Number.POSITIVE_INFINITY;

	// max force
	this.max_force = Number.POSITIVE_INFINITY;

	// is breakable ?
	this.breakable = false;
}

//------------------------------------------
// Distance Joint
//------------------------------------------

DistanceJoint = function(body1, body2, anchor1, anchor2) {
	Constraint.call(this, body1, body2);

	this.anchor1 = anchor1;
	this.anchor2 = anchor2;	

	var p1 = vec2.add(body1.p, vec2.rotate(anchor1, body1.a));
	var p2 = vec2.add(body2.p, vec2.rotate(anchor2, body2.a));
	
	// rest distance
	this.restLength = vec2.dist(p1, p2);

	// accumulated normal impulse
	this.jn_acc = 0;
}

DistanceJoint.prototype = new Constraint;
DistanceJoint.prototype.constructor = DistanceJoint;

DistanceJoint.prototype.preStep = function(dt, dt_inv) {
	this.r1 = vec2.rotate(this.anchor1, this.body1.a);
	this.r2 = vec2.rotate(this.anchor2, this.body2.a);

	var d = vec2.sub(vec2.add(this.body2.p, this.r2), vec2.add(this.body1.p, this.r1));
	var dist = d.length();

	// normal
	this.n = vec2.scale(d, 1 / dist);

	this.kn_inv = 1 / k_scalar(this.body1, this.body2, this.r1, this.r2, this.n);

	// max impulse
	this.j_max = this.max_force * dt;

	// separation bias
	this.bias = Math.clamp(this.bias_coeff * (this.restLength - dist) * dt_inv, -this.max_bias, this.max_bias);	

	// apply cached impulses
	applyImpulses(this.body1, this.body2, this.r1, this.r2, vec2.scale(this.n, this.jn_acc));
}

DistanceJoint.prototype.applyImpulse = function() {
	var dv = relative_velocity(this.body1, this.body2, this.r1, this.r2);
	var dvn = dv.dot(this.n);

	// normal impulse
	var jn = (-dvn + this.bias) * this.kn_inv;
	var jn_old = this.jn_acc;
	this.jn_acc = Math.clamp(jn_old + jn, -this.j_max, this.j_max);
	jn = this.jn_acc - jn_old;

	applyImpulses(this.body1, this.body2, this.r1, this.r2, vec2.scale(this.n, jn));
}

//------------------------------------------
// MaxDistance Joint
//------------------------------------------

MaxDistanceJoint = function(body1, body2, anchor1, anchor2, min, max) {
	Constraint.call(this, body1, body2);

	this.anchor1 = anchor1;
	this.anchor2 = anchor2;	

	this.min = min || 0;
	this.max = max;

	if (max == undefined) {
		var p1 = vec2.add(body1.p, vec2.rotate(anchor1, body1.a));
		var p2 = vec2.add(body2.p, vec2.rotate(anchor2, body2.a));

		this.max = vec2.dist(p1, p2);
	}

	// accumulated normal impulse
	this.jn_acc = 0;
}

MaxDistanceJoint.prototype = new Constraint;
MaxDistanceJoint.prototype.constructor = MaxDistanceJoint;

MaxDistanceJoint.prototype.preStep = function(dt, dt_inv) {
	this.r1 = vec2.rotate(this.anchor1, this.body1.a);
	this.r2 = vec2.rotate(this.anchor2, this.body2.a);

	var d = vec2.sub(vec2.add(this.body2.p, this.r2), vec2.add(this.body1.p, this.r1));
	var dist = d.length();

	// normal
	this.n = vec2.scale(d, 1 / dist);

	this.kn_inv = 1 / k_scalar(this.body1, this.body2, this.r1, this.r2, this.n);

	// max impulse
	this.j_max = this.max_force * dt;

	// penetration distance
	var pd = 0;
	if (dist < this.min) {
		pd = this.min - dist;
	}
	else if (dist > this.max) {
		pd = this.max - dist;
	}

	// separation bias
	this.bias = Math.clamp(this.bias_coeff * pd * dt_inv, -this.max_bias, this.max_bias);

	if (this.bias == 0) {
		this.jn_acc = 0;
	}

	// apply cached impulses
	applyImpulses(this.body1, this.body2, this.r1, this.r2, vec2.scale(this.n, this.jn_acc));
}

MaxDistanceJoint.prototype.applyImpulse = function() {
	if (this.bias == 0) {
		return; 
	}

	var dv = relative_velocity(this.body1, this.body2, this.r1, this.r2);
	var dvn = dv.dot(this.n);

	var jn = (-dvn + this.bias) * this.kn_inv;
	var jn_old = this.jn_acc;
	this.jn_acc = Math.clamp(jn_old + jn, -this.j_max, this.j_max);
	jn = this.jn_acc - jn_old;

	applyImpulses(this.body1, this.body2, this.r1, this.r2, vec2.scale(this.n, jn));
}

//------------------------------------------
// Angle Joint
//------------------------------------------

AngleJoint = function(body1, body2, rate) {
	Constraint.call(this, body1, body2);

	this.rate = rate;

	this.j_acc = 0;
}

AngleJoint.prototype = new Constraint;
AngleJoint.prototype.constructor = AngleJoint;

AngleJoint.prototype.preStep = function(dt, dt_inv) {
	this.k_inv = 1 / (this.body1.i_inv + this.body2.i_inv);

	// max impulse
	this.j_max = this.max_force * dt;

	// apply cached impulses
	this.body1.w -= this.j_acc * this.body1.i_inv;
	this.body2.w += this.j_acc * this.body2.i_inv;
}

AngleJoint.prototype.applyImpulse = function() {
	var dw = this.body2.w - this.body1.w + this.rate;
	
	// normal impulse
	var j = -dw * this.k_inv;
	var j_old = this.j_acc;
	this.j_acc = Math.clamp(j_old + j, -this.j_max, this.j_max);
	j = this.j_acc - j_old;

	this.body1.w -= j * this.body1.i_inv;
	this.body2.w += this.j * this.body2.i_inv;
}

//------------------------------------------
// Revolute Joint (2D Ball-Socket)
//------------------------------------------

RevoluteJointLocal = function(body1, body2, anchor1, anchor2) {
	Constraint.call(this, body1, body2);

	this.anchor1 = anchor1;
	this.anchor2 = anchor2;	

	this.j_acc = new vec2(0, 0);

	this.enableLimit = false;
	this.lowerAngle = 0;
	this.upperAngle = 0;

	this.enableMotor = false;
	this.maxMotorTorque = 0;
	this.motorSpeed = 0;
}

RevoluteJointLocal.prototype = new Constraint;
RevoluteJointLocal.prototype.constructor = RevoluteJointLocal;

RevoluteJointLocal.prototype.preStep = function(dt, dt_inv) {
	this.r1 = vec2.rotate(this.anchor1, this.body1.a);
	this.r2 = vec2.rotate(this.anchor2, this.body2.a);

	this.k = k_tensor(this.body1, this.body2, this.r1, this.r2);
	
	// max impulse
	this.j_max = this.max_force * dt;

	var d = vec2.sub(vec2.add(this.body2.p, this.r2), vec2.add(this.body1.p, this.r1));
	this.bias = vec2.truncate(vec2.scale(d, -this.bias_coeff * dt_inv), this.max_bias);

	applyImpulses(this.body1, this.body2, this.r1, this.r2, this.j_acc);
}

RevoluteJointLocal.prototype.applyImpulse = function() {
	var dv = relative_velocity(this.body1, this.body2, this.r1, this.r2);

	var j = this.k.mulvec(vec2.sub(this.bias, dv));
	var j_old = this.j_acc;
	this.j_acc = vec2.truncate(vec2.add(j_old, j), this.j_max);
	j = vec2.sub(this.j_acc, j_old);

	applyImpulses(this.body1, this.body2, this.r1, this.r2, j);
}

RevoluteJoint = function(body1, body2, pivot) {
	RevoluteJointLocal.call(this, body1, body2, body1.worldToLocal(pivot), body2.worldToLocal(pivot));
}

RevoluteJoint.prototype = new RevoluteJointLocal;
RevoluteJoint.prototype.constructor = RevoluteJoint;

//------------------------------------------
// Damped Spring
//------------------------------------------

DampedSpring = function(body1, body2, anchor1, anchor2, restLength, stiffness, damping) {
	Constraint.call(this, body1, body2);

	this.anchor1 = anchor1;
	this.anchor2 = anchor2;	

	this.restLength = restLength;
	this.stiffness = stiffness;
	this.damping = damping;
}

DampedSpring.prototype = new Constraint;
DampedSpring.prototype.constructor = DampedSpring;

DampedSpring.prototype.preStep = function(dt, dt_inv) {
	this.r1 = vec2.rotate(this.anchor1, this.body1.a);
	this.r2 = vec2.rotate(this.anchor2, this.body2.a);

	var d = vec2.sub(vec2.add(this.body2.p, this.r2), vec2.add(this.body1.p, this.r1));
	var dist = d.length();

	// normal
	this.n = vec2.scale(d, 1 / dist);

	var kn = k_scalar(this.body1, this.body2, this.r1, this.r2, this.n);
	this.kn_inv = 1 / kn;
	
	//
	this.target_dvn = 0;
	this.v_coeff = 1.0 - Math.exp(-this.damping * dt * kn);

	// apply spring force
	var spring_f = (this.restLength - dist) * this.stiffness;
	applyImpulses(this.body1, this.body2, this.r1, this.r2, vec2.scale(this.n, spring_f * dt));
}

DampedSpring.prototype.applyImpulse = function() {
	var dv = relative_velocity(this.body1, this.body2, this.r1, this.r2);
	var dvn = dv.dot(this.n) - this.target_dvn;

	// compute velocity loss from drag
	var v_damp = -dvn * this.v_coeff;
	this.target_dvn = dvn + v_damp;

	applyImpulses(this.body1, this.body2, this.r1, this.r2, vec2.scale(this.n, v_damp * this.kn_inv));
}


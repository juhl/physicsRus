Constraint = function(body1, body2, anchor1, anchor2) {
	this.body1 = body1;
	this.body2 = body2;

	this.anchor1 = anchor1;
	this.anchor2 = anchor2;	

	// sepration bias coefficient
	this.bias_coeff = 0.1;

	// max sepration bias
	this.max_bias = Number.POSITIVE_INFINITY;

	// max force
	this.max_force = Number.POSITIVE_INFINITY;
}

//------------------------------------------
// Pin Joint
//------------------------------------------

PinJoint = function(body1, body2, anchor1, anchor2) {
	Constraint.call(this, body1, body2, anchor1, anchor2);

	var p1 = vec2.add(body1.p, vec2.rotate(anchor1, body1.a));
	var p2 = vec2.add(body2.p, vec2.rotate(anchor2, body2.a));
	
	// rest distance
	this.restLength = vec2.dist(p1, p2);

	// accumulated normal impulse
	this.jn_acc = 0;
}

PinJoint.prototype = new Constraint;
PinJoint.prototype.constructor = PinJoint;

PinJoint.prototype.preStep = function(dt, dt_inv) {
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

PinJoint.prototype.applyImpulse = function() {
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
// Slide Joint
//------------------------------------------

SlideJoint = function(body1, body2, anchor1, anchor2, min, max) {
	Constraint.call(this, body1, body2, anchor1, anchor2);

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

SlideJoint.prototype = new Constraint;
SlideJoint.prototype.constructor = SlideJoint;

SlideJoint.prototype.preStep = function(dt, dt_inv) {
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

SlideJoint.prototype.applyImpulse = function() {
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
// Pivot Joint
//------------------------------------------

PivotJointLocal = function(body1, body2, anchor1, anchor2) {
	Constraint.call(this, body1, body2, anchor1, anchor2);

	this.j_acc = new vec2(0, 0);
}

PivotJointLocal.prototype = new Constraint;
PivotJointLocal.prototype.constructor = PivotJointLocal;

PivotJointLocal.prototype.preStep = function(dt, dt_inv) {
	this.r1 = vec2.rotate(this.anchor1, this.body1.a);
	this.r2 = vec2.rotate(this.anchor2, this.body2.a);

	var k = k_tensor(this.body1, this.body2, this.r1, this.r2);
	this.k1 = k.k1;
	this.k2 = k.k2;	

	// max impulse
	this.j_max = this.max_force * dt;

	var d = vec2.sub(vec2.add(this.body2.p, this.r2), vec2.add(this.body1.p, this.r1));
	this.bias = vec2.truncate(vec2.scale(d, -this.bias_coeff * dt_inv), this.max_bias);	

	applyImpulses(this.body1, this.body2, this.r1, this.r2, this.j_acc);
}

PivotJointLocal.prototype.applyImpulse = function() {
	var dv = relative_velocity(this.body1, this.body2, this.r1, this.r2);

	var j = mul_k(vec2.sub(this.bias, dv), this.k1, this.k2);
    var j_old = this.j_acc;
    this.j_acc = vec2.truncate(vec2.add(j_old, j), this.j_max);
    j = vec2.sub(this.j_acc, j_old);

    applyImpulses(this.body1, this.body2, this.r1, this.r2, j);
}

PivotJoint = function(body1, body2, pivot) {
	PivotJointLocal.call(this, body1, body2, body1.worldToLocal(pivot), body2.worldToLocal(pivot));
}

PivotJoint.prototype = new PivotJointLocal;
PivotJoint.prototype.constructor = PivotJoint;

//------------------------------------------
// Damped Spring
//------------------------------------------

DampedSpring = function(body1, body2, anchor1, anchor2, restLength, stiffness, damping) {
	Constraint.call(this, body1, body2, anchor1, anchor2);

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


Body = function(mass, inertia) {
    if (mass != undefined)
        this.setMass(mass);
    if (inertia != undefined)
        this.setInertia(inertia);

    // shape list for this body
    this.shapeArr = [];

    // force
    this.f = vec2.create(0, 0);

    // velocity
    this.v = vec2.create(0, 0);

    // position
    this.p = vec2.create(0, 0);

    // torque
    this.t = 0;

    // angular velocity
    this.w = 0;

    // orientation (angle)
    this.a = 0; 

    // velocity for contact penetration bias
    this.v_bias = vec2.create(0, 0);

    // angular velocity for contact penetration bias
    this.w_bias = 0;
}

Body.prototype.isStatic = function() {
    return this.m == Number.MAX_VALUE ? true : false;
}

Body.prototype.addShape = function(shape) {
    shape.body = this;
    shape.recenterForCentroid();
    this.shapeArr.push(shape);
}

Body.prototype.addStaticShape = function(shape) {    
    shape.body = this;
    this.shapeArr.push(shape);
    
    this.space.shapeArr.push(shape);
    shape.cacheData(vec2.create(0, 0), 0);
}

Body.prototype.cacheData = function() {
    for (var i = 0; i < this.shapeArr.length; i++) {
        this.shapeArr[i].cacheData(this.p, this.a);
    }
}

Body.prototype.setMass = function(mass) {
    this.m = mass;
    this.m_inv = 1 / mass;
}

Body.prototype.setInertia = function(inertia) {
    this.i = inertia;
    this.i_inv = 1 / inertia;
}

Body.prototype.setMassDensity = function(density) {
    var totalMass = 0;
    var totalInertia = 0;

    // compute total mass and moment of inertia with mass density
    for (var i = 0; i < this.shapeArr.length; i++) {
        var mass = this.shapeArr[i].area() * density;

        totalMass += mass;
        totalInertia += this.shapeArr[i].inertia(mass);
    }

    this.setMass(totalMass);
    this.setInertia(totalInertia);
}

Body.prototype.updateVelocity = function(gravity, damping, dt) {
	this.v = vec2.add(vec2.scale(this.v, damping), vec2.scale(vec2.add(gravity, vec2.scale(this.f, this.m_inv)), dt));	
	this.w = this.w * damping + this.t * this.i_inv * dt;

    this.f = 0;
    this.t = 0;
}

Body.prototype.updatePosition = function(dt) {
	this.p.addself(vec2.scale(vec2.add(this.v, this.v_bias), dt));
	this.a += (this.w + this.w_bias) * dt;

    this.v_bias.set(0, 0);
    this.w_bias = 0;
}

Body.prototype.applyForce = function(force, r) {
    if (this.isStatic())
        return;
	
	this.f.addself(force);
	this.t += vec2.cross(r, force);
}

Body.prototype.applyImpulse = function(j, r) {
    if (this.isStatic())
        return;

	this.v.addself(vec2.scale(j, this.m_inv));
	this.w += vec2.cross(r, j) * this.i_inv;
}

Body.prototype.applyBiasImpulse = function(j, r) {
    if (this.isStatic())
        return;

    if (j.x != 0 || j.y != 0) {
        var k = 100;
    }

	this.v_bias.addself(vec2.scale(j, this.m_inv));
	this.w_bias += vec2.cross(r, j) * this.i_inv;
}
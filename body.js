Body = function(mass, inertia) {
    if (Body.hashid_counter == undefined) {
        Body.hashid_counter = 0;
    }

    this.hashid = Body.hashid_counter++;

    if (mass != undefined)
        this.setMass(mass);
    if (inertia != undefined)
        this.setInertia(inertia);

    // shape list for this body
    this.shapeArr = [];

    // joint hash for this body
    this.jointHash = {};

    // force
    this.f = new vec2(0, 0);

    // velocity
    this.v = new vec2(0, 0);

    // position
    this.p = new vec2(0, 0);

    // torque
    this.t = 0;

    // angular velocity
    this.w = 0;

    // orientation (angle)
    this.a = 0;

    // velocity for contact penetration bias
    this.v_bias = new vec2(0, 0);

    // angular velocity for contact penetration bias
    this.w_bias = 0;
}

Body.prototype.localToWorld = function(vec) {
    return vec2.add(this.p, vec2.rotate(vec, this.a));
}

Body.prototype.worldToLocal = function(vec) {
    return vec2.rotate(vec2.sub(vec, this.p), -this.a);
}

Body.prototype.isStatic = function() {
    return this.m == Number.POSITIVE_INFINITY ? true : false;
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
    shape.cacheData(new vec2(0, 0), 0);
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
	this.v = vec2.mad(vec2.scale(this.v, damping), vec2.mad(gravity, this.f, this.m_inv), dt);
	this.w = this.w * damping + this.t * this.i_inv * dt;

    this.f.set(0, 0);
    this.t = 0;
}

Body.prototype.updatePosition = function(dt) {
	this.p.addself(vec2.scale(vec2.add(this.v, this.v_bias), dt));
	this.a += (this.w + this.w_bias) * dt;

    this.v_bias.set(0, 0);
    this.w_bias = 0;
}

Body.prototype.resetForce = function() {
    this.f.set(0, 0);
    this.t = 0;
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

	this.v.mad(j, this.m_inv);
	this.w += vec2.cross(r, j) * this.i_inv;
}

Body.prototype.applyBiasImpulse = function(j, r) {
    if (this.isStatic())
        return;

	this.v_bias.mad(j, this.m_inv);
	this.w_bias += vec2.cross(r, j) * this.i_inv;
}

Body.prototype.kineticEnergy = function() {
    var vsq = this.v.dot(this.v);
    var wsq = this.w * this.w;
    return 0.5 * (this.m * vsq + this.i * wsq);
}
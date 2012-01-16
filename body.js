Body = function(mass, inertia) {
    if (Body.id_counter == undefined) {
        Body.id_counter = 0;
    }

    this.id = Body.id_counter++;

    if (mass != undefined)
        this.setMass(mass);
    if (inertia != undefined)
        this.setInertia(inertia);

    // Shape list for this body
    this.shapeArr = [];

    // Joint hash for this body
    this.jointHash = {};

    // Force
    this.f = new vec2(0, 0);

    // Velocity
    this.v = new vec2(0, 0);

    // Position
    this.p = new vec2(0, 0);

    // Torque
    this.t = 0;

    // Angular velocity
    this.w = 0;

    // Orientation (angle)
    this.a = 0;

    // Sleep time
    this.sleepTime = 0;

    // Awaked flag
    this.awaked = false;
}

Body.prototype.isStatic = function() {
    return this.m == Infinity ? true : false;
}

Body.prototype.localToWorld = function(vec) {
    return vec2.add(this.p, vec2.rotate(vec, this.a));
}

Body.prototype.worldToLocal = function(vec) {
    return vec2.rotate(vec2.sub(vec, this.p), -this.a);
}

Body.prototype.addShape = function(shape) {
    shape.body = this;
    shape.recenterForCentroid();
    this.shapeArr.push(shape);
}

Body.prototype.addStaticShape = function(shape) {    
    shape.body = this;
    this.shapeArr.push(shape);
    
    this.space.activeShapeArr.push(shape);
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
	this.p.addself(vec2.scale(this.v, dt));
	this.a += this.w * dt;
}

Body.prototype.resetForce = function() {
    this.f.set(0, 0);
    this.t = 0;
}

Body.prototype.applyForce = function(force, r) {
    if (this.isStatic())
        return;

    if (!this.isAwake())
        this.awake(true);
	
    this.f.addself(force);
    this.t += vec2.cross(r, force);
}

Body.prototype.applyTorque = function(torque) {
    if (this.isStatic())
        return;

    if (!this.isAwake())
        this.awake(true);
    
    this.t += torque;
}

Body.prototype.applyLinearImpulse = function(impulse, r) {
    if (this.isStatic())
        return;

    if (!this.isAwake()) 
        this.awake(true);

	this.v.mad(impulse, this.m_inv);
	this.w += vec2.cross(r, impulse) * this.i_inv;
}

Body.prototype.applyAngularImpulse = function(impulse) {
    if (this.isStatic())
        return;

    if (!this.isAwake()) 
        this.awake(true);

    this.w += impulse * this.i_inv;
}

Body.prototype.kineticEnergy = function() {
    var vsq = this.v.dot(this.v);
    var wsq = this.w * this.w;
    return 0.5 * (this.m * vsq + this.i * wsq);
}

Body.prototype.isAwake = function() {
    return this.awaked;
}

Body.prototype.awake = function(flag) {
    this.awaked = flag;
    if (flag) {
        this.sleepTime = 0;
    } 
    else {
        this.v.set(0, 0);
        this.w = 0;
        this.f.set(0, 0);
        this.t = 0;
    }
}
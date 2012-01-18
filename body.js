Body = function(density) {
    if (Body.id_counter == undefined) {
        Body.id_counter = 0;
    }

    this.id = Body.id_counter++;

    // Shape list for this body
    this.shapeArr = [];

    // Joint hash for this body
    this.jointHash = {};

    // Density
    this.density = density;

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

Body.prototype.addShape = function(shape) {
    shape.body = this;    
    this.shapeArr.push(shape);
}

Body.prototype.addStaticShape = function(shape) {    
    shape.body = this;
    this.shapeArr.push(shape);
    
    this.space.activeShapeArr.push(shape);
    shape.cacheData(new vec2(0, 0), 0);
}

// Internal function
Body.prototype.cacheData = function() {
    for (var i = 0; i < this.shapeArr.length; i++) {
        this.shapeArr[i].cacheData(this.p, this.a);
    }
}

// Internal function
Body.prototype.setMass = function(mass) {
    this.m = mass;
    this.m_inv = 1 / mass; // 0 = 1 / Infinity
}

// Internal function
Body.prototype.setInertia = function(inertia) {
    this.i = inertia;
    this.i_inv = 1 / inertia; // 0 = 1 / Infinity
}

Body.prototype.resetMassData = function() {
    if (this.density == Infinity) {
        this.setMass(Infinity);
        this.setInertia(Infinity);
        return;
    }

    var totalArea = 0;
    var totalInertia = 0;
    var centroid = new vec2(0, 0);

    for (var i = 0; i < this.shapeArr.length; i++) {
        var shape = this.shapeArr[i];
        var area = shape.area();

        totalArea += area;
        centroid.mad(shape.centroid(), area);
    }

    centroid.scale(1 / totalArea);

    for (var i = 0; i < this.shapeArr.length; i++) {
        var shape = this.shapeArr[i];
        var mass = shape.area() * this.density;
        
        shape.recenter(centroid);
        totalInertia += shape.inertia(mass);
    }
    
    this.setMass(totalArea * this.density);
    this.setInertia(totalInertia);

    console.log("mass = " + this.m + " inertia = " + this.i);
}

Body.prototype.localToWorld = function(vec) {
    return vec2.add(this.p, vec2.rotate(vec, this.a));
}

Body.prototype.worldToLocal = function(vec) {
    return vec2.rotate(vec2.sub(vec, this.p), -this.a);
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
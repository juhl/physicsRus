Body = function(type, x, y, angle) {
	if (Body.id_counter == undefined) {
		Body.id_counter = 0;
	}

	this.id = Body.id_counter++;

	// Identifier
	this.name = "body" + this.id;

	// STATIC or DYNAMIC
	this.type = type;

	// Default values
	x = x || 0;
	y = y || 0;
	angle = angle || 0;

	// Transform
	this.xf = new Transform(x, y, angle);

	// Local center of mass
	this.centroid = new vec2(0, 0);

	// World position of centroid
	this.p = new vec2(x, y);
	
	// Velocity
	this.v = new vec2(0, 0);

	// Force
	this.f = new vec2(0, 0);

	// Orientation (angle)
	this.a = angle;

	// Angular velocity
	this.w = 0;    

	// Torque
	this.t = 0;

	// Sleep time
	this.sleepTime = 0;

	// Awaked flag
	this.awaked = false;

	// Shape list for this body
	this.shapeArr = [];

	// Joint hash for this body
	this.jointHash = {};

	// Bounds of all shapes
	this.bounds = new Bounds;

	this.stepCount = 0;
}

Body.STATIC = 1;
Body.KINETIC = 2;
Body.DYNAMIC = 3;

Body.prototype.duplicate = function() {
	var body = new Body(this.type, this.xf.t.x, this.xf.t.y, this.a);
	for (var i = 0; i < this.shapeArr.length; i++) {
		body.addShape(this.shapeArr[i].duplicate());
	}
	body.resetMassData();

	return body;
}

Body.prototype.serialize = function() {
	var shapes = [];
	for (var i = 0; i < this.shapeArr.length; i++) {
		var obj = this.shapeArr[i].serialize();
		shapes.push(obj);
	}

	return {
		"type": this.type == Body.STATIC ? "static" : "dynamic",
		"name": this.name,
		"position": this.xf.t,
		"angle": this.xf.a,
		"shapes": shapes
	};
}

Body.prototype.isStatic = function() {
	return this.type == Body.STATIC ? true : false;
}

Body.prototype.isDynamic = function() {
	return this.type == Body.DYNAMIC ? true : false;
}

Body.prototype.addShape = function(shape) {
	shape.body = this;
	this.shapeArr.push(shape);
}

Body.prototype.removeShape = function(shape) {
	var index = this.shapeArr.indexOf(shape);
	if (index != -1) {
		this.shapeArr.splice(index, 1);
		shape.body = undefined;
	}
}

// Internal function
Body.prototype.cacheData = function() {	
	this.bounds.clear();
	
	for (var i = 0; i < this.shapeArr.length; i++) {
		var shape = this.shapeArr[i];
		shape.cacheData(this.p, this.centroid, this.a);
		this.bounds.addBounds(shape.bounds);
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
	if (this.isStatic()) {
		this.centroid.set(0, 0);
		this.setMass(Infinity);
		this.setInertia(Infinity);
		this.p = this.xf.transform(this.centroid);
		return;
	}
	
	var totalMassCentroid = new vec2(0, 0);
	var totalMass = 0;
	var totalInertia = 0;

	for (var i = 0; i < this.shapeArr.length; i++) {
		var shape = this.shapeArr[i];
		var centroid = shape.centroid();
		var mass = shape.area() * shape.density;
		var inertia = shape.inertia(mass);

		totalMassCentroid.mad(centroid, mass);
		totalMass += mass;
		totalInertia += inertia;
	}
	
	this.centroid.copy(vec2.scale(totalMassCentroid, 1 / totalMass));
	this.setMass(totalMass);
	this.setInertia(totalInertia - totalMass * vec2.dot(this.centroid, this.centroid));
	//console.log("mass = " + this.m + " inertia = " + this.i);

	// Move center of mass	
	var old_p = this.p;
	this.p = this.xf.transform(this.centroid);

	// Update center of mass velocity ??
	this.v.mad(vec2.perp(vec2.sub(this.p, old_p)), this.w);
	//console.log(this.v.x, this.v.y);
}

// Local (center of mass) -> World
Body.prototype.localToWorld = function(v) {
	return vec2.add(this.p, vec2.rotate(v, this.a));
}

// World -> Local (center of mass)
Body.prototype.worldToLocal = function(v) {
	return vec2.rotate(vec2.sub(v, this.p), -this.a);
}

Body.prototype.setTransform = function(x, y, angle) {
	this.xf.set(x, y, angle);
	this.p = this.xf.transform(this.centroid);
	this.a = angle;
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

Body.prototype.applyForce = function(force, p) {
	if (this.isStatic())
		return;

	if (!this.isAwake())
		this.awake(true);
	
	this.f.addself(force);
	this.t += vec2.cross(vec2.sub(p, this.p), force);
}

Body.prototype.applyForceToCenter = function(force) {
	if (this.isStatic())
		return;

	if (!this.isAwake())
		this.awake(true);
	
	this.f.addself(force);
}

Body.prototype.applyTorque = function(torque) {
	if (this.isStatic())
		return;

	if (!this.isAwake())
		this.awake(true);
	
	this.t += torque;
}

Body.prototype.applyLinearImpulse = function(impulse, p) {
	if (this.isStatic())
		return;

	if (!this.isAwake()) 
		this.awake(true);

	this.v.mad(impulse, this.m_inv);
	this.w += vec2.cross(vec2.sub(p, this.p), impulse) * this.i_inv;
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

Body.prototype.isCollidable = function(other) {
	if (this == other)
		return false;

	if (this.isStatic() && other.isStatic())
		return false;

	for (var i in this.jointHash) {
		var joint = this.jointHash[i];

		if (!joint.collideConnected && other.jointHash[joint.id]) {
			return false;
		}
	}

	return true;
}
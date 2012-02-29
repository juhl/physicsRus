//------------------------------------------
// ShapeCircle
//------------------------------------------

ShapeCircle = function(local_x, local_y, radius) {
	Shape.call(this, Shape.TYPE_CIRCLE);
	this.c = new vec2(local_x || 0, local_y || 0);
	this.r = radius;

	this.tc = vec2.zero;

	this.finishVerts();
}

ShapeCircle.prototype = new Shape;
ShapeCircle.prototype.constructor = ShapeCircle;

ShapeCircle.prototype.finishVerts = function() {
	this.r = Math.abs(this.r);
}

ShapeCircle.prototype.duplicate = function() {
	return new ShapeCircle(this.c.x, this.c.y, this.r);
}

ShapeCircle.prototype.serialize = function() {
	return {
		"type": "ShapeCircle",
		"e": this.e,
		"u": this.u,
		"density": this.density,
		"center": this.c,
		"radius": this.r
	};
}

ShapeCircle.prototype.recenter = function(c) {
	this.c.subself(c);
}

ShapeCircle.prototype.area = function() {
	return areaForCircle(this.r, 0);
}

ShapeCircle.prototype.centroid = function() {
	return this.c.duplicate();
}

ShapeCircle.prototype.inertia = function(mass) {
	return inertiaForCircle(mass, this.c, this.r, 0);
}

ShapeCircle.prototype.cacheData = function(xf) {
	this.tc = xf.transform(this.c);
	this.bounds.mins.set(this.tc.x - this.r, this.tc.y - this.r);
	this.bounds.maxs.set(this.tc.x + this.r, this.tc.y + this.r);
}

ShapeCircle.prototype.pointQuery = function(p) {
	return vec2.distsq(this.tc, p) < (this.r * this.r);
}

ShapeCircle.prototype.findVertexByPoint = function(p, minDist) {
	var dsq = minDist * minDist;

	if (vec2.distsq(this.tc, p) < dsq) {
		return 0;
	}

	return -1;
}

ShapeCircle.prototype.distanceOnPlane = function(n, d) {
	return vec2.dot(n, this.tc) - this.r - d;
}
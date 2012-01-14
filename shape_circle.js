//------------------------------------------
// ShapeCircle
//------------------------------------------

ShapeCircle = function(radius, offset) {
    Shape.call(this, Shape.TYPE_CIRCLE);
    this.c = offset || vec2.zero;
    this.r = radius;

    this.tc = vec2.zero;    
}

ShapeCircle.prototype = new Shape;
ShapeCircle.prototype.constructor = ShapeCircle;

ShapeCircle.prototype.recenterForCentroid = function() {
    this.c = vec2.zero;
}

ShapeCircle.prototype.area = function() {
    return areaForCircle(this.r, 0);
}

ShapeCircle.prototype.inertia = function(mass) {
    return inertiaForCircle(mass, this.c, this.r, 0);
}

ShapeCircle.prototype.cacheData = function(pos, angle) {
    this.tc = vec2.add(pos, vec2.rotate(this.c, angle));
    this.bounds.mins.set(this.tc.x - this.r, this.tc.y - this.r);
    this.bounds.maxs.set(this.tc.x + this.r, this.tc.y + this.r);
}

ShapeCircle.prototype.pointQuery = function(p) {
    return vec2.distsq(this.tc, p) < (this.r * this.r);
}

ShapeCircle.prototype.distanceOnPlane = function(n, d) {
    return vec2.dot(n, this.tc) - this.r - d;
}
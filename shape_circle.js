//------------------------------------------
// ShapeCircle
//------------------------------------------

ShapeCircle = function(offset_x, offset_y, radius) {
    Shape.call(this, Shape.TYPE_CIRCLE);
    this.c = new vec2(offset_x || 0, offset_y || 0);
    this.r = radius;

    this.tc = vec2.zero;    
}

ShapeCircle.prototype = new Shape;
ShapeCircle.prototype.constructor = ShapeCircle;

ShapeCircle.prototype.serialize = function() {
    return {
        "type": "circle",
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

ShapeCircle.prototype.cacheData = function(pos, centroid, angle) {
    this.tc = vec2.add(pos, vec2.rotate(vec2.sub(this.c, centroid), angle));
    this.bounds.mins.set(this.tc.x - this.r, this.tc.y - this.r);
    this.bounds.maxs.set(this.tc.x + this.r, this.tc.y + this.r);
}

ShapeCircle.prototype.pointQuery = function(p) {
    return vec2.distsq(this.tc, p) < (this.r * this.r);
}

ShapeCircle.prototype.distanceOnPlane = function(n, d) {
    return vec2.dot(n, this.tc) - this.r - d;
}
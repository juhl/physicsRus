Math.clamp = function(v, min, max) { return v < min ? min : (v > max ? max : v); }

function deg2rad(deg) { return (deg / 180) * Math.PI; }
function rad2deg(rad) { return (rad / Math.PI) * 180; }

function vec2(x, y) {
    this.x = x || 0;
    this.y = y || 0;
}

vec2.zero = new vec2(0, 0);

vec2.prototype.set = function(x, y) {
    this.x = x || 0;
    this.y = y || 0;

    return this;
}

vec2.prototype.copy = function(v) {
    this.x = v.x;
    this.y = v.y;
    
    return this;
}

vec2.prototype.add = function(v1, v2) {
    this.x = v1.x + v2.x;
    this.y = v1.y + v2.y;

    return this;
}

vec2.prototype.addself = function(v) {
    this.x += v.x;
    this.y += v.y;

    return this;
}

vec2.prototype.sub = function(v1, v2) {
    this.x = v1.x - v2.x;
    this.y = v1.y - v2.y;

    return this;
}

vec2.prototype.subself = function(v) {
    this.x -= v.x;
    this.y -= v.y;

    return this;
}

vec2.prototype.scale = function(s) {
    this.x *= s;
    this.y *= s;

    return this;
}

vec2.prototype.neg = function() {
    this.x *= -1;
    this.y *= -1;

    return this;
}

vec2.prototype.lengthsq = function() {
    return this.x * this.x + this.y * this.y;
}

vec2.prototype.length = function() {
    return Math.sqrt(this.x * this.x + this.y * this.y);
}

vec2.prototype.normalize = function() {
    var inv = (this.x != 0 || this.y != 0) ? 1 / this.length() : 0;
    this.x *= inv;
    this.y *= inv;

    return this;
}

vec2.prototype.dot = function(v) {
    return this.x * v.x + this.y * v.y;
}

vec2.prototype.cross = function(v) {
    return this.x * v.y - this.y * v.x;
}

vec2.prototype.toAngle = function() {
    return Math.atan2(this.y, this.x);
}

vec2.prototype.rotation = function(angle) {
    return this.set(Math.cos(angle), Math.sin(angle));
}

vec2.prototype.rotate = function(r) {
    var v = r;
    if (!vec2.prototype.isPrototypeOf(r)) {
        v = vec2.rotation(r);
    }

    return this.set(this.x * v.x - this.y * v.y, this.x * v.y + this.y * v.x);
}

vec2.create = function(x, y) {
    return new vec2(x, y);
}

vec2.add = function(v1, v2) {
    var vec = new vec2;
    vec.add(v1, v2);

    return vec;
}

vec2.sub = function(v1, v2) {
    var vec = new vec2;
    vec.sub(v1, v2);

    return vec;
}

vec2.scale = function(v, s) {
    return new vec2(v.x * s, v.y * s);
}

vec2.neg = function(v) {
    return new vec2(-v.x, -v.y);
}

vec2.normalize = function(v) {
    var vec = new vec2(v.x, v.y);
    return vec.normalize();
}

vec2.dot = function(v1, v2) {
    return v1.dot(v2);
}

vec2.cross = function(v1, v2) {
    return v1.cross(v2);
}

vec2.toAngle = function(v) {
    return v.toAngle();
}

vec2.rotation = function(angle) {
    var vec = new vec2;
    return vec.rotation(angle);
}

vec2.rotate = function(v, r) {
    var vec = new vec2(v.x, v.y);
    return vec.rotate(r);
}

// return perpendicular vector (90 degree rotation)
vec2.perp = function(v) {
    var vec = new vec2;
    vec.x = -v.y;
    vec.y = v.x;

    return vec;
}

// return perpendicular vector (-90 degree rotation)
vec2.rperp = function(v) {
    var vec = new vec2;
    vec.x = v.y;
    vec.y = -v.x;

    return vec;
}

vec2.dist = function(v1, v2) {
    var vec = new vec2(v1.x - v2.x, v1.y - v2.y);
    return vec.length();
}

vec2.distsq = function(v1, v2) {
    var vec = new vec2(v1.x - v2.x, v1.y - v2.y);
    return vec.lengthsq();
}
Math.clamp = function(v, min, max) { return v < min ? min : (v > max ? max : v); }

function deg2rad(deg) { return (deg / 180) * Math.PI; }
function rad2deg(rad) { return (rad / Math.PI) * 180; }

function vec2(x, y) {
    this.x = x || 0;
    this.y = y || 0;
}

vec2.zero = new vec2(0, 0);

vec2.prototype.set = function(x, y) {
    this.x = x;
    this.y = y;

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

vec2.prototype.mad = function(v, s) {
    this.x += v.x * s;
    this.y += v.y * s;
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
    var inv = (this.x != 0 || this.y != 0) ? 1 / Math.sqrt(this.x * this.x + this.y * this.y) : 0;
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
    this.x = Math.cos(angle);
    this.y = Math.sin(angle);
    return this;
}

vec2.prototype.rotate = function(r) {
    var vec = vec2.prototype.isPrototypeOf(r) ? r : new vec2(Math.cos(r), Math.sin(r));
    return this.set(this.x * vec.x - this.y * vec.y, this.x * vec.y + this.y * vec.x);
}

vec2.add = function(v1, v2) {
    return new vec2(v1.x + v2.x, v1.y + v2.y);
}

vec2.sub = function(v1, v2) {
    return new vec2(v1.x - v2.x, v1.y - v2.y);
}

vec2.scale = function(v, s) {
    return new vec2(v.x * s, v.y * s);
}

vec2.mad = function(v1, v2, s) {
    return new vec2(v1.x + v2.x * s, v1.y + v2.y * s);
}

vec2.neg = function(v) {
    return new vec2(-v.x, -v.y);
}

vec2.normalize = function(v) {
    var inv = (v.x != 0 || v.y != 0) ? 1 / Math.sqrt(v.x * v.x + v.y * v.y) : 0;
    return new vec2(v.x * inv, v.y * inv);
}

vec2.dot = function(v1, v2) {
    return v1.x * v2.x + v1.y * v2.y;
}

vec2.cross = function(v1, v2) {
    return v1.x * v2.y - v1.y * v2.x;
}

vec2.toAngle = function(v) {
    return Math.atan2(v.y, v.x);
}

vec2.rotation = function(angle) {
    return new vec2(Math.cos(angle), Math.sin(angle));
}

vec2.rotate = function(v, r) {
    var vec = vec2.prototype.isPrototypeOf(r) ? r : new vec2(Math.cos(r), Math.sin(r));
    return new vec2(v.x * vec.x - v.y * vec.y, v.x * vec.y + v.y * vec.x);
}

// return perpendicular vector (90 degree rotation)
vec2.perp = function(v) {
    return new vec2(-v.y, v.x);
}

// return perpendicular vector (-90 degree rotation)
vec2.rperp = function(v) {
    return new vec2(v.y, -v.x);
}

vec2.dist = function(v1, v2) {
    var dx = v2.x - v1.x;
    var dy = v2.y - v1.y;
    return Math.sqrt(dx * dx + dy * dy);
}

vec2.distsq = function(v1, v2) {
    var dx = v2.x - v1.x;
    var dy = v2.y - v1.y;
    return dx * dx + dy * dy;
}
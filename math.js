Math.clamp = function(v, min, max) { return v < min ? min : (v > max ? max : v); }

function deg2rad(deg) { return (deg / 180) * Math.PI; }
function rad2deg(rad) { return (rad / Math.PI) * 180; }

//-----------------------------------
// 2D Vector
//-----------------------------------

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

vec2.prototype.duplicate = function() {
    return new vec2(this.x, this.y);
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

// Z-component of 3d cross product (ax, ay, 0) x (bx, by, 0)
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

vec2.prototype.lerp = function(v1, v2, t) {
    return this.add(vec2.scale(v1, 1 - t), vec2.scale(v2, t));
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

// Return perpendicular vector (90 degree rotation)
vec2.perp = function(v) {
    return new vec2(-v.y, v.x);
}

// Return perpendicular vector (-90 degree rotation)
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

vec2.lerp = function(v1, v2, t) {
    return vec2.add(vec2.scale(v1, 1 - t), vec2.scale(v2, t));
}

vec2.truncate = function(v, length) {
    var ret = v.duplicate();
    var length_sq = v.x * v.x + v.y * v.y;
    if (length_sq > length * length) {
        ret.scale(length / Math.sqrt(length_sq));
    }

    return ret;
}

//-----------------------------------
// 3D Vector
//-----------------------------------

function vec3(x, y, z) {
    this.x = x || 0;
    this.y = y || 0;
    this.z = z || 0;
}

vec3.zero = new vec3(0, 0, 0);

vec3.prototype.set = function(x, y, z) {
    this.x = x;
    this.y = y;
    this.z = z;

    return this;
}

vec3.prototype.copy = function(v) {
    this.x = v.x;
    this.y = v.y;
    this.z = v.z;
    
    return this;
}

vec3.prototype.duplicate = function() {
    return new vec3(this.x, this.y, this.z);
}

vec3.prototype.add = function(v1, v2) {
    this.x = v1.x + v2.x;
    this.y = v1.y + v2.y;
    this.z = v1.z + v2.z;

    return this;
}

vec3.prototype.addself = function(v) {
    this.x += v.x;
    this.y += v.y;
    this.z += v.z;

    return this;
}

vec3.prototype.sub = function(v1, v2) {
    this.x = v1.x - v2.x;
    this.y = v1.y - v2.y;
    this.z = v1.z - v2.z;

    return this;
}

vec3.prototype.subself = function(v) {
    this.x -= v.x;
    this.y -= v.y;
    this.z -= v.z;

    return this;
}

vec3.prototype.scale = function(s) {
    this.x *= s;
    this.y *= s;
    this.z *= s;

    return this;
}

vec3.prototype.mad = function(v, s) {
    this.x += v.x * s;
    this.y += v.y * s;
    this.z += v.z * s;
}

vec3.prototype.neg = function() {
    this.x *= -1;
    this.y *= -1;
    this.z *= -1;

    return this;
}

vec3.prototype.lengthsq = function() {
    return this.x * this.x + this.y * this.y + this.z * this.z;
}

vec3.prototype.length = function() {
    return Math.sqrt(this.x * this.x + this.y * this.y + this.z * this.z);
}

vec3.prototype.normalize = function() {
    var inv = (this.x != 0 || this.y != 0 || this.z != 0) ? 1 / Math.sqrt(this.x * this.x + this.y * this.y + this.z * this.z) : 0;
    this.x *= inv;
    this.y *= inv;
    this.z *= inv;

    return this;
}

vec3.prototype.dot = function(v) {
    return this.x * v.x + this.y * v.y + this.z * v.z;
}

vec3.prototype.toVec2 = function() {
    return new vec2(this.x, this.y);
}

vec3.fromVec2 = function(v, z) {
    return new vec3(v.x, v.y, z);
}

vec3.truncate = function(v, length) {
    var ret = v.duplicate();
    var length_sq = v.x * v.x + v.y * v.y + v.z * v.z;
    if (length_sq > length * length) {
        ret.scale(length / Math.sqrt(length_sq));
    }

    return ret;
}

//-----------------------------------
// 2x2 Matrix (row major)
//-----------------------------------

function mat2(_11, _12, _21, _22) {
    this._11 = _11 || 0;
    this._12 = _12 || 0;
    this._21 = _21 || 0;
    this._22 = _22 || 0;
}

mat2.zero = new mat2(0, 0, 0, 0);

mat2.prototype.set = function(_11, _12, _21, _22) {
    this._11 = _11;
    this._12 = _12;
    this._21 = _21;
    this._22 = _22;

    return this;
}

mat2.prototype.copy = function(m) {
    this._11 = m._11;
    this._12 = m._12;
    this._21 = m._21;
    this._22 = m._22;
    
    return this;
}

mat2.prototype.duplicate = function() {
    return new mat2(this._11, this._12, this._21, this._22);
}

mat2.prototype.scale = function(s) {
    this._11 *= s;
    this._12 *= s;
    this._21 *= s;
    this._22 *= s;

    return this;
}

mat2.prototype.mul = function(m) {
    return this.set(
        this._11 * m2._11 + this._12 * m2._21,
        this._11 * m2._12 + this._12 * m2._22,
        this._21 * m2._11 + this._22 * m2._21,
        this._21 * m2._12 + this._22 * m2._22);
}

mat2.prototype.mulvec = function(v) {
    return new vec2(
        this._11 * v.x + this._12 * v.y, 
        this._21 * v.x + this._22 * v.y);
}

mat2.prototype.invert = function() {
    var det = this._11 * this._22 - this._12 * this._21;
    if (det != 0)
        det = 1 / det;
    
    return this.set(
        this._22 * det, -this._12 * det,
        -this._21 * det, this._11 * det);   
}

// Solve A * x = b
mat2.prototype.solve = function(b) {
    var det = this._11 * this._22 - this._12 * this._21;
    if (det != 0) 
        det = 1 / det;
    
    return new vec2(
        det * (this._22 * b.x - this._12 * b.y), 
        det * (this._11 * b.y - this._21 * b.x));
}

mat2.mul = function(m1, m2) {
    return new mat2(
        m1._11 * m2._11 + m1._12 * m2._21,
        m1._11 * m2._12 + m1._12 * m2._22,
        m1._21 * m2._11 + m1._22 * m2._21,
        m1._21 * m2._12 + m1._22 * m2._22);
}

//-----------------------------------
// 3x3 Matrix (row major)
//-----------------------------------

function mat3(_11, _12, _13, _21, _22, _23, _31, _32, _33) {
    this._11 = _11 || 0;
    this._12 = _12 || 0;
    this._13 = _13 || 0;
    this._21 = _21 || 0;
    this._22 = _22 || 0;
    this._23 = _23 || 0;
    this._31 = _31 || 0;
    this._32 = _32 || 0;
    this._33 = _33 || 0;
}

mat3.zero = new mat3(0, 0, 0, 0, 0, 0, 0, 0, 0);

mat3.prototype.set = function(_11, _12, _13, _21, _22, _23, _31, _32, _33) {
    this._11 = _11;
    this._12 = _12;
    this._13 = _13;
    this._21 = _21;
    this._22 = _22;
    this._23 = _23;
    this._31 = _31;
    this._32 = _32;
    this._33 = _33;

    return this;
}

mat3.prototype.copy = function(m) {
    this._11 = m._11;
    this._12 = m._12;
    this._13 = m._13;
    this._21 = m._21;
    this._22 = m._22;
    this._23 = m._23;
    this._31 = m._31;
    this._32 = m._32;
    this._33 = m._33;

    return this;
}

mat3.prototype.duplicate = function() {
    return new mat3(this._11, this._12, this._13, this._21, this._22, this._23, this._31, this._32, this._33);
}

mat3.prototype.scale = function(s) {
    this._11 *= s;
    this._12 *= s;
    this._13 *= s;
    this._21 *= s;
    this._22 *= s;
    this._23 *= s;
    this._31 *= s;
    this._32 *= s;
    this._33 *= s;

    return this;
}

mat3.prototype.mul = function(m) {
    return this.set(
        this._11 * m2._11 + this._12 * m2._21 + this._13 * m2._31,
        this._11 * m2._12 + this._12 * m2._22 + this._13 * m2._32,
        this._11 * m2._13 + this._12 * m2._23 + this._13 * m2._33,
        this._21 * m2._11 + this._22 * m2._21 + this._23 * m2._31,
        this._21 * m2._12 + this._22 * m2._22 + this._23 * m2._32,
        this._21 * m2._13 + this._22 * m2._23 + this._23 * m2._33,
        this._31 * m2._11 + this._32 * m2._21 + this._33 * m2._31,
        this._31 * m2._12 + this._32 * m2._22 + this._33 * m2._32,
        this._31 * m2._13 + this._32 * m2._23 + this._33 * m2._33);
}

mat3.prototype.mulvec = function(v) {
    return new vec2(
        this._11 * v.x + this._12 * v.y + this._13 * v.z, 
        this._21 * v.x + this._22 * v.y + this._23 * v.z,
        this._31 * v.x + this._32 * v.y + this._33 * v.z);
}

mat3.prototype.invert = function() {
    var det2_11 = this._22 * this._33 - this._23 * this._32;
    var det2_12 = this._23 * this._31 - this._21 * this._33;
    var det2_13 = this._21 * this._32 - this._22 * this._31;

    var det = this._11 * det2_11 + this._12 * det2_12 + this._13 * det2_13;
    if (det != 0)
        det = 1 / det;

    var det2_21 = this._13 * this._32 - this._12 * this._33;    
    var det2_22 = this._11 * this._33 - this._13 * this._31;
    var det2_23 = this._12 * this._31 - this._11 * this._32;
    var det2_31 = this._12 * this._23 - this._13 * this._22;
    var det2_32 = this._13 * this._21 - this._11 * this._23;    
    var det2_33 = this._11 * this._22 - this._12 * this._21;

    return this.set(
        det2_11 * det, det2_12 * det, det2_13 * det,
        det2_21 * det, det2_22 * det, det2_23 * det,
        det2_31 * det, det2_32 * det, det2_33 * det);
}

// Solve A(2x2) * x = b
mat3.prototype.solve2x2 = function(b) {
    var det = this._11 * this._22 - this._12 * this._21;
    if (det != 0) 
        det = 1 / det;
    
    return new vec2(
        det * (this._22 * b.x - this._12 * b.y), 
        det * (this._11 * b.y - this._21 * b.x));
}

// Solve A(3x3) * x = b
mat3.prototype.solve = function(b) {
    var det2_11 = this._22 * this._33 - this._23 * this._32;
    var det2_12 = this._23 * this._31 - this._21 * this._33;
    var det2_13 = this._21 * this._32 - this._22 * this._31;

    var det = this._11 * det2_11 + this._12 * det2_12 + this._13 * det2_13;
    if (det != 0)
        det = 1 / det;

    var det2_21 = this._13 * this._32 - this._12 * this._33;    
    var det2_22 = this._11 * this._33 - this._13 * this._31;
    var det2_23 = this._12 * this._31 - this._11 * this._32;
    var det2_31 = this._12 * this._23 - this._13 * this._22;
    var det2_32 = this._13 * this._21 - this._11 * this._23;    
    var det2_33 = this._11 * this._22 - this._12 * this._21;
    
    return new vec3(
        det * (det2_11 * b.x + det2_12 * b.y + det2_13 * b.z),
        det * (det2_21 * b.x + det2_22 * b.y + det2_23 * b.z),
        det * (det2_31 * b.x + det2_32 * b.y + det2_33 * b.z));
}

mat3.mul = function(m1, m2) {
    return new mat3(
        m1._11 * m2._11 + m1._12 * m2._21 + m1._13 * m2._31,
        m1._11 * m2._12 + m1._12 * m2._22 + m1._13 * m2._32,
        m1._11 * m2._13 + m1._12 * m2._23 + m1._13 * m2._33,
        m1._21 * m2._11 + m1._22 * m2._21 + m1._23 * m2._31,
        m1._21 * m2._12 + m1._22 * m2._22 + m1._23 * m2._32,
        m1._21 * m2._13 + m1._22 * m2._23 + m1._23 * m2._33,
        m1._31 * m2._11 + m1._32 * m2._21 + m1._33 * m2._31,
        m1._31 * m2._12 + m1._32 * m2._22 + m1._33 * m2._32,
        m1._31 * m2._13 + m1._32 * m2._23 + m1._33 * m2._33);
}

//-----------------------------------
// 2D AABB
//-----------------------------------

Bounds = function(mins, maxs) {
    this.mins = mins ? new vec2(mins.x, mins.y) : new vec2(+999999999, +999999999);
    this.maxs = maxs ? new vec2(maxs.x, maxs.y) : new vec2(-999999999, -999999999);
}

Bounds.prototype.copy = function(b) {
    this.mins.copy(b.mins);
    this.maxs.copy(b.maxs);

    return this;
}

Bounds.prototype.clear = function() {
    this.mins.set(+999999999, +999999999);
    this.maxs.set(-999999999, -999999999);

    return this;
}

Bounds.prototype.isEmpty = function() {
    if (this.mins.x > this.maxs.x || this.mins.y > this.maxs.y)
        return true;
}

Bounds.prototype.addPoint = function(p) {
    if (this.mins.x > p.x)
        this.mins.x = p.x;
    if (this.maxs.x < p.x)
        this.maxs.x = p.x;
    if (this.mins.y > p.y)
        this.mins.y = p.y;
    if (this.maxs.y < p.y)
        this.maxs.y = p.y;

    return this;
}

Bounds.prototype.addBounds = function(b) {
    if (this.mins.x > b.mins.x)
        this.mins.x = b.mins.x;
    if (this.maxs.x < b.maxs.x)
        this.maxs.x = b.maxs.x;
    if (this.mins.y > b.mins.y)
        this.mins.y = b.mins.y;
    if (this.maxs.y < b.maxs.y)
        this.maxs.y = b.maxs.y;

    return this;
}

Bounds.prototype.expand = function(ax, ay) {
    this.mins.x -= ax;
    this.mins.y -= ay;
    this.maxs.x += ax;
    this.maxs.y += ay;

    return this;
}

Bounds.prototype.containPoint = function(p) {
    if (p.x < this.mins.x || p.x > this.maxs.x || p.y < this.mins.y || p.y > this.maxs.y)
        return false;

    return true;
}

Bounds.prototype.intersectsBounds = function(b) {
    if (this.mins.x > b.maxs.x || this.maxs.x < b.mins.x || this.mins.y > b.maxs.y || this.maxs.y < b.mins.y)
        return false;

    return true;
}
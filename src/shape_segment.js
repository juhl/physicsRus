//------------------------------------------
// ShapeSegment (thick rounded line segment)
//------------------------------------------

ShapeSegment = function(a, b, radius) {
	Shape.call(this, Shape.TYPE_SEGMENT);
	this.a = a.duplicate();
	this.b = b.duplicate();
	this.r = radius;
	this.n = vec2.perp(vec2.sub(b, a));
	this.n.normalize();

	this.ta = vec2.zero;
	this.tb = vec2.zero;
	this.tn = vec2.zero;

	this.finishVerts();
}

ShapeSegment.prototype = new Shape;
ShapeSegment.prototype.constructor = ShapeSegment;

ShapeSegment.prototype.finishVerts = function() {
	this.n = vec2.perp(vec2.sub(this.b, this.a));
	this.n.normalize();

	this.r = Math.abs(this.r);
}

ShapeSegment.prototype.duplicate = function() {
	return new ShapeSegment(this.a, this.b, this.r);
}

ShapeSegment.prototype.serialize = function() {
	return {
		"type": "ShapeSegment",
		"e": this.e,
		"u": this.u,
		"density": this.density,
		"a": this.a, 
		"b": this.b,
		"radius": this.r
	};
}

ShapeSegment.prototype.recenter = function(c) {
	this.a.subself(c);
	this.b.subself(c);
}

ShapeSegment.prototype.transform = function(xf) {
	this.a = xf.transform(this.a);
	this.b = xf.transform(this.b);
}

ShapeSegment.prototype.untransform = function(xf) {
	this.a = xf.untransform(this.a);
	this.b = xf.untransform(this.b);
}

ShapeSegment.prototype.area = function() {
	return areaForSegment(this.a, this.b, this.r);
}

ShapeSegment.prototype.centroid = function() {
	return centroidForSegment(this.a, this.b);
}

ShapeSegment.prototype.inertia = function(mass) {
	return inertiaForSegment(mass, this.a, this.b);
}

ShapeSegment.prototype.cacheData = function(xf) {
	this.ta = xf.transform(this.a);
	this.tb = xf.transform(this.b);
	this.tn = vec2.rotate(this.n, angle);

	if (this.ta.x < this.tb.x) {
		l = this.ta.x;
		r = this.tb.x;
	} 
	else {
		l = this.tb.x;
		r = this.ta.x;
	}
	
	if (this.ta.y < this.tb.y) {
		b = this.ta.y;
		t = this.tb.y;
	} else {
		b = this.tb.y;
		t = this.ta.y;
	}

	this.bounds.mins.set(l - this.r, b - this.r);
	this.bounds.maxs.set(r + this.r, t + this.r);
}

ShapeSegment.prototype.pointQuery = function(p) {
	if (!this.bounds.containPoint(p)) {
		return false;
	}
	
	var dn = vec2.dot(seg.tn, p) - vec2.dot(seg.ta, seg.tn);
	var dist = Math.abs(dn) - seg.r;
	if (dist > 0) {
		return false;
	}
	
	var dt = vec2.cross(p, seg.tn);
	var dtMin = vec2.cross(seg.ta, seg.tn);
	var dtMax = vec2.cross(seg.tb, seg.tn);
	
	if (dt <= dtMin) {
		if (dt < dtMin - seg.r) {
			return false;
		} 

		return vec2.distsq(seg.ta, p) < (seg.r * seg.r);
	} 
	else if (dt > dtMax) {
		if (dt > dtMax + seg.r) {
			return false;
		}

		return vec2.distsq(seg.tb, p) < (seg.r * seg.r);
	}
	
	return true;
}

ShapeSegment.prototype.findVertexByPoint = function(p, minDist) {
	var dsq = minDist * minDist;

	if (vec2.distsq(this.ta, p) < dsq) {
		return 0;
	}

	if (vec2.distsq(this.tb, p) < dsq) {
		return 1;
	}

	return -1;
}

ShapeSegment.prototype.distanceOnPlane = function(n, d) {
	var a = vec2.dot(n, this.ta) - this.r;
	var b = vec2.dot(n, this.tb) - this.r;
	
	return Math.min(a, b) - d;
}
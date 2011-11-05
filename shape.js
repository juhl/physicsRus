Shape = function(type) {
    if (arguments.length == 0)
        return;

    if (Shape.hashid_counter == undefined)
        Shape.hashid_counter = 0;
    
    this.hashid = Shape.hashid_counter++;
    this.type = type;

    // coefficient of restitution (elasticity)
	this.e = 0;

    // frictional coefficient
	this.u = 1;

    // axis-aligned bounding box
    this.bounds = new Bounds;
}

Shape.TYPE_CIRCLE = 0;
Shape.TYPE_SEGMENT = 1;
Shape.TYPE_POLY = 2;
Shape.NUM_TYPES = 3;

//------------------------------------------
// Circle
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

//------------------------------------------
// Segment (thick rounded line segment)
//------------------------------------------

ShapeSegment = function(a, b, radius) {
    Shape.call(this, Shape.TYPE_SEGMENT);
    this.a = a;
    this.b = b;
    this.r = radius;
    this.n = vec2.perp(vec2.sub(b, a));
    this.n.normalize();

    this.ta = vec2.zero;
    this.tb = vec2.zero;
    this.tn = vec2.zero;
}

ShapeSegment.prototype = new Shape;
ShapeSegment.prototype.constructor = ShapeSegment;

ShapeSegment.prototype.recenterForCentroid = function() {
    var centroid = centroidForSegment(this.a, this.b);
    this.a.subself(centroid);
    this.b.subself(centroid);
}

ShapeSegment.prototype.area = function() {
    return areaForSegment(this.a, this.b, this.r);
}

ShapeSegment.prototype.inertia = function(mass) {
    return inertiaForSegment(mass, this.a, this.b);
}

ShapeSegment.prototype.cacheData = function(pos, angle) {
    this.ta = vec2.add(pos, vec2.rotate(this.a, angle));
	this.tb = vec2.add(pos, vec2.rotate(this.b, angle));
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

ShapeSegment.prototype.distanceOnPlane = function(n, d) {
    var a = vec2.dot(n, this.ta) - this.r;
    var b = vec2.dot(n, this.tb) - this.r;
    
    return Math.min(a, b) - d;
}

//--------------------------------
// Poly (convex only)
//--------------------------------

ShapePoly = function(verts) {
    Shape.call(this, Shape.TYPE_POLY);
    this.verts = verts;
    this.planes = []; 
   
    this.tverts = [];
    this.tplanes = [];

    // must be counter-clockwise verts
    for (var i = 0; i < verts.length; i++) {
        var a = verts[i];
        var b = verts[(i + 1) % verts.length];
        var n = vec2.normalize(vec2.perp(vec2.sub(a, b)));

        this.planes[i] = {};
        this.planes[i].n = n;
        this.planes[i].d = vec2.dot(n, a);

        this.tverts[i] = vec2.zero;

        this.tplanes[i] = {};
        this.tplanes[i].n = vec2.zero;
        this.tplanes[i].d = 0;
    }
}

ShapePoly.prototype = new Shape;
ShapePoly.prototype.constructor = ShapePoly;

ShapePoly.prototype.recenterForCentroid = function() {
	var centroid = centroidForPoly(this.verts);
	for (var i = 0; i < this.numVerts; i++) {
		this.verts[i].subself(centroid);
	}
}

ShapePoly.prototype.area = function() {
    return areaForPoly(this.verts);
}

ShapePoly.prototype.inertia = function(mass) {
    return inertiaForPoly(mass, this.verts, vec2.zero);
}

ShapePoly.prototype.cacheData = function(pos, angle) {
    for (var i = 0; i < this.verts.length; i++) {
        this.tverts[i] = vec2.add(pos, vec2.rotate(this.verts[i], angle));
    }

    for (var i = 0; i < this.verts.length; i++) {
        var a = this.tverts[i];
        var b = this.tverts[(i + 1) % this.verts.length];

        var n = vec2.normalize(vec2.perp(vec2.sub(a, b)));
        
        this.tplanes[i].n = n;
        this.tplanes[i].d = vec2.dot(n, a);
    }

    this.bounds.clear();
    for (var i = 0; i < this.verts.length; i++) {
		this.bounds.addPoint(this.tverts[i]);
	}
}

ShapePoly.prototype.pointQuery = function(p) {
    if (!this.bounds.containPoint(p)) {
        return false;
    }

    return this.containPoint(p);
}

ShapePoly.prototype.distanceOnPlane = function(n, d) {
    var min = 99999999;
    for (var i = 0; i < this.verts.length; i++) {
        min = Math.min(min, vec2.dot(n, this.tverts[i]));
    }
    return min - d;
}

ShapePoly.prototype.containPoint = function(p) {
    for (var i = 0; i < this.verts.length; i++) {
        var plane = this.tplanes[i];
        if (vec2.dot(plane.n, p) - plane.d > 0) {
            return false;
        }
    }

    return true;
}

ShapePoly.prototype.containPointPartial = function(p, n) {
    for (var i = 0; i < this.verts.length; i++) {
        var plane = this.tplanes[i];
        if (vec2.dot(plane.n, n) < 0) {
            continue;
        }

        if (vec2.dot(plane.n, p) - plane.d > 0) {
            return false;
        }
    }

    return true;
}

//--------------------------------
// Triangle
//--------------------------------

ShapeTriangle = function(p1, p2, p3) {
    var verts = [
        new vec2(p1.x, p1.y),
        new vec2(p2.x, p2.y),
        new vec2(p3.x, p3.y)
    ];
    return new ShapePoly(verts);
}

//--------------------------------
// Box
//--------------------------------

ShapeBox = function(w, h, offset_x, offset_y) {
    offset_x = offset_x || 0;
    offset_y = offset_y || 0;

    var hw = w * 0.5;
    var hh = h * 0.5;
    var verts = [
        new vec2(-hw + offset_x, +hh + offset_y),
        new vec2(-hw + offset_x, -hh + offset_y),
        new vec2(+hw + offset_x, -hh + offset_y),
        new vec2(+hw + offset_x, +hh + offset_y)
    ];

    return new ShapePoly(verts);
}


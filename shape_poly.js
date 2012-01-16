//--------------------------------
// ShapePoly (convex only)
//--------------------------------

ShapePoly = function(verts) {
    Shape.call(this, Shape.TYPE_POLY);
    this.verts = verts;
    this.planes = []; 
   
    this.tverts = [];
    this.tplanes = [];

    // Must be counter-clockwise verts
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
    var min = 999999999;
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
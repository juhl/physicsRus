//--------------------------------
// ShapePoly (convex only)
//--------------------------------

ShapePoly = function(verts) {
	Shape.call(this, Shape.TYPE_POLY);

	this.verts = [];
	this.planes = [];
   
	this.tverts = [];
	this.tplanes = [];

	if (verts) {
		for (var i = 0; i < verts.length; i++) {
			this.verts[i] = verts[i].duplicate();
			this.tverts[i] = this.verts[i];

			this.tplanes[i] = {};
			this.tplanes[i].n = vec2.zero;
			this.tplanes[i].d = 0;
		}
	}

	this.finishVerts();
}

ShapePoly.prototype = new Shape;
ShapePoly.prototype.constructor = ShapePoly;

ShapePoly.prototype.finishVerts = function() {
	if (this.verts.length < 2) {
		this.convexity = false;
		this.planes = [];
		return;
	}

	this.convexity = true;
	this.tverts = [];
	this.tplanes = [];

	// Create the convex hull using the Gift wrapping algorithm
	// http://en.wikipedia.org/wiki/Gift_wrapping_algorithm

	// Find the right most point on the hull
	var i0 = 0;
	var x0 = this.verts[0].x;
	for (var i = 1; i < this.verts.length; i++) {
		var x = this.verts[i].x;
		if (x > x0 || (x == x0 && this.verts[i].y < this.verts[i0].y)) {
			i0 = i;
			x0 = x;
		}
	}

	//
	var n = this.verts.length;//Math.min(this.verts.length, 100);
	var hull = [];
	var m = 0;
	var ih = i0;

	while (1) {
		hull[m] = ih;

		var ie = 0;
		for (var j = 1; j < n; j++) {
			if (ie == ih) {
				ie = j;
				continue;
			}

			var r = vec2.sub(this.verts[ie], this.verts[hull[m]]);
			var v = vec2.sub(this.verts[j], this.verts[hull[m]]);
			var c = vec2.cross(r, v);
			if (c < 0) {
				ie = j;
			}

			// Collinearity check
			if (c == 0 && v.lengthsq() > r.lengthsq()) {
				ie = j;
			}
		}

		m++;
		ih = ie;

		if (ie == i0) {
			break;
		}		
	}

	// Copy vertices
	var verts = [];
	for (var i = 0; i < m; ++i) {
		verts.push(this.verts[hull[i]]);
	}

	this.verts = verts;

	// Must be counter-clockwise verts
	for (var i = 0; i < this.verts.length; i++) {
		var a = this.verts[i];
		var b = this.verts[(i + 1) % this.verts.length];
		var n = vec2.normalize(vec2.perp(vec2.sub(a, b)));

		this.planes[i] = {};
		this.planes[i].n = n;
		this.planes[i].d = vec2.dot(n, a);

		this.tverts[i] = this.verts[i];

		this.tplanes[i] = {};
		this.tplanes[i].n = vec2.zero;
		this.tplanes[i].d = 0;		
	}

	for (var i = 0; i < this.planes.length; i++) {
		var p1 = this.planes[i];
		var p2 = this.planes[(i + 1) % this.planes.length];

		if (vec2.cross(p1.n, p2.n) < 0) {
			this.convexity = false;
		}
	}
}

ShapePoly.prototype.duplicate = function() {
	return new ShapePoly(this.verts);
}

ShapePoly.prototype.serialize = function() {
	return {
		"type": "ShapePoly",
		"e": this.e,
		"u": this.u,
		"density": this.density,
		"verts": this.verts
	};
}

ShapePoly.prototype.recenter = function(c) {
	for (var i = 0; i < this.verts.length; i++) {
		this.verts[i].subself(c);
	}
}

ShapePoly.prototype.transform = function(xf) {
	for (var i = 0; i < this.verts.length; i++) {
		this.verts[i] = xf.transform(this.verts[i]);
	}
}

ShapePoly.prototype.untransform = function(xf) {
	for (var i = 0; i < this.verts.length; i++) {
		this.verts[i] = xf.untransform(this.verts[i]);
	}
}

ShapePoly.prototype.area = function() {
	return areaForPoly(this.verts);
}

ShapePoly.prototype.centroid = function() {
	return centroidForPoly(this.verts);
}

ShapePoly.prototype.inertia = function(mass) {
	return inertiaForPoly(mass, this.verts, vec2.zero);
}

ShapePoly.prototype.cacheData = function(xf) {
	this.bounds.clear();

	var numVerts = this.verts.length;
	if (numVerts == 0) {
		return;
	}

	for (var i = 0; i < numVerts; i++) {
		this.tverts[i] = xf.transform(this.verts[i]);
	}		

	if (numVerts < 2) {
		this.bounds.addPoint(this.tverts[0]);
		return;
	}	

	for (var i = 0; i < numVerts; i++) {
		var a = this.tverts[i];
		var b = this.tverts[(i + 1) % numVerts];

		var n = vec2.normalize(vec2.perp(vec2.sub(a, b)));
		
		this.tplanes[i].n = n;
		this.tplanes[i].d = vec2.dot(n, a);

		this.bounds.addPoint(a);
	}
}

ShapePoly.prototype.pointQuery = function(p) {
	if (!this.bounds.containPoint(p)) {
		return false;
	}

	return this.containPoint(p);
}

ShapePoly.prototype.findVertexByPoint = function(p, minDist) {
	var dsq = minDist * minDist;

	for (var i = 0; i < this.tverts.length; i++) {
		if (vec2.distsq(this.tverts[i], p) < dsq) {
			return i;
		}
	}

	return -1;
}

ShapePoly.prototype.findEdgeByPoint = function(p, minDist) {
	var dsq = minDist * minDist;
	var numVerts = this.tverts.length;

	for (var i = 0; i < this.tverts.length; i++) {
		var v1 = this.tverts[i];
		var v2 = this.tverts[(i + 1) % numVerts];
		var n = this.tplanes[i].n;

		var dtv1 = vec2.cross(v1, n);
		var dtv2 = vec2.cross(v2, n);
		var dt = vec2.cross(p, n);

		if (dt > dtv1) {
			if (vec2.distsq(v1, p) < dsq) {
				return i;
			}
		}
		else if (dt < dtv2) {
			if (vec2.distsq(v2, p) < dsq) {
				return i;
			}
		}
		else {
			var dist = vec2.dot(n, p) - vec2.dot(n, v1);
			if (dist * dist < dsq) {
				return i;
			}
		}
	}

	return -1;
}

ShapePoly.prototype.distanceOnPlane = function(n, d) {
	var min = 999999;
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

ShapeBox = function(local_x, local_y, w, h) {
	local_x = local_x || 0;
	local_y = local_y || 0;

	var hw = w * 0.5;
	var hh = h * 0.5;
	var verts = [
		new vec2(-hw + local_x, +hh + local_y),
		new vec2(-hw + local_x, -hh + local_y),
		new vec2(+hw + local_x, -hh + local_y),
		new vec2(+hw + local_x, +hh + local_y)
	];

	return new ShapePoly(verts);
}
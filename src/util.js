function areaForCircle(radius_outer, radius_inner) {
	return Math.PI * (radius_outer * radius_outer - radius_inner * radius_inner);
}

function inertiaForCircle(mass, center, radius_outer, radius_inner) {
	return mass * ((radius_outer * radius_outer + radius_inner * radius_inner) * 0.5 + center.lengthsq());
}

function areaForSegment(a, b, radius) {
	return radius * (Math.PI * radius + 2 * vec2.dist(a, b));
}

function centroidForSegment(a, b) {
    return vec2.scale(vec2.add(a, b), 0.5);
}

function inertiaForSegment(mass, a, b) {
	var distsq = vec2.distsq(b, a);
	var offset = vec2.scale(vec2.add(a, b), 0.5);
	
	return mass * (distsq / 12 + offset.lengthsq());
}

function areaForPoly(verts) {
	var area = 0;
	for (var i = 0; i < verts.length; i++) {
		area += vec2.cross(verts[i], verts[(i + 1) % verts.length]);
	}
	
	return area / 2;
}

function centroidForPoly(verts) {
	var area = 0;
	var vsum = new vec2(0, 0);
	
	for (var i = 0; i < verts.length; i++) {
		var v1 = verts[i];
		var v2 = verts[(i + 1) % verts.length];
		var cross = vec2.cross(v1, v2);
		
		area += cross;
		vsum.addself(vec2.scale(vec2.add(v1, v2), cross));
	}
	
	return vec2.scale(vsum, 1 / (3 * area));
}

function inertiaForPoly(mass, verts, offset) {
	var sum1 = 0;
	var sum2 = 0;

	for (var i = 0; i < verts.length; i++) {
		var v1 = vec2.add(verts[i], offset);
		var v2 = vec2.add(verts[(i+1) % verts.length], offset);
		
		var a = vec2.cross(v2, v1);
		var b = vec2.dot(v1, v1) + vec2.dot(v1, v2) + vec2.dot(v2, v2);
		
		sum1 += a * b;
		sum2 += a;
	}
	
	return (mass * sum1) / (6 * sum2);
}

function inertiaForBox(mass, w, h) {
	return mass * (w * w + h * h) / 12;
}
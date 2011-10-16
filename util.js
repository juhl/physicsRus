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

function relative_velocity(body1, body2, r1, r2) {
    var v1 = vec2.mad(body1.v, vec2.perp(r1), body1.w);
    var v2 = vec2.mad(body2.v, vec2.perp(r2), body2.w);

    return vec2.sub(v2, v1);
}

function relative_bias_velocity(body1, body2, r1, r2) {
    var vb1 = vec2.mad(body1.v_bias, vec2.perp(r1), body1.w_bias);
    var vb2 = vec2.mad(body2.v_bias, vec2.perp(r2), body2.w_bias);

    return vec2.sub(vb2, vb1);
}

function k_scalar(body1, body2, r1, r2, n) {
    var m_inv_sum = body1.m_inv + body2.m_inv;
    var r1cn = vec2.cross(r1, n);
    var r2cn = vec2.cross(r2, n);
            
    return m_inv_sum + body1.i_inv * r1cn * r1cn + body2.i_inv * r2cn * r2cn;
}

function k_tensor(body1, body2, r1, r2) {
	var m_inv_sum = body1.m_inv + body2.m_inv;

	// m_inv_sum * I
	var k_11 = m_inv_sum;
	var k_12 = 0;
	var k_21 = 0;
	var k_22 = m_inv_sum;

	var i_inv1 = body1.i_inv;
	var i_inv2 = body2.i_inv;

	// add influence from r1
	var r1_xx =  r1.x * r1.x * i_inv1;
	var r1_yy =  r1.y * r1.y * i_inv1;
	var r1_xy = -r1.x * r1.y * i_inv1;

	k_11 += r1_yy;
	k_12 += r1_xy;
	k_21 += r1_xy;
	k_22 += r1_xx;

	// add influence from r2
	var r2_xx =  r2.x * r2.x * i_inv2;
	var r2_yy =  r2.y * r2.y * i_inv2;
	var r2_xy = -r2.x * r2.y * i_inv2;

	k_11 += r2_yy;
	k_12 += r2_xy;
	k_21 += r2_xy;
	k_22 += r2_xx;

	// invert
	var det = k_11 * k_22 - k_12 * k_21;
	var det_inv = 1 / det;

	var k1 = new vec2( k_22 * det_inv, -k_12 * det_inv);
	var k2 = new vec2(-k_21 * det_inv,  k_11 * det_inv);

	return { k1: k1, k2: k2 };
}

function mul_k(dv, k1, k2) {
	return new vec2(k1.dot(dv), k2.dot(dv));
}

function applyImpulses(body1, body2, r1, r2, j) {
	body1.applyImpulse(vec2.neg(j), r1);
    body2.applyImpulse(j, r2);
}

function applyBiasImpulses(body1, body2, r1, r2, j) {
	body1.applyBiasImpulse(vec2.neg(j), r1);
    body2.applyBiasImpulse(j, r2);
}
function ContactSolver(shape1, shape2) {
    // contact shapes
    this.shape1 = shape1;
    this.shape2 = shape2;

    // contact list
    this.contactArr = [];

    // coefficient of restitution (elasticity)
    this.e = 1; 

    // frictional coefficient
    this.u = 1;
}

ContactSolver.CORRECTION_COEFF = 0.34;
ContactSolver.COLLISION_SLOP = 0.1;

ContactSolver.prototype.update = function(newContactArr) {
    for (var i = 0; i < newContactArr.length; i++) {
        var newContact = newContactArr[i];
        var k = -1;
        for (var j = 0; j < this.contactArr.length; j++) {
            if (newContact.hash == this.contactArr[j].hash) {
                k = j;
                break;
            }
        }

        if (k > -1) {
            newContact.jn_acc = this.contactArr[k].jn_acc;
            newContact.jt_acc = this.contactArr[k].jt_acc;
            newContact.jp_acc = 0;
        }
    }

    this.contactArr = newContactArr;
}

ContactSolver.prototype.initSolver = function(dt_inv) {
    var body1 = this.shape1.body;
    var body2 = this.shape2.body;

    var sum_m_inv = body1.m_inv + body2.m_inv;

    for (var i = 0; i < this.contactArr.length; i++) {
        var con = this.contactArr[i];

        // transformed r1, r2
        con.r1 = vec2.sub(con.p, body1.p);
        con.r2 = vec2.sub(con.p, body2.p);

        // local r1, r2
        con.r1_local = vec2.rotate(con.r1, -body1.a);
        con.r2_local = vec2.rotate(con.r2, -body2.a);

        var n = con.n;
        var t = vec2.perp(con.n);

        // kn = J * invM * JT
        // J = [ -n, -cross(r1, n), n, cross(r2, n) ]        
        var sn1 = vec2.cross(con.r1, n);
        var sn2 = vec2.cross(con.r2, n);
        var kn = sum_m_inv + body1.i_inv * sn1 * sn1 + body2.i_inv * sn2 * sn2;
        con.kn_inv = kn == 0 ? 0 : 1 / kn;

        // kt = J * invM * JT
        // J = [ -t, -cross(r1, t), t, cross(r2, t) ]  
        var st1 = vec2.cross(con.r1, t);
        var st2 = vec2.cross(con.r2, t);
        var kt = sum_m_inv + body1.i_inv * st1 * st1 + body2.i_inv * st2 * st2;
        con.kt_inv = kt == 0 ? 0 : 1 / kt;
        
        // linear velocities at contact
        // in 2D: cross(w, r) = perp(r) * w
        var v1 = vec2.mad(body1.v, vec2.perp(con.r1), body1.w);
        var v2 = vec2.mad(body2.v, vec2.perp(con.r2), body2.w);

        // relative velocity at contact
        var rv = vec2.sub(v2, v1);

        // bounce velocity dot n
        con.bounce = vec2.dot(rv, con.n) * this.e;
    }
}

ContactSolver.prototype.warmStart = function() {
    var body1 = this.shape1.body;
    var body2 = this.shape2.body;

    for (var i = 0; i < this.contactArr.length; i++) {
        var con = this.contactArr[i];

        // apply accumulated impulses
        var j = vec2.rotate(con.n, new vec2(con.jn_acc, con.jt_acc));

        body1.v.mad(j, -body1.m_inv);
        body1.w -= vec2.cross(con.r1, j) * body1.i_inv;

        body2.v.mad(j, body2.m_inv);
        body2.w += vec2.cross(con.r2, j) * body2.i_inv;
    }
}

ContactSolver.prototype.solveVelocityConstraints = function() {
    var body1 = this.shape1.body;
    var body2 = this.shape2.body;

    for (var i = 0; i < this.contactArr.length; i++) {
        var con = this.contactArr[i];
        var n = con.n;
        var t = vec2.perp(n);
        var r1 = con.r1;
        var r2 = con.r2;

        // linear velocities at contact
        // in 2D: cross(w, r) = perp(r) * w
        var v1 = vec2.mad(body1.v, vec2.perp(r1), body1.w);
        var v2 = vec2.mad(body2.v, vec2.perp(r2), body2.w);

        // relative velocity at contact
        var rv = vec2.sub(v2, v1);

        // compute normal impulse
        var jn = -con.kn_inv * (vec2.dot(n, rv) + con.bounce);
        var jn_old = con.jn_acc;
        con.jn_acc = Math.max(jn_old + jn, 0);
        jn = con.jn_acc - jn_old;

        // max friction impulse (Coulomb's Law)
        var jt_max = con.jn_acc * this.u;

        // compute frictional impulse
        var jt = -con.kt_inv * vec2.dot(t, rv);
        var jt_old = con.jt_acc;
        con.jt_acc = Math.clamp(jt_old + jt, -jt_max, jt_max);
        jt = con.jt_acc - jt_old;

		// apply the final impulses
        var j = vec2.rotate(n, new vec2(jn, jt));

        body1.v.mad(j, -body1.m_inv);
        body1.w -= vec2.cross(r1, j) * body1.i_inv;

        body2.v.mad(j, body2.m_inv);
        body2.w += vec2.cross(r2, j) * body2.i_inv;
    }   
}

ContactSolver.prototype.solvePositionConstraints = function() {
    var body1 = this.shape1.body;
    var body2 = this.shape2.body;

    var max_penetration = 0;

    for (var i = 0; i < this.contactArr.length; i++) {
        var con = this.contactArr[i];
        var n = con.n;

        // transformed r1, r2
        var r1 = vec2.rotate(con.r1_local, body1.a);
        var r2 = vec2.rotate(con.r2_local, body2.a);

        // (corrected) contact points
        var p1 = vec2.add(body1.p, r1);
        var p2 = vec2.add(body2.p, r2);

        // corrected delta vector
        var dp = vec2.sub(p2, p1);

        // position constraint
        var c = vec2.dot(dp, n) + con.d;
        var correction = ContactSolver.CORRECTION_COEFF * Math.min(c + ContactSolver.COLLISION_SLOP, 0);
        if (correction == 0)
            continue;

        // we don't need max_penetration less than or equal slop
        max_penetration = Math.max(max_penetration, -c);

        // compute lambda for position constraint
        // solve (J * invM * JT) * lambda = -C
        var sn1 = vec2.cross(r1, n);
        var sn2 = vec2.cross(r2, n);
        var k = body1.m_inv + body2.m_inv + body1.i_inv * sn1 * sn1 + body2.i_inv * sn2 * sn2;
        var jp = k == 0 ? 0 : -correction / k;

        // accumulate and clamp
        var jp_old = con.jp_acc;
        con.jp_acc = Math.max(jp_old + jp, 0);
        jp = con.jp_acc - jp_old;        
        
        // apply correction impulses
        var j = vec2.scale(n, jp);

        body1.p.mad(j, -body1.m_inv);
        body1.a -= sn1 * jp * body1.i_inv;
        
        body2.p.mad(j, body2.m_inv);
        body2.a += sn2 * jp * body2.i_inv;
    }

    return max_penetration <= ContactSolver.COLLISION_SLOP * 3;
}

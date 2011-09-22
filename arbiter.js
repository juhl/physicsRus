function Contact(p, n, d, hash) {
    this.hash = hash;

    // contact point
    this.p = p; 

    // contact normal
    this.n = n; 

    // penetration depth
    this.d = d; 

    // accumulated normal impulse
    this.jn_acc = 0; 

    // accumulated tangential impulse
    this.jt_acc = 0; 

    // accumulated normal impulse bias
    this.jbn_acc = 0; 
}

function Arbiter(shape1, shape2) {
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

Arbiter.BIAS_COEFF = 0.2;
Arbiter.COLLISION_SLOP = 0.04;

Arbiter.prototype.update = function(newContactArr) {
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
            newContact.jbn_acc = this.contactArr[k].jbn_acc;
        }
    }

    this.contactArr = newContactArr;
}

Arbiter.prototype.preStep = function(dt_inv) {
    var body1 = this.shape1.body;
    var body2 = this.shape2.body;

    if (body1 == this.staticBody && body2 == this.staticBody) {
        return;
    }

    for (var i = 0; i < this.contactArr.length; i++) {
        var con = this.contactArr[i];

        con.r1 = vec2.sub(con.p, body1.p);
        con.r2 = vec2.sub(con.p, body2.p);

        con.kn_inv = 1 / k_scalar(body1, body2, con.r1, con.r2, con.n);
        con.kt_inv = 1 / k_scalar(body1, body2, con.r1, con.r2, vec2.perp(con.n));

        // velocity bias
        con.v_bias = -Arbiter.BIAS_COEFF * dt_inv * Math.min(0, con.d + Arbiter.COLLISION_SLOP);

        con.jbn_acc = 0;
        
        // Relative velocity at contact
        var dv = relative_velocity(body1, body2, con.r1, con.r2);

        // bounce velocity
        con.bounce = vec2.dot(dv, con.n) * this.e;
    }
}

Arbiter.prototype.applyCachedImpulse = function() {
    var body1 = this.shape1.body;
    var body2 = this.shape2.body;

    for (var i = 0; i < this.contactArr.length; i++) {
        var con = this.contactArr[i];

        var j = vec2.rotate(con.n, vec2.create(con.jn_acc, con.jt_acc));

        body1.applyImpulse(vec2.neg(j), con.r1);
        body2.applyImpulse(j, con.r2);
    }
}

Arbiter.prototype.applyImpulse = function() {
    var shape1 = this.shape1;
    var shape2 = this.shape2;

    var body1 = shape1.body;
    var body2 = shape2.body;

    if (body1 == this.staticBody && body2 == this.staticBody) {
        return;
    }

    for (var i = 0; i < this.contactArr.length; i++) {
        var con = this.contactArr[i];
        var n = con.n;
        var r1 = con.r1;
        var r2 = con.r2;

        // relative bias velocity at contact
        var dvb = relative_bias_velocity(body1, body2, r1, r2);

		// bias impulse.
		var dvbn = vec2.dot(dvb, n);
		var jbn = (-dvbn + con.v_bias) * con.kn_inv;
        var jbn_old = con.jbn_acc;
        con.jbn_acc = Math.max(jbn_old + jbn, 0);
        jbn = con.jbn_acc - jbn_old;
		
		// apply bias impulse.
		body1.applyBiasImpulse(vec2.scale(n, -jbn), r1);
		body2.applyBiasImpulse(vec2.scale(n, +jbn), r2);

		// relative velocity at contact
        var dv = relative_velocity(body1, body2, r1, r2);

        // compute normal impulse
        var dvn = vec2.dot(dv, n);
        var jn = -(dvn + con.bounce) * con.kn_inv;
        var jn_old = con.jn_acc;
        con.jn_acc = Math.max(jn_old + jn, 0);
        jn = con.jn_acc - jn_old;

        // compute frictional impulse
        var dvt = vec2.dot(dv, vec2.perp(n));
        var jt_max = this.u * con.jn_acc;
        var jt = -dvt * con.kt_inv;
        var jt_old = con.jt_acc;
        con.jt_acc = Math.clamp(jt_old + jt, -jt_max, jt_max);
        jt = con.jt_acc - jt_old;

		// apply the final impulse
        var j = vec2.rotate(n, vec2.create(jn, jt));
        body1.applyImpulse(vec2.neg(j), r1);
        body2.applyImpulse(j, r2);
    }   
}

function relative_velocity(body1, body2, r1, r2) {
    var v1 = vec2.add(body1.v, vec2.scale(vec2.perp(r1), body1.w));
    var v2 = vec2.add(body2.v, vec2.scale(vec2.perp(r2), body2.w));

    return vec2.sub(v2, v1);
}

function relative_bias_velocity(body1, body2, r1, r2) {
    var vb1 = vec2.add(body1.v_bias, vec2.scale(vec2.perp(r1), body1.w_bias));
    var vb2 = vec2.add(body2.v_bias, vec2.scale(vec2.perp(r2), body2.w_bias));

    return vec2.sub(vb2, vb1);
}

function k_scalar(body1, body2, r1, r2, n) {
    var m_inv_sum = body1.m_inv + body2.m_inv;
    var r1cn = vec2.cross(r1, n);
    var r2cn = vec2.cross(r2, n);
            
    return m_inv_sum + body1.i_inv * r1cn * r1cn + body2.i_inv * r2cn * r2cn;
}
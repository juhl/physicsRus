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

    // accumulated separation impulse
    this.js_acc = 0; 
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

Arbiter.SEPARATION_COEFF = 0.32;
Arbiter.COLLISION_SLOP = 0.18;

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
            newContact.js_acc = this.contactArr[k].js_acc;
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

        // separation velocity dot n
        con.separation = -Arbiter.SEPARATION_COEFF * Math.min(con.d + Arbiter.COLLISION_SLOP, 0) * dt_inv;

        con.js_acc = 0;
        
        // relative velocity at contact
        var dv = relative_velocity(body1, body2, con.r1, con.r2);

        // bounce velocity dot n
        con.bounce = vec2.dot(dv, con.n) * this.e;
    }
}

Arbiter.prototype.applyCachedImpulse = function() {
    var body1 = this.shape1.body;
    var body2 = this.shape2.body;

    for (var i = 0; i < this.contactArr.length; i++) {
        var con = this.contactArr[i];

        var j = vec2.rotate(con.n, new vec2(con.jn_acc, con.jt_acc));

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

        // relative separation velocity at contact
        var dvs = relative_bias_velocity(body1, body2, r1, r2);

		// separation impulse.
		var dvs = vec2.dot(dvs, n);
		var js = (-dvs + con.separation) * con.kn_inv;
        var js_old = con.js_acc;
        con.js_acc = Math.max(js_old + js, 0);
        js = con.js_acc - js_old;
		
		// apply separation impulse.
		body1.applyBiasImpulse(vec2.scale(n, -js), r1);
		body2.applyBiasImpulse(vec2.scale(n, +js), r2);

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
        var j = vec2.rotate(n, new vec2(jn, jt));
        body1.applyImpulse(vec2.neg(j), r1);
        body2.applyImpulse(j, r2);
    }   
}
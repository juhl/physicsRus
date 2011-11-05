function Space() {
    this.gravity = new vec2(0, 0);
    this.damping = 1.0;

    this.staticBody = new Body(Number.POSITIVE_INFINITY, Number.POSITIVE_INFINITY);
    this.staticBody.space = this;

    this.shapeArr = [];
    this.bodyArr = [];    
    this.jointArr = [];

    this.arbiterArr = [];
}

Space.prototype.addBody = function(body) {
    this.bodyArr.push(body);
    
    for (var i = 0; i < body.shapeArr.length; i++) {
        this.shapeArr.push(body.shapeArr[i]); 
    }

    body.space = this;
    body.cacheData();
}

Space.prototype.removeBody = function(body) {
    for (var i = 0; i < this.bodyArr.length; i++) {
        if (this.bodyArr[i] == body) {            
            for (var j = 0; j < this.shapeArr.length; j++) {
                if (body.shapeArr[0] == this.shapeArr[j]) {
                    this.shapeArr.splice(j, body.shapeArr.length);
                    break;
                }
            }

            body.space = null;
            this.bodyArr.splice(i, 1);
            break;
        }
    }
}

Space.prototype.addJoint = function(joint) {
    this.jointArr.push(joint);
}

Space.prototype.removeJoint = function(joint) {
    for (var i = 0; i < this.jointArr.length; i++) {
        if (this.jointArr[i] == joint) {
            this.jointArr.splice(i, 1);
            break;
        }
    }
}

Space.prototype.findShapeByPoint = function(p) {
    for (var i = 0; i < this.shapeArr.length; i++) {
        if (this.shapeArr[i].pointQuery(p)) {
            return this.shapeArr[i];
        }
    }
}

Space.prototype.findArbiter = function(shape1, shape2) {
    for (var i = 0; i < this.arbiterArr.length; i++) {
        var arbiter = this.arbiterArr[i];
        if (shape1 == arbiter.shape1 && shape2 == arbiter.shape2) {
            return arbiter;
        }
    }

    return null;
}

Space.prototype.isCollidable = function(body1, body2) {
    if (body1 == body2)
        return false;

    if (body1 == this.staticBody && body2 == this.staticBody)
        return false;

    for (var i = 0; i < body1.jointArr.length; i++) {        
        var joint = body1.jointArr[i];

        if (!joint.collideConnected) {
            if (joint.body1 == body1) {
                if (joint.body2 == body2)
                    return;
            }
            else {
                if (joint.body1 == body2)
                    return;
            }            
        }
    }

    return true;
}

Space.prototype.step = function(dt, iteration) {
    var dt_inv = 1 / dt;
    var newArbiterArr = [];

    // generate contact & arbiter
    for (var i = 0; i < this.shapeArr.length; i++) {
        for (var j = i + 1; j < this.shapeArr.length; j++) {
            var shape1 = this.shapeArr[i];
            var shape2 = this.shapeArr[j];

            if (!this.isCollidable(shape1.body, shape2.body))
                continue;
                        
            if (!shape1.bounds.intersectsBounds(shape2.bounds))
                continue;

            var contactArr = [];
            if (!Collision.collide(shape1, shape2, contactArr)) {
                continue;
            }

            if (shape1.type > shape2.type) {
                var temp = shape1;
                shape1 = shape2;
                shape2 = temp;
            }

            var arbiter = this.findArbiter(shape1, shape2);
            if (arbiter) {
                arbiter.update(contactArr);
                newArbiterArr.push(arbiter);
            }
            else {
                var newArbiter = new Arbiter(shape1, shape2);
                newArbiter.contactArr = contactArr;
                newArbiter.e = Math.max(shape1.e, shape2.e);
                newArbiter.u = Math.sqrt(shape1.u * shape2.u);
                newArbiterArr.push(newArbiter);
            }
        }
    }

    this.arbiterArr = newArbiterArr;

    // prestep arbiters
    for (var i = 0; i < this.arbiterArr.length; i++) {
        this.arbiterArr[i].preStep(dt_inv);
    }

    // prestep Joints
    for (var i = 0; i < this.jointArr.length; i++) {
        this.jointArr[i].preStep(dt, dt_inv);
    }

    // intergrate velocity
    var damping = this.damping < 1 ? Math.pow(this.damping, dt) : 1;
    for (var i = 0; i < this.bodyArr.length; i++) {
        this.bodyArr[i].updateVelocity(this.gravity, damping, dt);
    }

    // apply cached impulse
    for (var i = 0; i < this.arbiterArr.length; i++) {
        this.arbiterArr[i].applyCachedImpulse();
    }

    // run the iterative impulse solver
    for (var i = 0; i < iteration; i++) {
        for (var j = 0; j < this.arbiterArr.length; j++) {
            this.arbiterArr[j].applyImpulse();
        }
        
        for (var j = 0; j < this.jointArr.length; j++) {
            this.jointArr[j].applyImpulse();
        }
    }    

    // intergrate position
    // semi-implicit method
    for (var i = 0; i < this.bodyArr.length; i++) {
        this.bodyArr[i].updatePosition(dt);
    }

    for (var i = 0; i < this.bodyArr.length; i++) {
        body = this.bodyArr[i].cacheData();
    }
}


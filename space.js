function Space() {
    this.gravity = new vec2(0, 0);
    this.damping = 1.0;

    this.staticBody = new Body(Number.MAX_VALUE, Number.MAX_VALUE);
    this.staticBody.space = this;

    this.bodyArr = [];
    this.shapeArr = [];
    this.arbiterArr = [];
    this.constraintArr = [];
}

Space.prototype.addBody = function(body) {
    this.bodyArr.push(body);
    
    for (var i = 0; i < body.shapeArr.length; i++) {
        this.shapeArr.push(body.shapeArr[i]); 
    }

    body.space = this;
    body.cacheData();
}

Space.prototype.addConstraint = function(constraint) {
    this.constraintArr.push(constraint);
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

Space.prototype.step = function(dt, iteration) {
    var dt_inv = 1 / dt;
    var newArbiterArr = [];

    for (var i = 0; i < this.bodyArr.length; i++) {
        body = this.bodyArr[i].cacheData();
    }

    // generate contact & arbiter
    for (var i = 0; i < this.shapeArr.length; i++) {
        for (var j = i + 1; j < this.shapeArr.length; j++) {
            var shape1 = this.shapeArr[i];
            var shape2 = this.shapeArr[j];

            if (shape1.body == this.staticBody && shape2.body == this.staticBody)
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

    // arbiter prestep
    for (var i = 0; i < this.arbiterArr.length; i++) {
        this.arbiterArr[i].preStep(dt_inv);
    }

    // constraint prestep
    for (var i = 0; i < this.constraintArr.length; i++) {
        this.constraintArr[i].preStep(dt_inv);
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
        
        for (var j = 0; j < this.constraintArr.length; j++) {
            this.constraintArr[j].applyImpulse();
        }
    }

    // intergrate position
    // semi-implicit method
    for (var i = 0; i < this.bodyArr.length; i++) {
        this.bodyArr[i].updatePosition(dt);
    }
}


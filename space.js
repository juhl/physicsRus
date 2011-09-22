function Space() {
    this.iteration = 10;
    this.gravity = vec2.zero;
    this.damping = 1.0;

    this.staticBody = new Body(Number.MAX_VALUE, Number.MAX_VALUE);
    this.staticBody.space = this;

    this.bodyArr = [];
    this.shapeArr = [];
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

Space.prototype.findArbiter = function(shape1, shape2) {
    for (var i = 0; i < this.arbiterArr.length; i++) {
        var arbiter = this.arbiterArr[i];
        if (shape1 == arbiter.shape1 && shape2 == arbiter.shape2) {
            return arbiter;
        }
    }

    return null;
}

Space.prototype.step = function(dt) {
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
            
            if (!shape1.intersectsBounds(shape2.mins, shape2.maxs))
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
                newArbiter.e = shape1.e * shape2.e;
                newArbiter.u = shape1.u * shape2.u;
                newArbiterArr.push(newArbiter);
            }
        }
    }

    this.arbiterArr = newArbiterArr;

    // arbiter prestep
    for (var i = 0; i < this.arbiterArr.length; i++) {
        this.arbiterArr[i].preStep(1 / dt);
    }

    // intergrate velocity
    var damping = Math.pow(this.damping, dt);
    for (var i = 0; i < this.bodyArr.length; i++) {
        this.bodyArr[i].updateVelocity(this.gravity, damping, dt);
    }

    // apply cached impulse
    for (var i = 0; i < this.arbiterArr.length; i++) {
        this.arbiterArr[i].applyCachedImpulse();
    }

    // run the iterative impulse solver    
    for (var i = 0; i < this.iteration; i++) {
        for (var j = 0; j < this.arbiterArr.length; j++) {
            this.arbiterArr[j].applyImpulse();
        }
    }

    // intergrate position
    for (var i = 0; i < this.bodyArr.length; i++) {
        this.bodyArr[i].updatePosition(dt);
    }
}


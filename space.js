function Space() {
    this.gravity = new vec2(0, 0);
    this.damping = 1.0;

    this.staticBody = new Body(Infinity, Infinity);
    this.staticBody.space = this;

    this.bodyHash = {};
    this.jointHash = {};

    this.staticShapeArr = [];
    this.activeShapeArr = [];
    
    this.contactSolverArr = [];

    this.postSolve = function(arb) {};
}

Space.TIME_TO_SLEEP = 0.5;
Space.SLEEP_ENERGY_TOLERANCE = 1;

Space.prototype.addBody = function(body) {
    this.bodyHash[body.id] = body;
    
    for (var i = 0; i < body.shapeArr.length; i++) {
        this.activeShapeArr.push(body.shapeArr[i]); 
    }

    body.awake(true);
    body.space = this;
    body.cacheData();
}

Space.prototype.removeBody = function(body) {
    if (this.bodyHash[body.id]) {
        // remove from space shapeArr
        for (var j = 0; j < this.activeShapeArr.length; j++) {
            if (body.shapeArr[0] == this.activeShapeArr[j]) {
                this.activeShapeArr.splice(j, body.shapeArr.length);
                break;
            }
        }

        // remove linked joint
        for (var j in body.jointHash) {
            this.removeJoint(body.jointHash[j]);
        }

        body.space = null;
        delete this.bodyHash[body.id];
    }
}

Space.prototype.addJoint = function(joint) {
    joint.body1.awake(true);
    joint.body2.awake(true);

    this.jointHash[joint.id] = joint;

    joint.body1.jointHash[joint.id] = joint;
    joint.body2.jointHash[joint.id] = joint;
}

Space.prototype.removeJoint = function(joint) {
    if (this.jointHash[joint.id]) {
        joint.body1.awake(true);
        joint.body2.awake(true);

        delete joint.body1.jointHash[joint.id];
        delete joint.body2.jointHash[joint.id];

        delete this.jointHash[joint.id];
    }
}

Space.prototype.findShapeByPoint = function(p) {
    for (var i = 0; i < this.activeShapeArr.length; i++) {
        if (this.activeShapeArr[i].pointQuery(p)) {
            return this.activeShapeArr[i];
        }
    }
}

Space.prototype.findContactSolver = function(shape1, shape2) {
    for (var i = 0; i < this.contactSolverArr.length; i++) {
        var contactSolver = this.contactSolverArr[i];
        if (shape1 == contactSolver.shape1 && shape2 == contactSolver.shape2) {
            return contactSolver;
        }
    }

    return null;
}

Space.prototype.isCollidable = function(body1, body2) {
    if (body1 == body2)
        return false;

    if (body1 == this.staticBody && body2 == this.staticBody)
        return false;

    for (var i in body1.jointHash) {
        var joint = body1.jointHash[i];

        if (!joint.collideConnected && body2.jointHash[joint.id]) {
            return false;
        }
    }

    return true;
}

Space.prototype.step = function(dt, vel_iteration, pos_iteration) {
    var dt_inv = 1 / dt;
    var newContactSolverArr = [];

    var t0 = Date.now();

    // generate contact & contactSolver
    for (var i = 0; i < this.activeShapeArr.length; i++) {
        for (var j = i + 1; j < this.activeShapeArr.length; j++) {
            var shape1 = this.activeShapeArr[i];
            var shape2 = this.activeShapeArr[j];

            var body1 = shape1.body;
            var body2 = shape2.body;

            var active1 = body1.isAwake() && !body1.isStatic();
            var active2 = body2.isAwake() && !body2.isStatic();

            if (!active1 && !active2) {
                continue;
            }

            if (!this.isCollidable(body1, body2)) {
                continue;
            }
                        
            if (!shape1.bounds.intersectsBounds(shape2.bounds)) {
                continue;
            }

            var contactArr = [];
            if (!Collision.collide(shape1, shape2, contactArr)) {
                continue;
            }

            if (shape1.type > shape2.type) {
                var temp = shape1;
                shape1 = shape2;
                shape2 = temp;
            }

            var contactSolver = this.findContactSolver(shape1, shape2);
            if (contactSolver) {
                contactSolver.update(contactArr);
                newContactSolverArr.push(contactSolver);
            }
            else {
                var newContactSolver = new ContactSolver(shape1, shape2);
                newContactSolver.contactArr = contactArr;
                newContactSolver.e = Math.max(shape1.e, shape2.e);
                newContactSolver.u = Math.sqrt(shape1.u * shape2.u);
                newContactSolverArr.push(newContactSolver);
            }
        }
    }

    stats.timeCollision = Date.now() - t0;

    this.contactSolverArr = newContactSolverArr;

    t0 = Date.now();

    // initialize contact solvers
    for (var i = 0; i < this.contactSolverArr.length; i++) {
        this.contactSolverArr[i].initSolver(dt_inv);
    }

    // initialize joint solver
    for (var i in this.jointHash) {
        this.jointHash[i].initSolver(dt, true);
    }

    stats.timeInitSolver = Date.now() - t0;

     // intergrate velocity
    var damping = this.damping < 1 ? Math.pow(this.damping, dt) : 1;
    for (var i in this.bodyHash) {
        this.bodyHash[i].updateVelocity(this.gravity, damping, dt);
    }

    // warm start (apply cached impulse)
    for (var i = 0; i < this.contactSolverArr.length; i++) {
        this.contactSolverArr[i].warmStart();
    }

    t0 = Date.now();

    // iterative velocity constraints solver
    for (var i = 0; i < vel_iteration; i++) {
        for (var j in this.jointHash) {
            this.jointHash[j].solveVelocityConstraints();
        }

        for (var j = 0; j < this.contactSolverArr.length; j++) {
            this.contactSolverArr[j].solveVelocityConstraints();
        }
    }

    stats.timeVelocitySolver = Date.now() - t0;

    // intergrate position
    for (var i in this.bodyHash) {
        this.bodyHash[i].updatePosition(dt);
    }

    // process breakable joint
    for (var i in this.jointHash) {
        var joint = this.jointHash[i];
        if (joint.breakable) {
            if (joint.getReactionForce(dt_inv).lengthsq() >= joint.max_force * joint.max_force)
                this.removeJoint(joint);
        }
    }

    t0 = Date.now();

    stats.positionIterations = 0;
    var positionSolved = false;

    // iterative position constraints solver    
    for (var i = 0; i < pos_iteration; i++) {
        var contactsOk = true;
        var jointsOk = true;

        for (var j = 0; j < this.contactSolverArr.length; j++) {
            var contactOk = this.contactSolverArr[j].solvePositionConstraints();
            contactsOk = contactOk && contactsOk;
        }

        for (var j in this.jointHash) {
            var jointOk = this.jointHash[j].solvePositionConstraints();
            jointsOk = jointOk && jointsOk;
        }
        
        if (contactsOk && jointsOk) {
            // exit early if the position errors are small
            positionSolved = true;
            break;
        }

        stats.positionIterations++;
    }

    stats.timePositionSolver = Date.now() - t0;

    // post solve collision callback
    for (var i = 0; i < this.contactSolverArr.length; i++) {
        var arb = this.contactSolverArr[i];
        this.postSolve(arb);
    }   

    for (var i in this.bodyHash) {
        body = this.bodyHash[i].cacheData();
    }

    // sleeping
    if (1) {
        var minSleepTime = 999999;

        for (var i in this.bodyHash) {
           var body = this.bodyHash[i];
           
            if (body.isStatic()) {
                continue;
            }

            if (body.kineticEnergy() < Space.SLEEP_ENERGY_TOLERANCE) {
                body.sleepTime += dt;
                minSleepTime = Math.min(minSleepTime, body.sleepTime);
            }
            else {
                body.sleepTime = 0;
                minSleepTime = 0;
            }
        }

        if (positionSolved && minSleepTime >= Space.TIME_TO_SLEEP) {
            for (var i in this.bodyHash) {
                var body = this.bodyHash[i];
                //body.awake(false);
            }
        }
    }
}


function Space() {
    this.gravity = new vec2(0, 0);
    this.damping = 1.0;

    this.staticBody = new Body(Infinity);
    this.staticBody.resetMassData();
    this.staticBody.space = this;

    this.bodyHash = {};
    this.numBodies = 0;

    this.jointHash = {};
    this.numJoints = 0;

    this.shapeArr = [];
    
    this.contactSolverArr = [];
    this.numContacts = 0;

    this.postSolve = function(arb) {};
}

Space.TIME_TO_SLEEP = 0.5;
Space.SLEEP_LINEAR_TOLERANCE = 0.01;
Space.SLEEP_ANGULAR_TOLERANCE = deg2rad(2);

Space.prototype.addBody = function(body) {
    if (this.bodyHash[body.id]) {
        return;
    }

    this.bodyHash[body.id] = body;
    this.numBodies++;
    
    for (var i = 0; i < body.shapeArr.length; i++) {
        this.shapeArr.push(body.shapeArr[i]); 
    }

    body.awake(true);
    body.space = this;
    body.cacheData();
}

Space.prototype.removeBody = function(body) {
    if (!this.bodyHash[body.id]) {
        return;
    }

    // Remove from space shapeArr
    for (var j = 0; j < this.shapeArr.length; j++) {
        if (body.shapeArr[0] == this.shapeArr[j]) {
            this.shapeArr.splice(j, body.shapeArr.length);
            break;
        }
    }

    // Remove linked joint
    for (var j in body.jointHash) {
        this.removeJoint(body.jointHash[j]);
    }

    body.space = null;
    delete this.bodyHash[body.id];
    this.numBodies--;
}

Space.prototype.addJoint = function(joint) {
    if (this.jointHash[joint.id]) {
        return;
    }

    joint.body1.awake(true);
    joint.body2.awake(true);

    this.jointHash[joint.id] = joint;
    this.numJoints++;

    joint.body1.jointHash[joint.id] = joint;
    joint.body2.jointHash[joint.id] = joint;
}

Space.prototype.removeJoint = function(joint) {
    if (!this.jointHash[joint.id]) {
        return;
    }

    joint.body1.awake(true);
    joint.body2.awake(true);

    delete joint.body1.jointHash[joint.id];
    delete joint.body2.jointHash[joint.id];

    delete this.jointHash[joint.id];
    this.numJoints--;
}

Space.prototype.findShapeByPoint = function(p) {
    for (var i = 0; i < this.shapeArr.length; i++) {
        if (this.shapeArr[i].pointQuery(p)) {
            return this.shapeArr[i];
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

Space.prototype.genTemporalContactSolvers = function() {
    var t0 = Date.now();
    var newContactSolverArr = [];

    this.numContacts = 0;

    for (var i = 0; i < this.shapeArr.length; i++) {
        for (var j = i + 1; j < this.shapeArr.length; j++) {
            var shape1 = this.shapeArr[i];
            var shape2 = this.shapeArr[j];

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

            this.numContacts += contactArr.length;

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
                body1.awake(true);
                body2.awake(true);

                var newContactSolver = new ContactSolver(shape1, shape2);
                newContactSolver.contactArr = contactArr;
                newContactSolver.e = Math.max(shape1.e, shape2.e);
                newContactSolver.u = Math.sqrt(shape1.u * shape2.u);
                newContactSolverArr.push(newContactSolver);
            }
        }
    }

    stats.timeCollision = Date.now() - t0;

    return newContactSolverArr;
}

Space.prototype.initSolver = function(dt, dt_inv) {
    var t0 = Date.now();

    // Initialize contact solvers
    for (var i = 0; i < this.contactSolverArr.length; i++) {
        this.contactSolverArr[i].initSolver(dt_inv);
    }

    // Initialize joint solver
    for (var i in this.jointHash) {
        this.jointHash[i].initSolver(dt, true);
    }

    stats.timeInitSolver = Date.now() - t0;
}

Space.prototype.velocitySolver = function(iteration) {
    var t0 = Date.now();

    // Warm start (apply cached impulse)
    for (var i = 0; i < this.contactSolverArr.length; i++) {
        this.contactSolverArr[i].warmStart();
    }
    
    for (var i = 0; i < iteration; i++) {
        for (var j in this.jointHash) {
            this.jointHash[j].solveVelocityConstraints();
        }

        for (var j = 0; j < this.contactSolverArr.length; j++) {
            this.contactSolverArr[j].solveVelocityConstraints();
        }
    }

    stats.timeVelocitySolver = Date.now() - t0;
}

Space.prototype.positionSolver = function(iteration) {
    var t0 = Date.now();    

    var positionSolved = false;

    stats.positionIterations = 0;
    
    for (var i = 0; i < iteration; i++) {
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

    return positionSolved;
}

Space.prototype.step = function(dt, vel_iteration, pos_iteration, allowSleep) {
    var dt_inv = 1 / dt;

    // Generate contact & contactSolver
    this.contactSolverArr = this.genTemporalContactSolvers();

    // Initialize contacts & joints solver
    this.initSolver(dt, dt_inv);

    //
    for (var i in this.jointHash) {
        var joint = this.jointHash[i];
        var body1 = joint.body1;
        var body2 = joint.body2;

        var awake1 = body1.isAwake() && !body1.isStatic();
        var awake2 = body2.isAwake() && !body2.isStatic();

        if (awake1 ^ awake2) {
            if (!awake1)
                body1.awake(true);
            if (!awake2)
                body2.awake(true);
        }
    }

    // Intergrate velocity
    var damping = this.damping < 1 ? Math.pow(this.damping, dt) : 1;
    for (var i in this.bodyHash) {
        var body = this.bodyHash[i];
        if (body.isAwake()) {
            body.updateVelocity(this.gravity, damping, dt);
        }
    }

    // Iterative velocity constraints solver
    this.velocitySolver(vel_iteration);

    // Intergrate position
    for (var i in this.bodyHash) {
        var body = this.bodyHash[i];
        if (body.isAwake()) {
            body.updatePosition(dt);
        }
    }

    // Process breakable joint
    for (var i in this.jointHash) {
        var joint = this.jointHash[i];
        if (joint.breakable) {
            if (joint.getReactionForce(dt_inv).lengthsq() >= joint.maxForce * joint.maxForce)
                this.removeJoint(joint);
        }
    }

    // Iterative position constraints solver
    var positionSolved = this.positionSolver(pos_iteration);

    // Post solve collision callback
    for (var i = 0; i < this.contactSolverArr.length; i++) {
        var arb = this.contactSolverArr[i];
        this.postSolve(arb);
    }

    for (var i in this.bodyHash) {
        var body = this.bodyHash[i];
        if (body.isAwake()) {
            body.cacheData();
        }
    }

    // Process sleeping
    if (allowSleep) {
        var minSleepTime = 999999999;

        var linTolSqr = Space.SLEEP_LINEAR_TOLERANCE * Space.SLEEP_LINEAR_TOLERANCE;
        var angTolSqr = Space.SLEEP_ANGULAR_TOLERANCE * Space.SLEEP_ANGULAR_TOLERANCE;

        for (var i in this.bodyHash) {
           var body = this.bodyHash[i];
           
            if (body.isStatic()) {
                continue;
            }

            if (body.w * body.w > angTolSqr || body.v.dot(body.v) > linTolSqr) {
                body.sleepTime = 0;
                minSleepTime = 0;
            }
            else {
                body.sleepTime += dt;
                minSleepTime = Math.min(minSleepTime, body.sleepTime);
            }
        }

        if (positionSolved && minSleepTime >= Space.TIME_TO_SLEEP) {
            for (var i in this.bodyHash) {
                var body = this.bodyHash[i];
                body.awake(false);
            }
        }
    }
}


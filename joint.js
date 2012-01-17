Joint = function(body1, body2, collideConnected) {
	if (arguments.length == 0)
		return;

    if (Joint.id_counter == undefined)
        Joint.id_counter = 0;
    
    this.id = Joint.id_counter++;

	this.body1 = body1;
	this.body2 = body2;

	// Allow collision between to cennected body
	this.collideConnected = collideConnected;

	// Constraint force limit
	this.max_force = Infinity;

	// Max linear correction
	Joint.MAX_LINEAR_CORRECTION = Infinity;

	// Max angular correction
	Joint.MAX_ANGULAR_CORRECTION = Infinity;//Math.PI * (8 / 180);

	// Is breakable ?
	this.breakable = false;
}

Joint.LINEAR_SLOP = 0.005;
Joint.ANGULAR_SLOP = deg2rad(1);
Joint.MAX_LINEAR_CORRECTION = 0.2;
Joint.MAX_ANGULAR_CORRECTION = deg2rad(8);

Joint.LIMIT_STATE_INACTIVE = 0;
Joint.LIMIT_STATE_AT_LOWER = 1;
Joint.LIMIT_STATE_AT_UPPER = 2;
Joint.LIMIT_STATE_EQUAL_LIMITS = 3;

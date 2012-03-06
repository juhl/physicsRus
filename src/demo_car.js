DemoCar = function() {
	var space;
	function init(s) {
		space = s;
		var staticBody = new Body(Body.STATIC);
		staticBody.addShape(new ShapeBox(-9.84, 5, 0.8, 2));
		staticBody.addShape(new ShapeBox(9.84, 5, 0.8, 2));
		staticBody.addShape(new ShapePoly([new vec2(-10.24, 0), new vec2(-2, 0), new vec2(-2, 1), new vec2(-9.44, 4), new vec2(-10.24, 4)]));
		staticBody.addShape(new ShapePoly([new vec2(2, 0), new vec2(10.24, 0), new vec2(10.24, 4), new vec2(9.44, 4), new vec2(2, 1)]));
		staticBody.resetMassData();
		space.addBody(staticBody);

		// Bridge
		var body_prev;
		for (var i = 0; i < 10; i++) {
			var body = new Body(Body.DYNAMIC, new vec2(-1.8 + i * 0.4, 0.9));
			var shape = new ShapeBox(0, 0, 0.44, 0.2);
			shape.e = 0.1;
			shape.u = 0.8;
			shape.density = 20;
			body.addShape(shape);
			body.resetMassData();
			space.addBody(body);

			if (i == 0) {
				var joint = new RevoluteJoint(staticBody, body, new vec2(-2, 0.9));
				joint.collideConnected = false;
				space.addJoint(joint);
			}
			else {
				var joint = new RevoluteJoint(body_prev, body, new vec2(-2 + i * 0.4, 0.9));
				joint.collideConnected = false;
				space.addJoint(joint);
			}

			body_prev = body;
		}

		var joint = new RevoluteJoint(body, staticBody, new vec2(2, 0.9));
		joint.collideConnected = false;
		space.addJoint(joint);

		// Car body        
		var body1 = new Body(Body.DYNAMIC, new vec2(-8, 5));		
		var shape = new ShapePoly([new vec2(-0.8, 0.48), new vec2(-0.8, 0), new vec2(0.8, 0), new vec2(0.8, 0.32), new vec2(0, 0.84), new vec2(-0.56, 0.84)]);
		shape.e = 0.5;
		shape.u = 1.0;
		shape.density = 6;
		body1.addShape(shape);
		body1.resetMassData();		
		space.addBody(body1);

		// Wheel 1        
		var body2 = new Body(Body.DYNAMIC, new vec2(-8.5, 4.9));
		var shape = new ShapeCircle(0, 0, 0.26);
		shape.e = 0.1;
		shape.u = 0.97;
		shape.density = 0.8;
		body2.addShape(shape);
		body2.resetMassData();
		space.addBody(body2);

		var joint = new DistanceJoint(body1, body2, new vec2(-8.5, 5.36), new vec2(-8.5, 4.9));
		joint.setSpringFrequencyHz(12);
		joint.setSpringDampingRatio(0.1);
		joint.collideConnected = false;
		space.addJoint(joint);

		var joint = new LineJoint(body1, body2, new vec2(-8.5, 5.36), new vec2(-8.5, 4.9));
		/*joint.enableMotor(true);
		joint.setMotorSpeed(deg2rad(-2000));
		joint.setMaxMotorTorque(20000);*/
		joint.collideConnected = false;
		space.addJoint(joint);

		// Wheel 2        
		var body3 = new Body(Body.DYNAMIC, new vec2(-7.5, 4.9));
		var shape = new ShapeCircle(0, 0, 0.26);
		shape.e = 0.1;
		shape.u = 0.97;
		shape.density = 0.8;
		body3.addShape(shape);
		body3.resetMassData();
		space.addBody(body3);

		var joint = new DistanceJoint(body1, body3, new vec2(-7.5, 5.36), new vec2(-7.5, 4.9));
		joint.setSpringFrequencyHz(12)
		joint.setSpringDampingRatio(0.1);
		joint.collideConnected = false;
		space.addJoint(joint);

		var joint = new LineJoint(body1, body3, new vec2(-7.5, 5.36), new vec2(-7.5, 4.9));
		/*joint.enableMotor(true);
		joint.setMotorSpeed(deg2rad(-2000));
		joint.setMaxMotorTorque(30000);*/
		joint.collideConnected = false;
		space.addJoint(joint);

		// Both wheels constrained to be same rotation        
		//space.addJoint(new AngleJoint(body2, body3));
	}

	function runFrame() {
	}

	function keyDown(ev) {
	}

	function name() {
		return "Car";
	}

	return {
		init: init,
		runFrame: runFrame,
		keyDown: keyDown,
		name: name
	};
}();
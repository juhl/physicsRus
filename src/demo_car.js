DemoCar = function() {
	var space;
	function init(s) {
		space = s;
		var staticBody = new Body(Body.STATIC);
		staticBody.addShape(new ShapeBox(-492, 250, 40, 100));
		staticBody.addShape(new ShapeBox(492, 250, 40, 100));
		staticBody.addShape(new ShapePoly([new vec2(-512, 0), new vec2(-100, 0), new vec2(-100, 50), new vec2(-472, 200), new vec2(-512, 200)]));
		staticBody.addShape(new ShapePoly([new vec2(100, 0), new vec2(512, 0), new vec2(512, 200), new vec2(472, 200), new vec2(100, 50)]));
		staticBody.resetMassData();
		space.addBody(staticBody);

		// Bridge
		var body_prev;
		for (var i = 0; i < 10; i++) {
			var body = new Body(Body.DYNAMIC, new vec2(-90 + i * 20, 45));
			var shape = new ShapeBox(0, 0, 22, 10);
			shape.e = 0.1;
			shape.u = 0.8;
			shape.density = 0.5;
			body.addShape(shape);
			body.resetMassData();
			space.addBody(body);

			if (i == 0) {
				var joint = new RevoluteJoint(staticBody, body, new vec2(-100, 45));
				joint.collideConnected = false;
				space.addJoint(joint);
			}
			else {
				var joint = new RevoluteJoint(body_prev, body, new vec2(-100 + i * 20, 45));
				joint.collideConnected = false;
				space.addJoint(joint);
			}

			body_prev = body;
		}

		var joint = new RevoluteJoint(body, staticBody, new vec2(100, 45));
		joint.collideConnected = false;
		space.addJoint(joint);

		// Car body        
		var body1 = new Body(Body.DYNAMIC, new vec2(-400, 250));
		//var shape = new ShapeBox(0, 10, 75, 20);
		var shape = new ShapePoly([new vec2(-40, 24), new vec2(-40, 0), new vec2(40, 0), new vec2(40, 16), new vec2(0, 42), new vec2(-28, 42)]);
		shape.e = 0.5;
		shape.u = 1.0;
		shape.density = 0.1;
		body1.addShape(shape);
		//shape = new ShapeBox(0, 30, 50, 20);
		//shape.e = 0.5;
		//shape.u = 1.0;
		//shape.density = 0.001;
		//body1.addShape(shape);
		body1.resetMassData();
		space.addBody(body1);

		// Wheel 1        
		var body2 = new Body(Body.DYNAMIC, new vec2(-425, 245));
		var shape = new ShapeCircle(0, 0, 13);
		shape.e = 0.1;
		shape.u = 0.97;
		shape.density = 0.014;
		body2.addShape(shape);
		body2.resetMassData();
		space.addBody(body2);

		var joint = new DistanceJoint(body1, body2, new vec2(-425, 268), new vec2(-425, 245));
		joint.setSpringCoeffs(12, 0.1);
		joint.collideConnected = false;
		space.addJoint(joint);

		var joint = new LineJoint(body1, body2, new vec2(-425, 268), new vec2(-425, 245));
		//joint.enableMotor(true);
		//joint.setMotorSpeed(deg2rad(-1000));
		//joint.setMaxMotorTorque(2000000);
		joint.collideConnected = false;
		space.addJoint(joint);

		// Wheel 2        
		var body3 = new Body(Body.DYNAMIC, new vec2(-375, 245));
		var shape = new ShapeCircle(0, 0, 13);
		shape.e = 0.1;
		shape.u = 0.97;
		shape.density = 0.014;
		body3.addShape(shape);
		body3.resetMassData();
		space.addBody(body3);

		var joint = new DistanceJoint(body1, body3, new vec2(-375, 268), new vec2(-375, 245));
		joint.setSpringCoeffs(12, 0.1);
		joint.collideConnected = false;
		space.addJoint(joint);

		var joint = new LineJoint(body1, body3, new vec2(-375, 268), new vec2(-375, 245));
		//joint.enableMotor(true);
		//joint.setMotorSpeed(deg2rad(-2000));
		//joint.setMaxMotorTorque(1100000);  
		joint.collideConnected = false;
		space.addJoint(joint);

		// Both wheels constrained to be same rotation        
		//space.addJoint(new AngleJoint(body2, body3));
	}

	function runFrame() {
	}

	function name() {
		return "Car";
	}

	return {
		init: init,
		runFrame: runFrame,
		name: name
	};
}();
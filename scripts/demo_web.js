DemoWeb = function() {
	var space;
	function init(s) { 
		space = s;
		var staticBody = new Body(Body.STATIC);        
		staticBody.resetMassData();
		space.addBody(staticBody);

		var body1 = new Body(Body.DYNAMIC, -70, 300);
		var shape = new ShapeBox(0, 0, 20, 20);
		shape.e = 0.0;
		shape.u = 1.0;
		shape.density = 1;
		body1.addShape(shape);
		body1.resetMassData();
		space.addBody(body1);

		var body2 = new Body(Body.DYNAMIC, -70, 160);
		var shape = new ShapeBox(0, 0, 20, 20);
		shape.e = 0.0;
		shape.u = 1.0;
		shape.density = 1;
		body2.addShape(shape);
		body2.resetMassData();
		space.addBody(body2);

		var body3 = new Body(Body.DYNAMIC, 70, 300);
		var shape = new ShapeBox(0, 0, 20, 20);
		shape.e = 0.0;
		shape.u = 1.0;
		shape.density = 1;
		body3.addShape(shape);
		body3.resetMassData();
		space.addBody(body3);

		var body4 = new Body(Body.DYNAMIC, 70, 160);
		var shape = new ShapeBox(0, 0, 20, 20);
		shape.e = 0.0;
		shape.u = 1.0;
		shape.density = 1;
		body4.addShape(shape);
		body4.resetMassData();
		space.addBody(body4);

		var joint1 = new DistanceJoint(staticBody, body1, new vec2(-200, 430), new vec2(-80, 310));
		joint1.setSpringCoeffs(2, 0.1);
		space.addJoint(joint1);

		var joint2 = new DistanceJoint(staticBody, body2, new vec2(-200, 60), new vec2(-80, 150));
		joint2.setSpringCoeffs(2, 0.1);
		space.addJoint(joint2);

		var joint3 = new DistanceJoint(staticBody, body3, new vec2(200, 430), new vec2(80, 310));
		joint3.setSpringCoeffs(2, 0.1);
		space.addJoint(joint3);

		var joint4 = new DistanceJoint(staticBody, body4, new vec2(200, 60), new vec2(80, 150));
		joint4.setSpringCoeffs(2, 0.1);
		space.addJoint(joint4);

		var joint5 = new DistanceJoint(body1, body2, new vec2(-70, 290), new vec2(-70, 170));
		joint5.setSpringCoeffs(2, 0.1);
		space.addJoint(joint5);

		var joint6 = new DistanceJoint(body3, body4, new vec2(70, 290), new vec2(70, 170));
		joint6.setSpringCoeffs(2, 0.1);
		space.addJoint(joint6);

		var joint7 = new DistanceJoint(body1, body3, new vec2(-60, 300), new vec2(60, 300));
		joint7.setSpringCoeffs(2, 0.1);
		space.addJoint(joint7);

		var joint7 = new DistanceJoint(body2, body4, new vec2(-60, 160), new vec2(60, 160));
		joint7.setSpringCoeffs(2, 0.1);
		space.addJoint(joint7);
	}

	function runFrame() {
	}

	function name() {
		return "Web";
	}

	return {
		init: init,
		runFrame: runFrame,
		name: name
	};
}();
DemoWeb = function() {
	var space;
	function init(s) { 
		space = s;
		var staticBody = new Body(Body.STATIC);        
		staticBody.resetMassData();
		space.addBody(staticBody);

		var body1 = new Body(Body.DYNAMIC, new vec2(-70, 450));
		var shape = new ShapeBox(0, 0, 20, 20);
		shape.e = 0.0;
		shape.u = 1.0;
		shape.density = 1;
		body1.addShape(shape);
		body1.resetMassData();
		space.addBody(body1);

		var body2 = new Body(Body.DYNAMIC, new vec2(-70, 310));
		var shape = new ShapeBox(0, 0, 20, 20);
		shape.e = 0.0;
		shape.u = 1.0;
		shape.density = 1;
		body2.addShape(shape);
		body2.resetMassData();
		space.addBody(body2);

		var body3 = new Body(Body.DYNAMIC, new vec2(70, 450));
		var shape = new ShapeBox(0, 0, 20, 20);
		shape.e = 0.0;
		shape.u = 1.0;
		shape.density = 1;
		body3.addShape(shape);
		body3.resetMassData();
		space.addBody(body3);

		var body4 = new Body(Body.DYNAMIC, new vec2(70, 310));
		var shape = new ShapeBox(0, 0, 20, 20);
		shape.e = 0.0;
		shape.u = 1.0;
		shape.density = 1;
		body4.addShape(shape);
		body4.resetMassData();
		space.addBody(body4);

		var joint1 = new DistanceJoint(staticBody, body1, new vec2(-200, 580), new vec2(-80, 460));
		joint1.setSpringFrequencyHz(2);
		joint1.setSpringDampingRatio(0.1);
		space.addJoint(joint1);

		var joint2 = new DistanceJoint(staticBody, body2, new vec2(-200, 210), new vec2(-80, 300));
		joint2.setSpringFrequencyHz(2);
		joint2.setSpringDampingRatio(0.1);
		space.addJoint(joint2);

		var joint3 = new DistanceJoint(staticBody, body3, new vec2(200, 580), new vec2(80, 460));
		joint3.setSpringFrequencyHz(2);
		joint3.setSpringDampingRatio(0.1);
		space.addJoint(joint3);

		var joint4 = new DistanceJoint(staticBody, body4, new vec2(200, 210), new vec2(80, 300));
		joint4.setSpringFrequencyHz(2);
		joint4.setSpringDampingRatio(0.1);
		space.addJoint(joint4);

		var joint5 = new DistanceJoint(body1, body2, new vec2(-70, 440), new vec2(-70, 320));
		joint5.setSpringFrequencyHz(2);
		joint5.setSpringDampingRatio(0.1);
		space.addJoint(joint5);

		var joint6 = new DistanceJoint(body3, body4, new vec2(70, 440), new vec2(70, 320));
		joint6.setSpringFrequencyHz(2);
		joint6.setSpringDampingRatio(0.1);
		space.addJoint(joint6);

		var joint7 = new DistanceJoint(body1, body3, new vec2(-60, 450), new vec2(60, 450));
		joint7.setSpringFrequencyHz(2);
		joint7.setSpringDampingRatio(0.1);
		space.addJoint(joint7);

		var joint8 = new DistanceJoint(body2, body4, new vec2(-60, 310), new vec2(60, 310));
		joint8.setSpringFrequencyHz(2);
		joint8.setSpringDampingRatio(0.1);
		space.addJoint(joint8);
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
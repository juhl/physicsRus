DemoRope = function() {
	var space;
	function init(s) {
		space = s;
		var staticBody = new Body(Body.STATIC);
		staticBody.addShape(new ShapeBox(0, 10, 1024, 20));
		staticBody.resetMassData();
		space.addBody(staticBody);

		var body_prev;
		for (var i = 0; i < 22; i++) {            
			var body = new Body(Body.DYNAMIC, new vec2(8 + i * 16, 320));
			var shape = new ShapeBox(0, 0, 20, 4);
			shape.e = 0.0;
			shape.u = 0.5;
			shape.density = 0.01;
			body.addShape(shape);
			body.resetMassData();
			space.addBody(body);

			if (i == 0) {
				var joint = new RevoluteJoint(staticBody, body, new vec2(0, 320));                
				joint.collideConnected = false;
				space.addJoint(joint);
			}
			else {
				var joint = new RevoluteJoint(body_prev, body, new vec2(i * 16, 320));                
				//joint.breakable = true;
				//joint.maxForce = 8000000;
				joint.collideConnected = false;
				space.addJoint(joint);
			}

			body_prev = body;
		}
	}

	function runFrame() {
	}

	function name() {
		return "Rope";
	}

	return {
		init: init,
		runFrame: runFrame,
		name: name
	};
}();
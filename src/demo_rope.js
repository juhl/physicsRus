DemoRope = function() {
	var space;
	function init(s) {
		space = s;
		var staticBody = new Body(Body.STATIC);
		staticBody.addShape(new ShapeBox(0, 0.2, 20.48, 0.4));
		staticBody.resetMassData();
		space.addBody(staticBody);
		
		var body = [];

		for (var i = 0; i < 10; i++) {
			if (i == 9) {				
				var shape = new ShapeBox(0, 0, 1, 1);
				shape.e = 0.0;
				shape.u = 0.5;
				shape.density = 1;
				body[i] = new Body(Body.DYNAMIC, new vec2(i * 0.8, 10));
				body[i].addShape(shape);
				body[i].categoryBits = 0x0002;
			}
			else {				
				var shape = new ShapeBox(0, 0, 0.8, 0.2);
				shape.e = 0.0;
				shape.u = 0.5;
				shape.density = 1;
				body[i] = new Body(Body.DYNAMIC, new vec2(0.4 + i * 0.8, 10));
				body[i].addShape(shape);
				body[i].categoryBits = 0x0001;
				body[i].maskBits = 0xFFFF & ~0x0002;
			}
						
			body[i].resetMassData();
			space.addBody(body[i]);

			if (i == 0) {
				var joint = new RevoluteJoint(staticBody, body[i], new vec2(0, 10));
				joint.collideConnected = false;
				space.addJoint(joint);
			}
			else {
				var joint = new RevoluteJoint(body[i - 1], body[i], new vec2(i * 0.8, 10));                
				//joint.breakable = true;
				//joint.maxForce = 8000000;
				joint.collideConnected = false;
				space.addJoint(joint);
			}
		}

		var joint = new RopeJoint(staticBody, body[9], new vec2(0, 10), new vec2(9 * 0.8, 10));
		joint.collideConnected = false;
		space.addJoint(joint);
	}

	function runFrame() {
	}

	function keyDown(ev) {
	}

	function name() {
		return "Rope";
	}

	return {
		init: init,
		runFrame: runFrame,
		keyDown: keyDown,
		name: name
	};
}();
DemoRope = function() {
	var space;
	function init(s) {
		space = s;
		var staticBody = new Body(Body.STATIC);
		staticBody.addShape(new ShapeBox(0, 10, 1024, 20));
		staticBody.resetMassData();
		space.addBody(staticBody);
		
		var body = [];

		for (var i = 0; i < 16; i++) {
			if (i == 15) {				
				var shape = new ShapeCircle(0, 0, 40);
				shape.e = 0.0;
				shape.u = 0.5;
				shape.density = 1;
				body[i] = new Body(Body.DYNAMIC, new vec2(40 + i * 20, 500));
				body[i].addShape(shape);
				body[i].categoryBits = 0x0002;
			}
			else {				
				var shape = new ShapeBox(0, 0, 20, 6);
				shape.e = 0.0;
				shape.u = 0.5;
				shape.density = 0.2;
				body[i] = new Body(Body.DYNAMIC, new vec2(10 + i * 20, 500));
				body[i].addShape(shape);
				body[i].categoryBits = 0x0001;
				body[i].maskBits = 0xFFFF & ~0x0002;
			}
						
			body[i].resetMassData();
			space.addBody(body[i]);

			if (i == 0) {
				var joint = new RevoluteJoint(staticBody, body[i], new vec2(0, 500));                
				joint.collideConnected = false;
				space.addJoint(joint);
			}
			else {
				var joint = new RevoluteJoint(body[i - 1], body[i], new vec2(i * 20, 500));                
				//joint.breakable = true;
				//joint.maxForce = 8000000;
				joint.collideConnected = false;
				space.addJoint(joint);
			}
		}

		var joint = new RopeJoint(staticBody, body[15], new vec2(0, 500), new vec2(15 * 20, 500));
		joint.collideConnected = false;
		space.addJoint(joint);
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
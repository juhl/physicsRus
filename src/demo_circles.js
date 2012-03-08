DemoCircles = function() {
	var space;
	function init(s) {
		space = s;
		var staticBody = new Body(Body.STATIC);
		staticBody.addShape(new ShapeBox(0, 0.2, 20.48, 0.4));
		staticBody.addShape(new ShapeBox(0, 15.16, 20.48, 0.4));
		staticBody.addShape(new ShapeBox(-10.04, 7.68, 0.4, 14.56));
		staticBody.addShape(new ShapeBox(10.04, 7.68, 0.4, 14.56));
		staticBody.resetMassData();
		space.addBody(staticBody);

		for (var i = 0; i < 50; i++) {
			var body = new Body(Body.DYNAMIC, new vec2(Math.random() * 20 - 10, 0.5 + Math.random() * 14));
			var shape = new ShapeCircle(0, 0, 1.4 * (Math.max(Math.random(), 0.2)));
			shape.e = 0.1;
			shape.u = 1.0;
			shape.density = 1;
			body.addShape(shape);
			body.resetMassData();
			space.addBody(body); 
		}
	}

	function runFrame() {
	}

	function keyDown(ev) {
	}

	function name() {
		return "Circles";
	}

	return {
		init: init,
		runFrame: runFrame,
		keyDown: keyDown,
		name: name
	};
}();
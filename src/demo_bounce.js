DemoBounce = function() {
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

		for (var i = 0; i <= 10; i++)  {
			var body = new Body(Body.DYNAMIC, new vec2(-6 + i * 1.2, 8));
			var shape = new ShapeCircle(0, 0, 0.4);
			shape.e = i / 10;
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
		return "Bounce-test";
	}

	return {
		init: init,
		runFrame: runFrame,
		keyDown: keyDown,
		name: name
	};
}();

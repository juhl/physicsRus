DemoBounce = function() {
	var space;

	function init(s) {
		space = s;
		var staticBody = new Body(Body.STATIC);
		staticBody.addShape(new ShapeBox(0, 10, 1024, 20));
		staticBody.addShape(new ShapeBox(-502, 270, 20, 500));
		staticBody.addShape(new ShapeBox(502, 270, 20, 500));
		staticBody.resetMassData();
		space.addBody(staticBody);

		shape = new ShapeBox(400, 250, 10, 500);
		staticBody.addShape(shape);

		for (var i = 0; i <= 10; i++)  {            
			var body = new Body(Body.DYNAMIC, -300 + i * 60, 400);
			var shape = new ShapeCircle(0, 0, 20);
			shape.e = i / 10;
			shape.u = 1.0;
			shape.density = 0.8;
			body.addShape(shape);
			body.resetMassData();
			space.addBody(body);
		}
	}    

	function runFrame() {
	}

	function name() {
		return "Bounce-test";
	}

	return {
		init: init,
		runFrame: runFrame,
		name: name
	};
}();
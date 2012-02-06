DemoPyramid = function() {
	var space;
	function init(s) {
		space = s;
		var staticBody = new Body(Body.STATIC);
		staticBody.addShape(new ShapeBox(0, 10, 1024, 20));
		staticBody.addShape(new ShapeBox(0, 758, 1024, 20));
		staticBody.addShape(new ShapeBox(-502, 384, 20, 728));
		staticBody.addShape(new ShapeBox(502, 384, 20, 728));
		staticBody.resetMassData();
		space.addBody(staticBody);

		for (var i = 0; i < 9; i++) {
			for (var j = 0; j <= i; j++) {
				var body = new Body(Body.DYNAMIC, (j - i * 0.5) * 42, 500 - i * 42);
				var shape = new ShapeBox(0, 0, 36, 36);
				shape.e = 0.0;
				shape.u = 1.0;
				shape.density = 0.8;
				body.addShape(shape);
				body.resetMassData();
				space.addBody(body);
			}
		}
		/*
		body = new Body(Body.DYNAMIC, 0, 50);
		var shape = new ShapeCircle(0, 0, 19);
		shape.e = 0.1;
		shape.u = 1.0;
		shape.density = 2;
		body.addShape(shape);
		body.resetMassData();        
		space.addBody(body);*/
	}

	function runFrame() {
	}

	function name() {
		return "Pyramid";
	}

	return {
		init: init,
		runFrame: runFrame,
		name: name
	};
}();
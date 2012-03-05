DemoPyramid = function() {
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

		for (var i = 0; i < 9; i++) {
			for (var j = 0; j <= i; j++) {
				var body = new Body(Body.DYNAMIC, new vec2((j - i * 0.5) * 0.84, 10 - i * 0.84));
				var shape = new ShapeBox(0, 0, 0.72, 0.72);
				shape.e = 0.1;
				shape.u = 1.0;
				shape.density = 1;
				body.addShape(shape);
				body.resetMassData();
				space.addBody(body);
			}
		}
		/*
		body = new Body(Body.DYNAMIC, new vec2(0, 1));
		var shape = new ShapeCircle(0, 0, 0.4);
		shape.e = 0.1;
		shape.u = 1.0;
		shape.density = 2;
		body.addShape(shape);
		body.resetMassData();        
		space.addBody(body);*/
	}

	function runFrame() {
	}

	function keyDown(ev) {
	}

	function name() {
		return "Pyramid";
	}

	return {
		init: init,
		runFrame: runFrame,
		keyDown: keyDown,
		name: name
	};
}();
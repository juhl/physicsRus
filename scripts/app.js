var stats = {};

App = function() {
	var canvas;
	var ctx;
	var ws;

	var mouseDown;
	var canvasBounds = new Bounds;
	var clearBounds = new Bounds;
	var paintBounds = new Bounds;
	var randomColor;    
	var lastTime;
	var timeOffset;	
	var screenZoomScale = 1.0;
	var screenOffset = new vec2(0, 0);

	var editMode = false;
	var selectMode = 0; // 0: Body, 1: Shape, 2: Vertex, 3: Joint
	var selectedBody;
	var selectedShape;
	var selectedVertex;
	var selectedJoint;

	var space;
	var demoArr = [DemoCar, DemoRagDoll, DemoSeeSaw, DemoPyramid, DemoCrank, DemoRope, DemoWeb, DemoBounce];
	var sceneNameArr = [];
	var sceneIndex;
	var mouseBody;
	var mouseJoint;
	var gravity = new vec2(0, -627.2);
	var pause = false;
	var step = false;
	var frameRateHz = 60;
	var velocityIterations = 8;
	var positionIterations = 4;
	var warmStarting = true;
	var allowSleep = true;
	var showBounds = false;
	var showContacts = false;
	var showJoints = true;
	var showStats = false;
	var showClearBounds = false;

	function main() {
		// Horizontal & vertical scrollbar will be hidden
		document.documentElement.style.overflowX = "hidden";
		document.documentElement.style.overflowY = "hidden";
		document.body.scroll = "no"; // ie only

		canvas = document.getElementById("canvas");
		if (!canvas.getContext) {
			alert("Couldn't get canvas object !");
		}
		
		window.addEventListener("resize", function(e) { onResize(e) }, false);
		canvas.addEventListener("mousedown", function(e) { onMouseDown(e) }, false);
		window.addEventListener("mouseup", function(e) { onMouseUp(e) }, false);
		window.addEventListener("mousemove", function(e) { onMouseMove(e) }, false);		
		window.addEventListener("mouseleave", function(e) { onMouseLeave(e) }, false);
		//canvas.addEventListener("mousewheel", function(e) { onMouseWheel(e) }, false);

		canvas.addEventListener("touchstart", touchHandler, false);
		canvas.addEventListener("touchend", touchHandler, false);
		canvas.addEventListener("touchmove", touchHandler, false);
		canvas.addEventListener("touchcancel", touchHandler, false);

		// Prevent elastic scrolling on iOS
		//document.body.addEventListener('touchmove', function(event) { event.preventDefault(); }, false);

		if (document.addEventListener) {
			document.addEventListener("keydown", onKeyDown, false);
			document.addEventListener("keyup", onKeyUp, false);
			document.addEventListener("keypress", onKeyPress, false);
		}
		else if (document.attachEvent) {
			document.attachEvent("onkeydown", onKeyDown);
			document.attachEvent("onkeyup", onKeyUp);
			document.attachEvent("onkeypress", onKeyPress);
		}
		else {
			document.onkeydown = onKeyDown;
			document.onkeyup = onKeyUp
			document.onkeypress = onKeyPress;
		}

		window.requestAnimFrame = (function() {
			return window.requestAnimationFrame || 
			window.webkitRequestAnimationFrame || 
			window.mozRequestAnimationFrame || 
			window.oRequestAnimationFrame || 
			window.msRequestAnimationFrame || 
			function(callback, element) { window.setTimeout(callback, 1000 / 60); };
		})();

		// Add scenes from demos
		var combobox = document.getElementById("scene");
		for (var i = 0; i < demoArr.length; i++) {
			var option = document.createElement("option");
			var name = demoArr[i].name();
			option.text = name;
			option.value = name;
			combobox.add(option);
			sceneNameArr.push(name);
		}		

		// Add scenes from server files
		httpGetText("http://peppercode.net/rigid-dyn2d/cgi-bin/scene.rb?action=list", false, function(text) { 
			text.replace(/\s*(.+?\.json)/g, function($0, filename) {
				var option = document.createElement("option");
				option.text = filename;
				option.value = filename;
				combobox.add(option);
				sceneNameArr.push(filename);
			});
		});

		// Select scene
		sceneIndex = 0;
		combobox.selectedIndex = sceneIndex;

		var editbox = document.getElementById("gravity");
		editbox.value = gravity.y;

		var editbox = document.getElementById("frameRateHz");
		editbox.value = frameRateHz;

		var editbox = document.getElementById("v_iters");
		editbox.value = velocityIterations;

		var editbox = document.getElementById("p_iters");
		editbox.value = positionIterations;		
		
		// Main canvas context
		ctx = canvas.getContext("2d");

		Renderer.init(ctx);

		// Random color for bodies
		randomColor = ["#AFC", "#59C", "#DBB", "#9E6", "#7CF", "#A9E", "#F89", "#8AD", "#FAF", "#CDE", "#FC7", "#FF8"];

		collision.init();		

		space = new Space();

		mouseBody = new Body(Body.KINETIC);
		mouseBody.resetMassData();
		space.addBody(mouseBody);

		onResize();

		initScene();		

		window.requestAnimFrame(function() { runFrame(); });
	}

	function httpGetText(uri, async, callback) {
		var request = new XMLHttpRequest();
		request.onreadystatechange = function () {
			if (request.readyState == 4 && request.status == 200) {
				var text = request.responseText;
				callback(text);
			}
		}

		request.open('GET', uri, async);
		request.overrideMimeType('text/plain');
		request.setRequestHeader('Content-Type', 'text/plain');
		request.send();
	}

	function httpPostText(uri, async, text, callback) {
		var request = new XMLHttpRequest();
		request.onreadystatechange = function () {
			if (request.readyState == 4 && request.status == 200) {
				var text = request.responseText;
				callback(text);
			}
		}

		request.open('POST', uri, async);
		request.overrideMimeType('text/plain');
		request.setRequestHeader('Content-Type', 'text/plain');
		request.send(text);
	}

	function loadSceneFromServer(filename) {
		var uri = "http://peppercode.net/rigid-dyn2d/scenes/" + encodeURIComponent(filename);
		httpGetText(uri, false, function(text) {
			space.create(text);
		});
	}

	function saveSceneToServer(filename) {
		var text = JSON.stringify(space, null, "\t");
		var uri = "http://peppercode.net/rigid-dyn2d/cgi-bin/scene.rb?action=save&filename=" + encodeURIComponent(filename);
		httpPostText(uri, true, "file=" + text, function(text) {});
	}

	function initScene() {
		space.clear();
		space.gravity.copy(gravity);

		if (sceneIndex < demoArr.length) {
			demo = demoArr[sceneIndex];
			demo.init(space);
		}
		else {
			demo = null;
			loadSceneFromServer(sceneNameArr[sceneIndex]);
		}
		
		clearBounds.copy(canvasBounds);

		lastTime = Date.now();
		timeOffset = 0;
	}	

	function bodyColor(body) {
		if (body.isStatic()) {
			return "#888";
		}

		if (!body.isAwake()) {
			return "#888";
		}

		return randomColor[(body.id) % randomColor.length];
	}
	
	function runFrame() {
		window.requestAnimFrame(function() { runFrame(); });   

		var time = Date.now();
		var frameTime = (time - lastTime) / 1000;
		lastTime = time;

		if (!pause || step && !editMode) {
			var h = 1 / frameRateHz;

			timeOffset += frameTime;

			if (step) {
				step = false;
				timeOffset = h;
			}
			
			stats.timeStep = 0;
			stats.stepCount = 0;

			for (var maxSteps = 4; maxSteps > 0 && timeOffset >= h; timeOffset -= h, maxSteps--) {
				var t0 = Date.now();
				space.step(h, velocityIterations, positionIterations, warmStarting, allowSleep);
				stats.timeStep += Date.now() - t0;
				stats.stepCount++;
			}

			if (timeOffset > h) {
				timeOffset = 0;
			}
		}
		
		updateScreen(frameTime);
	}

	function updateScreen(frameTime) {	
		var t0 = Date.now();
		drawFrame(frameTime);
		stats.timeDrawFrame = Date.now() - t0;

		// Draw statistics
		if (showStats) {
			ctx.save();
			ctx.setTransform(1, 0, 0, 1, 0, 0);
			ctx.font = "9pt menlo";
			ctx.textBaseline = "top";
			ctx.fillStyle = "#333";			
			ctx.fillText("step_cnt: " + stats.stepCount + " tm_step: " + stats.timeStep + " tm_draw: " + stats.timeDrawFrame, 10, 2);
			ctx.fillText("tm_col: " + stats.timeCollision + " tm_init_sv: " + stats.timeInitSolver + " tm_vel_sv: " + stats.timeVelocitySolver + " tm_pos_sv: " + stats.timePositionSolver, 10, 18);
			ctx.fillText("bodies: " + space.numBodies + " joints: " + space.numJoints + " contacts: " + space.numContacts + " pos_iters: " + stats.positionIterations, 10, 34);
			ctx.restore();

			clearBounds.copy(canvasBounds);
		}
	}

	function drawFrame(frameTime) {
		// Transform coordinate system to y-axis is up and origin is bottom center
		ctx.setTransform(1, 0, 0, 1, 0, 0);
		ctx.translate(canvas.width * 0.5 + screenOffset.x, canvas.height + screenOffset.y);
		ctx.scale(screenZoomScale, -screenZoomScale);

		// Clear rect
		if (!clearBounds.isEmpty()) {
			Renderer.clearRect(clearBounds.mins.x, clearBounds.mins.y, clearBounds.maxs.x - clearBounds.mins.x, clearBounds.maxs.y - clearBounds.mins.y);
		}

		// Update paint bounds for culling
		paintBounds.clear();
		for (var i in space.bodyHash) {
			preBody(space.bodyHash[i]);
		}

		paintBounds.addBounds(clearBounds);
		clearBounds.clear();

		// Draw bodies
		for (var i in space.bodyHash) {
			var body = space.bodyHash[i];
			drawBody(body, bodyColor(body), "#000");
		}

		// Draw joints
		if (showJoints) {
			for (var i in space.jointHash) {
				drawJoint(space.jointHash[i], "#F0F");
			}
		}

		// Draw contacts
		if (showContacts) {
			for (var i = 0; i < space.contactSolverArr.length; i++) {
				var contactSolver = space.contactSolverArr[i];
				for (var j = 0; j < contactSolver.contactArr.length; j++) {
					var con = contactSolver.contactArr[j];
					Renderer.drawCircle(con.p, 2.0, 0, "#F00");
					//Renderer.drawArrow(con.p, vec2.add(con.p, vec2.scale(con.n, con.d)), "#F00");
				}
			}
		}

		// Draw update bounds
		if (showClearBounds) {
			var bounds = new Bounds(clearBounds.mins, clearBounds.maxs);
			bounds.expand(-2, -2);
			Renderer.drawBox(bounds.mins, bounds.maxs, null, "#F00");
		}
	}	

	function preBody(body) {
		for (var i = 0; i < body.shapeArr.length; i++) {
			var shape = body.shapeArr[i];

			// Expand for outline
			var bounds = new Bounds(shape.bounds.mins, shape.bounds.maxs);
			bounds.expand(2, 2);

			if (!canvasBounds.intersectsBounds(bounds)) {
				continue;
			}

			if (!body.isStatic() && body.isAwake()) {
				paintBounds.addBounds(bounds);
			}
		}
	}

	function drawBody(body, fillColor, outlineColor) {
		for (var i = 0; i < body.shapeArr.length; i++) {
			var shape = body.shapeArr[i];

			// Expand for outline
			var bounds = new Bounds(shape.bounds.mins, shape.bounds.maxs);
			bounds.expand(2, 2);

			if (!paintBounds.intersectsBounds(bounds)) {
				continue;
			}

			if (!body.isStatic() && body.isAwake()) {
				clearBounds.addBounds(bounds);
			}

			drawBodyShape(body, shape, fillColor, outlineColor);
		}
	}

	function drawBodyShape(body, shape, fillColor, outlineColor) {
		// Draw body shape
		switch (shape.type) {
			case Shape.TYPE_CIRCLE:
				Renderer.drawCircle(shape.tc, shape.r, body.a, fillColor, outlineColor);
				break;
			case Shape.TYPE_SEGMENT:
				Renderer.drawSegment(shape.ta, shape.tb, shape.r, fillColor, outlineColor);
				break;
			case Shape.TYPE_POLY:
				Renderer.drawPolygon(shape.tverts, fillColor, outlineColor);
				break;
		}

		// Draw bounds
		if (showBounds) {
			// expand for outline
			var bounds = new Bounds(shape.bounds.mins, shape.bounds.maxs);
			bounds.expand(1, 1);

			Renderer.drawBox(bounds.mins, bounds.maxs, null, "#0A0");
			clearBounds.addBounds(bounds);
		}
	}

	function drawJoint(joint, strokeStyle) {
		if (!joint.anchor1 || !joint.anchor2) {
			return;
		}

		var body1 = joint.body1;
		var body2 = joint.body2;

		var p1 = vec2.add(vec2.rotate(joint.anchor1, body1.a), body1.p);
		var p2 = vec2.add(vec2.rotate(joint.anchor2, body2.a), body2.p);

		Renderer.drawLine(p1, p2, strokeStyle);

		if (body1.isAwake() || body2.isAwake()) {
			bounds = new Bounds;
			bounds.addPoint(p1);
			bounds.addPoint(p2);
			bounds.expand(3, 3);
			clearBounds.addBounds(bounds);
		}

		Renderer.drawCircle(p1, 2.5, 0, "#808");		
		Renderer.drawCircle(p2, 2.5, 0, "#808");		
	}

	function onResize(e) {
		canvas.width = window.innerWidth - document.getElementById("toolbar").clientWidth;
		canvas.height = window.innerHeight;

		canvasBounds.mins = new vec2(-canvas.width * 0.5, 0);
		canvasBounds.maxs = new vec2(canvas.width * 0.5, canvas.height);

		clearBounds.copy(canvasBounds);
	}

	function getMousePoint(e) {
		return { 
			x: document.body.scrollLeft + e.clientX - canvas.offsetLeft, 
			y: document.body.scrollTop + e.clientY - canvas.offsetTop 
		};
	}

	function onMouseDown(e) {
		mouseDown = true;

		if (mouseJoint) {
			space.removeJoint(mouseJoint);
			mouseJoint = null;
		}

		var point = getMousePoint(e);
		var p = new vec2(point.x - canvas.width * 0.5, canvas.height - point.y);

		if (!editMode) {
			var shape = space.findShapeByPoint(p);
			if (shape) {
				var body = shape.body;

				if (!body.isStatic()) {
					mouseBody.p.copy(p);
					mouseJoint = new MouseJoint(mouseBody, body, p);
					mouseJoint.maxForce = body.m * 10000;
					space.addJoint(mouseJoint);
				}
			}
		}
		else {
			var shape = space.findShapeByPoint(p);
			if (selectMode == 0) {
				selectedBody = shape.body;
			}			
		}

		e.preventDefault();        
	}

	function onMouseUp(e) {
		if (mouseDown) {
			mouseDown = false;

			if (mouseJoint) {
				space.removeJoint(mouseJoint);
				mouseJoint = null;
			}
			
			e.preventDefault();
		}
	}

	function onMouseMove(e) {
		if (mouseDown) {
			if (mouseJoint) {
				var point = getMousePoint(e);
				mouseBody.p.set(point.x - canvas.width * 0.5, canvas.height - point.y);				
			}

			e.preventDefault();
		}
	}

	function onMouseLeave(e) {
		if (mouseDown) {
			mouseDown = false;

			if (mouseJoint) {
				space.removeJoint(mouseJoint);
				mouseJoint = null;
			}

			e.preventDefault();
		}
	}

	function onMouseWheel(e) {
		var point = getMousePoint(e);
		if (point.x < 0 || point.x >= canvas.width || point.y < 0 || point.y >= canvas.height) {
			var delta = e.detail ? e.detail * -120 : e.wheelDelta;

			// FIXME !!
			screenZoomScale += delta * 0.01;
			screenZoomScale = Math.clamp(screenZoomScale, 0.5, 2.0);

			clearBounds.copy(canvasBounds);

			e.preventDefault();
		}
	}

	function touchHandler(e) {
		var touches = e.changedTouches;
		var first = touches[0];
		var type = "";

		switch (e.type) {
			case "touchstart": type = "mousedown"; break;
			case "touchmove":  type = "mousemove"; break;
			case "touchend":   type = "mouseup"; break;
			default: return;
		}

		//initMouseEvent(type, canBubble, cancelable, view, clickCount, 
		//           screenX, screenY, clientX, clientY, ctrlKey, 
		//           altKey, shiftKey, metaKey, button, relatedTarget); 
		var simulatedEvent = document.createEvent("MouseEvent");
		simulatedEvent.initMouseEvent(type, true, true, window, 1, 
			first.screenX, first.screenY, 
			first.clientX, first.clientY, false, 
			false, false, false, 0/*left*/, null);

		first.target.dispatchEvent(simulatedEvent);
		e.preventDefault();
	}

	function onKeyDown(e) {
		if (!e) {
			e = event;
		}

		switch (e.keyCode) {
			case 66: // 'b'
				break;        
			case 67: // 'c'
				break;
			case 74: // 'j'
				break;
			case 83: // 's'
				break;        
			case 85: // 'u'
				break;
			case 49: // '1'            
			case 50: // '2'
			case 51: // '3'
				//number = e.keyCode - 48;
				break;
			case 32: // 'space'            
				break;
		}
	}

	function onKeyUp(e) {
		if (!e) {
			e = event;
		}
	}

	function onKeyPress(e) {
		if (!e) {
			e = event;
		}
	}

	function onChangedScene(index) {
		sceneIndex = index;
		initScene();
	}

	function onChangedGravity(value) {
		gravity.y = parseFloat(value);
		space.gravity.copy(gravity);
	}

	function onChangedFrameRateHz(value) {
		frameRateHz = parseInt(value);
	}

	function onChangedVelocityIterations(value) {
		velocityIterations = parseInt(value);
	}

	function onChangedPositionIterations(value) {
		positionIterations = parseInt(value);
	}

	function onClickedWarmStarting() {
		warmStarting = !warmStarting;
	}

	function onClickedAllowSleep() {
		allowSleep = !allowSleep;
	}

	function onClickedShowBounds() {
		showBounds = !showBounds;
	}

	function onClickedShowContacts() {
		showContacts = !showContacts;
	}

	function onClickedShowJoints() {
		showJoints = !showJoints;
	}

	function onClickedShowStats() {
		showStats = !showStats;
	}

	function onClickedShowClearRect() {
		showClearBounds = !showClearBounds;
	}

	function updatePauseButton() {
		var button = document.getElementById("pause");
		button.value = pause ? "Play" : "Pause";
	}

	function onClickedRestart() {
		initScene();
		pause = false;
		updatePauseButton();
	}

	function onClickedPause() {
		pause = !pause;
		updatePauseButton();
	}

	function onClickedStep() {
		pause = true;
		step = true;
		updatePauseButton();
	}

	return { 
		main: main,
		onChangedScene: onChangedScene,
		onChangedGravity: onChangedGravity,
		onChangedFrameRateHz: onChangedFrameRateHz,
		onChangedVelocityIterations: onChangedVelocityIterations,
		onChangedPositionIterations: onChangedPositionIterations,        
		onClickedWarmStarting: onClickedWarmStarting,
		onClickedAllowSleep: onClickedAllowSleep,
		onClickedShowBounds: onClickedShowBounds,
		onClickedShowContacts: onClickedShowContacts,
		onClickedShowJoints: onClickedShowJoints,
		onClickedShowStats: onClickedShowStats,
		onClickedShowClearRect: onClickedShowClearRect,
		onClickedRestart: onClickedRestart,
		onClickedPause: onClickedPause,
		onClickedStep: onClickedStep
	};
}();
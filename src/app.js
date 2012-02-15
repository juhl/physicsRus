var stats = {};

App = function() {
	var mainView;	
	var canvas;
	var fg = {};
	var bg = {};
	var renderer;
	var activeWindow = true;
	
	var lastTime;
	var timeDelta;
	var view = { origin: new vec2(0, 0), scale: 1, minScale: 0.5, maxScale: 4.0, bounds: new Bounds };
	var mouseDown = false;
	var startMoving = false;
	var mousePosition = new vec2;
	var mousePositionOld = new vec2;
	var mouseCursor = "default";
	var touchPosOld = new Array(2);
	var gestureStartScale;
	var gestureScale;
	var dirtyBounds = new Bounds;
	var pressedShape;

	var editMode = false;
	var SELECT_MODE_VERTEX = 0;
	var SELECT_MODE_SHAPE = 1;
	var SELECT_MODE_BODY = 2;
	var SELECT_MODE_JOINT = 3;
	var selectMode = SELECT_MODE_SHAPE;
	var selectedShape;
	var selectedVertex = -1;
	var selectedJoint;	

	var space;
	var demoArr = [DemoCar, DemoRagDoll, DemoSeeSaw, DemoPyramid, DemoCrank, DemoRope, DemoWeb, DemoBounce];
	var sceneNameArr = [];
	var sceneIndex;
	var randomColor;
	var mouseBody;
	var mouseJoint;

	var showSettings = false;
	var gravity = new vec2(0, -627.2);
	var pause = false;
	var step = false;
	var frameRateHz = 60;
	var velocityIterations = 8;
	var positionIterations = 4;
	var warmStarting = true;
	var allowSleep = true;
	var enableDirtyBounds = true;
	var showBounds = false;
	var showContacts = false;
	var showStats = false;

	function main() {
		mainView = document.getElementById("main_view");

		// Initialize canvas context
		canvas = document.getElementById("canvas");
		if (!canvas.getContext) {
			alert("Your browser doesn't support canvas.");
			return;
		}

		fg.canvas = canvas;
		fg.ctx = fg.canvas.getContext("2d");
		bg.canvas = document.createElement("canvas");
		bg.ctx = bg.canvas.getContext("2d");

		// HACK
		onResize(); 

		// Horizontal & vertical scrollbar will be hidden
		document.documentElement.style.overflowX = "hidden";
		document.documentElement.style.overflowY = "hidden";
		document.body.scroll = "no"; // ie only	

		var elements = document.getElementById("settings_layout").querySelectorAll("select, input");
		for (var i in elements) {
			elements[i].onblur = function() { window.scrollTo(0, 0); };			
		}

		//document.onselectstart = null;
		
		window.addEventListener("focus", function(e) { activeWindow = true; }, false);
		window.addEventListener("blur", function(e) { activeWindow = false; }, false);
		window.addEventListener("resize", onResize, false);
		canvas.addEventListener("mousedown", onMouseDown, false);
		window.addEventListener("mousemove", onMouseMove, false);
		window.addEventListener("mouseup", onMouseUp, false);
		window.addEventListener("mouseleave", onMouseLeave, false);
		canvas.addEventListener("mousewheel", onMouseWheel, false);

		canvas.addEventListener("touchstart", touchHandler, false);
		canvas.addEventListener("touchmove", touchHandler, false);
		canvas.addEventListener("touchend", touchHandler, false);		
		canvas.addEventListener("touchcancel", touchHandler, false);

		canvas.addEventListener("gesturestart", onGestureStart, false);
		canvas.addEventListener("gesturechange", onGestureChange, false);
		canvas.addEventListener("gestureend", onGestureEnd, false);		
		window.addEventListener("orientationchange", onResize, false);

		// Prevent elastic scrolling on iOS
		document.body.addEventListener("touchmove", function(event) { event.preventDefault(); }, false);

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
/*
		// Add scenes from list of JSON files in server
		httpGetText("scene.rb?action=list", false, function(text) { 
			text.replace(/\s*(.+?\.json)/g, function($0, filename) {
				var option = document.createElement("option");
				option.text = filename;
				option.value = filename;
				combobox.add(option);
				sceneNameArr.push(filename);
			});
		});*/

		updateMainToolbar();

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

		renderer = RendererCanvas;

		// Random color for bodies
		randomColor = ["#AFC", "#59C", "#DBB", "#9E6", "#7CF", "#A9E", "#F89", "#8AD", "#FAF", "#CDE", "#FC7", "#FF8"];

		collision.init();		

		space = new Space();

		mouseBody = new Body(Body.KINETIC);
		mouseBody.resetMassData();
		space.addBody(mouseBody);

		initScene();

		window.requestAnimFrame = window.requestAnimationFrame || 
			window.webkitRequestAnimationFrame || 
			window.mozRequestAnimationFrame || 
			window.oRequestAnimationFrame || 
			window.msRequestAnimationFrame;

		if (window.requestAnimationFrame) {
			window.requestAnimFrame(function() { window.requestAnimFrame(arguments.callee); runFrame(); });
		}
		else {
			window.setInterval(runFrame, parseInt(1000 / 60));
		}
	}
	
	function httpGetText(uri, async, callback) {
		var request = new XMLHttpRequest();
		request.onreadystatechange = function () {
			if (request.readyState == 4 && request.status == 200) {
				var text = request.responseText;
				callback(text);
			}
		}

		request.open("GET", uri, async);
		//request.overrideMimeType("text/plain");
		request.setRequestHeader("Content-Type", "text/plain");
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

		request.open("POST", uri, async);
		//request.overrideMimeType("text/plain");
		request.setRequestHeader("Content-Type", "application/x-www-form-urlencoded");
		request.setRequestHeader("Content-length", text.length);
		request.setRequestHeader("Connection", "close");
		request.send(text);
	}	

	function loadSceneFromServer(name) {		
		var uri = "scenes/" + encodeURIComponent(name);
		httpGetText(uri, false, function(text) {
			space.create(text);
		});
	}

	function saveSceneToServer(name) {
		var text = JSON.stringify(space, null, "\t");
		var postData = "action=save&filename=" + encodeURIComponent(name) + "&text=" + encodeURIComponent(text);
		httpPostText("scene.rb", false, postData, function(text) {});
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

		lastTime = Date.now();
		timeDelta = 0;

		// Set dirtyBounds to full screen
		dirtyBounds.set(canvasToWorld(new vec2(0, canvas.height)), canvasToWorld(new vec2(canvas.width, 0)));
		bg.outdated = true;
	}

	function worldToCanvas(v) {
		return new vec2(
			canvas.width * 0.5 + (v.x * view.scale - view.origin.x),
			canvas.height - (v.y * view.scale - view.origin.y));
	}

	function canvasToWorld(v) {
		return new vec2(
			(view.origin.x + (v.x - canvas.width * 0.5)) / view.scale,
			(view.origin.y - (v.y - canvas.height)) / view.scale);
	}

	function screenAlign(bounds) {
		var mins = worldToCanvas(bounds.mins);
		mins.x = Math.max(Math.floor(mins.x), 0);
		mins.y = Math.min(Math.ceil(mins.y), canvas.height);
		bounds.mins = canvasToWorld(mins);

		var maxs = worldToCanvas(bounds.maxs);
		maxs.x = Math.min(Math.ceil(maxs.x), canvas.width);
		maxs.y = Math.max(Math.floor(maxs.y), 0);
		bounds.maxs = canvasToWorld(maxs);
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
		var time = Date.now();
		var frameTime = (time - lastTime) / 1000;
		lastTime = time;

		if (!activeWindow) {
			return;
		}

		if (!mouseDown) {
			if (!editMode) {
				var p = canvasToWorld(mousePosition);
				var shape = space.findShapeByPoint(p);
				mouseCursor = shape ? "pointer" : "default";
			}
			else {
				
			}
		}

		canvas.style.cursor = mouseCursor;
		
		if (window.requestAnimFrame) {
			frameTime = Math.floor(frameTime * 60 + 0.5) / 60;
		}

		if ((!pause || step) && !editMode) {
			var h = 1 / frameRateHz;

			timeDelta += frameTime;

			if (step) {
				step = false;
				timeDelta = h;
			}
			
			stats.timeStep = 0;
			stats.stepCount = 0;

			for (var maxSteps = 4; maxSteps > 0 && timeDelta >= h; maxSteps--) {
				var t0 = Date.now();
				space.step(h, velocityIterations, positionIterations, warmStarting, allowSleep);
				stats.timeStep += Date.now() - t0;
				stats.stepCount++;

				timeDelta -= h;
			}

			if (timeDelta > h) {
				timeDelta = 0;
			}
		}

		if (stats.stepCount > 0) {
			updateScreen(frameTime);
		}
	}
	
	function updateScreen(frameTime) {	
		var t0 = Date.now();
		drawFrame(frameTime);
		stats.timeDrawFrame = Date.now() - t0;

		var info = document.getElementById("info");
		info.innerHTML = "";

		if (editMode) {
		}

		// Show statistaics
		if (showStats) {			
			info.innerHTML +=
				["fps:", parseInt(1 / frameTime), "step_cnt:", stats.stepCount, "tm_step:", stats.timeStep, "tm_draw:", stats.timeDrawFrame, "<br />"].join(" ") +
				["tm_col:", stats.timeCollision, "tm_init_sv:", stats.timeInitSolver, "tm_vel_sv:", stats.timeVelocitySolver, "tm_pos_sv:", stats.timePositionSolver, "<br />"].join(" ") +
				["bodies:", space.numBodies, "joints:", space.numJoints, "contacts:", space.numContacts, "pos_iters:", stats.positionIterations].join(" ");
		}
	}

	function drawFrame(frameTime) {
		// view.bounds for culling
		view.bounds.set(canvasToWorld(new vec2(0, canvas.height)), canvasToWorld(new vec2(canvas.width, 0)));

		// Check the visibility of shapes for all bodies
		for (var i in space.bodyHash) {
			var body = space.bodyHash[i];

			for (var j = 0; j < body.shapeArr.length; j++) {
				var shape = body.shapeArr[j];
				var bounds = new Bounds(shape.bounds.mins, shape.bounds.maxs);
				if (view.bounds.intersectsBounds(bounds)) {
					shape.visible = true;
				}
				else {
					shape.visible = false;
				}
			}
		}

		// Update whole background canvas if we needed
		if (bg.outdated) {
			bg.outdated = false;
			bg.ctx.fillStyle = "rgba(244, 244, 244, 1.0)";
			bg.ctx.fillRect(0, 0, canvas.width, canvas.height);

			bg.ctx.save();
			bg.ctx.setTransform(view.scale, 0, 0, -view.scale, canvas.width * 0.5 - view.origin.x, canvas.height + view.origin.y);
			
			drawGrids(bg.ctx, 64, "#CCC");

			// Draw static bodies
			for (var i in space.bodyHash) {
				var body = space.bodyHash[i];
				if (body.isStatic()) {
					drawBody(bg.ctx, body, bodyColor(body), "#000");
				}
			}

			bg.ctx.restore();
		}

		// Transform dirtyBounds world to screen
		if (enableDirtyBounds && !dirtyBounds.isEmpty()) {			
			var mins = worldToCanvas(dirtyBounds.mins);
			var maxs = worldToCanvas(dirtyBounds.maxs);
			var x = Math.max(Math.floor(mins.x), 0);
			var y = Math.max(Math.floor(maxs.y), 0);
			var w = Math.min(Math.ceil(maxs.x + 1), canvas.width) - x;
			var h = Math.min(Math.ceil(mins.y + 1), canvas.height) - y;

			// void drawImage(HTMLVideoElement image, double sx, double sy, double sw, double sh, double dx, double dy, double dw, double dh);
			fg.ctx.drawImage(bg.canvas, x, y, w, h, x, y, w, h);
		}
		else {
			fg.ctx.drawImage(bg.canvas, 0, 0);
		}

		fg.ctx.save();
		
		// Transform view coordinates to screen canvas
		/*fg.ctx.translate(canvas.width * 0.5, canvas.height);
		fg.ctx.scale(1, -1);

		// Transform world coordinates to view
		fg.ctx.translate(-view.origin.x, -view.origin.y);
		fg.ctx.scale(view.scale, view.scale);*/

		fg.ctx.setTransform(view.scale, 0, 0, -view.scale, canvas.width * 0.5 - view.origin.x, canvas.height + view.origin.y);

		//renderer.drawBox(fg.ctx, dirtyBounds.mins, dirtyBounds.maxs, "", "#00F");

		dirtyBounds.clear();

		// Draw bodies except for static bodies
		for (var i in space.bodyHash) {
			var body = space.bodyHash[i];			
			if (!body.isStatic()) {
				drawBody(fg.ctx, body, bodyColor(body), "#000");
			}			
		}

		// Edit mode drawing
		if (editMode) {
			for (var i in space.bodyHash) {
				drawBodyEdit(fg.ctx, space.bodyHash[i]);
			}

			for (var i in space.jointHash) {
				drawJoint(fg.ctx, space.jointHash[i], "#F0F");
			}
		}

		// Draw contacts
		if (showContacts) {
			for (var i = 0; i < space.contactSolverArr.length; i++) {
				var contactSolver = space.contactSolverArr[i];
				for (var j = 0; j < contactSolver.contactArr.length; j++) {
					var con = contactSolver.contactArr[j];
					var offset = new vec2(2, 2);					
					var mins = vec2.sub(con.p, offset);
					var maxs = vec2.add(con.p, offset);

					dirtyBounds.addBounds2(mins, maxs);
					renderer.drawBox(fg.ctx, mins, maxs, "#F00");
					//dirtyBounds.addBounds2();
					//renderer.drawArrow(fg.ctx, con.p, vec2.add(con.p, vec2.scale(con.n, con.d)), "#F00");
				}
			}
		}		

		fg.ctx.restore();
	}	

	function drawGrids(ctx, refGridSize, gridColor) {
		var n = refGridSize * view.scale;
		var p = 1; while (p <= n) p <<= 1; p >>= 1; // previous power of two
		var gridSize = refGridSize * refGridSize / p;

		var start_x = Math.floor(view.bounds.mins.x / gridSize) * gridSize;
		var start_y = Math.floor(view.bounds.mins.y / gridSize) * gridSize;
		var end_x = Math.ceil(view.bounds.maxs.x / gridSize) * gridSize;
		var end_y = Math.ceil(view.bounds.maxs.y / gridSize) * gridSize;

		var v1 = new vec2(start_x, start_y);
		var v2 = new vec2(start_x, end_y);

		for (var x = start_x; x <= end_x; x += gridSize) {
			v1.x = x;
			v2.x = x;			
			renderer.drawLine(ctx, v1, v2, gridColor);
		}

		v1.set(start_x, start_y);
		v2.set(end_x, start_y);

		for (var y = start_y; y <= end_y; y += gridSize) {
			v1.y = y;
			v2.y = y;
			renderer.drawLine(ctx, v1, v2, gridColor);
		}
	}

	function drawBody(ctx, body, fillColor, outlineColor) {
		for (var i = 0; i < body.shapeArr.length; i++) {
			var shape = body.shapeArr[i];
			if (!shape.visible) {
				continue;
			}			

			drawBodyShape(ctx, shape, fillColor, outlineColor);

			if (showBounds || !body.isStatic()) {
				var bounds = new Bounds(shape.bounds.mins, shape.bounds.maxs);

				if (showBounds) {
					bounds.expand(1, 1);
					renderer.drawBox(ctx, bounds.mins, bounds.maxs, null, "#0A0");
				}

				if (!body.isStatic()) {
					bounds.expand(1, 1);
					dirtyBounds.addBounds(bounds);
				}
			}
		}
	}

	function drawBodyShape(ctx, shape, fillColor, outlineColor) {
		switch (shape.type) {
		case Shape.TYPE_CIRCLE:
			renderer.drawCircle(ctx, shape.tc, shape.r, shape.body.a, fillColor, outlineColor);
			break;
		case Shape.TYPE_SEGMENT:
			renderer.drawSegment(ctx, shape.ta, shape.tb, shape.r, fillColor, outlineColor);
			break;
		case Shape.TYPE_POLY:
			renderer.drawPolygon(ctx, shape.tverts, fillColor, outlineColor);			
			break;
		}		
	}

	function drawBodyEdit(ctx, body) {		
		for (var i = 0; i < body.shapeArr.length; i++) {
			var shape = body.shapeArr[i];
			if (!shape.visible) {
				continue;
			}

			if (selectMode == SELECT_MODE_SHAPE && selectedShape == shape) {
				drawBodyShape(ctx, shape, "rgba(255, 0, 0, 0.6)", "#F00");
				dirtyBounds.addBounds(Bounds.expand(shape.bounds, 1, 1));
			}
			else if (selectMode == SELECT_MODE_BODY && selectedShape && selectedShape.body == body) {
				drawBodyShape(ctx, shape, "rgba(255, 0, 0, 0.6)", "#F00");
				dirtyBounds.addBounds(Bounds.expand(shape.bounds, 1, 1));
			}

			if (selectMode == SELECT_MODE_VERTEX) {
				selectedVertex = shape.findVertexByPoint(canvasToWorld(mousePosition), 3);
				drawBodyShapeVerts(ctx, shape);
			}
		}
	}

	function drawBodyShapeVerts(ctx, shape, color) {
		switch (shape.type) {
		case Shape.TYPE_CIRCLE:
			drawVertex(ctx, shape.tc, "#008", true);
			break;
		case Shape.TYPE_SEGMENT:
			drawVertex(ctx, shape.ta, "#008", true);
			drawVertex(ctx, shape.tb, "#008", true);
			break;
		case Shape.TYPE_POLY:
			for (var i = 0; i < shape.tverts.length; i++) {
				drawVertex(ctx, shape.tverts[i], "#008", true);
			}
			break;
		}		
	}

	function drawVertex(ctx, v, color, addDirtyBounds) {
		if (this.vertex_offset == undefined) {
			this.vertex_offset = new vec2(2, 2);
		}

		var mins = vec2.sub(v, vertex_offset);
		var maxs = vec2.add(v, vertex_offset);

		renderer.drawBox(ctx, mins, maxs, color);

		if (addDirtyBounds) {
			dirtyBounds.addBounds2(mins, maxs);
		}
	}

	function drawJoint(ctx, joint, strokeStyle) {
		if (!joint.anchor1 || !joint.anchor2) {
			return;
		}

		var body1 = joint.body1;
		var body2 = joint.body2;

		var p1 = vec2.add(vec2.rotate(joint.anchor1, body1.a), body1.p);
		var p2 = vec2.add(vec2.rotate(joint.anchor2, body2.a), body2.p);

		var bounds = new Bounds;
		bounds.addPoint(p1);
		bounds.addPoint(p2);
		bounds.expand(2, 2);
		
		if (!view.bounds.intersectsBounds(bounds)) {
			return;
		}

		renderer.drawLine(ctx, p1, p2, strokeStyle);

		var offset = new vec2(2, 2);
		renderer.drawBox(ctx, vec2.sub(p1, offset), vec2.add(p1, offset), "#808");
		renderer.drawBox(ctx, vec2.sub(p2, offset), vec2.add(p2, offset), "#808");
		//renderer.drawCircle(ctx, p1, 2.5, 0, "#808");
		//renderer.drawCircle(ctx, p2, 2.5, 0, "#808");

		if (!body1.isStatic() || !body2.isStatic()) {
			dirtyBounds.addBounds(bounds);
		}
	}

	function onResize(e) {
		window.scrollTo(0, 0);

		fg.canvas.width = mainView.clientWidth - mainView.offsetLeft;
		fg.canvas.height = mainView.clientHeight - mainView.offsetTop;

		bg.canvas.width = fg.canvas.width;
		bg.canvas.height = fg.canvas.height;

		console.log([mainView.offsetLeft, mainView.offsetTop, mainView.clientWidth, mainView.clientHeight].join(" "));

		// Set dirtyBounds to full screen
		dirtyBounds.set(canvasToWorld(new vec2(0, canvas.height)), canvasToWorld(new vec2(canvas.width, 0)));		
		bg.outdated = true;

		fg.canvas.style.left = "0px";
		fg.canvas.style.top = "0px";		
	}

	function getMousePosition(e) {
		return new vec2(
			e.clientX + document.body.scrollLeft - mainView.offsetLeft, 
			e.clientY + document.body.scrollTop - mainView.offsetTop);
	}
		
	function onMouseDown(e) {
		mouseDown = true;

		if (mouseJoint) {
			space.removeJoint(mouseJoint);
			mouseJoint = null;
		}

		var pos = getMousePosition(e);
		var p = canvasToWorld(pos);
		var shape = space.findShapeByPoint(p, selectedShape);

		if (shape) {
			pressedShape = shape;

			if (!editMode) {
				var body = shape.body;
				
				mouseBody.p.copy(p);
				mouseJoint = new MouseJoint(mouseBody, body, p);
				mouseJoint.maxForce = 8000000;
				space.addJoint(mouseJoint);
			}
		}
		else if (/*e.metaKey*/1) {
			startMoving = true;
			mousePositionOld = pos;
		}

		e.preventDefault();
	}

	function onMouseUp(e) {		
		if (mouseJoint) {
			space.removeJoint(mouseJoint);
			mouseJoint = null;
		}		

		var pos = getMousePosition(e);
		var p = canvasToWorld(pos);
		var shape = space.findShapeByPoint(p, selectedShape);

		if (shape && pressedShape == shape) {
			selectedShape = shape;
		}
		else if (startMoving) {		
			selectedShape = null;
		}

		pressedShape = null;
		mouseDown = false;		
		startMoving = false;		

		e.preventDefault();
	}

	function onMouseMove(e) {		
		mousePosition = getMousePosition(e);

		if (mouseJoint) {
			mouseBody.p.copy(canvasToWorld(mousePosition));

			e.preventDefault();
		}
		else if (startMoving) {
			view.origin.x -= mousePosition.x - mousePositionOld.x;
			view.origin.y += mousePosition.y - mousePositionOld.y;

			//view.origin.y = Math.clamp(view.origin.y, 0, 0);			

			// Set dirtyBounds to full screen
			dirtyBounds.set(canvasToWorld(new vec2(0, canvas.height)), canvasToWorld(new vec2(canvas.width, 0)));
			bg.outdated = true;	
		
			e.preventDefault();
		}		

		mousePositionOld.x = mousePosition.x;
		mousePositionOld.y = mousePosition.y;
	}

	function onMouseLeave(e) {
		if (mouseJoint) {
			space.removeJoint(mouseJoint);
			mouseJoint = null;
		
			e.preventDefault();
		}
	}

	function onMouseWheel(e) {
		// Zoom in and out using vertical mouse wheel
		var ds = -e.wheelDeltaY * 0.001;
		var oldViewScale = view.scale;
		view.scale = Math.clamp(oldViewScale + ds, view.minScale, view.maxScale);
		ds = view.scale - oldViewScale;

		// Adjust view origin for focused zoom in and out
		// p = (1 + ds) * p - ds * p
		var p = canvasToWorld(getMousePosition(e));
		view.origin.x += p.x * ds;
		view.origin.y += p.y * ds;

		// Horizontal scroll using horizontal mouse wheel
		var dx = e.wheelDeltaX * 0.2;
		view.origin.x -= dx;

		// Clamp view origin limit
		//view.origin.y = Math.clamp(view.origin.y, 0, 0);

		// Set dirtyBounds to full screen
		dirtyBounds.set(canvasToWorld(new vec2(0, canvas.height)), canvasToWorld(new vec2(canvas.width, 0)));
		bg.outdated = true;

		e.preventDefault();		
	}

	function touchHandler(e) {
		if (e.touches.length <= 1) {
			var first = e.changedTouches[0];
			var type = {touchstart: "mousedown", touchmove: "mousemove", touchend: "mouseup"}[e.type] || "";			
			//initMouseEvent(type, canBubble, cancelable, view, clickCount, screenX, screenY, clientX, clientY, ctrlKey, altKey, shiftKey, metaKey, button, relatedTarget);
			var simulatedEvent = document.createEvent("MouseEvent");			
			simulatedEvent.initMouseEvent(type, true, true, window, 1, first.screenX, first.screenY, first.clientX, first.clientY, false, false, false, false, 0, null);
			first.target.dispatchEvent(simulatedEvent);
		}
		else {
			var handler = {touchstart: onTouchStart, touchmove: onTouchMove, touchend: onTouchEnd}[e.type];
			if (handler) {
				handler(e);
			}
		}

		e.preventDefault();
	}

	function onTouchStart(e) {
		if (mouseJoint) {
			space.removeJoint(mouseJoint);
			mouseJoint = null;
		}

		if (e.touches.length == 2) {
			touchPosOld[0] = getMousePosition(e.touches[0]);
			touchPosOld[1] = getMousePosition(e.touches[1]);
			
			e.preventDefault();
		}
	}

	function onTouchMove(e) {
		if (e.touches.length == 2) {
			var touchPos = [];

			touchPos[0] = getMousePosition(e.touches[0]);
			touchPos[1] = getMousePosition(e.touches[1]);

			var v1 = vec2.sub(touchPos[0], touchPosOld[0]);
			var v2 = vec2.sub(touchPos[1], touchPosOld[1]);

			var d1 = v1.length();
			var d2 = v2.length();

			if (d1 > 0 || d2 > 0) {
				touchScaleCenter = canvasToWorld(vec2.lerp(touchPos[0], touchPos[1], d1 / (d1 + d2)));

				var oldScale = view.scale;
				view.scale = Math.clamp(gestureScale, view.minScale, view.maxScale);
				var ds = view.scale - oldScale;
		
				view.origin.x += touchScaleCenter.x * ds;
				view.origin.y += touchScaleCenter.y * ds;

				view.origin.x -= (v1.x + v2.x) * 0.5;
				view.origin.y += (v1.y + v2.y) * 0.5;

				//view.origin.y = Math.clamp(view.origin.y, 0, 0);

				// Set dirtyBounds to full screen
				dirtyBounds.set(canvasToWorld(new vec2(0, canvas.height)), canvasToWorld(new vec2(canvas.width, 0)));
				bg.outdated = true;
			}

			touchPosOld[0] = touchPos[0];
			touchPosOld[1] = touchPos[1];			

			e.preventDefault();
		}
	}

	function onTouchEnd(e) {
		
	}

	function onGestureStart(e) {
		gestureStartScale = view.scale;

		e.preventDefault();
	}

	function onGestureChange(e) {
		var threhold = Math.clamp(e.scale - 1, -0.1, 0.1);
		gestureScale = gestureStartScale * (e.scale - threhold);

		e.preventDefault();
	}

	function onGestureEnd(e) {
	}

	function onKeyDown(e) {
		if (!e) {
			e = event;
		}

		switch (e.keyCode) {
		case 17: // Ctrl
			e.preventDefault();			
			break;
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
		case 52: // '4'
			if (editMode) {
				onClickedSelectMode(["vertex", "shape", "body", "joint"][(e.keyCode - 48) - 1]);				
			}
			break;
		case 32: // 'space'
			onClickedStep();
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

	function onClickedEnableDirtyRect() {
		enableDirtyBounds = !enableDirtyBounds;
	}

	function onClickedShowBounds() {
		showBounds = !showBounds;
	}

	function onClickedShowContacts() {
		showContacts = !showContacts;
	}

	function onClickedShowStats() {
		showStats = !showStats;
	}

	function updatePauseButton() {
		var button = document.getElementById("pause");
		button.innerHTML = pause ? "Play" : "Pause";
	}

	function updateMainToolbar() {
		var button = document.getElementById("edit");
		var elements = document.getElementsByName("selectmode");

		if (editMode) {
			button.innerHTML = "Run";

			document.getElementById("restart").style.display = "none";
			document.getElementById("pause").style.display = "none";
			document.getElementById("step").style.display = "none";

			var value = ["vertex", "shape", "body", "joint"][selectMode];

			for (var i = 0 ; i < elements.length; i++) {
				var e = elements[i];
				
				e.style.display = "inline";
				if (e.value == value) {
					if (e.className.indexOf(" pushed") == -1) {
						e.className += " pushed";
					}
				}
				else {
					e.className = e.className.replace(" pushed", "");
				}
			}
		}
		else {
			button.innerHTML = "Edit";

			document.getElementById("restart").style.display = "inline";
			document.getElementById("pause").style.display = "inline";
			document.getElementById("step").style.display = "inline";			
			
			for (var i = 0 ; i < elements.length; i++) {
				elements[i].style.display = "none";
			}			
		}		
		
		updatePauseButton();	
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

	function onClickedEdit() {
		editMode = !editMode;
		pause = false;
		step = false;
		updateMainToolbar();

		initScene();
	}

	function onClickedSelectMode(value) {
		selectMode = { vertex: SELECT_MODE_VERTEX, shape: SELECT_MODE_SHAPE, body: SELECT_MODE_BODY, joint: SELECT_MODE_JOINT }[value];
		selectedShape = null;
		selectedVertex = -1;
		selectedJoint = null;

		updateMainToolbar();
	}

	function onClickedSettings() {
		showSettings = !showSettings;

		var layout = document.getElementById("settings_layout");
		var button = document.getElementById("settings");

		if (showSettings) {
			layout.style.display = "block";
			layout.style.left = (canvas.width - layout.clientWidth) - 4 + "px";
			layout.style.top = "4px";				

			if (button.className.indexOf(" pushed") == -1) {
				button.className += " pushed";
			}
		}
		else {
			layout.style.display = "none";

			button.className = button.className.replace(" pushed", "");
		}
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
		onClickedEnableDirtyRect: onClickedEnableDirtyRect,
		onClickedShowBounds: onClickedShowBounds,
		onClickedShowContacts: onClickedShowContacts,
		onClickedShowStats: onClickedShowStats,
		onClickedRestart: onClickedRestart,
		onClickedPause: onClickedPause,
		onClickedStep: onClickedStep,
		onClickedEdit: onClickedEdit,
		onClickedSelectMode: onClickedSelectMode,
		onClickedSettings: onClickedSettings
	};
}();
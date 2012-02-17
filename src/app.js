var stats = {};

App = function() {
	var mainView;	
	var canvas;
	var fg = {};
	var bg = {};
	var renderer;
	var activeWindow = true;

	var view = { origin: new vec2(0, 0), scale: 1, minScale: 0.5, maxScale: 4.0, bounds: new Bounds, scroll: new vec2(0, 0) };
	var dirtyBounds = new Bounds; // dirty bounds in world space	
	var pause = false;
	var step = false;
	var frameCount;
	var lastTime;
	var timeDelta;
	var fps_frameCount = 0;
	var fps_time = 0;
	var fps = 0;		

	// mouse & touch variables
	var mouseDown = false;
	var mouseDownMoving = false;
	var mousePosition = new vec2;
	var mousePositionOld = new vec2;
	var mouseCursor = "default";
	var touchPosOld = new Array(2);
	var gestureStartScale;
	var gestureScale;	

	// selection mode
	var SM_VERTICES = 0;
	var SM_SHAPES = 1;
	var SM_BODIES = 2;
	var SM_JOINTS = 3;	

	// selection flag
	var SF_REPLACE = 0;
	var SF_ADDITIVE = 1;
	var SF_XOR = 2;

	// transform mode
	var TM_SELECT = 0;
	var TM_TRANSLATE = 1;
	var TM_ROTATE = 2;
	var TM_SCALE = 3;

	// editor variables
	var editMode = false;
	var selectionMode = SM_SHAPES;
	var transformMode = TM_SELECT;
	var selectedFeatureArr = [];
	var markedFeatureArr = [];	
	var highlightFeatureArr = [];
	var clickedFeature;
	var selectionColor = "rgba(255, 160, 0, 1.0)";
	var highlightColor = "rgba(255, 255, 255, 0.75)";
	var selectionPattern;
	var highlightPattern;	

	var space;
	var demoArr = [DemoCar, DemoRagDoll, DemoSeeSaw, DemoPyramid, DemoCrank, DemoRope, DemoWeb, DemoBounce];
	var sceneNameArr = [];
	var sceneIndex;
	var randomColor;
	var mouseBody;
	var mouseJoint;

	// settings variables	
	var showSettings = false;
	var gravity = new vec2(0, -627.2);	
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

		selectionPattern = createCheckPattern(selectionColor);
		highlightPattern = createCheckPattern(highlightColor);

		// Horizontal & vertical scrollbar will be hidden
		document.documentElement.style.overflowX = "hidden";
		document.documentElement.style.overflowY = "hidden";
		document.body.scroll = "no"; // ie only	

		var elements = document.getElementById("settings_layout").querySelectorAll("select, input");
		for (var i in elements) {
			elements[i].onblur = function() { window.scrollTo(0, 0); };			
		}
		
		window.addEventListener("focus", function(e) { activeWindow = true; }, false);
		window.addEventListener("blur", function(e) { activeWindow = false; }, false);
		window.addEventListener("resize", onResize, false);
		canvas.addEventListener("mousedown", onMouseDown, false);
		canvas.addEventListener("mousemove", onMouseMove, false);
		canvas.addEventListener("mouseup", onMouseUp, false);
		canvas.addEventListener("mouseleave", onMouseLeave, false);
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

		// HACK
		onResize();		

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

	function createCheckPattern(color) {
		var digits = color.match(/rgba\((\d+)\s*,\s*(\d+)\s*,\s*(\d+)\s*,\s*([\d.]+)\)/);
    
    	var r = parseInt(digits[1]);
    	var g = parseInt(digits[2]);
    	var b = parseInt(digits[3]);
    	var a = 255;

		var pattern = document.createElement("canvas");
		pattern.width = 4;
		pattern.height = 2;

		var ctx = pattern.getContext("2d");

		var imageData = ctx.getImageData(0, 0, 4, 2);

		/*for (var y = 0; y < 2; y++) {
		    for (var x = 0; x < 2; x++) {
		        if (x == y) {
		        	var index = (y * 2 + x) * 4;

		            imageData.data[index] = r;
		            imageData.data[index + 1] = g;
		            imageData.data[index + 2] = b;
		            imageData.data[index + 3] = a;
		        }
		    }
		}*/
		
		imageData.data[0] = r;
		imageData.data[1] = g;
		imageData.data[2] = b;
		imageData.data[3] = a;

		imageData.data[24 + 0] = r;
		imageData.data[24 + 1] = g;
		imageData.data[24 + 2] = b;
		imageData.data[24 + 3] = a;

		ctx.putImageData(imageData, 0, 0);

		return ctx.createPattern(pattern, "repeat");
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

		initFrame();
	}

	function initFrame() {
		frameCount = 0;
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
			return "#999";
		}

		if (!body.isAwake()) {
			return "#999";
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

		frameCount++;		
			
		// Calc frame per second
		fps_frameCount++;
		fps_time += frameTime;

		if (fps_time >= 1.0) {
			fps = fps_frameCount / fps_time;
			fps_time -= 1.0;
			fps_frameCount = 0;
		}
	}
	
	function updateScreen(frameTime) {	
		var t0 = Date.now();
		drawFrame(frameTime);
		stats.timeDrawFrame = Date.now() - t0;

		var info = document.getElementById("info");
		
		// Show statistaics
		if (showStats) {
			// Update info once per every 10 frames
			if ((frameCount % 10) == 0) {
				info.innerHTML =
					["fps:", Math.round(fps), "tm_draw:", stats.timeDrawFrame, "step_cnt:", stats.stepCount, "tm_step:", stats.timeStep, "<br />"].join(" ") +
					["tm_col:", stats.timeCollision, "tm_init_sv:", stats.timeInitSolver, "tm_vel_sv:", stats.timeVelocitySolver, "tm_pos_sv:", stats.timePositionSolver, "<br />"].join(" ") +
					["bodies:", space.numBodies, "joints:", space.numJoints, "contacts:", space.numContacts, "pos_iters:", stats.positionIterations].join(" ");
			}
		}
		else {
			info.innerHTML = "";
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
		if (enableDirtyBounds) {
			if (!dirtyBounds.isEmpty()) {
				var mins = worldToCanvas(dirtyBounds.mins);
				var maxs = worldToCanvas(dirtyBounds.maxs);
				var x = Math.max(Math.floor(mins.x), 0);
				var y = Math.max(Math.floor(maxs.y), 0);
				var w = Math.min(Math.ceil(maxs.x + 1), canvas.width) - x;
				var h = Math.min(Math.ceil(mins.y + 1), canvas.height) - y;

				// void drawImage(HTMLVideoElement image, double sx, double sy, double sw, double sh, double dx, double dy, double dw, double dh);
				fg.ctx.drawImage(bg.canvas, x, y, w, h, x, y, w, h);
			}
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
			drawEditMode(fg.ctx);			
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

	function drawBodyShapeViewTransformed(ctx, shape, fillColor, outlineColor) {
		ctx.save();
		ctx.setTransform(1, 0, 0, 1, 0, 0);

		ctx.lineWidth = view.scale;

		switch (shape.type) {
		case Shape.TYPE_CIRCLE:
			renderer.drawCircle(ctx, worldToCanvas(shape.tc), shape.r * view.scale, -shape.body.a, fillColor, outlineColor);
			break;
		case Shape.TYPE_SEGMENT:
			renderer.drawSegment(ctx, worldToCanvas(shape.ta), worldToCanvas(shape.tb), shape.r * view.scale, fillColor, outlineColor);
			break;
		case Shape.TYPE_POLY:
			var ctverts = new Array(shape.tverts.length);
			for (var i = 0; i < ctverts.length; i++) {
			 	ctverts[i] = worldToCanvas(shape.tverts[i]);
			}
			renderer.drawPolygon(ctx, ctverts, fillColor, outlineColor);
			break;
		}		

		ctx.restore();
	}

	function drawEditMode(ctx) {
		// Draw joints
		for (var i in space.jointHash) {
			drawJoint(ctx, space.jointHash[i], "#F0F");
		}
		
		if (selectionMode == SM_VERTICES) {
			// Draw vertices
			for (var i = 0; i < space.shapeArr.length; i++) {
				var shape = space.shapeArr[i];
				if (shape.visible) {
					switch (shape.type) {
					case Shape.TYPE_CIRCLE:
						dirtyBounds.addBounds(drawVertex(ctx, shape.tc, "#444"));
						break;
					case Shape.TYPE_SEGMENT:
						dirtyBounds.addBounds(drawVertex(ctx, shape.ta, "#444"));
						dirtyBounds.addBounds(drawVertex(ctx, shape.tb, "#444"));
						break;
					case Shape.TYPE_POLY:
						for (var j = 0; j < shape.tverts.length; j++) {
							drawVertex(ctx, shape.tverts[j], "#444");
						}
						dirtyBounds.addBounds(Bounds.expand(shape.bounds, 2, 2));
						break;
					}
				}				
			}

			// Draw selected vertices
			for (var i = 0; i < selectedFeatureArr.length; i++) {
				var vertex = selectedFeatureArr[i];
				var shape = space.shapeById((vertex >> 16) & 0xFFFF);
				if (shape && shape.visible) {
					var b = drawShapeVertex(ctx, shape, vertex & 0xFFFF, selectionColor);
					dirtyBounds.addBounds(b);
				}
			}

			// Draw highlighted vertex
			for (var i = 0; i < highlightFeatureArr.length; i++) {
				var vertex = highlightFeatureArr[i];
				var shape = space.shapeById((vertex >> 16) & 0xFFFF);
				if (shape && shape.visible) {
					var b = drawShapeVertex(ctx, shape, vertex & 0xFFFF, highlightColor);
					dirtyBounds.addBounds(b);
				}				
			}
		}
		else if (selectionMode == SM_SHAPES) {
			// Draw selected shapes
			for (var i = 0; i < selectedFeatureArr.length; i++) {
				var shape = selectedFeatureArr[i];
				if (shape.visible) {
					drawBodyShapeViewTransformed(ctx, shape, selectionPattern, selectionColor);
					dirtyBounds.addBounds(Bounds.expand(shape.bounds, 1, 1));
				}
			}

			// Draw highlighted shape
			for (var i = 0; i < highlightFeatureArr.length; i++) {
				var shape = highlightFeatureArr[i];
				if (shape.visible) {
					drawBodyShapeViewTransformed(ctx, shape, highlightPattern);
					dirtyBounds.addBounds(shape.bounds);
				}
			}
		}
		else if (selectionMode == SM_BODIES) {
			// Draw selected bodies
			for (var i = 0; i < selectedFeatureArr.length; i++) {
				var body = selectedFeatureArr[i];
				for (var j = 0; j < body.shapeArr.length; j++) {
					var shape = body.shapeArr[j];
					if (shape.visible) {
						drawBodyShapeViewTransformed(ctx, shape, selectionPattern, selectionColor);
						dirtyBounds.addBounds(Bounds.expand(shape.bounds, 1, 1));
					}
				}
			}

			// Draw highlighted body
			for (var i = 0; i < highlightFeatureArr.length; i++) {
				var body = highlightFeatureArr[i];
				for (var j = 0; j < body.shapeArr.length; j++) {
					var shape = body.shapeArr[j];
					if (shape.visible) {
						drawBodyShapeViewTransformed(ctx, shape, highlightPattern);
						dirtyBounds.addBounds(shape.bounds);
					}
				}
			}
		}
	}

	function drawVertex(ctx, v, color) {
		var vertex_offset = new vec2(2, 2);

		var mins = vec2.sub(v, vertex_offset);
		var maxs = vec2.add(v, vertex_offset);

		renderer.drawBox(ctx, mins, maxs, color);

		return new Bounds(mins, maxs);		
	}

	function drawShapeVertex(ctx, shape, index, color) {
		var b;
		
		switch (shape.type) {
		case Shape.TYPE_CIRCLE:
			b = drawVertex(ctx, shape.tc, color, false);
			break;
		case Shape.TYPE_SEGMENT:
			b = drawVertex(ctx, index == 0 ? shape.ta : shape.tb, color, false);
			break;
		case Shape.TYPE_POLY:
			b = drawVertex(ctx, shape.tverts[index], color, false);
			break;
		}

		return b;		
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

		fg.canvas.width = window.innerWidth - mainView.offsetLeft;
		fg.canvas.height = window.innerHeight - mainView.offsetTop;

		bg.canvas.width = fg.canvas.width;
		bg.canvas.height = fg.canvas.height;

		//console.log([mainView.offsetLeft, mainView.offsetTop, mainView.clientWidth, mainView.clientHeight].join(" "));

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

	function getFeatureByPoint(p) {
		if (selectionMode == SM_VERTICES) {
			return space.findVertexByPoint(p, 2.5, selectedFeatureArr[0]);
		}
		else if (selectionMode == SM_SHAPES) {
			return space.findShapeByPoint(p, selectedFeatureArr[0]);
		}
		else if (selectionMode == SM_BODIES) {
			var shape = space.findShapeByPoint(p, selectedFeatureArr[0]);
			if (shape) {
				return shape.body;
			}
		}
		else if (selectionMode == SM_JOINTS) {	
			return null;
		}

		return null;
	}

	function isValidFeature(feature) {
		switch (selectionMode) {
		case SM_VERTICES:
			return feature != -1 ? true : false;
		case SM_SHAPES:
			return feature ? true : false;
		case SM_BODIES:
			return feature ? true : false;
		case SM_JOINTS:
			return feature != -1 ? true : false;
		}

		console.log("invalid select mode");
		return false;
	}

	function doSelect(p, flags) {
		var feature;

		if (selectionMode == SM_VERTICES) {
			feature = space.findVertexByPoint(p, 2.5, selectedFeatureArr[0]);
			if (feature == -1) {
				return false;
			}
		}
		else if (selectionMode == SM_SHAPES) {
			feature = space.findShapeByPoint(p, selectedFeatureArr[0]);
			if (!feature) {
				return false;
			}
		}
		else if (selectionMode == SM_BODIES) {
			var shape = space.findShapeByPoint(p, selectedFeatureArr[0]);
			if (!shape) {
				return false;
			}

			feature = shape.body;
		}
		else if (selectionMode == SM_JOINTS) {	
			return false;
		}

		if (flags == SF_ADDITIVE) {
			if (selectedFeatureArr.indexOf(feature) == -1) {
				selectedFeatureArr.push(feature);
			}
		}
		else if (flags == SF_XOR) {
			if (markedFeatureArr.indexOf(feature) == -1) {
				markedFeatureArr.push(feature);
				var index = selectedFeatureArr.indexOf(feature);
				if (index == -1) {				
					selectedFeatureArr.push(feature);
				}
				else {				
					selectedFeatureArr.splice(index, 1);
				}
			}
		}
		// SF_REPLACE
		else {
			selectedFeatureArr = [];
			selectedFeatureArr.push(feature);
		}

		return true;
	}
		
	function onMouseDown(e) {
		mouseDown = true;
		mouseDownMoving = false;

		var pos = getMousePosition(e);
		var p = canvasToWorld(pos);

		if (!editMode) {
			// Remove previous mouse joint
			if (mouseJoint) {
				space.removeJoint(mouseJoint);
				mouseJoint = null;
			}

			// If we picked shape then create mouse joint
			var shape = space.findShapeByPoint(p);
			if (shape) {
				mouseBody.p.copy(p);
				mouseJoint = new MouseJoint(mouseBody, shape.body, p);
				mouseJoint.maxForce = 8000000;
				space.addJoint(mouseJoint);
			}
		}
		else {
			clickedFeature = getFeatureByPoint(p);
		}

		// for the touch device
		mousePositionOld.x = pos.x;
		mousePositionOld.y = pos.y;

		e.preventDefault();
	}

	function onMouseUp(e) {
		var pos = getMousePosition(e);
		var p = canvasToWorld(pos);

		if (!editMode) {
			if (mouseJoint) {
				space.removeJoint(mouseJoint);
				mouseJoint = null;
			}
		}
		else {
			if (transformMode == TM_SELECT) {
				if (!mouseDownMoving && !doSelect(p, e.shiftKey ? SF_ADDITIVE : (e.metaKey ? SF_XOR : SF_REPLACE))) {
					if (!e.shiftKey && !e.metaKey) {
						selectedFeatureArr = [];
					}
				}
			}
		}

		markedFeatureArr = [];
		
		mouseDown = false;
		mouseDownMoving = false;

		e.preventDefault();
	}

	function onMouseMove(e) {		
		mousePosition = getMousePosition(e);

		var dx = mousePosition.x - mousePositionOld.x;
		var dy = mousePosition.y - mousePositionOld.y;		

		highlightFeatureArr = [];

		if (mouseDown) {
			// Scroll view
			if (!isValidFeature(clickedFeature) && !e.shiftKey && !e.metaKey) {
				view.scroll.x = -(mousePosition.x - mousePositionOld.x);
				view.scroll.y = mousePosition.y - mousePositionOld.y;

				view.origin.x += view.scroll.x;
				view.origin.y += view.scroll.y;

				//view.origin.y = Math.clamp(view.origin.y, 0, 0);			

				// Set dirtyBounds to full screen
				dirtyBounds.set(canvasToWorld(new vec2(0, canvas.height)), canvasToWorld(new vec2(canvas.width, 0)));
				bg.outdated = true;
			}
		}
		
		if (!editMode) {
			if (mouseDown) {
				if (mouseJoint) {
					mouseBody.p.copy(canvasToWorld(mousePosition));
				}
			}
		}
		else {
			if (mouseDown) {
				if (transformMode == TM_SELECT) {
					if (!mouseDownMoving && !e.shiftKey && !e.metaKey) {
						selectedFeatureArr = [];
					}

					doSelect(canvasToWorld(mousePosition), e.metaKey ? SF_XOR : SF_ADDITIVE);
				}
				else if (transformMode == TM_TRANSLATE || transformMode == TM_ROTATE) {
					if (selectionMode == SM_VERTICES) {
						
					}
					else if (selectionMode == SM_SHAPES) {
						
					}
					else if (selectionMode == SM_BODIES) {
						if (isValidFeature(clickedFeature)) {
							if (selectedFeatureArr.indexOf(clickedFeature) == -1) {
								selectedFeatureArr[0] = clickedFeature;
							}
							
							for (var i = 0; i < selectedFeatureArr.length; i++) {
								var body = selectedFeatureArr[i];

								var tx = body.xf.t.x;
								var ty = body.xf.t.y;
								var ta = body.a;

								if (transformMode == TM_TRANSLATE) {
									tx += dx;
									ty -= dy;
								}
								else if (transformMode == TM_ROTATE) {
									ta -= dy * 0.01;
								}

								if (body.isStatic()) {
									dirtyBounds.addBounds(Bounds.expand(body.bounds, 1, 1));
									bg.outdated = true;
								}

								body.setTransform(tx, ty, ta);
								body.cacheData();
							}
						}
						else {
							
						}
					}
					else if (selectionMode == SM_JOINTS) {
						
					}
				}
			}
			else {
				var feature = getFeatureByPoint(canvasToWorld(mousePosition));
				if (isValidFeature(feature)) {
					highlightFeatureArr[0] = feature;
				}				
			}
		}

		mousePositionOld.x = mousePosition.x;
		mousePositionOld.y = mousePosition.y;

		if (mouseDown) {
			mouseDownMoving = true;
		}

		e.preventDefault();
	}

	function onMouseLeave(e) {
		if (mouseJoint) {
			space.removeJoint(mouseJoint);
			mouseJoint = null;
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
		case 74: // 'j'
			break;
		case 83: // 's'
			break;        		
		case 81: // 'q'
			if (editMode) {
				onClickedTransformMode("select");
			}			
			break;
		case 87: // 'w'
			if (editMode) {
				onClickedTransformMode("translate");
			}			
			break;
		case 69: // 'e'
			if (editMode) {
				onClickedTransformMode("rotate");
			}			
			break;
		case 49: // '1'
		case 50: // '2'
		case 51: // '3'
		case 52: // '4'
			if (editMode) {
				onClickedSelectMode(["vertices", "shapes", "bodies", "joints"][(e.keyCode - 48) - 1]);				
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

	function updateMainToolbar() {
		var editButton = document.getElementById("edit");
		var playerButtons = document.getElementsByName("player");
		var selectionModeButtons = document.getElementsByName("selectmode");
		var transformModeButtons = document.getElementsByName("transformmode");

		if (editMode) {
			// edit button
			editButton.innerHTML = "Run";

			// player buttons
			for (var i = 0; i < playerButtons.length; i++) {
				playerButtons[i].style.display = "none";
			}
		
			// select mode buttons
			var value = ["vertices", "shapes", "bodies", "joints"][selectionMode];
			for (var i = 0; i < selectionModeButtons.length; i++) {
				var e = selectionModeButtons[i];
				
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

			// transform mode buttons
			var value = ["select", "translate", "rotate", "scale"][transformMode];
			for (var i = 0; i < transformModeButtons.length; i++) {
				var e = transformModeButtons[i];
				
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
			// edit button
			editButton.innerHTML = "Edit";

			// player buttons
			for (var i = 0; i < playerButtons.length; i++) {
				playerButtons[i].style.display = "inline";
			}
			
			// select mode buttons
			for (var i = 0 ; i < selectionModeButtons.length; i++) {
				selectionModeButtons[i].style.display = "none";
			}

			// transform mode buttons
			for (var i = 0 ; i < transformModeButtons.length; i++) {
				transformModeButtons[i].style.display = "none";
			}			
		}		
		
		updatePauseButton();	
	}

	function updatePauseButton() {
		var button = document.getElementById("pause");
		button.innerHTML = pause ? "Play" : "Pause";
	}

	function onClickedRestart() {
		initScene();
		pause = false;
		updatePauseButton();

		return false;
	}

	function onClickedPause() {
		pause = !pause;
		updatePauseButton();

		return false;
	}

	function onClickedStep() {
		pause = true;
		step = true;
		updatePauseButton();

		return false;
	}

	function onClickedEdit() {
		editMode = !editMode;
		pause = false;
		step = false;
		selectedFeatureArr = [];
		markedFeatureArr = [];
		highlightFeatureArr = [];

		updateMainToolbar();

		if (editMode) {
			initScene();
		}
		else {
			initFrame();
		}

		return false;
	}

	function onClickedSelectMode(value) {
		selectionMode = { vertices: SM_VERTICES, shapes: SM_SHAPES, bodies: SM_BODIES, joints: SM_JOINTS }[value];
		selectedFeatureArr = [];
		markedFeatureArr = [];
		highlightFeatureArr = [];

		updateMainToolbar();

		return false;
	}

	function onClickedTransformMode(value) {
		transformMode = { select: TM_SELECT, translate: TM_TRANSLATE, rotate: TM_ROTATE, scale: TM_SCALE }[value];

		updateMainToolbar();

		return false;
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

		return false;
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
		onClickedTransformMode: onClickedTransformMode,
		onClickedSettings: onClickedSettings
	};
}();
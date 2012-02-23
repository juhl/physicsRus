var stats = {};

App = function() {
	var mainView;
	var toolbar;
	var settings;
	var canvas;
	var fg = {};
	var bg = {};
	var renderer;
	var activeWindow = true;

	var view = { origin: new vec2(0, 0), 
		scale: 1, minScale: 0.5, maxScale: 4.0, 
		bounds: new Bounds, 
		scroll: new vec2(0, 0) 
	};
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
	var mouseDownPosition = new vec2;
	var mouseCursor = "default";
	var touchPosOld = new Array(2);
	var gestureStartScale;
	var gestureScale;

	var SELECTABLE_POINT_DIST_THREHOLD = isAppleMobileDevice() ? 15 : 5;
	var SELECTABLE_LINE_DIST_THREHOLD = isAppleMobileDevice() ? 8 : 4;
	var SELECTABLE_CIRCLE_DIST_THREHOLD = isAppleMobileDevice() ? 10 : 5;	

	// selection mode
	var SM_VERTICES = 0;
	var SM_EDGES = 1;
	var SM_SHAPES = 2;
	var SM_BODIES = 3;
	var SM_JOINTS = 4;

	// selection flag
	var SF_REPLACE = 0;
	var SF_ADDITIVE = 1;
	var SF_XOR = 2;

	// transform mode
	var TM_SELECT = 0;
	var TM_TRANSLATE = 1;
	var TM_SCALE = 2;
	var TM_ROTATE = 3;

	// transform axis
	var TRANSFORM_AXIS_X = 1;
	var TRANSFORM_AXIS_Y = 2;
	var TRANSFORM_AXIS_Z = 4;
	var TRANSFORM_AXIS_XY = TRANSFORM_AXIS_X | TRANSFORM_AXIS_Y;
	var TRANSFORM_AXIS_XYZ = TRANSFORM_AXIS_XY | TRANSFORM_AXIS_Z;

	// gizmo value
	var GIZMO_RADIUS = 100;
	var GIZMO_INNER_OFFSET = 32;
	var GIZMO_INNER_RADIUS = 15;
	var GIZMO_SCALE_AXIS_BOX_EXTENT = 6;	

	// edit mode drawing value
	var HELPER_VERTEX_EXTENT = 2;
	var HELPER_JOINT_ANCHOR_EXTENT = 2.5;
	var HELPER_ANGLE_JOINT_RADIUS = 5;
	var HELPER_REVOLUTE_JOINT_RADIUS = 14;
	var HELPER_PRISMATIC_JOINT_ARROW_SIZE = 16;
	var HELPER_LINE_JOINT_RADIUS = 5;
	var HELPER_WELD_JOINT_EXTENT = 8;

	// editor variables
	var editMode = false;
	var selectionMode = SM_SHAPES;
	var transformMode = TM_SELECT;
	var snap = true;
	var selectedFeatureArr = [];
	var markedFeatureArr = [];
	var highlightFeatureArr = [];
	var clickedFeature;
	var transformCenter = new vec2(0, 0);
	var transformAxis = 0;
	var selectionColor = "rgba(255, 160, 0, 1.0)";
	var highlightColor = "rgba(220, 255, 255, 0.75)";
	var backgroundColor = "rgb(244, 244, 244)";
	var vertexColor = "#444";
	var jointAnchorColor = "#408";
	var jointHelperColor = "#80F";
	var jointHelperColor2 = "#098";	
	var selectionPattern;
	var highlightPattern;

	var space;
	var demoArr = [DemoCar, DemoRagDoll, DemoSeeSaw, DemoPyramid, DemoCrank, DemoRope, DemoWeb, DemoBounce];
	var sceneNameArr = [];
	var sceneIndex;
	var randomColor;
	var mouseBody;
	var mouseJoint;

	var showAbout = false;
	var showSettings = false;	

	// settings variables	
	var gravity = new vec2(0, -627.2);	
	var frameRateHz = 60;
	var velocityIterations = 8;
	var positionIterations = 4;
	var warmStarting = true;
	var allowSleep = true;
	var enableDirtyBounds = true;
	var showAxis = false;
	var showJoints = false;
	var showBounds = false;
	var showContacts = false;
	var showStats = false;

	function onReady() {
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
		
		addEvent(window, "focus", function(ev) { activeWindow = true; });
		addEvent(window, "blur", function(ev) { activeWindow = false; });
		addEvent(window, "resize", onResize);
		addEvent(canvas, "mousedown", onMouseDown);
		addEvent(canvas, "mousemove", onMouseMove);
		addEvent(canvas, "mouseup", onMouseUp);
		addEvent(canvas, "mouseleave", onMouseLeave);

		var eventname = (/Firefox/i.test(navigator.userAgent))? "DOMMouseScroll" : "mousewheel";
		addEvent(canvas, eventname, onMouseWheel);

		addEvent(canvas, "touchstart", touchHandler);
		addEvent(canvas, "touchmove", touchHandler);
		addEvent(canvas, "touchend", touchHandler);
		addEvent(canvas, "touchcancel", touchHandler);

		addEvent(canvas, "gesturestart", onGestureStart);
		addEvent(canvas, "gesturechange", onGestureChange);
		addEvent(canvas, "gestureend", onGestureEnd);
		addEvent(window, "orientationchange", onResize);

		// Prevent elastic scrolling on iOS
		addEvent(document.body, "touchmove", function(ev) { ev.preventDefault(); });

		addEvent(document, "keydown", onKeyDown);
		addEvent(document, "keyup", onKeyUp);
		addEvent(document, "keypress", onKeyPress);

		// Horizontal & vertical scrollbar will be hidden
		document.documentElement.style.overflowX = "hidden";
		document.documentElement.style.overflowY = "hidden";
		document.body.scroll = "no"; // ie only		

		// Setting up toolbar events
		toolbar = document.querySelector("#toolbar");
		addEvent(toolbar.querySelector("#scene"), "change", function() { onChangedScene(this.selectedIndex); });
		addEvent(toolbar.querySelector("#edit"), "click", onClickedEdit);
		var elements = toolbar.querySelectorAll("[name=player]");
		for (var i in elements) {
			addEvent(elements[i], "click", function() { return onClickedPlayer(this.value); });
		}
		var elements = toolbar.querySelectorAll("[name=selectionmode]");
		for (var i in elements) {
			addEvent(elements[i], "click", function() { return onClickedSelectMode(this.value); });
		}
		var elements = toolbar.querySelectorAll("[name=transformmode]");
		for (var i in elements) {
			addEvent(elements[i], "click", function() { return onClickedTransformMode(this.value); });
		}
		addEvent(toolbar.querySelector("#toggle_snap"), "click", onClickedSnap);
		addEvent(toolbar.querySelector("#toggle_settings"), "click", onClickedSettings);
		addEvent(toolbar.querySelector("#toggle_about"), "click", onClickedAbout);

		// Setting up settings events
		settings = document.querySelector("#settings");
		addEvent(settings.querySelector("#gravity"), "change", function() { onChangedGravity(this.value); });
		addEvent(settings.querySelector("#frameRateHz"), "change", function() { onChangedFrameRateHz(this.value); });
		addEvent(settings.querySelector("#v_iters"), "change", function() { onChangedVelocityIterations(this.value); });
		addEvent(settings.querySelector("#p_iters"), "change", function() { onChangedPositionIterations(this.value); });
		addEvent(settings.querySelector("#warmStarting"), "click", onClickedWarmStarting);
		addEvent(settings.querySelector("#allowSleep"), "click", onClickedAllowSleep);
		addEvent(settings.querySelector("#enableDirtyRect"), "click", onClickedEnableDirtyRect);				
		addEvent(settings.querySelector("#showAxis"), "click", onClickedShowAxis);
		addEvent(settings.querySelector("#showJoints"), "click", onClickedShowJoints);
		addEvent(settings.querySelector("#showBounds"), "click", onClickedShowBounds);
		addEvent(settings.querySelector("#showContacts"), "click", onClickedShowContacts);
		addEvent(settings.querySelector("#showStats"), "click", onClickedShowStats);
		var elements = settings.querySelectorAll("select, input");
		for (var i in elements) {
			addEvent(elements[i], "blur", function() { window.scrollTo(0, 0); });
		}

		updateToolbar();
	}	

	function onLoad() {
		// Add scenes from demos
		var combobox = toolbar.querySelector("#scene");
		for (var i = 0; i < demoArr.length; i++) {
			var option = document.createElement("option");
			var name = demoArr[i].name();
			option.text = name;
			option.value = name;
			combobox.add(option);
			sceneNameArr.push(name);
		}
/*
		// Add scenes from list of JSON files from server
		httpGetText("scene.rb?action=list", false, function(text) { 
			text.replace(/\s*(.+?\.json)/g, function($0, filename) {
				var option = document.createElement("option");
				option.text = filename;
				option.value = filename;
				combobox.add(option);
				sceneNameArr.push(filename);
			});
		});*/

		sceneIndex = 0;
		combobox.selectedIndex = sceneIndex;

		// HACK
		onResize();

		renderer = RendererCanvas;

		selectionPattern = createCheckPattern(selectionColor);
		highlightPattern = createCheckPattern(highlightColor);

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

		if (window.requestAnimFrame) {
			window.requestAnimFrame(function() { window.requestAnimFrame(arguments.callee); runFrame(); });
		}
		else {
			window.setInterval(runFrame, parseInt(1000 / 60));
		}
	}

	function updateToolbar() {
		var editButton = toolbar.querySelector("#edit");
		var snapButton = toolbar.querySelector("#toggle_snap");
		var playerSpan = toolbar.querySelector("#player");
		var selectionModeSpan = toolbar.querySelector("#selectionmode");
		var transformModeSpan = toolbar.querySelector("#transformmode");
		var selectionModeButtons = toolbar.querySelectorAll("#selectionmode > [name=selectionmode]");
		var transformModeButtons = toolbar.querySelectorAll("#transformmode > [name=transformmode]");		

		if (editMode) {
			// show / hide
			playerSpan.style.display = "none";
			selectionModeSpan.style.display = "inline";
			transformModeSpan.style.display = "inline";
			snapButton.style.display = "inline";

			// edit button
			editButton.innerHTML = "Run";			
		
			// selection mode buttons
			var value = ["vertices", "edges", "shapes", "bodies", "joints"][selectionMode];
			for (var i = 0; i < selectionModeButtons.length; i++) {
				var e = selectionModeButtons[i];
								
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
			var value = ["select", "translate", "scale", "rotate"][transformMode];
			for (var i = 0; i < transformModeButtons.length; i++) {
				var e = transformModeButtons[i];
				
				if (e.value == value) {
					if (e.className.indexOf(" pushed") == -1) {
						e.className += " pushed";
					}
				}
				else {
					e.className = e.className.replace(" pushed", "");
				}
			}
			
			if (snap) {
				if (snapButton.className.indexOf(" pushed") == -1) {
					snapButton.className += " pushed";
				}
			}
			else {
				snapButton.className = snapButton.className.replace(" pushed", "");
			}
		}
		else {
			// show / hide
			playerSpan.style.display = "inline";
			selectionModeSpan.style.display = "none";
			transformModeSpan.style.display = "none";
			snapButton.style.display = "none";

			// edit button
			editButton.innerHTML = "Edit";
		}

		updatePauseButton();
	}

	function updatePauseButton() {
		var button = toolbar.querySelector("#player > [value=pause]");
		button.innerHTML = pause ? "<i class='icon-white icon-play'></i>" : "<i class='icon-white icon-pause'></i>";
	}

	function createCheckPattern(color) {		
		var c = Color.parse(color);
    	var r = c.channels[0];
    	var g = c.channels[1];
    	var b = c.channels[2];
    	var a = 255;

		var pattern = document.createElement("canvas");
		pattern.width = 4;
		pattern.height = 2;

		var ctx = pattern.getContext("2d");

		var imageData = ctx.getImageData(0, 0, 4, 2);

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
			return "#777";
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

		if (activeWindow) {			
			if (!editMode) {
				if (!mouseDown) {
					var p = canvasToWorld(mousePosition);
					var shape = space.findShapeByPoint(p);
					mouseCursor = shape ? "pointer" : "default";
				}
			}
			else {
				if (!mouseDownMoving) {
					checkHighlight(mousePosition);

					mouseCursor = "default";
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
					["fps:", fps.toFixed(1), "tm_draw:", stats.timeDrawFrame, "step_cnt:", stats.stepCount, "tm_step:", stats.timeStep, "<br />"].join(" ") +
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

			body.visible = false;

			for (var j = 0; j < body.shapeArr.length; j++) {
				var shape = body.shapeArr[j];
				var bounds = new Bounds(shape.bounds.mins, shape.bounds.maxs);
				if (view.bounds.intersectsBounds(bounds)) {
					shape.visible = true;
					body.visible = true;
				}
				else {
					shape.visible = false;
				}
			}
		}

		// Update whole background canvas if we needed
		if (bg.outdated) {
			bg.outdated = false;
			bg.ctx.fillStyle = backgroundColor;
			bg.ctx.fillRect(0, 0, canvas.width, canvas.height);

			bg.ctx.save();
			bg.ctx.setTransform(view.scale, 0, 0, -view.scale, canvas.width * 0.5 - view.origin.x, canvas.height + view.origin.y);
			
			if (editMode) {
				drawGrids(bg.ctx, 64, "#BBB");
			}			
			else {
				// Draw static bodies
				for (var i in space.bodyHash) {
					var body = space.bodyHash[i];
					if (body.isStatic()) {
						drawBody(bg.ctx, body, 1, "#000", bodyColor(body));
					}
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
				
				if (x >= 0 && y >= 0 && w > 0 && h > 0) {
					// void drawImage(HTMLVideoElement image, double sx, double sy, double sw, double sh, double dx, double dy, double dw, double dh);
					fg.ctx.drawImage(bg.canvas, x, y, w, h, x, y, w, h);
				}
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

		//renderer.drawRect(fg.ctx, dirtyBounds.mins, dirtyBounds.maxs, 1, "#00F");

		dirtyBounds.clear();

		// Draw bodies except for static bodies
		for (var i in space.bodyHash) {
			var body = space.bodyHash[i];
			if (editMode || (!editMode && !body.isStatic())) {
				drawBody(fg.ctx, body, 1, "#000", bodyColor(body));
				dirtyBounds.addBounds(Bounds.expand(body.bounds, 2, 2));
			}			
		}
		
		// Draw joints
		if (!editMode) {
			if (showAxis) {
				for (var i in space.bodyHash) {
					drawBodyAxis(fg.ctx, body);
				}
			}

			if (showJoints) {
				for (var i in space.jointHash) {
					drawJoint(fg.ctx, space.jointHash[i]);
				}
			}			
		}		
		else {
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
					
					renderer.drawRect(fg.ctx, mins, maxs, 1, "", "#F00");
					dirtyBounds.addBounds2(mins, maxs);					
					//renderer.drawArrow(fg.ctx, con.p, vec2.add(con.p, vec2.scale(con.n, con.d)), ARROW_TYPE_NONE, ARROW_TYPE_NORMAL, 8, 1, "#F00");
					//dirtyBounds.addBounds2();
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
			renderer.drawLine(ctx, v1, v2, 0.75 / view.scale, gridColor);
		}

		v1.set(start_x, start_y);
		v2.set(end_x, start_y);

		for (var y = start_y; y <= end_y; y += gridSize) {
			v1.y = y;
			v2.y = y;
			renderer.drawLine(ctx, v1, v2, 0.75 / view.scale, gridColor);
		}
	}

	function drawBodyAxis(ctx, body) {
		if (body.visible) {
			var rvec = body.xf.rotate(new vec2(12, 0));
			renderer.drawLine(ctx, body.xf.t, vec2.add(body.xf.t, rvec), 1, "#F00");
			renderer.drawLine(ctx, body.xf.t, vec2.add(body.xf.t, vec2.perp(rvec)), 1, "#0F0");
		}
	}

	function drawBody(ctx, body, lineWidth, outlineColor, fillColor) {
		for (var i = 0; i < body.shapeArr.length; i++) {
			var shape = body.shapeArr[i];
			if (!shape.visible) {
				continue;
			}			

			drawBodyShape(ctx, shape, lineWidth, outlineColor, fillColor);

			if (showBounds || !body.isStatic()) {
				if (showBounds) {
					var bounds = new Bounds(shape.bounds.mins, shape.bounds.maxs);
					bounds.expand(1, 1);
					renderer.drawRect(ctx, shape.bounds.mins, bounds.maxs, lineWidth, "#0A0");
				}				
			}
		}
	}

	function drawBodyShape(ctx, shape, lineWidth, outlineColor, fillColor) {
		switch (shape.type) {
		case Shape.TYPE_CIRCLE:
			renderer.drawCircle(ctx, shape.tc, shape.r, shape.body.a, lineWidth, outlineColor, fillColor);
			break;
		case Shape.TYPE_SEGMENT:
			renderer.drawSegment(ctx, shape.ta, shape.tb, shape.r, lineWidth, outlineColor, fillColor);
			break;
		case Shape.TYPE_POLY:
			renderer.drawPolygon(ctx, shape.tverts, lineWidth, !shape.convexity ? "#F00" : outlineColor, fillColor);
			break;
		}
	}

	function drawBodyShapeViewTransformed(ctx, shape, lineWidth, outlineColor, fillColor) {
		ctx.save();
		ctx.setTransform(1, 0, 0, 1, 0, 0);

		ctx.lineWidth = view.scale;

		switch (shape.type) {
		case Shape.TYPE_CIRCLE:
			renderer.drawCircle(ctx, worldToCanvas(shape.tc), shape.r * view.scale, -shape.body.a, lineWidth, outlineColor, fillColor);
			break;
		case Shape.TYPE_SEGMENT:
			renderer.drawSegment(ctx, worldToCanvas(shape.ta), worldToCanvas(shape.tb), shape.r * view.scale, lineWidth, outlineColor, fillColor);
			break;
		case Shape.TYPE_POLY:
			var ctverts = new Array(shape.tverts.length);
			for (var i = 0; i < ctverts.length; i++) {
			 	ctverts[i] = worldToCanvas(shape.tverts[i]);
			}
			renderer.drawPolygon(ctx, ctverts, lineWidth, outlineColor, fillColor);
			break;
		}		

		ctx.restore();
	}

	function drawGizmo(ctx) {
		ctx.save();
		ctx.setTransform(1, 0, 0, 1, 0, 0);

		var center = worldToCanvas(transformCenter);		

		var extent = new vec2(GIZMO_RADIUS / view.scale, GIZMO_RADIUS / view.scale);
		var mins = vec2.sub(transformCenter, extent);
		var maxs = vec2.add(transformCenter, extent);
		var bounds = new Bounds(mins, maxs);
		bounds.expand(4, 4); // expand for outline

		if (transformMode == TM_TRANSLATE) {
			var p1 = vec2.add(center, new vec2(GIZMO_RADIUS, 0));
			var p2 = vec2.add(center, new vec2(0, -GIZMO_RADIUS));

			var s1 = vec2.add(center, new vec2(GIZMO_INNER_OFFSET, 0));
			var s2 = vec2.add(center, new vec2(0, -GIZMO_INNER_OFFSET));

			var x_color = transformAxis == TRANSFORM_AXIS_X ? "#FA0" : "#F00";
			var y_color = transformAxis == TRANSFORM_AXIS_Y ? "#FA0" : "#0F0";

			renderer.drawArrow(ctx, s1, p1, ARROW_TYPE_NONE, ARROW_TYPE_NORMAL, 16, 2, x_color, x_color);
			renderer.drawArrow(ctx, s2, p2, ARROW_TYPE_NONE, ARROW_TYPE_NORMAL, 16, 2, y_color, y_color);
			
			var mins = vec2.sub(center, new vec2(GIZMO_INNER_RADIUS, -GIZMO_INNER_RADIUS));
			var maxs = vec2.add(center, new vec2(GIZMO_INNER_RADIUS, -GIZMO_INNER_RADIUS));

			var color1 = transformAxis == TRANSFORM_AXIS_XY ? "#FA0" : "#FF0";
			var color2 = Color.parse(color1); color2.channels[3] = 0.4;

			renderer.drawRect(ctx, mins, maxs, 0, color1, color2.rgba());
		}
		else if (transformMode == TM_SCALE) {
			var p1 = vec2.add(center, new vec2(GIZMO_RADIUS, 0));
			var p2 = vec2.add(center, new vec2(0, -GIZMO_RADIUS));

			var s1 = vec2.add(center, new vec2(GIZMO_INNER_OFFSET, 0));
			var s2 = vec2.add(center, new vec2(0, -GIZMO_INNER_OFFSET));			

			var x_color = transformAxis == TRANSFORM_AXIS_X ? "#FA0" : "#F00";
			var y_color = transformAxis == TRANSFORM_AXIS_Y ? "#FA0" : "#0F0";

			renderer.drawArrow(ctx, s1, p1, ARROW_TYPE_NONE, ARROW_TYPE_BOX, GIZMO_SCALE_AXIS_BOX_EXTENT, 2, x_color, x_color);
			renderer.drawArrow(ctx, s2, p2, ARROW_TYPE_NONE, ARROW_TYPE_BOX, GIZMO_SCALE_AXIS_BOX_EXTENT, 2, y_color, y_color);

			var color1 = transformAxis == TRANSFORM_AXIS_XY ? "#FA0" : "#FF0";
			var color2 = Color.parse(color1); color2.channels[3] = 0.4;
			
			renderer.drawCircle(ctx, center, GIZMO_INNER_RADIUS, undefined, 2, color1, color2.rgba());

			var extent = (GIZMO_SCALE_AXIS_BOX_EXTENT + 2) / view.scale;
			bounds.addExtents(canvasToWorld(p1), extent, extent);
			bounds.addExtents(canvasToWorld(p2), extent, extent);
		}
		else if (transformMode == TM_ROTATE) {
			var color = transformAxis & TRANSFORM_AXIS_Z ? "#FA0" : "#00F";

			renderer.drawCircle(ctx, center, 2, undefined, 0, "", color);
			renderer.drawCircle(ctx, center, GIZMO_RADIUS, undefined, 2, color);
			
			if (mouseDownMoving && transformAxis & TRANSFORM_AXIS_Z) {
				var r = vec2.scale(vec2.normalize(vec2.sub(mousePosition, center)), GIZMO_RADIUS);
				var p = vec2.add(center, r);
				renderer.drawLine(ctx, center, p, 2, "#F55");
			}			
		}

		//renderer.drawDashLine(ctx, vec2.sub(center, new vec2(15, 0)), vec2.add(center, new vec2(15, 0)), 1, 20, "#00F");
		//renderer.drawDashLine(ctx, vec2.sub(center, new vec2(0, 15)), vec2.add(center, new vec2(0, 15)), 1, 20, "#00F");			

		dirtyBounds.addBounds(bounds);

		ctx.restore();
	}	

	function drawEditMode(ctx) {
		for (var i in space.bodyHash) {
			drawBodyAxis(ctx, space.bodyHash[i]);
		}

		if (selectionMode == SM_VERTICES || selectionMode == SM_EDGES) {
			// Draw vertices
			for (var i in space.bodyHash) {
				var body = space.bodyHash[i];

				for (var j = 0; j < body.shapeArr.length; j++) {
					var shape = body.shapeArr[j];
					if (shape.visible) {
						switch (shape.type) {
						case Shape.TYPE_CIRCLE:
							drawVertex(ctx, shape.tc, vertexColor);
							dirtyBounds.addExtents(shape.tc, HELPER_VERTEX_EXTENT, HELPER_VERTEX_EXTENT);
							break;
						case Shape.TYPE_SEGMENT:
							drawVertex(ctx, shape.ta, vertexColor);
							drawVertex(ctx, shape.tb, vertexColor);
							dirtyBounds.addExtents(shape.ta, HELPER_VERTEX_EXTENT, HELPER_VERTEX_EXTENT);
							dirtyBounds.addExtents(shape.ta, HELPER_VERTEX_EXTENT, HELPER_VERTEX_EXTENT);
							break;
						case Shape.TYPE_POLY:
							for (var k = 0; k < shape.tverts.length; k++) {
								drawVertex(ctx, shape.tverts[k], vertexColor);
							}
							dirtyBounds.addBounds(Bounds.expand(shape.bounds, HELPER_VERTEX_EXTENT, HELPER_VERTEX_EXTENT));
							break;
						}
					}
				}
			}
		}

		if (selectionMode == SM_VERTICES) {			
			// Draw selected vertices
			for (var i = 0; i < selectedFeatureArr.length; i++) {
				var vertex = selectedFeatureArr[i];
				var shape = space.shapeById((vertex >> 16) & 0xFFFF);
				if (shape && shape.visible) {
					var index = vertex & 0xFFFF;
					var p = drawShapeVertex(ctx, shape, index, selectionColor);
					dirtyBounds.addExtents(p, HELPER_VERTEX_EXTENT, HELPER_VERTEX_EXTENT);
				}
			}

			// Draw highlighted vertex			
			for (var i = 0; i < highlightFeatureArr.length; i++) {
				var vertex = highlightFeatureArr[i];
				var shape = space.shapeById((vertex >> 16) & 0xFFFF);
				if (shape && shape.visible) {
					var index = vertex & 0xFFFF;
					var p = drawShapeVertex(ctx, shape, index, highlightColor);
					dirtyBounds.addExtents(p, HELPER_VERTEX_EXTENT, HELPER_VERTEX_EXTENT);
				}				
			}
		}
		else if (selectionMode == SM_EDGES) {
			// Draw selected edges
			for (var i = 0; i < selectedFeatureArr.length; i++) {
				var edge = selectedFeatureArr[i];
				var shape = space.shapeById((edge >> 16) & 0xFFFF);
				if (shape && shape.visible) {
					var index1 = edge & 0xFFFF;
					var index2 = (index1 + 1) % shape.tverts.length;
					var v1 = shape.tverts[index1];
					var v2 = shape.tverts[index2];

			 		renderer.drawLine(ctx, v1, v2, 1.5, selectionColor);
			 		drawShapeVertex(ctx, shape, index1, selectionColor);
			 		drawShapeVertex(ctx, shape, index2, selectionColor);

					dirtyBounds.addPoint(v1);
					dirtyBounds.addPoint(v2);
				}
			}

			// Draw highlighted edges
			for (var i = 0; i < highlightFeatureArr.length; i++) {
				var edge = highlightFeatureArr[i];
				var shape = space.shapeById((edge >> 16) & 0xFFFF);
				if (shape && shape.visible) {
					var index1 = edge & 0xFFFF;
					var index2 = (index1 + 1) % shape.tverts.length;
					var v1 = shape.tverts[index1];
					var v2 = shape.tverts[index2];

			 		renderer.drawLine(ctx, v1, v2, 1.5, highlightColor);
			 		drawShapeVertex(ctx, shape, index1, highlightColor);
			 		drawShapeVertex(ctx, shape, index2, highlightColor);
					
					dirtyBounds.addPoint(v1);
					dirtyBounds.addPoint(v2);
				}
			}
		}
		else if (selectionMode == SM_SHAPES) {
			// Draw selected shapes
			for (var i = 0; i < selectedFeatureArr.length; i++) {
				var shape = selectedFeatureArr[i];
				if (shape.visible) {
					drawBodyShapeViewTransformed(ctx, shape, 1, selectionColor, selectionPattern);
					dirtyBounds.addBounds(Bounds.expand(shape.bounds, 2, 2));
				}
			}

			// Draw highlighted shape
			for (var i = 0; i < highlightFeatureArr.length; i++) {
				var shape = highlightFeatureArr[i];
				if (shape.visible) {
					drawBodyShapeViewTransformed(ctx, shape, 1, "", highlightPattern);
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
						drawBodyShapeViewTransformed(ctx, shape, 1, selectionColor, selectionPattern);
						dirtyBounds.addBounds(Bounds.expand(shape.bounds, 2, 2));
					}
				}
			}

			// Draw highlighted body
			for (var i = 0; i < highlightFeatureArr.length; i++) {
				var body = highlightFeatureArr[i];
				for (var j = 0; j < body.shapeArr.length; j++) {
					var shape = body.shapeArr[j];
					if (shape.visible) {
						drawBodyShapeViewTransformed(ctx, shape, 1, "", highlightPattern);
						dirtyBounds.addBounds(shape.bounds);
					}
				}
			}
		}
		else if (selectionMode == SM_JOINTS) {
			for (var i in space.jointHash) {
				drawJoint(ctx, space.jointHash[i]);
			}
		}

		if (transformMode != TM_SELECT && selectedFeatureArr.length > 0) {
			drawGizmo(ctx);
		}
	}

	function drawVertex(ctx, p, color) {
		var extent = new vec2(HELPER_VERTEX_EXTENT, HELPER_VERTEX_EXTENT);
		var mins = vec2.sub(p, extent);
		var maxs = vec2.add(p, extent);

		renderer.drawRect(ctx, mins, maxs, 1, "", color);
	}

	function drawShapeVertex(ctx, shape, index, color) {
		var p;

		switch (shape.type) {
		case Shape.TYPE_CIRCLE:
			p = shape.tc;
			break;
		case Shape.TYPE_SEGMENT:
			p = index == 0 ? shape.ta : shape.tb;
			return 
		case Shape.TYPE_POLY:
			p = shape.tverts[index];
			break;
		}

		drawVertex(ctx, p, color, false);
		return p;
	}

	function drawJoint(ctx, joint) {
		var body1 = joint.body1;
		var body2 = joint.body2;

		var bounds = new Bounds;

		if (joint instanceof AngleJoint) {
			var color = Color.parse(jointHelperColor2);
			color.channels[3] = 0.2;

			renderer.drawCircle(ctx, body1.p, HELPER_ANGLE_JOINT_RADIUS, body1.a, 1, jointHelperColor2, color.rgba());
			renderer.drawCircle(ctx, body2.p, HELPER_ANGLE_JOINT_RADIUS, body2.a, 1, jointHelperColor2, color.rgba());

			renderer.drawCircle(ctx, body1.p, HELPER_JOINT_ANCHOR_EXTENT, undefined, 1, "", jointAnchorColor);
			renderer.drawCircle(ctx, body2.p, HELPER_JOINT_ANCHOR_EXTENT, undefined, 1, "", jointAnchorColor);

			bounds.addExtents(body1.p, HELPER_ANGLE_JOINT_RADIUS, HELPER_ANGLE_JOINT_RADIUS);
			bounds.addExtents(body2.p, HELPER_ANGLE_JOINT_RADIUS, HELPER_ANGLE_JOINT_RADIUS);
		}
		else if (joint instanceof MouseJoint) {
			var p2 = body2.getWorldPoint(joint.anchor2);
			renderer.drawLine(ctx, mouseBody.p, p2, 1, "#F28");
			
			bounds.addPoint(mouseBody.p);
			bounds.addPoint(p2);
		}
		else {
			var p1 = body1.getWorldPoint(joint.anchor1);
			var p2 = body2.getWorldPoint(joint.anchor2);		

			if (!body1.isStatic()) {
				renderer.drawLine(ctx, body1.xf.t, p1, 2, jointHelperColor);
			}

			if (!body2.isStatic()) {
				renderer.drawLine(ctx, body2.xf.t, p2, 2, jointHelperColor);
			}

			if (joint instanceof DistanceJoint) {
				renderer.drawLine(ctx, p1, p2, 1, jointHelperColor2);
			}
			else if (joint instanceof RevoluteJoint) {
				var color = Color.parse(jointHelperColor2);
				color.channels[3] = 0.2;

				if (joint.limitEnabled) {
					var a1 = body1.a + joint.limitLowerAngle;
					var a2 = body1.a + joint.limitUpperAngle;

					renderer.drawArc(ctx, p1, HELPER_REVOLUTE_JOINT_RADIUS, a1, a2, 1, jointHelperColor2, color.rgba());
				}
				else {
					renderer.drawCircle(ctx, p1, HELPER_REVOLUTE_JOINT_RADIUS, undefined, 1, jointHelperColor2, color.rgba());
				}

				renderer.drawLine(ctx, p1, vec2.add(p2, vec2.scale(vec2.rotation(body2.a), HELPER_REVOLUTE_JOINT_RADIUS)), 2, "#F08");

				bounds.addExtents(p1, HELPER_REVOLUTE_JOINT_RADIUS, HELPER_REVOLUTE_JOINT_RADIUS);
			}
			else if (joint instanceof LineJoint) {
				var color = Color.parse(jointHelperColor2);
				color.channels[3] = 0.2;
				renderer.drawArrow(ctx, p1, p2, ARROW_TYPE_CIRCLE, ARROW_TYPE_CIRCLE, HELPER_LINE_JOINT_RADIUS, 1, jointHelperColor2, color.rgba());

				bounds.addExtents(p1, HELPER_LINE_JOINT_RADIUS, HELPER_LINE_JOINT_RADIUS);
				bounds.addExtents(p2, HELPER_LINE_JOINT_RADIUS, HELPER_LINE_JOINT_RADIUS);
			}
			else if (joint instanceof PrismaticJoint) {
				renderer.drawArrow(ctx, p1, p2, ARROW_TYPE_NORMAL, ARROW_TYPE_NORMAL, HELPER_PRISMATIC_JOINT_ARROW_SIZE, 1, jointHelperColor2, jointHelperColor2);

				bounds.addExtents(p1, HELPER_PRISMATIC_JOINT_ARROW_SIZE, HELPER_PRISMATIC_JOINT_ARROW_SIZE);
				bounds.addExtents(p2, HELPER_PRISMATIC_JOINT_ARROW_SIZE, HELPER_PRISMATIC_JOINT_ARROW_SIZE);
			}
			else if (joint instanceof WeldJoint) {
				var color = Color.parse(jointHelperColor2);
				color.channels[3] = 0.2;

				var rvec = vec2.rotate(new vec2(HELPER_WELD_JOINT_EXTENT, 0), body1.a);
				var uvec = vec2.rotate(new vec2(0, HELPER_WELD_JOINT_EXTENT), body1.a);

				renderer.drawBox(ctx, p1, rvec, uvec, 1, jointHelperColor2, color.rgba());

				bounds.addExtents(p1, HELPER_WELD_JOINT_EXTENT, HELPER_WELD_JOINT_EXTENT);
			}

			renderer.drawCircle(ctx, p1, HELPER_JOINT_ANCHOR_EXTENT, undefined, 1, "", jointAnchorColor);
			renderer.drawCircle(ctx, p2, HELPER_JOINT_ANCHOR_EXTENT, undefined, 1, "", jointAnchorColor);

			bounds.addExtents(p1, HELPER_JOINT_ANCHOR_EXTENT, HELPER_JOINT_ANCHOR_EXTENT);
			bounds.addExtents(p2, HELPER_JOINT_ANCHOR_EXTENT, HELPER_JOINT_ANCHOR_EXTENT);
		}		

		if (!body1.isStatic() || !body2.isStatic()) {
			bounds.expand(2, 2);
			dirtyBounds.addBounds(bounds);
		}
	}

	function onResize(ev) {
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

	function getMousePosition(ev) {
		return new vec2(
			ev.clientX + document.body.scrollLeft - mainView.offsetLeft, 
			ev.clientY + document.body.scrollTop - mainView.offsetTop);
	}

	function getFeatureByPoint(p) {
		if (selectionMode == SM_VERTICES) {
			return space.findVertexByPoint(p, SELECTABLE_POINT_DIST_THREHOLD, selectedFeatureArr[0]);
		}
		else if (selectionMode == SM_EDGES) {
			return space.findEdgeByPoint(p, SELECTABLE_LINE_DIST_THREHOLD, selectedFeatureArr[0]);
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
			var shape = space.findShapeByPoint(p);
			/*if (shape) {
				shape.body.findJointByPoint(p);
				for (var i in shape.body.jointHash)) {
					var joint = shape.body.jointHash[i];					
					if (refVertex == -1) {
						return vertex;
					}

					if (firstVertex == -1) {
						firstVertex = vertex;
					}

					if (vertex == refVertex) {
						refVertex = -1;
					}		
				}
			}*/
		}

		return null;
	}

	function isValidFeature(feature) {
		switch (selectionMode) {
		case SM_VERTICES:
			return feature != -1 ? true : false;
		case SM_EDGES:
			return feature != -1 ? true : false;
		case SM_SHAPES:
			return feature ? true : false;
		case SM_BODIES:
			return feature ? true : false;
		case SM_JOINTS:
			return feature ? true : false;
		}

		console.log("invalid select mode");
		return false;
	}

	function doSelect(p, flags) {
		var feature;

		if (selectionMode == SM_VERTICES) {
			var vertex = space.findVertexByPoint(p, SELECTABLE_POINT_DIST_THREHOLD, selectedFeatureArr[0]);
			if (vertex == -1) {
				return false;
			}

			feature = vertex;		
		}
		else if (selectionMode == SM_EDGES) {
			var edge = space.findEdgeByPoint(p, SELECTABLE_LINE_DIST_THREHOLD, selectedFeatureArr[0]);
			if (edge == -1) {
				return false;
			}
			
			feature = edge;			
		}
		else if (selectionMode == SM_SHAPES) {
			var shape = space.findShapeByPoint(p, selectedFeatureArr[0]);
			if (!shape) {
				return false;
			}

			feature = shape;		
		}
		else if (selectionMode == SM_BODIES) {
			var shape = space.findShapeByPoint(p, selectedFeatureArr[0]);
			if (!shape) {
				return false;
			}

			feature = shape.body;		
		}
		else if (selectionMode == SM_JOINTS) {	
			/*var shape = space.findShapeByPoint(p);
			if (!shape || isEmptyObject(shape.body.jointHash)) {
				return false;
			}

			var joint = shape.body.jointHash[0];
			feature = joint;*/		
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

	function resetTransformCenter() {
		if (selectionMode == SM_VERTICES) {
			var center = new vec2(0, 0);

			for (var i = 0; i < selectedFeatureArr.length; i++) {
				var vertex = selectedFeatureArr[i];
				var shape = space.shapeById((vertex >> 16) & 0xFFFF);
				var index = vertex & 0xFFFF;
				var v = shape.tverts[index];

				center.addself(v);
			}

			center.scale(1 / selectedFeatureArr.length);
			transformCenter.copy(center);
		}
		else if (selectionMode == SM_EDGES) {
			var center = new vec2(0, 0);

			for (var i = 0; i < selectedFeatureArr.length; i++) {
				var edge = selectedFeatureArr[i];
				var shape = space.shapeById((edge >> 16) & 0xFFFF);
				var index1 = edge & 0xFFFF;
				var index2 = (index1 + 1) % shape.tverts.length;
				var v1 = shape.tverts[index1];
				var v2 = shape.tverts[index2];

				center.addself(vec2.lerp(v1, v2, 0.5));
			}
			
			center.scale(1 / selectedFeatureArr.length);
			transformCenter.copy(center);
		}
		else if (selectionMode == SM_SHAPES) {
			var center = new vec2(0, 0);

			for (var i = 0; i < selectedFeatureArr.length; i++) {
				var shape = selectedFeatureArr[i];
				var c = shape.body.getWorldPoint(shape.centroid());

				center.addself(c);
			}

			center.scale(1 / selectedFeatureArr.length);
			transformCenter.copy(center);
		}
		else if (selectionMode == SM_BODIES) {		
			var center = new vec2(0, 0);

			for (var i = 0; i < selectedFeatureArr.length; i++) {
				var shape = selectedFeatureArr[i];

				center.addself(shape.body.xf.t);
			}

			center.scale(1 / selectedFeatureArr.length);
			transformCenter.copy(center);
		}
	}

	function getShapeVertex(shape, index) {
		if (shape.type == Shape.TYPE_CIRCLE && index == 0) {
			return shape.tc;
		}
		
		if (shape.type == Shape.TYPE_SEGMENT && (index == 0 || index == 1)) {
			if (index == 0) {
				return shape.ta;
			}
			return shape.tb;
		}
		
		if (shape.type == Shape.TYPE_POLY && index >= 0) {
			index = index % shape.tverts.length;
			if (index < 0) {
				index += shape.tverts.length;
			}
			return shape.tverts[index];
		}

		console.log("invalid vertex index: " + index);		
	}

	function setShapeVertex(shape, index, v) {
		var body = shape.body;

		if (shape.type == Shape.TYPE_CIRCLE && index == 0) {
			shape.c.copy(body.getLocalPoint(v));
			return;
		}
		
		if (shape.type == Shape.TYPE_SEGMENT && (index == 0 || index == 1)) {
			if (index == 0) {
				shape.a.copy(body.getLocalPoint(v));
				return;
			}
			shape.b.copy(body.getLocalPoint(v));
			return;
		}
		
		if (shape.type == Shape.TYPE_POLY && index >= 0) {
			index = index % shape.tverts.length;
			if (index < 0) {
				index += shape.tverts.length;
			}
			shape.verts[index].copy(body.getLocalPoint(v));
			return;
		}

		console.log("invalid vertex index: " + index);
	}
		
	function onMouseDown(ev) {
		mouseDown = true;
		mouseDownMoving = false;

		var pos = getMousePosition(ev);
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
				mouseJoint.maxForce = shape.body.m * 20000;
				space.addJoint(mouseJoint);
			}
		}
		else {
			clickedFeature = getFeatureByPoint(p);
		}

		// for the touch device
		mousePositionOld.x = pos.x;
		mousePositionOld.y = pos.y;

		mousePosition.x = pos.x;
		mousePosition.y = pos.y;

		mouseDownPosition.x = pos.x;
		mouseDownPosition.y = pos.x;

		ev.preventDefault();
	}

	function onMouseUp(ev) {
		var pos = getMousePosition(ev);
		var p = canvasToWorld(pos);

		if (!editMode) {
			if (mouseJoint) {
				space.removeJoint(mouseJoint);
				mouseJoint = null;
			}
		}
		else {
			if (mouseDown && !mouseDownMoving) {
				if (transformMode == TM_SELECT) {
					var flag = ev.shiftKey ? SF_ADDITIVE : (ev.metaKey ? SF_XOR : SF_REPLACE);

					if (!doSelect(p, flag) && flag == SF_REPLACE) {
						selectedFeatureArr = [];
					}
					else {
						resetTransformCenter();
					}
				}
				else {
					transformCenter.copy(p);
				}
			}
		}

		markedFeatureArr = [];
		
		mouseDown = false;
		mouseDownMoving = false;

		ev.preventDefault();
	}

	function scrollView(dx, dy) {
		view.origin.x += dx;
		view.origin.y += dy;

		//view.origin.y = Math.clamp(view.origin.y, 0, 0);

		// Set dirtyBounds to full screen
		dirtyBounds.set(canvasToWorld(new vec2(0, canvas.height)), canvasToWorld(new vec2(canvas.width, 0)));
		bg.outdated = true;
	}

	function checkHighlight(point) {
		highlightFeatureArr = [];
		transformAxis = 0;

		if (transformMode == TM_SELECT) {
			var feature = getFeatureByPoint(canvasToWorld(point));

			if (isValidFeature(feature)) {
				highlightFeatureArr[0] = feature;
			}
		}
		else if (transformMode == TM_TRANSLATE) {
			var center = worldToCanvas(transformCenter);

			if (Math.abs(point.x - center.x) < GIZMO_INNER_RADIUS && Math.abs(point.y - center.y) < GIZMO_INNER_RADIUS) {
				transformAxis = TRANSFORM_AXIS_X | TRANSFORM_AXIS_Y;
			}
			else {	
				var dx = point.x - center.x;
				var dy = -(point.y - center.y);

				if (dx <= GIZMO_RADIUS && dx >= GIZMO_INNER_OFFSET && Math.abs(dy) < SELECTABLE_LINE_DIST_THREHOLD) {
					transformAxis = TRANSFORM_AXIS_X;
				}
				else if (dy <= GIZMO_RADIUS && dy >= GIZMO_INNER_OFFSET && Math.abs(dx) < SELECTABLE_LINE_DIST_THREHOLD) {
					transformAxis = TRANSFORM_AXIS_Y;					
				}
			}
		}
		else if (transformMode == TM_SCALE) {
			var center = worldToCanvas(transformCenter);			
			var dsq = vec2.distsq(point, center);
			var cd = GIZMO_INNER_RADIUS;// + SELECTABLE_CIRCLE_DIST_THREHOLD;

			if (dsq < cd * cd) {
				transformAxis = TRANSFORM_AXIS_X | TRANSFORM_AXIS_Y;
			}
			else {
				var cd = GIZMO_SCALE_AXIS_BOX_EXTENT + SELECTABLE_LINE_DIST_THREHOLD;

				var px = vec2.add(center, new vec2(GIZMO_RADIUS, 0));
				var dx = Math.abs(point.x - px.x);
				var dy = Math.abs(point.y - px.y);				

				if (dx < cd && dy < cd) {
					transformAxis = TRANSFORM_AXIS_X;
				}
				else {					
					var py = vec2.add(center, new vec2(0, -GIZMO_RADIUS));
					var dx = Math.abs(point.x - py.x);
					var dy = Math.abs(point.y - py.y);

					if (dx < cd && dy < cd) {
						transformAxis = TRANSFORM_AXIS_Y;
					}
				}
			}
		}
		else if (transformMode == TM_ROTATE) {
			var dsq = vec2.distsq(point, worldToCanvas(transformCenter));

			if (dsq > (GIZMO_RADIUS - SELECTABLE_CIRCLE_DIST_THREHOLD) * (GIZMO_RADIUS - SELECTABLE_CIRCLE_DIST_THREHOLD) &&
				dsq < (GIZMO_RADIUS + SELECTABLE_CIRCLE_DIST_THREHOLD) * (GIZMO_RADIUS + SELECTABLE_CIRCLE_DIST_THREHOLD)) {
				transformAxis = TRANSFORM_AXIS_Z;
			}
		}
	}

	function onMouseMove(ev) {
		mousePosition = getMousePosition(ev);

		if (!editMode) {
			if (mouseDown) {
				if (mouseJoint) {
					mouseBody.p.copy(canvasToWorld(mousePosition));
				}
				else {
					scrollView(-(mousePosition.x - mousePositionOld.x), mousePosition.y - mousePositionOld.y);
				}
			}
		}
		else {
			highlightFeatureArr = [];

			if (mouseDown) {				
				if (ev.altKey) {					
					scrollView(-(mousePosition.x - mousePositionOld.x), mousePosition.y - mousePositionOld.y);
				}
				else if (transformMode == TM_SELECT) {
					if (!mouseDownMoving && !ev.shiftKey && !ev.metaKey) {
						selectedFeatureArr = [];
					}

					doSelect(canvasToWorld(mousePosition), ev.metaKey ? SF_XOR : SF_ADDITIVE);
				}
				else if ((transformMode == TM_TRANSLATE || transformMode == TM_SCALE || transformMode == TM_ROTATE) && transformAxis) {
					var dx = (mousePosition.x - mousePositionOld.x) / view.scale;
					var dy = -(mousePosition.y - mousePositionOld.y) / view.scale;

					if (transformMode == TM_TRANSLATE) {
						if (transformAxis & TRANSFORM_AXIS_X) {
							transformCenter.x += dx;
						}

						if (transformAxis & TRANSFORM_AXIS_Y) {
							transformCenter.y += dy;
						}
					}

					if (selectionMode == SM_VERTICES) {
						for (var i = 0; i < selectedFeatureArr.length; i++) {
							var vertex = selectedFeatureArr[i];
							var shape = space.shapeById((vertex >> 16) & 0xFFFF);
							var body = shape.body;							
							var index = vertex & 0xFFFF;
							var v = getShapeVertex(shape, index);

							if (transformMode == TM_TRANSLATE) {
								var delta = new vec2(dx, dy);
								if (!(transformAxis & TRANSFORM_AXIS_X)) {
									delta.x = 0;
								}

								if (!(transformAxis & TRANSFORM_AXIS_Y)) {
									delta.y = 0;
								}

								setShapeVertex(shape, index, vec2.add(v, delta));
							}
							else if (transformMode == TM_SCALE) {
								var p1 = vec2.sub(mousePositionOld, worldToCanvas(transformCenter));
								var p2 = vec2.sub(mousePosition, worldToCanvas(transformCenter));

								if (transformAxis == TRANSFORM_AXIS_XY) {
									var offset = new vec2(GIZMO_RADIUS, -GIZMO_RADIUS);
									
									p1.addself(offset);
									p2.addself(offset);
								}
								
								var scale = new vec2(p2.x / p1.x, p2.y / p1.y);

								if (!(transformAxis & TRANSFORM_AXIS_X)) {
									scale.x = 1;
								}

								if (!(transformAxis & TRANSFORM_AXIS_Y)) {
									scale.y = 1;
								}
								
								var wv = vec2.add(vec2.scale2(vec2.sub(v, transformCenter), scale), transformCenter);
								setShapeVertex(shape, index, wv);
							}
							else if (transformMode == TM_ROTATE) {
								var p1 = vec2.normalize(vec2.sub(canvasToWorld(mousePositionOld), transformCenter));
								var p2 = vec2.normalize(vec2.sub(canvasToWorld(mousePosition), transformCenter));
								var da = p2.toAngle() - p1.toAngle();
								var wv = vec2.add(vec2.rotate(vec2.sub(v, transformCenter), da), transformCenter);
								setShapeVertex(shape, index, wv);
							}							

							shape.finishVerts();
							shape.body.resetMassData();
							shape.body.syncTransform();
							shape.body.cacheData();
						}
					}
					else if (selectionMode == SM_EDGES) {
						var markedVertexArr = [];

						for (var i = 0; i < selectedFeatureArr.length; i++) {
							var edge = selectedFeatureArr[i];
							var shape = space.shapeById((edge >> 16) & 0xFFFF);
							var body = shape.body;							
							var index = edge & 0xFFFF;

							var v1 = getShapeVertex(shape, index);
							var v2 = getShapeVertex(shape, index + 1);

							var vertex1 = (shape.id << 16) | index;
							var vertex2 = (shape.id << 16) | ((index + 1) % shape.verts.length);

							if (transformMode == TM_TRANSLATE) {
								var delta = new vec2(dx, dy);

								if (!(transformAxis & TRANSFORM_AXIS_X)) {
									delta.x = 0;
								}

								if (!(transformAxis & TRANSFORM_AXIS_Y)) {
									delta.y = 0;
								}

								if (markedVertexArr.indexOf(vertex1) == -1) {
									markedVertexArr.push(vertex1);
									setShapeVertex(shape, index, vec2.add(v1, delta));
								}

								if (markedVertexArr.indexOf(vertex2) == -1) {
									markedVertexArr.push(vertex2);
									setShapeVertex(shape, index + 1, vec2.add(v2, delta));
								}
							}
							else if (transformMode == TM_SCALE) {
								var p1 = vec2.sub(mousePositionOld, worldToCanvas(transformCenter));
								var p2 = vec2.sub(mousePosition, worldToCanvas(transformCenter));

								if (transformAxis == TRANSFORM_AXIS_XY) {
									var offset = new vec2(GIZMO_RADIUS, -GIZMO_RADIUS);
									
									p1.addself(offset);
									p2.addself(offset);
								}
								
								var scale = new vec2(p2.x / p1.x, p2.y / p1.y);

								if (!(transformAxis & TRANSFORM_AXIS_X)) {
									scale.x = 1;
								}

								if (!(transformAxis & TRANSFORM_AXIS_Y)) {
									scale.y = 1;
								}
																
								if (markedVertexArr.indexOf(vertex1) == -1) {
									markedVertexArr.push(vertex1);
									var wv = vec2.add(vec2.scale2(vec2.sub(v1, transformCenter), scale), transformCenter);
									setShapeVertex(shape, index, wv);	
								}

								if (markedVertexArr.indexOf(vertex2) == -1) {
									markedVertexArr.push(vertex2);
									var wv = vec2.add(vec2.scale2(vec2.sub(v2, transformCenter), scale), transformCenter);
									setShapeVertex(shape, index + 1, wv);
								}
							}
							else if (transformMode == TM_ROTATE) {
								var p1 = vec2.normalize(vec2.sub(canvasToWorld(mousePositionOld), transformCenter));
								var p2 = vec2.normalize(vec2.sub(canvasToWorld(mousePosition), transformCenter));
								var da = p2.toAngle() - p1.toAngle();
								
								if (markedVertexArr.indexOf(vertex1) == -1) {
									markedVertexArr.push(vertex1);
									var wv = vec2.add(vec2.rotate(vec2.sub(v1, transformCenter), da), transformCenter);
									setShapeVertex(shape, index, wv);
								}

								if (markedVertexArr.indexOf(vertex2) == -1) {
									markedVertexArr.push(vertex2);
									var wv = vec2.add(vec2.rotate(vec2.sub(v2, transformCenter), da), transformCenter);
									setShapeVertex(shape, index + 1, wv);
								}
							}

							shape.finishVerts();
							shape.body.resetMassData();
							shape.body.syncTransform();
							shape.body.cacheData();
						}
					}
					else if (selectionMode == SM_SHAPES) {
						// Copy shapes
						if (!mouseDownMoving && ev.shiftKey) {
							for (var i = 0; i < selectedFeatureArr.length; i++) {
								var shape = selectedFeatureArr[i];
								var dup = shape.duplicate();

								shape.body.addShape(dup);
								selectedFeatureArr[i] = dup;
							}

							clickedFeature = selectedFeatureArr[0];
						}

						for (var i = 0; i < selectedFeatureArr.length; i++) {
							var shape = selectedFeatureArr[i];
							var body = shape.body;							

							if (transformMode == TM_TRANSLATE) {
								var delta = new vec2(dx, dy);

								if (!(transformAxis & TRANSFORM_AXIS_X)) {
									delta.x = 0;
								}

								if (!(transformAxis & TRANSFORM_AXIS_Y)) {
									delta.y = 0;
								}

								switch (shape.type) {
								case Shape.TYPE_CIRCLE:
									var wc = vec2.add(shape.tc, delta);
									shape.c.copy(body.getLocalPoint(wc));
									break;
								case Shape.TYPE_SEGMENT:
									var wa = vec2.add(shape.ta, delta);
									var wb = vec2.add(shape.ta, delta);
									shape.a.copy(body.getLocalPoint(wa));
									shape.b.copy(body.getLocalPoint(wb));
									break;
								case Shape.TYPE_POLY:
									for (var j = 0; j < shape.tverts.length; j++) {
										var wv = vec2.add(shape.tverts[j], delta);
										shape.verts[j].copy(body.getLocalPoint(wv));
									}
									break;
								}
							}
							else if (transformMode == TM_SCALE) {								
								var p1 = vec2.sub(mousePositionOld, worldToCanvas(transformCenter));
								var p2 = vec2.sub(mousePosition, worldToCanvas(transformCenter));

								if (transformAxis == TRANSFORM_AXIS_XY) {
									var offset = new vec2(GIZMO_RADIUS, -GIZMO_RADIUS);
									
									p1.addself(offset);
									p2.addself(offset);
								}
								
								var scale = new vec2(p2.x / p1.x, p2.y / p1.y);

								if (!(transformAxis & TRANSFORM_AXIS_X)) {
									scale.x = 1;
								}

								if (!(transformAxis & TRANSFORM_AXIS_Y)) {
									scale.y = 1;
								}

								switch (shape.type) {
								case Shape.TYPE_CIRCLE:
									var wv = vec2.add(vec2.scale2(vec2.sub(shape.tc, transformCenter), scale), transformCenter);
									shape.c.copy(body.getLocalPoint(wv));
									shape.r *= p2.length() / p1.length();
									break;
								case Shape.TYPE_SEGMENT:
									var wa = vec2.add(vec2.scale2(vec2.sub(shape.ta, transformCenter), scale), transformCenter);
									var wv = vec2.add(vec2.scale2(vec2.sub(shape.ta, transformCenter), scale), transformCenter);
									shape.a.copy(body.getLocalPoint(wa));
									shape.b.copy(body.getLocalPoint(wb));
									shape.r *= p2.length() / p1.length();
									break;
								case Shape.TYPE_POLY:
									for (var j = 0; j < shape.tverts.length; j++) {
										var wv = vec2.add(vec2.scale2(vec2.sub(shape.tverts[j], transformCenter), scale), transformCenter);
										shape.verts[j].copy(body.getLocalPoint(wv));
									}
									break;
								}
							}
							else if (transformMode == TM_ROTATE) {
								var p1 = vec2.normalize(vec2.sub(canvasToWorld(mousePositionOld), transformCenter));
								var p2 = vec2.normalize(vec2.sub(canvasToWorld(mousePosition), transformCenter));
								var da = p2.toAngle() - p1.toAngle();

								switch (shape.type) {
								case Shape.TYPE_CIRCLE:									
									var wc = vec2.add(vec2.rotate(vec2.sub(shape.tc, transformCenter), da), transformCenter);
									shape.c.copy(body.getLocalPoint(wc));
									break;
								case Shape.TYPE_SEGMENT:
									var wa = vec2.add(vec2.rotate(vec2.sub(shape.ta, transformCenter), da), transformCenter);
									shape.a.copy(body.getLocalPoint(wa));

									var wb = vec2.add(vec2.rotate(vec2.sub(shape.tb, transformCenter), da), transformCenter);
									shape.b.copy(body.getLocalPoint(wb));
									break;
								case Shape.TYPE_POLY:
									for (var j = 0; j < shape.tverts.length; j++) {
										var wv = vec2.add(vec2.rotate(vec2.sub(shape.tverts[j], transformCenter), da), transformCenter);
										shape.verts[j].copy(body.getLocalPoint(wv));
									}
									break;
								}
							}							

							shape.finishVerts();
							shape.body.resetMassData();
							shape.body.syncTransform();
							shape.body.cacheData();
						}
					}
					else if (selectionMode == SM_BODIES) {
						if (!mouseDownMoving && ev.shiftKey) {
							for (var i = 0; i < selectedFeatureArr.length; i++) {
								var body = selectedFeatureArr[i];
								var dup = body.duplicate();

								space.addBody(dup);
								selectedFeatureArr[i] = dup;
							}

							clickedFeature = selectedFeatureArr[0];
						}

						for (var i = 0; i < selectedFeatureArr.length; i++) {
							var body = selectedFeatureArr[i];

							var p = body.xf.t.duplicate();
							var a = body.a;

							if (transformMode == TM_TRANSLATE) {
								if (transformAxis & TRANSFORM_AXIS_X) {
									p.x += dx;
								}

								if (transformAxis & TRANSFORM_AXIS_Y) {
									p.y += dy;
								}
							}
							else if (transformMode == TM_SCALE) {
								// NOT AVAILABLE
							}
							else if (transformMode == TM_ROTATE) {
								var p1 = vec2.normalize(vec2.sub(canvasToWorld(mousePositionOld), transformCenter));
								var p2 = vec2.normalize(vec2.sub(canvasToWorld(mousePosition), transformCenter));
								var da = p2.toAngle() - p1.toAngle();

								p = vec2.add(vec2.rotate(vec2.sub(p, transformCenter), da), transformCenter);								
								a += da;
							}

							body.setTransform(p.x, p.y, a);
							body.cacheData();
						}
					}
					else if (selectionMode == SM_JOINTS) {
						
					}
				}
			}
		}

		mousePositionOld.x = mousePosition.x;
		mousePositionOld.y = mousePosition.y;

		if (mouseDown) {
			mouseDownMoving = true;
		}

		ev.preventDefault();
	}

	function onMouseLeave(ev) {
		if (mouseJoint) {
			space.removeJoint(mouseJoint);
			mouseJoint = null;
		}
	}

	function onMouseWheel(ev) {
		// Zoom in and out using vertical mouse wheel
		var ds = -ev.wheelDeltaY * 0.001;
		var oldViewScale = view.scale;
		view.scale = Math.clamp(oldViewScale + ds, view.minScale, view.maxScale);
		ds = view.scale - oldViewScale;

		// Adjust view origin for focused zoom in and out
		// p = (1 + ds) * p - ds * p
		var p = canvasToWorld(getMousePosition(ev));
		view.origin.x += p.x * ds;
		view.origin.y += p.y * ds;

		// Horizontal scroll using horizontal mouse wheel
		var dx = ev.wheelDeltaX * 0.2;
		view.origin.x -= dx;

		// Clamp view origin limit
		//view.origin.y = Math.clamp(view.origin.y, 0, 0);

		// Set dirtyBounds to full screen
		dirtyBounds.set(canvasToWorld(new vec2(0, canvas.height)), canvasToWorld(new vec2(canvas.width, 0)));
		bg.outdated = true;

		ev.preventDefault();		
	}

	function touchHandler(ev) {
		if (ev.touches.length <= 1) {
			var first = ev.changedTouches[0];
			var type = {touchstart: "mousedown", touchmove: "mousemove", touchend: "mouseup"}[ev.type] || "";
			//initMouseEvent(type, canBubble, cancelable, view, clickCount, screenX, screenY, clientX, clientY, ctrlKey, altKey, shiftKey, metaKey, button, relatedTarget);
			var simulatedEvent = document.createEvent("MouseEvent");
			simulatedEvent.initMouseEvent(type, true, true, window, 1, first.screenX, first.screenY, first.clientX, first.clientY, false, false, false, false, 0, null);
			first.target.dispatchEvent(simulatedEvent);
		}
		else {
			var handler = {touchstart: onTouchStart, touchmove: onTouchMove, touchend: onTouchEnd}[ev.type];
			if (handler) {
				handler(ev);
			}
		}

		ev.preventDefault();
	}

	function onTouchStart(ev) {
		if (mouseJoint) {
			space.removeJoint(mouseJoint);
			mouseJoint = null;
		}

		if (ev.touches.length == 2) {
			touchPosOld[0] = getMousePosition(ev.touches[0]);
			touchPosOld[1] = getMousePosition(ev.touches[1]);
			
			ev.preventDefault();
		}
	}

	function onTouchMove(ev) {
		if (ev.touches.length == 2) {
			var touchPos = [];

			touchPos[0] = getMousePosition(ev.touches[0]);
			touchPos[1] = getMousePosition(ev.touches[1]);

			var v1 = vec2.sub(touchPos[0], touchPosOld[0]);
			var v2 = vec2.sub(touchPos[1], touchPosOld[1]);

			var d1 = v1.length();
			var d2 = v2.length();

			if (d1 > 0 || d2 > 0) {
				scrollView(-(v1.x + v2.x) * 0.5, (v1.y + v2.y) * 0.5);

				touchScaleCenter = canvasToWorld(vec2.lerp(touchPos[0], touchPos[1], d1 / (d1 + d2)));

				var oldScale = view.scale;
				view.scale = Math.clamp(gestureScale, view.minScale, view.maxScale);
				var ds = view.scale - oldScale;				
		
				view.origin.x += touchScaleCenter.x * ds;
				view.origin.y += touchScaleCenter.y * ds;

				// Set dirtyBounds to full screen
				dirtyBounds.set(canvasToWorld(new vec2(0, canvas.height)), canvasToWorld(new vec2(canvas.width, 0)));
				bg.outdated = true;
			}

			touchPosOld[0] = touchPos[0];
			touchPosOld[1] = touchPos[1];			

			ev.preventDefault();
		}
	}

	function onTouchEnd(ev) {
		
	}

	function onGestureStart(ev) {
		gestureStartScale = view.scale;

		ev.preventDefault();
	}

	function onGestureChange(ev) {
		var threhold = Math.clamp(ev.scale - 1, -0.1, 0.1);
		gestureScale = gestureStartScale * (ev.scale - threhold);

		ev.preventDefault();
	}

	function onGestureEnd(ev) {
	}

	function onKeyDown(ev) {
		if (!ev) {
			ev = event;
		}

		if (ev.metaKey) {
			return;
		}

		switch (ev.keyCode) {
		case 17: // Ctrl
			ev.preventDefault();
			break;
		case 8: // Delete
			if (editMode) {
				onDelete();
				ev.preventDefault();
			}
			break;
		case 74: // 'j'
			break;
		case 83: // 's'
			if (editMode) {
				if (ev.ctrlKey) {
					sliceEdges();
					ev.preventDefault();
				}
			}
			break;
		case 81: // 'q'
			if (editMode) {
				onClickedTransformMode("select");
				ev.preventDefault();
			}			
			break;
		case 87: // 'w'
			if (editMode) {
				onClickedTransformMode("translate");
				ev.preventDefault();
			}			
			break;
		case 69: // 'e'
			if (ev.ctrlKey) {
				onClickedEdit();
				ev.preventDefault();
			}
			else if (editMode) {
				onClickedTransformMode("scale");
				ev.preventDefault();
			}
			break;
		case 82: // 'r'
			if (editMode) {
				onClickedTransformMode("rotate");
				ev.preventDefault();
			}			
			break;
		case 49: // '1'
		case 50: // '2'
		case 51: // '3'
		case 52: // '4'
		case 53: // '5'
			if (editMode) {
				onClickedSelectMode(["vertices", "edges", "shapes", "bodies", "joints"][(ev.keyCode - 48) - 1]);				
			}
			break;
		case 32: // 'space'
			if (!editMode) {
				onClickedStep();
				ev.preventDefault();
			}
			break;
		}					
	}

	function onKeyUp(ev) {
		if (!ev) {
			ev = event;
		}
	}

	function onKeyPress(ev) {
		if (!ev) {
			ev = event;
		}
	}

	function onChangedScene(index) {
		sceneIndex = index;
		initScene();

		selectedFeatureArr = [];
		markedFeatureArr = [];
		highlightFeatureArr = [];
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
	
	function onClickedShowAxis() {
		showAxis = !showAxis;
	}

	function onClickedShowJoints() {
		showJoints = !showJoints;
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

	function onClickedPlayer(value) {
		switch (value) {
		case "restart":
			initScene();
			pause = false;
			break;
		case "pause":
			pause = !pause;
			break;
		case "step":
			pause = true;
			step = true;
			break;
		}
		
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

		updateToolbar();

		initFrame();
		
		return false;
	}

	function onClickedSelectMode(value) {
		selectionMode = { vertices: SM_VERTICES, edges: SM_EDGES, shapes: SM_SHAPES, bodies: SM_BODIES, joints: SM_JOINTS }[value];
		selectedFeatureArr = [];
		markedFeatureArr = [];
		highlightFeatureArr = [];

		updateToolbar();

		return false;
	}

	function onClickedTransformMode(value) {
		transformMode = { select: TM_SELECT, translate: TM_TRANSLATE, scale: TM_SCALE, rotate: TM_ROTATE }[value];		

		updateToolbar();		

		return false;
	}

	function deleteShape(shape) {
		var body = shape.body;

		body.removeShape(shape);
		if (body.shapeArr.length != 0) {
			body.resetMassData();
			body.syncTransform();
			body.cacheData();
		}
		else {
			space.removeBody(body);
		}
	}

	function onDelete() {
		if (selectionMode == SM_VERTICES) {
			// Sort by decremental order
			selectedFeatureArr.sort(function(a, b) { return (b & 0xFFFF) - (a & 0xFFFF); });

			for (var i = 0; i < selectedFeatureArr.length; i++) {
				var vertex = selectedFeatureArr[i];
				var shape = space.shapeById((vertex >> 16) & 0xFFFF);
				var index = vertex & 0xFFFF;

				if (shape.type == Shape.TYPE_POLY) {
					shape.verts.splice(index, 1);

					shape.finishVerts();
					shape.body.resetMassData();
					shape.body.syncTransform();
					shape.body.cacheData();	
				}
				
				if (shape.verts.length == 0) {
					deleteShape(shape);
					delete shape;
				}
			}
		}
		else if (selectionMode == SM_EDGES) {
			// Sort by decremental order
			selectedFeatureArr.sort(function(a, b) { return (b & 0xFFFF) - (a & 0xFFFF); });

			for (var i = 0; i < selectedFeatureArr.length; i++) {
				var edge = selectedFeatureArr[i];
				var shape = space.shapeById((edge >> 16) & 0xFFFF);				

				if (shape.type == Shape.TYPE_POLY) {
					var index = edge & 0xFFFF;

					shape.verts.splice(index, 1);

					shape.finishVerts();
					shape.body.resetMassData();
					shape.body.syncTransform();
					shape.body.cacheData();	
				}
				
				if (shape.verts.length == 0) {
					deleteShape(shape);
					delete shape;
				}
			}
		}
		else if (selectionMode == SM_SHAPES) {
			for (var i = 0; i < selectedFeatureArr.length; i++) {
				var shape = selectedFeatureArr[i];
				deleteShape(shape);
				delete shape;
			}
		}
		else if (selectionMode == SM_BODIES) {
			for (var i = 0; i < selectedFeatureArr.length; i++) {
				var body = selectedFeatureArr[i];
				space.removeBody(body);
				delete body;
			}
		}
		else if (selectionMode == SM_JOINTS) {
			
		}

		selectedFeatureArr = [];
		highlightFeatureArr = [];
	}

	function sliceEdges() {
		if (selectionMode == SM_EDGES) {
			// Sort by incremental order
			selectedFeatureArr.sort(function(a, b) { return (a & 0xFFFF) - (b & 0xFFFF); });

			var new_selectedFeatureArr = [];
			var prev_shape_id = -1;
			var addedCount = 0;

			for (var i = 0; i < selectedFeatureArr.length; i++) {
				var edge = selectedFeatureArr[i];
				var shape_id = (edge >> 16) & 0xFFFF;
				var shape = space.shapeById(shape_id);

				if (shape_id != prev_shape_id) {
					addedCount = 0;
				}

				if (shape.type == Shape.TYPE_POLY) {
					var index1 = (edge & 0xFFFF) + addedCount;
					var index2 = index1 + 1;

					var new_vert = vec2.lerp(shape.verts[index1], shape.verts[index2 % shape.verts.length], 0.5);

					shape.verts.splice(index2, 0, new_vert);

					shape.finishVerts();
					shape.body.cacheData();

					var new_edge1 = (shape.id << 16) | index1;
					var new_edge2 = (shape.id << 16) | index2;

					new_selectedFeatureArr.push(new_edge1);
					new_selectedFeatureArr.push(new_edge2);

					addedCount++;
				}		

				prev_shape_id = shape_id;		
			}

			selectedFeatureArr = new_selectedFeatureArr;
		}
	}

	function onClickedSnap() {
		snap = !snap;

		updateToolbar();

		return false;
	}

	function onClickedSettings() {
		showSettings = !showSettings;

		var editbox = document.getElementById("gravity");
		editbox.value = gravity.y;

		var editbox = document.getElementById("frameRateHz");
		editbox.value = frameRateHz;

		var editbox = document.getElementById("v_iters");
		editbox.value = velocityIterations;

		var editbox = document.getElementById("p_iters");
		editbox.value = positionIterations;

		var layout = document.getElementById("settings");
		var button = document.getElementById("toggle_settings");

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

	function onClickedAbout() {
		showAbout = !showAbout;	

		var layout = document.getElementById("about");
		var button = document.getElementById("toggle_about");

		if (showAbout) {
			layout.style.display = "block";

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

	return { onReady: onReady, onLoad: onLoad };
}();

ready(App.onReady);
addEvent(window, "load", App.onLoad);
var stats = {};

App = function() {
	// edit mode
	const EM_SELECT = 0;
	const EM_TRANSLATE = 1;
	const EM_ROTATE = 2;
	const EM_SCALE = 3;
	const EM_CREATE_CIRCLE = 4;
	const EM_CREATE_TRIANGLE = 5;
	const EM_CREATE_BOX = 6;
	const EM_CREATE_HEXAGON = 7;
	const EM_CREATE_POLY = 8;
	const EM_CREATE_ANGLE_JOINT = 9;
	const EM_CREATE_REVOLUTE_JOINT = 10;
	const EM_CREATE_WELD_JOINT = 11;
	const EM_CREATE_LINE_JOINT = 12;
	const EM_CREATE_PRISMATIC_JOINT = 13;
	const EM_CREATE_DISTANCE_JOINT = 14;
	const EM_COLLAPSE_BODIES = 15;
	const EM_EDGE_SLICE = 16;

	// selection mode
	const SM_VERTICES = 0;
	const SM_EDGES = 1;
	const SM_SHAPES = 2;
	const SM_BODIES = 3;
	const SM_JOINTS = 4;

	// selection flag
	const SF_REPLACE = 0;
	const SF_ADDITIVE = 1;
	const SF_XOR = 2;

	// transform axis
	const TRANSFORM_AXIS_X = 1;
	const TRANSFORM_AXIS_Y = 2;
	const TRANSFORM_AXIS_Z = 4;
	const TRANSFORM_AXIS_XY = TRANSFORM_AXIS_X | TRANSFORM_AXIS_Y;
	const TRANSFORM_AXIS_XYZ = TRANSFORM_AXIS_XY | TRANSFORM_AXIS_Z;

	// gizmo value
	const GIZMO_RADIUS = 120;
	const GIZMO_INNER_OFFSET = 32;
	const GIZMO_INNER_RADIUS = 15;
	const GIZMO_SCALE_AXIS_BOX_EXTENT = 6;	

	// edit mode drawing value
	const HELPER_BODY_AXIS_SIZE = 12;
	const HELPER_VERTEX_EXTENT = 2;
	const HELPER_JOINT_ANCHOR_RADIUS = 2.5;
	const HELPER_ANGLE_JOINT_RADIUS = 16;
	const HELPER_REVOLUTE_JOINT_RADIUS = 20;
	const HELPER_PRISMATIC_JOINT_ARROW_SIZE = 12;
	const HELPER_LINE_JOINT_RADIUS = 8;
	const HELPER_WELD_JOINT_EXTENT = 8;

	// selectable feature threholds
	const SELECTABLE_POINT_DIST_THREHOLD = isAppleMobileDevice() ? 15 : 5;
	const SELECTABLE_LINE_DIST_THREHOLD = isAppleMobileDevice() ? 8 : 4;
	const SELECTABLE_CIRCLE_DIST_THREHOLD = isAppleMobileDevice() ? 10 : 5;	

	// default values for creating shape
	const DEFAULT_DENSITY = 0.1;
	const DEFAULT_RESTITUTION = 0.4;
	const DEFAULT_FRICTION = 0.8;

	// DOM objects
	var domView;
	var domCanvas;
	var domInfo;
	var domToolbar;
	var domSidebar;
	var domVertexInspector;
	var domEdgeInspector;
	var domShapeInspector;
	var domBodyInspector;
	var domJointInspector;
	var domSettings;

	// canvas rendering stuffs	
	var fg = {};
	var bg = {};
	var renderer;
	var activeWindow = true;
	var camera = { origin: new vec2(0, 0), 
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
	
	var showSettings = false;
	var showHelp = false;

	var space;
	var demoArr = [DemoCar, DemoRagDoll, DemoSeeSaw, DemoPyramid, DemoCrank, DemoRope, DemoWeb, DemoBounce];
	var sceneNameArr = [];
	var sceneIndex;	
	var randomColor = ["#BEB", "#48B", "#CAA", "#8D5", "#6BE", "#98D", "#E78", "#7BC", "#E9E", "#BCD", "#EB6", "#EE7"]; // Random colors for drawing bodies
	var mouseBody;
	var mouseJoint;
	var creatingBody;
	var creatingJoint;

	// editor variables
	var editorEnabled = false;	
	var editMode = EM_SELECT;
	var editModeEventArr = [];
	var selectionMode = SM_BODIES;
	var snapEnabled = false;
	var selectedFeatureArr = [];
	var markedFeatureArr = [];
	var highlightFeatureArr = [];
	var transformCenter = new vec2(0, 0);
	var transformAxis = 0;
	var transformScale = new vec2;
	var gridFrameSize = 256;
	var gridSize = 32;
	var scaledGridSize;
	var snapCenterOffset = new vec2;
	var snapOffset = new vec2;
	var backgroundColor = "rgb(222, 222, 222)";
	//var backgroundColor = "rgb(95, 105, 118)";
	var gridFrameColor = "#888";
	var gridColor = "#BDBDBD";
	var selectionColor = "rgba(255, 160, 0, 1.0)";
	var highlightColor = "rgba(192, 255, 255, 1.0)";	
	var vertexColor = "#444";
	var jointAnchorColor = "#80F";
	var jointHelperColor = "#F0F";
	var selectionPattern;
	var highlightPattern;	

	// mouse & touch variables
	var mouseDown = false;
	var mouseDownMoving = false;
	var mousePosition = new vec2;
	var mousePositionOld = new vec2;
	var mouseDownPosition = new vec2;
	var touchPosOld = new Array(2);
	var gestureStartScale;
	var gestureScale;

	// settings variables	
	var gravity = new vec2(0, -627.2);
	var frameRateHz = 60;
	var velocityIterations = 8;
	var positionIterations = 4;
	var warmStarting = true;
	var allowSleep = true;
	var enableDirtyBounds = true;
	var showDirtyBounds = false;
	var showAxis = false;
	var showJoints = true;	
	var showBounds = false;
	var showContacts = false;
	var showStats = false;

	function onReady() {
		domView = document.getElementById("main_view");

		// Initialize canvas context
		domCanvas = document.getElementById("canvas");
		if (!domCanvas.getContext) {
			alert("Your browser doesn't support canvas.");
			return;
		}

		fg.canvas = domCanvas;
		fg.ctx = fg.canvas.getContext("2d");

		bg.canvas = document.createElement("canvas");
		bg.ctx = bg.canvas.getContext("2d");

		domInfo = document.getElementById("info");
		
		//addEvent(window, "focus", function(ev) { activeWindow = true; });
		//addEvent(window, "blur", function(ev) { activeWindow = false; });
		addEvent(window, "resize", onResize);
		addEvent(domCanvas, "mousedown", onMouseDown);
		addEvent(domCanvas, "mousemove", onMouseMove);
		addEvent(domCanvas, "mouseup", onMouseUp);
		addEvent(domCanvas, "mouseleave", onMouseLeave);
		addEvent(domCanvas, "dblclick", onMouseDoubleClick);

		var eventname = (/Firefox/i.test(navigator.userAgent))? "DOMMouseScroll" : "mousewheel";
		addEvent(domCanvas, eventname, onMouseWheel);

		addEvent(domCanvas, "touchstart", touchHandler);
		addEvent(domCanvas, "touchmove", touchHandler);
		addEvent(domCanvas, "touchend", touchHandler);
		addEvent(domCanvas, "touchcancel", touchHandler);

		addEvent(domCanvas, "gesturestart", onGestureStart);
		addEvent(domCanvas, "gesturechange", onGestureChange);
		addEvent(domCanvas, "gestureend", onGestureEnd);
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
		domToolbar = document.querySelector("#toolbar");
		addEvent(domToolbar.querySelector("#scene"), "change", function() { onChangedScene(this.selectedIndex); });
		addEvent(domToolbar.querySelector("#edit"), "click", onClickedEdit);
		var elements = domToolbar.querySelectorAll("[name=player]");
		for (var i in elements) {
			addEvent(elements[i], "click", function() { return onClickedPlayer(this.value); });
		}
		var elements = domToolbar.querySelectorAll("[name=selectionmode]");
		for (var i in elements) {
			addEvent(elements[i], "click", function() { return onClickedSelectionMode(this.value); });
		}		
		addEvent(domToolbar.querySelector("#toggle_snap"), "click", onClickedSnap);
		addEvent(domToolbar.querySelector("#toggle_settings"), "click", onClickedSettings);
		addEvent(domToolbar.querySelector("#toggle_help"), "click", onClickedHelp);
		//domToolbar.querySelector("#toggle_help").style.display = "none"; //

		// Setting up sidebar events
		domSidebar = document.querySelector("#sidebar");
		var elements = domSidebar.querySelectorAll("[name=editmode]");
		for (var i in elements) {
			addEvent(elements[i], "click", function() { return onClickedEditMode(this.value); });
		}
		domVertexInspector = domSidebar.querySelector("#vertex_inspector");
		addEvent(domVertexInspector.querySelector("[name=position_x]"), "change", function() { onChangedVertexPositionX(this.value); });
		addEvent(domVertexInspector.querySelector("[name=position_x]"), "input", function() { onChangedVertexPositionX(this.value); });
		addEvent(domVertexInspector.querySelector("[name=position_y]"), "change", function() { onChangedVertexPositionY(this.value); });
		addEvent(domVertexInspector.querySelector("[name=position_y]"), "input", function() { onChangedVertexPositionY(this.value); });

		domEdgeInspector = domSidebar.querySelector("#edge_inspector");
		addEvent(domEdgeInspector.querySelector("[name=v1_position_x]"), "change", function() { onChangedEdgePositionX(0, this.value); });
		addEvent(domEdgeInspector.querySelector("[name=v1_position_x]"), "input", function() { onChangedEdgePositionX(0, this.value); });
		addEvent(domEdgeInspector.querySelector("[name=v1_position_y]"), "change", function() { onChangedEdgePositionY(0, this.value); });
		addEvent(domEdgeInspector.querySelector("[name=v1_position_y]"), "input", function() { onChangedEdgePositionY(0, this.value); });
		addEvent(domEdgeInspector.querySelector("[name=v2_position_x]"), "change", function() { onChangedEdgePositionX(1, this.value); });
		addEvent(domEdgeInspector.querySelector("[name=v2_position_x]"), "input", function() { onChangedEdgePositionX(1, this.value); });
		addEvent(domEdgeInspector.querySelector("[name=v2_position_y]"), "change", function() { onChangedEdgePositionY(1, this.value); });
		addEvent(domEdgeInspector.querySelector("[name=v2_position_y]"), "input", function() { onChangedEdgePositionY(1, this.value); });

		domShapeInspector = domSidebar.querySelector("#shape_inspector");
		addEvent(domShapeInspector.querySelector("[name=radius]"), "change", function() { onChangedShapeRadius(this.value); });
		addEvent(domShapeInspector.querySelector("[name=radius]"), "input", function() { onChangedShapeRadius(this.value); });
		addEvent(domShapeInspector.querySelector("[name=density]"), "change", function() { onChangedShapeDensity(this.value); });
		addEvent(domShapeInspector.querySelector("[name=density]"), "input", function() { onChangedShapeDensity(this.value); });
		addEvent(domShapeInspector.querySelector("[name=restitution]"), "change", function() { onChangedShapeRestitution(this.value); });
		addEvent(domShapeInspector.querySelector("[name=restitution]"), "input", function() { onChangedShapeRestitution(this.value); });
		addEvent(domShapeInspector.querySelector("[name=friction]"), "change", function() { onChangedShapeFriction(this.value); });
		addEvent(domShapeInspector.querySelector("[name=friction]"), "input", function() { onChangedShapeFriction(this.value); });

		domBodyInspector = domSidebar.querySelector("#body_inspector");
		addEvent(domBodyInspector.querySelector("[name=type]"), "change", function() { onChangedBodyType(this.value); });
		addEvent(domBodyInspector.querySelector("[name=name]"), "change", function() { onChangedBodyName(this.value); });
		addEvent(domBodyInspector.querySelector("[name=position_x]"), "change", function() { onChangedBodyPositionX(this.value); });
		addEvent(domBodyInspector.querySelector("[name=position_x]"), "input", function() { onChangedBodyPositionX(this.value); });
		addEvent(domBodyInspector.querySelector("[name=position_y]"), "change", function() { onChangedBodyPositionY(this.value); });
		addEvent(domBodyInspector.querySelector("[name=position_y]"), "input", function() { onChangedBodyPositionY(this.value); });
		addEvent(domBodyInspector.querySelector("[name=angle]"), "change", function() { onChangedBodyAngle(this.value); });
		addEvent(domBodyInspector.querySelector("[name=angle]"), "input", function() { onChangedBodyAngle(this.value); });
		addEvent(domBodyInspector.querySelector("[name=mass]"), "change", function() { onChangedBodyMass(this.value); });
		addEvent(domBodyInspector.querySelector("[name=mass]"), "input", function() { onChangedBodyMass(this.value); });

		domJointInspector = domSidebar.querySelector("#joint_inspector");
		addEvent(domJointInspector.querySelector("[name=body1]"), "change", function() { onChangedJointBody(0, this.value); });		
		addEvent(domJointInspector.querySelector("[name=body2]"), "change", function() { onChangedJointBody(1, this.value); });
		addEvent(domJointInspector.querySelector("[name=anchor_position_x]"), "change", function() { onChangedJointAnchorPositionX(this.value); });
		addEvent(domJointInspector.querySelector("[name=anchor_position_x]"), "input", function() { onChangedJointAnchorPositionX(this.value); });
		addEvent(domJointInspector.querySelector("[name=anchor_position_y]"), "change", function() { onChangedJointAnchorPositionY(this.value); });
		addEvent(domJointInspector.querySelector("[name=anchor_position_y]"), "input", function() { onChangedJointAnchorPositionY(this.value); });
		addEvent(domJointInspector.querySelector("[name=max_force]"), "change", function() { onChangedJointMaxForce(this.value); });
		addEvent(domJointInspector.querySelector("[name=max_force]"), "input", function() { onChangedJointMaxForce(this.value); });
		addEvent(domJointInspector.querySelector("[name=breakable]"), "click", onClickedJointBreakable);
		addEvent(domJointInspector.querySelector("[name=collide_connected]"), "click", onClickedJointCollideConnected);
		addEvent(domJointInspector.querySelector("[name=enable_limit]"), "click", onClickedJointEnableLimit);
		addEvent(domJointInspector.querySelector("[name=limit_lower_angle]"), "change", function() { onChangedJointLimitLowerAngle(this.value); });
		addEvent(domJointInspector.querySelector("[name=limit_lower_angle]"), "input", function() { onChangedJointLimitLowerAngle(this.value); });
		addEvent(domJointInspector.querySelector("[name=limit_upper_angle]"), "change", function() { onChangedJointLimitUpperAngle(this.value); });
		addEvent(domJointInspector.querySelector("[name=limit_upper_angle]"), "input", function() { onChangedJointLimitUpperAngle(this.value); });
		addEvent(domJointInspector.querySelector("[name=enable_motor]"), "click", onClickedJointEnableMotor);
		addEvent(domJointInspector.querySelector("[name=motor_speed]"), "change", function() { onChangedJointMotorSpeed(this.value); });
		addEvent(domJointInspector.querySelector("[name=motor_speed]"), "input", function() { onChangedJointMotorSpeed(this.value); });
		addEvent(domJointInspector.querySelector("[name=max_motor_torque]"), "change", function() { onChangedJointMaxMotorTorque(this.value); });
		addEvent(domJointInspector.querySelector("[name=max_motor_torque]"), "input", function() { onChangedJointMaxMotorTorque(this.value); });
		addEvent(domJointInspector.querySelector("[name=spring_frequency_hz]"), "change", function() { onChangedJointSpringFrequencyHz(this.value); });
		addEvent(domJointInspector.querySelector("[name=spring_frequency_hz]"), "input", function() { onChangedJointSpringFrequencyHz(this.value); });
		addEvent(domJointInspector.querySelector("[name=spring_damping_ratio]"), "change", function() { onChangedJointSpringDampingRatio(this.value); });
		addEvent(domJointInspector.querySelector("[name=spring_damping_ratio]"), "input", function() { onChangedJointSpringDampingRatio(this.value); });

		// Setting up settings events
		domSettings = document.querySelector("#settings");
		addEvent(domSettings.querySelector("#gravity"), "change", function() { onChangedGravity(this.value); });
		addEvent(domSettings.querySelector("#frameRateHz"), "change", function() { onChangedFrameRateHz(this.value); });
		addEvent(domSettings.querySelector("#v_iters"), "change", function() { onChangedVelocityIterations(this.value); });
		addEvent(domSettings.querySelector("#p_iters"), "change", function() { onChangedPositionIterations(this.value); });
		addEvent(domSettings.querySelector("#warmStarting"), "click", onClickedWarmStarting);
		addEvent(domSettings.querySelector("#allowSleep"), "click", onClickedAllowSleep);
		addEvent(domSettings.querySelector("#enableDirtyRect"), "click", onClickedEnableDirtyRect);
		addEvent(domSettings.querySelector("#showDirtyRect"), "click", onClickedShowDirtyRect);
		addEvent(domSettings.querySelector("#showAxis"), "click", onClickedShowAxis);
		addEvent(domSettings.querySelector("#showJoints"), "click", onClickedShowJoints);
		addEvent(domSettings.querySelector("#showBounds"), "click", onClickedShowBounds);
		addEvent(domSettings.querySelector("#showContacts"), "click", onClickedShowContacts);
		addEvent(domSettings.querySelector("#showStats"), "click", onClickedShowStats);
		var elements = domSettings.querySelectorAll("select, input");
		for (var i in elements) {
			addEvent(elements[i], "blur", function() { window.scrollTo(0, 0); });
		}

		updateToolbar();
		updateSidebar();

		// Setting up mouse event for each edit modes

		editModeEventArr[EM_SELECT] = {};
		editModeEventArr[EM_SELECT].init = function() {
			domCanvas.style.cursor = "default";
		}
		editModeEventArr[EM_SELECT].shutdown = function() {
		}
		editModeEventArr[EM_SELECT].mouseDown = function(ev) {}
		editModeEventArr[EM_SELECT].mouseUp = function(ev) {
			if (mouseDown && !mouseDownMoving) {
				var flag = ev.shiftKey ? SF_ADDITIVE : (ev.metaKey ? SF_XOR : SF_REPLACE);

				var pos = getMousePosition(ev);
				var p = canvasToWorld(pos);

				if (!doSelect(p, flag) && flag == SF_REPLACE) {
					selectedFeatureArr = [];					
				}
				else {
					resetTransformCenter();
				}

				updateSidebar();
			}
		}
		editModeEventArr[EM_SELECT].mouseMove = function(ev) {
			if (mouseDown) {
				if (!mouseDownMoving && !ev.shiftKey && !ev.metaKey) {
					selectedFeatureArr = [];
				}

				doSelect(canvasToWorld(mousePosition), ev.metaKey ? SF_XOR : SF_ADDITIVE);
				updateSidebar();
			}
			else {
				highlightFeatureArr = [];
				transformAxis = 0;

				var feature = getFeatureByPoint(canvasToWorld(mousePosition));
				if (isValidFeature(feature)) {
					highlightFeatureArr[0] = feature;
				}
			}
		}
		editModeEventArr[EM_SELECT].keyDown = function(keyCode) {
			if (keyCode == 27) {
				selectedFeatureArr = [];
				updateSidebar();
			}
		}

		editModeEventArr[EM_TRANSLATE] = {};
		editModeEventArr[EM_TRANSLATE].init = function() {
			domCanvas.style.cursor = "default";
		}
		editModeEventArr[EM_TRANSLATE].shutdown = function() {
		}
		editModeEventArr[EM_TRANSLATE].checkTransformAxis = function() {
			highlightFeatureArr = [];
			transformAxis = 0;

			var center = worldToCanvas(transformCenter);

			if (Math.abs(mousePosition.x - center.x) < GIZMO_INNER_RADIUS && Math.abs(mousePosition.y - center.y) < GIZMO_INNER_RADIUS) {
				transformAxis = TRANSFORM_AXIS_X | TRANSFORM_AXIS_Y;
			}
			else {	
				var dx = mousePosition.x - center.x;
				var dy = -(mousePosition.y - center.y);

				if (dx <= GIZMO_RADIUS && dx >= GIZMO_INNER_OFFSET && Math.abs(dy) < 6 + SELECTABLE_LINE_DIST_THREHOLD) {
					transformAxis = TRANSFORM_AXIS_X;
				}
				else if (dy <= GIZMO_RADIUS && dy >= GIZMO_INNER_OFFSET && Math.abs(dx) < 6 + SELECTABLE_LINE_DIST_THREHOLD) {
					transformAxis = TRANSFORM_AXIS_Y;					
				}
			}				
		}
		editModeEventArr[EM_TRANSLATE].mouseDown = function(ev) {
			if (ev.metaKey) {
				var pos = getMousePosition(ev);
				var p = canvasToWorld(pos);

				if (doSelect(p, SF_REPLACE)) {
					resetTransformCenter();
				}

				updateSidebar();
			}

			this.checkTransformAxis();
		}
		editModeEventArr[EM_TRANSLATE].mouseUp = function(ev) {
			if (!ev.metaKey && mouseDown && !mouseDownMoving) {
				var pos = getMousePosition(ev);
				var p = canvasToWorld(pos);

				if (snapEnabled) {
				 	p = snapPointByGrid(p);
				}
				transformCenter.copy(p);
				transformScale.set(1, 1);
			}
		}		
		editModeEventArr[EM_TRANSLATE].mouseMove = function(ev) {			
			if (mouseDown && transformAxis) {
				var wmp_new = canvasToWorld(mousePosition);
				var wmp_old = canvasToWorld(mousePositionOld);

				if (snapEnabled) {
					if (!mouseDownMoving) {
						snapCenterOffset = vec2.sub(transformCenter, wmp_old);
						snapOffset.set(0, 0);
					}

					wmp_new.addself(snapCenterOffset);
					var wmp_new_old = wmp_new;
					wmp_new = snapPointByGrid(wmp_new);
					
					wmp_old.addself(snapCenterOffset);
					wmp_old.addself(snapOffset);

					snapOffset = vec2.sub(wmp_new, wmp_new_old);
				}

				var wdx = wmp_new.x - wmp_old.x;
				var wdy = wmp_new.y - wmp_old.y;

				var delta = new vec2(wdx, wdy);

				if (transformAxis & TRANSFORM_AXIS_X) {
					transformCenter.x += wdx;
				}
				else {
					delta.x = 0;
				}

				if (transformAxis & TRANSFORM_AXIS_Y) {
					transformCenter.y += wdy;
				}
				else {
					delta.y = 0;
				}				

				if (selectionMode == SM_VERTICES) {
					for (var i = 0; i < selectedFeatureArr.length; i++) {
						var vertexId = selectedFeatureArr[i];
						var shape = space.shapeById((vertexId >> 16) & 0xFFFF);
						var body = shape.body;
						var index = vertexId & 0xFFFF;

						var v = getShapeVertex(shape, index);

						setShapeVertex(shape, index, vec2.add(v, delta));

						shape.finishVerts();
						body.resetMassData();
						body.cacheData();
					}
				}
				else if (selectionMode == SM_EDGES) {
					var markedVertexArr = [];

					for (var i = 0; i < selectedFeatureArr.length; i++) {
						var edgeId = selectedFeatureArr[i];
						var shape = space.shapeById((edgeId >> 16) & 0xFFFF);
						var body = shape.body;
						var index = edgeId & 0xFFFF;

						var v1 = getShapeVertex(shape, index);
						var v2 = getShapeVertex(shape, index + 1);

						var vertexId1 = (shape.id << 16) | index;
						var vertexId2 = (shape.id << 16) | ((index + 1) % shape.verts.length);
					
						if (markedVertexArr.indexOf(vertexId1) == -1) {
							markedVertexArr.push(vertexId1);
							setShapeVertex(shape, index, vec2.add(v1, delta));
						}

						if (markedVertexArr.indexOf(vertexId2) == -1) {
							markedVertexArr.push(vertexId2);
							setShapeVertex(shape, index + 1, vec2.add(v2, delta));
						}

						shape.finishVerts();
						body.resetMassData();
						body.cacheData();
					}
				}
				else if (selectionMode == SM_SHAPES) {
					// Copy shapes
					if (!mouseDownMoving && ev.shiftKey) {
						for (var i = 0; i < selectedFeatureArr.length; i++) {
							var shape = selectedFeatureArr[i];
							var dup = shape.duplicate();

							dup.cacheData(shape.body.xf);
							shape.body.addShape(dup);
							selectedFeatureArr[i] = dup;
						}
					} 

					for (var i = 0; i < selectedFeatureArr.length; i++) {
						var shape = selectedFeatureArr[i];
						var body = shape.body;

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

						shape.finishVerts();
						body.resetMassData();
						body.cacheData();
					}
				}
				else if (selectionMode == SM_BODIES) {
					// Copy bodies
					if (!mouseDownMoving && ev.shiftKey) {
						for (var i = 0; i < selectedFeatureArr.length; i++) {
							var body = selectedFeatureArr[i];
							var dup = body.duplicate();

							space.addBody(dup);
							selectedFeatureArr[i] = dup;
						}
					}

					for (var i = 0; i < selectedFeatureArr.length; i++) {
						var body = selectedFeatureArr[i];
						var p = body.xf.t.duplicate();
						var a = body.a;

						p.x += delta.x;
						p.y += delta.y;

						body.setTransform(p, a);
						body.resetJointAnchors();
						body.cacheData();
					}						
				}
				else if (selectionMode == SM_JOINTS) {
					for (var i = 0; i < selectedFeatureArr.length; i++) {
						var jointId = selectedFeatureArr[i];
						var joint = space.jointById((jointId >> 16) & 0xFFFF);
						var anchorIndex = jointId & 0xFFFF;

						if (anchorIndex == 0) {
							var anchor = joint.getWorldAnchor1();
							anchor.addself(delta);
							joint.setWorldAnchor1(anchor);
						}
						else {
							var anchor = joint.getWorldAnchor2();
							anchor.addself(delta);
							joint.setWorldAnchor2(anchor);
						}
					}
				}

				updateSidebar();
			}
			else {
				this.checkTransformAxis();
			}			
		}		
		editModeEventArr[EM_TRANSLATE].keyDown = function(keyCode) {
			if (keyCode == 27) {
				onClickedEditMode("select");
			}
		}

		editModeEventArr[EM_ROTATE] = {};
		editModeEventArr[EM_ROTATE].init = function() {
			domCanvas.style.cursor = "default";
		}
		editModeEventArr[EM_ROTATE].shutdown = function() {
		}
		editModeEventArr[EM_ROTATE].checkTransformAxis = function() {
			highlightFeatureArr = [];
			transformAxis = 0;

			var dsq = vec2.distsq(mousePosition, worldToCanvas(transformCenter));

			if (dsq > (GIZMO_RADIUS - SELECTABLE_CIRCLE_DIST_THREHOLD) * (GIZMO_RADIUS - SELECTABLE_CIRCLE_DIST_THREHOLD) &&
				dsq < (GIZMO_RADIUS + SELECTABLE_CIRCLE_DIST_THREHOLD) * (GIZMO_RADIUS + SELECTABLE_CIRCLE_DIST_THREHOLD)) {
				transformAxis = TRANSFORM_AXIS_Z;
			}
		}
		editModeEventArr[EM_ROTATE].mouseDown = function(ev) {
			if (ev.metaKey) {
				var pos = getMousePosition(ev);
				var p = canvasToWorld(pos);

				if (doSelect(p, SF_REPLACE)) {
					resetTransformCenter();
				}

				updateSidebar();
			}

			this.checkTransformAxis();
		}
		editModeEventArr[EM_ROTATE].mouseUp = function(ev) {
			if (!ev.metaKey && mouseDown && !mouseDownMoving) {
				var pos = getMousePosition(ev);
				var p = canvasToWorld(pos);

				if (snapEnabled) {
				 	p = snapPointByGrid(p);
				}
				transformCenter.copy(p);
				transformScale.set(1, 1);
			}
		}
		editModeEventArr[EM_ROTATE].mouseMove = function(ev) {
			if (mouseDown && transformAxis) {
				var wmp_new = canvasToWorld(mousePosition);
				var wmp_old = canvasToWorld(mousePositionOld);

				if (snapEnabled) {
				}

				var p1 = vec2.normalize(vec2.sub(wmp_old, transformCenter));
				var p2 = vec2.normalize(vec2.sub(wmp_new, transformCenter));
				var da = p2.toAngle() - p1.toAngle();

				if (selectionMode == SM_VERTICES) {
					for (var i = 0; i < selectedFeatureArr.length; i++) {
						var vertex = selectedFeatureArr[i];
						var shape = space.shapeById((vertex >> 16) & 0xFFFF);
						var body = shape.body;
						var index = vertex & 0xFFFF;

						var v = getShapeVertex(shape, index);

						var wv = vec2.add(vec2.rotate(vec2.sub(v, transformCenter), da), transformCenter);
						setShapeVertex(shape, index, wv);

						shape.finishVerts();
						body.resetMassData();
						body.cacheData();
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

						var vertexId1 = (shape.id << 16) | index;
						var vertexId2 = (shape.id << 16) | ((index + 1) % shape.verts.length);
						
						if (markedVertexArr.indexOf(vertexId1) == -1) {
							markedVertexArr.push(vertexId1);
							var wv = vec2.add(vec2.rotate(vec2.sub(v1, transformCenter), da), transformCenter);
							setShapeVertex(shape, index, wv);
						}

						if (markedVertexArr.indexOf(vertexId2) == -1) {
							markedVertexArr.push(vertexId2);
							var wv = vec2.add(vec2.rotate(vec2.sub(v2, transformCenter), da), transformCenter);
							setShapeVertex(shape, index + 1, wv);
						}

						shape.finishVerts();
						body.resetMassData();
						body.cacheData();
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
					}

					for (var i = 0; i < selectedFeatureArr.length; i++) {
						var shape = selectedFeatureArr[i];
						var body = shape.body;

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

						shape.finishVerts();
						body.resetMassData();
						body.cacheData();
					}
				}
				else if (selectionMode == SM_BODIES) {
					// Copy bodies
					if (!mouseDownMoving && ev.shiftKey) {
						for (var i = 0; i < selectedFeatureArr.length; i++) {
							var body = selectedFeatureArr[i];
							var dup = body.duplicate();

							space.addBody(dup);
							selectedFeatureArr[i] = dup;
						}
					}

					for (var i = 0; i < selectedFeatureArr.length; i++) {
						var body = selectedFeatureArr[i];

						var p = body.xf.t.duplicate();
						var a = body.a;

						p = vec2.add(vec2.rotate(vec2.sub(p, transformCenter), da), transformCenter);
						a += da;

						body.setTransform(p, a);
						body.resetJointAnchors();
						body.cacheData();
					}
				}
				else if (selectionMode == SM_JOINTS) {
					for (var i = 0; i < selectedFeatureArr.length; i++) {
						var jointId = selectedFeatureArr[i];
						var joint = space.jointById((jointId >> 16) & 0xFFFF);
						var anchorIndex = jointId & 0xFFFF;

						if (anchorIndex == 0) {
							var anchor = joint.getWorldAnchor1();
							anchor = vec2.add(vec2.rotate(vec2.sub(anchor, transformCenter), da), transformCenter);
							joint.setWorldAnchor1(anchor);
						}
						else {
							var anchor = joint.getWorldAnchor2();
							anchor = vec2.add(vec2.rotate(vec2.sub(anchor, transformCenter), da), transformCenter);
							joint.setWorldAnchor2(anchor);
						}
					}
				}

				updateSidebar();
			}
			else {			
				this.checkTransformAxis();
			}
		}		
		editModeEventArr[EM_ROTATE].keyDown = function(keyCode) {
			if (keyCode == 27) {
				onClickedEditMode("select");
			}
		}

		editModeEventArr[EM_SCALE] = {};
		editModeEventArr[EM_SCALE].init = function() {
			domCanvas.style.cursor = "default";
		}
		editModeEventArr[EM_SCALE].shutdown = function() {
		}
		editModeEventArr[EM_SCALE].checkTransformAxis = function() {
			highlightFeatureArr = [];
			transformAxis = 0;

			var center = worldToCanvas(transformCenter);
			var dsq = vec2.distsq(mousePosition, center);
			var cd = GIZMO_INNER_RADIUS;// + SELECTABLE_CIRCLE_DIST_THREHOLD;

			if (dsq < cd * cd) {
				transformAxis = TRANSFORM_AXIS_X | TRANSFORM_AXIS_Y;
			}
			else {
				var cd = GIZMO_SCALE_AXIS_BOX_EXTENT + SELECTABLE_LINE_DIST_THREHOLD;

				var px = vec2.add(center, new vec2(GIZMO_RADIUS, 0));
				var dx = Math.abs(mousePosition.x - px.x);
				var dy = Math.abs(mousePosition.y - px.y);				

				if (dx < cd && dy < cd) {
					transformAxis = TRANSFORM_AXIS_X;
				}
				else {					
					var py = vec2.add(center, new vec2(0, -GIZMO_RADIUS));
					var dx = Math.abs(mousePosition.x - py.x);
					var dy = Math.abs(mousePosition.y - py.y);

					if (dx < cd && dy < cd) {
						transformAxis = TRANSFORM_AXIS_Y;
					}
				}
			}				
		}
		editModeEventArr[EM_SCALE].mouseDown = function(ev) {
			if (ev.metaKey) {
				var pos = getMousePosition(ev);
				var p = canvasToWorld(pos);

				if (doSelect(p, SF_REPLACE)) {
					resetTransformCenter();
				}

				updateSidebar();
			}

			this.checkTransformAxis();
		}
		editModeEventArr[EM_SCALE].mouseUp = function(ev) {
			if (!ev.metaKey && mouseDown && !mouseDownMoving) {
				var pos = getMousePosition(ev);
				var p = canvasToWorld(pos);

				if (snapEnabled) {
				 	p = snapPointByGrid(p);
				}
				transformCenter.copy(p);
				transformScale.set(1, 1);
			}
		}
		editModeEventArr[EM_SCALE].mouseMove = function(ev) {
			if (mouseDown && transformAxis) {
				var wmp_new = canvasToWorld(mousePosition);
				var wmp_old = canvasToWorld(mousePositionOld);

				if (snapEnabled) {
					if (!mouseDownMoving) {
						snapCenterOffset = vec2.sub(transformCenter, wmp_old);
						snapOffset.set(0, 0);
					}

					wmp_new.addself(snapCenterOffset);
					var wmp_new_old = wmp_new;
					wmp_new = snapPointByGrid(wmp_new);
					
					wmp_old.addself(snapCenterOffset);
					wmp_old.addself(snapOffset);

					snapOffset = vec2.sub(wmp_new, wmp_new_old);
				}

				var wdx = wmp_new.x - wmp_old.x;
				var wdy = wmp_new.y - wmp_old.y;

				var scale_old = transformScale.duplicate();

				transformScale.x += wdx * 0.01;
				transformScale.y += wdy * 0.01;
				
				var scale = new vec2(transformScale.x / scale_old.x, transformScale.y / scale_old.y);

				if (!(transformAxis & TRANSFORM_AXIS_X)) {
					scale.x = 1;
				}

				if (!(transformAxis & TRANSFORM_AXIS_Y)) {
					scale.y = 1;
				}

				if (selectionMode == SM_VERTICES) {
					for (var i = 0; i < selectedFeatureArr.length; i++) {
						var vertexId = selectedFeatureArr[i];
						var shape = space.shapeById((vertexId >> 16) & 0xFFFF);
						var body = shape.body;							
						var index = vertexId & 0xFFFF;

						var v = getShapeVertex(shape, index);

						var wv = vec2.add(vec2.scale2(vec2.sub(v, transformCenter), scale), transformCenter);
						setShapeVertex(shape, index, wv);

						shape.finishVerts();
						shape.body.resetMassData();
						shape.body.cacheData();
					}
				}
				else if (selectionMode == SM_EDGES) {
					for (var i = 0; i < selectedFeatureArr.length; i++) {
						var edgeId = selectedFeatureArr[i];
						var shape = space.shapeById((edgeId >> 16) & 0xFFFF);
						var body = shape.body;							
						var index = edgeId & 0xFFFF;

						var v1 = getShapeVertex(shape, index);
						var v2 = getShapeVertex(shape, index + 1);

						var vertexId1 = (shape.id << 16) | index;
						var vertexId2 = (shape.id << 16) | ((index + 1) % shape.verts.length);					

						if (markedVertexArr.indexOf(vertexId1) == -1) {
							markedVertexArr.push(vertexId1);
							var wv = vec2.add(vec2.scale2(vec2.sub(v1, transformCenter), scale), transformCenter);
							setShapeVertex(shape, index, wv);	
						}

						if (markedVertexArr.indexOf(vertexId2) == -1) {
							markedVertexArr.push(vertexId2);
							var wv = vec2.add(vec2.scale2(vec2.sub(v2, transformCenter), scale), transformCenter);
							setShapeVertex(shape, index + 1, wv);
						}

						shape.finishVerts();
						shape.body.resetMassData();
						shape.body.cacheData();
					}
				}
				else if (selectionMode == SM_SHAPES) {
					for (var i = 0; i < selectedFeatureArr.length; i++) {
						var shape = selectedFeatureArr[i];
						var body = shape.body;

						switch (shape.type) {
						case Shape.TYPE_CIRCLE:
							var wv = vec2.add(vec2.scale2(vec2.sub(shape.tc, transformCenter), scale), transformCenter);
							shape.c.copy(body.getLocalPoint(wv));
							shape.r *= scale.x; // FIXME
							break;
						case Shape.TYPE_SEGMENT:
							var wa = vec2.add(vec2.scale2(vec2.sub(shape.ta, transformCenter), scale), transformCenter);
							var wv = vec2.add(vec2.scale2(vec2.sub(shape.ta, transformCenter), scale), transformCenter);
							shape.a.copy(body.getLocalPoint(wa));
							shape.b.copy(body.getLocalPoint(wb));
							shape.r *= scale.x; // FIXME
							break;
						case Shape.TYPE_POLY:
							for (var j = 0; j < shape.tverts.length; j++) {
								var wv = vec2.add(vec2.scale2(vec2.sub(shape.tverts[j], transformCenter), scale), transformCenter);
								shape.verts[j].copy(body.getLocalPoint(wv));
							}
							break;
						}

						shape.finishVerts();
						shape.body.resetMassData();
						shape.body.cacheData();
					}
				}
				else if (selectionMode == SM_BODIES) {
					// NOT AVAILABLE
				}
				else if (selectionMode == SM_JOINTS) {					
					for (var i = 0; i < selectedFeatureArr.length; i++) {
						var jointId = selectedFeatureArr[i];
						var joint = space.jointById((jointId >> 16) & 0xFFFF);
						var anchorIndex = jointId & 0xFFFF;

						if (anchorIndex == 0) {
							var anchor = joint.getWorldAnchor1();
							anchor = vec2.add(vec2.scale2(vec2.sub(anchor, transformCenter), scale), transformCenter);
							joint.setWorldAnchor1(anchor);
						}
						else {
							var anchor = joint.getWorldAnchor2();
							anchor = vec2.add(vec2.scale2(vec2.sub(anchor, transformCenter), scale), transformCenter);							
							joint.setWorldAnchor2(anchor);
						}
					}				
				}

				updateSidebar();
			}
			else {
				this.checkTransformAxis();
			}
		}	
		editModeEventArr[EM_SCALE].keyDown = function(keyCode) {
			if (keyCode == 27) {
				onClickedEditMode("select");
			}
		}
		
		editModeEventArr[EM_CREATE_CIRCLE] = {};
		editModeEventArr[EM_CREATE_CIRCLE].init = function() {
			domCanvas.style.cursor = "crosshair";
		}
		editModeEventArr[EM_CREATE_CIRCLE].shutdown = function() {
		}
		editModeEventArr[EM_CREATE_CIRCLE].mouseDown = function(ev) {
			var p = canvasToWorld(mousePosition);
			if (snapEnabled) {
				p = snapPointByGrid(p);
			}

			if (!creatingBody) {				
				creatingBody = new Body(Body.DYNAMIC, p);
				var shape = new ShapeCircle(0, 0, 0);
				shape.density = DEFAULT_DENSITY;
				shape.e = DEFAULT_RESTITUTION;
				shape.u = DEFAULT_FRICTION;
				creatingBody.addShape(shape);
				space.addBody(creatingBody);						
			}
		}
		editModeEventArr[EM_CREATE_CIRCLE].mouseUp = function(ev) {			
			if (creatingBody) {
				var shape = creatingBody.shapeArr[0];
				if (shape.area() < 0.0001) {
					space.removeBody(creatingBody);
					delete shape;
					delete creatingBody;					
				}

				creatingBody = null;
			}
		}
		editModeEventArr[EM_CREATE_CIRCLE].mouseMove = function(ev) {
			if (mouseDown && creatingBody) {
				var p1 = canvasToWorld(mouseDownPosition);
				var p2 = canvasToWorld(mousePosition);

				if (snapEnabled) {
					p1 = snapPointByGrid(p1);
					p2 = snapPointByGrid(p2);
				}

				var shape = creatingBody.shapeArr[0];
				shape.r = vec2.dist(p2, creatingBody.shapeArr[0].tc);
				shape.body.resetMassData();					
				shape.body.cacheData();

				updateSidebar();
			}
		}
		editModeEventArr[EM_CREATE_CIRCLE].keyDown = function(keyCode) {
			if (keyCode == 27) {
				creatingBody = null;
			}
		}

		editModeEventArr[EM_CREATE_TRIANGLE] = {};
		editModeEventArr[EM_CREATE_TRIANGLE].init = function() {
			domCanvas.style.cursor = "crosshair";
		}
		editModeEventArr[EM_CREATE_TRIANGLE].shutdown = function() {
		}
		editModeEventArr[EM_CREATE_TRIANGLE].mouseDown = function(ev) {
			var p = canvasToWorld(mousePosition);
			if (snapEnabled) {
				p = snapPointByGrid(p);
			}

			if (!creatingBody) {
				creatingBody = new Body(Body.DYNAMIC, p);
				var shape = new ShapeTriangle(p, p, p);
				shape.density = DEFAULT_DENSITY;
				shape.e = DEFAULT_RESTITUTION;
				shape.u = DEFAULT_FRICTION;
				creatingBody.addShape(shape);
				space.addBody(creatingBody);
			}
		}
		editModeEventArr[EM_CREATE_TRIANGLE].mouseUp = function(ev) {
			if (creatingBody) {
				var shape = creatingBody.shapeArr[0];
				if (shape.area() < 0.0001) {
					space.removeBody(creatingBody);
					delete shape;
					delete creatingBody;
				}

				creatingBody = null;				
			}
		}
		editModeEventArr[EM_CREATE_TRIANGLE].mouseMove = function(ev) {
			if (mouseDown && creatingBody) {
				var p1 = canvasToWorld(mouseDownPosition);
				var p2 = canvasToWorld(mousePosition);

				if (snapEnabled) {
					p1 = snapPointByGrid(p1);
					p2 = snapPointByGrid(p2);
				}

				var p3 = new vec2(p2.x, p1.y);
				var delta = vec2.sub(p2, p1);
				var ccw = (delta.x > 0) ^ (delta.y > 0);
				
				creatingBody.setTransform(p1.y < p2.y ? p1 : p3, 0);

				var wv = [];
				wv.push(p1);
				if (ccw) {
					wv.push(p2);
					wv.push(p3);
				}
				else {
					wv.push(p3);
					wv.push(p2);
				}

				var shape = creatingBody.shapeArr[0];

				for (var i = 0; i < 3; i++) {
					shape.verts[i].copy(creatingBody.getLocalPoint(wv[i]));
				}

				shape.finishVerts();
				shape.body.resetMassData();
				shape.body.cacheData();

				updateSidebar();
			}
		}
		editModeEventArr[EM_CREATE_TRIANGLE].keyDown = function(keyCode) {}

		editModeEventArr[EM_CREATE_BOX] = {};
		editModeEventArr[EM_CREATE_BOX].init = function() {
			domCanvas.style.cursor = "crosshair";
		}
		editModeEventArr[EM_CREATE_BOX].shutdown = function() {
		}
		editModeEventArr[EM_CREATE_BOX].mouseDown = function(ev) {
			var p = canvasToWorld(mousePosition);
			if (snapEnabled) {
				p = snapPointByGrid(p);
			}

			if (!creatingBody) {						
				creatingBody = new Body(Body.DYNAMIC, p);
				var shape = new ShapeBox(0, 0, 0, 0);
				shape.density = DEFAULT_DENSITY;
				shape.e = DEFAULT_RESTITUTION;
				shape.u = DEFAULT_FRICTION;
				creatingBody.addShape(shape);
				space.addBody(creatingBody);
			}
		}
		editModeEventArr[EM_CREATE_BOX].mouseUp = function(ev) {
			if (creatingBody) {
				var shape = creatingBody.shapeArr[0];
				if (shape.area() < 0.0001) {
					space.removeBody(creatingBody);
					delete shape;
					delete creatingBody;
				}

				creatingBody = null;
			}
		}
		editModeEventArr[EM_CREATE_BOX].mouseMove = function(ev) {
			if (mouseDown && creatingBody) {
				var p1 = canvasToWorld(mouseDownPosition);
				var p2 = canvasToWorld(mousePosition);
				
				if (snapEnabled) {
					p1 = snapPointByGrid(p1);
					p2 = snapPointByGrid(p2);
				}

				var mins = new vec2(p1.x, p1.y);
				var maxs = new vec2(p2.x, p2.y);

				if (p1.x > p2.x) { mins.x = p2.x; maxs.x = p1.x; }
				if (p1.y > p2.y) { mins.y = p2.y; maxs.y = p1.y; }

				var center = vec2.lerp(mins, maxs, 0.5);
				creatingBody.setTransform(center, 0);

				var wv = new Array(4);
				wv[0] = new vec2(mins.x, mins.y);
				wv[1] = new vec2(maxs.x, mins.y);
				wv[2] = new vec2(maxs.x, maxs.y);
				wv[3] = new vec2(mins.x, maxs.y);					

				var shape = creatingBody.shapeArr[0];

				for (var i = 0; i < 4; i++) {
					shape.verts[i].copy(creatingBody.getLocalPoint(wv[i]));
				}

				shape.finishVerts();
				shape.body.resetMassData();
				shape.body.cacheData();

				updateSidebar();
			}
		}
		editModeEventArr[EM_CREATE_BOX].keyDown = function(keyCode) {}

		editModeEventArr[EM_CREATE_HEXAGON] = {};
		editModeEventArr[EM_CREATE_HEXAGON].init = function() {
			domCanvas.style.cursor = "crosshair";
		}
		editModeEventArr[EM_CREATE_HEXAGON].shutdown = function() {
		}
		editModeEventArr[EM_CREATE_HEXAGON].mouseDown = function(ev) {
			var p = canvasToWorld(mousePosition);
			if (snapEnabled) {
				p = snapPointByGrid(p);
			}

			if (!creatingBody) {				
				creatingBody = new Body(Body.DYNAMIC, p);
				var verts = new Array(6);
				for (var i = 0; i < 6; i++) {
					verts[i] = p;
				}
				var shape = new ShapePoly(verts);
				shape.density = DEFAULT_DENSITY;
				shape.e = DEFAULT_RESTITUTION;
				shape.u = DEFAULT_FRICTION;
				creatingBody.addShape(shape);
				space.addBody(creatingBody);
			}
		}
		editModeEventArr[EM_CREATE_HEXAGON].mouseUp = function(ev) {
			if (creatingBody) {
				var shape = creatingBody.shapeArr[0];
				if (shape.area() < 0.0001) {
					space.removeBody(creatingBody);
					delete shape;
					delete creatingBody;
				}

				creatingBody = null;
			}
		}
		editModeEventArr[EM_CREATE_HEXAGON].mouseMove = function(ev) {
			if (mouseDown && creatingBody) {
				var p1 = canvasToWorld(mouseDownPosition);
				var p2 = canvasToWorld(mousePosition);
				
				if (snapEnabled) {
					p1 = snapPointByGrid(p1);
					p2 = snapPointByGrid(p2);
				}

				var mins = new vec2(p1.x, p1.y);
				var maxs = new vec2(p2.x, p2.y);

				if (p1.x > p2.x) { mins.x = p2.x; maxs.x = p1.x; }
				if (p1.y > p2.y) { mins.y = p2.y; maxs.y = p1.y; }

				var center = vec2.lerp(mins, maxs, 0.5);
				creatingBody.setTransform(center, 0);

				var wv = new Array(6);
				wv[0] = new vec2(mins.x, center.y);
				wv[1] = new vec2((mins.x + center.x) * 0.5, mins.y);
				wv[2] = new vec2((maxs.x + center.x) * 0.5, mins.y);
				wv[3] = new vec2(maxs.x, center.y);
				wv[4] = new vec2((maxs.x + center.x) * 0.5, maxs.y);
				wv[5] = new vec2((mins.x + center.x) * 0.5, maxs.y);

				var shape = creatingBody.shapeArr[0];

				for (var i = 0; i < 6; i++) {
					shape.verts[i].copy(creatingBody.getLocalPoint(wv[i]));
				}

				shape.finishVerts();
				shape.body.resetMassData();
				shape.body.cacheData();

				updateSidebar();
			}
		}
		editModeEventArr[EM_CREATE_HEXAGON].keyDown = function(keyCode) {}

		editModeEventArr[EM_CREATE_POLY] = {};
		editModeEventArr[EM_CREATE_POLY].init = function() {
			domCanvas.style.cursor = "crosshair";
		}
		editModeEventArr[EM_CREATE_POLY].shutdown = function() {
			creatingBody = null;
		}
		editModeEventArr[EM_CREATE_POLY].mouseDown = function(ev) {
			var p = canvasToWorld(mousePosition);
			if (snapEnabled) {
				p = snapPointByGrid(p);
			}
			
			if (!creatingBody) {
				creatingBody = new Body(Body.DYNAMIC, p);
				var shape = new ShapePoly();
				shape.density = DEFAULT_DENSITY;
				shape.e = DEFAULT_RESTITUTION;
				shape.u = DEFAULT_FRICTION;
				creatingBody.addShape(shape);
				space.addBody(creatingBody);
			}

			var shape = creatingBody.shapeArr[0];
			shape.verts.push(creatingBody.getLocalPoint(p));

			shape.finishVerts();
			shape.body.resetMassData();
			shape.body.cacheData();
		}
		editModeEventArr[EM_CREATE_POLY].mouseUp = function(ev) {			
		}
		editModeEventArr[EM_CREATE_POLY].mouseMove = function(ev) {
			if (mouseDown && creatingBody) {
				var p = canvasToWorld(mousePosition);
				
				if (snapEnabled) {
					p = snapPointByGrid(p);
				}

				var shape = creatingBody.shapeArr[0];
				var last_v = shape.verts[shape.verts.length - 1];
				last_v.copy(creatingBody.getLocalPoint(p));

				shape.finishVerts();
				shape.body.resetMassData();
				shape.body.cacheData();

				updateSidebar();
			}
		}
		editModeEventArr[EM_CREATE_POLY].keyDown = function(keyCode) {
			if (keyCode == 27) {
				creatingBody = null;
			}	
		}

		editModeEventArr[EM_CREATE_ANGLE_JOINT] = {};
		editModeEventArr[EM_CREATE_ANGLE_JOINT].init = function() {
			domCanvas.style.cursor = "crosshair";

			if (selectionMode == SM_BODIES && selectedFeatureArr.length == 2) {		
				if (!creatingJoint) {
					var body1 = selectedFeatureArr[0];
					var body2 = selectedFeatureArr[1];

					creatingJoint = new AngleJoint(body1, body2);
					space.addJoint(creatingJoint);
				}

				creatingJoint = null;
			}
		}
		editModeEventArr[EM_CREATE_ANGLE_JOINT].shutdown = function() {
		}
		editModeEventArr[EM_CREATE_ANGLE_JOINT].mouseDown = function(ev) {			
		}
		editModeEventArr[EM_CREATE_ANGLE_JOINT].mouseUp = function(ev) {			
		}
		editModeEventArr[EM_CREATE_ANGLE_JOINT].mouseMove = function(ev) {
		}
		editModeEventArr[EM_CREATE_ANGLE_JOINT].keyDown = function(keyCode) {
			if (keyCode == 27) {
				creatingJoint = null;
			}
		}

		editModeEventArr[EM_CREATE_REVOLUTE_JOINT] = {};
		editModeEventArr[EM_CREATE_REVOLUTE_JOINT].init = function() {
			domCanvas.style.cursor = "crosshair";
		};
		editModeEventArr[EM_CREATE_REVOLUTE_JOINT].shutdown = function() {
		}
		editModeEventArr[EM_CREATE_REVOLUTE_JOINT].mouseDown = function(ev) {
			if (selectionMode == SM_BODIES && selectedFeatureArr.length == 2) {
				var p = canvasToWorld(mousePosition);
				if (snapEnabled) {
					p = snapPointByGrid(p);
				}
				
				if (!creatingJoint) {
					var body1 = selectedFeatureArr[0];
					var body2 = selectedFeatureArr[1];

					creatingJoint = new RevoluteJoint(body1, body2, p);
					space.addJoint(creatingJoint);
				}
			}
		}
		editModeEventArr[EM_CREATE_REVOLUTE_JOINT].mouseUp = function(ev) {
			creatingJoint = null;
		}
		editModeEventArr[EM_CREATE_REVOLUTE_JOINT].mouseMove = function(ev) {
			if (mouseDown && creatingJoint) {
				var p = canvasToWorld(mousePosition);
				
				if (snapEnabled) {
					p = snapPointByGrid(p);
				}
				
				creatingJoint.setWorldAnchor1(p);
			}
		}		
		editModeEventArr[EM_CREATE_REVOLUTE_JOINT].keyDown = function(keyCode) {
			if (keyCode == 27) {
				creatingJoint = null;
			}
		}

		editModeEventArr[EM_CREATE_WELD_JOINT] = {};
		editModeEventArr[EM_CREATE_WELD_JOINT].init = function() {
			domCanvas.style.cursor = "crosshair";
		}
		editModeEventArr[EM_CREATE_WELD_JOINT].shutdown = function() {
		}
		editModeEventArr[EM_CREATE_WELD_JOINT].mouseDown = function(ev) {
			if (selectionMode == SM_BODIES && selectedFeatureArr.length == 2) {
				var p = canvasToWorld(mousePosition);
				if (snapEnabled) {
					p = snapPointByGrid(p);
				}
				
				if (!creatingJoint) {
					var body1 = selectedFeatureArr[0];
					var body2 = selectedFeatureArr[1];

					creatingJoint = new WeldJoint(body1, body2, p);
					space.addJoint(creatingJoint);
				}
			}
		}
		editModeEventArr[EM_CREATE_WELD_JOINT].mouseUp = function(ev) {
			creatingJoint = null;
		}
		editModeEventArr[EM_CREATE_WELD_JOINT].mouseMove = function(ev) {
			if (mouseDown && creatingJoint) {
				var p = canvasToWorld(mousePosition);
				
				if (snapEnabled) {
					p = snapPointByGrid(p);
				}
				
				creatingJoint.setWorldAnchor1(p);
			}
		}
		editModeEventArr[EM_CREATE_WELD_JOINT].keyDown = function(keyCode) {
			if (keyCode == 27) {
				creatingJoint = null;
			}
		}

		editModeEventArr[EM_CREATE_LINE_JOINT] = {};
		editModeEventArr[EM_CREATE_LINE_JOINT].init = function() {
			domCanvas.style.cursor = "crosshair";
		}
		editModeEventArr[EM_CREATE_LINE_JOINT].shutdown = function() {
		}
		editModeEventArr[EM_CREATE_LINE_JOINT].mouseDown = function(ev) {
			if (selectionMode == SM_BODIES && selectedFeatureArr.length == 2) {
				var p = canvasToWorld(mousePosition);
				if (snapEnabled) {
					p = snapPointByGrid(p);
				}
				
				if (!creatingJoint) {
					var body1 = selectedFeatureArr[0];
					var body2 = selectedFeatureArr[1];

					creatingJoint = new LineJoint(body1, body2, p, p);
					space.addJoint(creatingJoint);
				}
			}
		}
		editModeEventArr[EM_CREATE_LINE_JOINT].mouseUp = function(ev) {
			creatingJoint = null;
		}
		editModeEventArr[EM_CREATE_LINE_JOINT].mouseMove = function(ev) {		
			if (mouseDown && creatingJoint) {
				var p = canvasToWorld(mousePosition);
				
				if (snapEnabled) {
					p = snapPointByGrid(p);
				}
				
				creatingJoint.setWorldAnchor2(p);
			}
		}
		editModeEventArr[EM_CREATE_LINE_JOINT].keyDown = function(keyCode) {
			if (keyCode == 27) {
				creatingJoint = null;
			}
		}

		editModeEventArr[EM_CREATE_PRISMATIC_JOINT] = {};
		editModeEventArr[EM_CREATE_PRISMATIC_JOINT].init = function() {
			domCanvas.style.cursor = "crosshair";
		}
		editModeEventArr[EM_CREATE_PRISMATIC_JOINT].shutdown = function() {
		}
		editModeEventArr[EM_CREATE_PRISMATIC_JOINT].mouseDown = function(ev) {
			if (selectionMode == SM_BODIES && selectedFeatureArr.length == 2) {
				var p = canvasToWorld(mousePosition);
				if (snapEnabled) {
					p = snapPointByGrid(p);
				}
				
				if (!creatingJoint) {
					var body1 = selectedFeatureArr[0];
					var body2 = selectedFeatureArr[1];

					creatingJoint = new PrismaticJoint(body1, body2, p, p);
					space.addJoint(creatingJoint);
				}
			}
		}
		editModeEventArr[EM_CREATE_PRISMATIC_JOINT].mouseUp = function(ev) {
			creatingJoint = null;
		}
		editModeEventArr[EM_CREATE_PRISMATIC_JOINT].mouseMove = function(ev) {		
			if (mouseDown && creatingJoint) {
				var p = canvasToWorld(mousePosition);
				
				if (snapEnabled) {
					p = snapPointByGrid(p);
				}
				
				creatingJoint.setWorldAnchor2(p);
			}
		}
		editModeEventArr[EM_CREATE_PRISMATIC_JOINT].keyDown = function(keyCode) {
			if (keyCode == 27) {
				creatingJoint = null;
			}
		}

		editModeEventArr[EM_CREATE_DISTANCE_JOINT] = {};
		editModeEventArr[EM_CREATE_DISTANCE_JOINT].init = function() {
			domCanvas.style.cursor = "crosshair";
		}
		editModeEventArr[EM_CREATE_DISTANCE_JOINT].shutdown = function() {
		}
		editModeEventArr[EM_CREATE_DISTANCE_JOINT].mouseDown = function(ev) {
			if (selectionMode == SM_BODIES && selectedFeatureArr.length == 2) {
				var p = canvasToWorld(mousePosition);
				if (snapEnabled) {
					p = snapPointByGrid(p);
				}
				
				if (!creatingJoint) {
					var body1 = selectedFeatureArr[0];
					var body2 = selectedFeatureArr[1];

					creatingJoint = new DistanceJoint(body1, body2, p, p);
					space.addJoint(creatingJoint);
				}
			}
		}
		editModeEventArr[EM_CREATE_DISTANCE_JOINT].mouseUp = function(ev) {
			creatingJoint = null;
		}
		editModeEventArr[EM_CREATE_DISTANCE_JOINT].mouseMove = function(ev) {		
			if (mouseDown && creatingJoint) {
				var p = canvasToWorld(mousePosition);
				
				if (snapEnabled) {
					p = snapPointByGrid(p);
				}
				
				creatingJoint.setWorldAnchor2(p);
			}
		}
		editModeEventArr[EM_CREATE_DISTANCE_JOINT].keyDown = function(keyCode) {
			if (keyCode == 27) {
				creatingJoint = null;
			}
		}

		editModeEventArr[EM_COLLAPSE_BODIES] = {};
		editModeEventArr[EM_COLLAPSE_BODIES].init = function() {
			if (selectionMode == SM_BODIES && selectedFeatureArr.length >= 2) {
				var primaryBody = selectedFeatureArr[0];

				for (var i = 1; i < selectedFeatureArr.length; i++) {
					var body = selectedFeatureArr[i];

					for (var j = 0; j < body.shapeArr.length; j++) {
						var shape = body.shapeArr[j];						
						shape.transform(body.xf);
						shape.untransform(primaryBody.xf);
						primaryBody.addShape(shape);
					}

					for (var j in body.jointHash) {
						var joint = body.jointHash[j];

						var anchor1 = joint.getWorldAnchor1();
						var anchor2 = joint.getWorldAnchor2();

						if (joint.body1 == body) {							
							joint.body1 = primaryBody;
							joint.setWorldAnchor1(anchor1);
						}
						else if (joint.body2 == body) {
							joint.body2 = primaryBody;
							joint.setWorldAnchor2(anchor2);
						}
					}

					body.jointHash = {};
					space.removeBody(body);					
				}

				primaryBody.resetMassData();
				primaryBody.cacheData();
			}

			onClickedEditMode("select");
		}
		editModeEventArr[EM_COLLAPSE_BODIES].shutdown = function() {
		}
		editModeEventArr[EM_COLLAPSE_BODIES].mouseDown = function(ev) {}
		editModeEventArr[EM_COLLAPSE_BODIES].mouseUp = function(ev) {}
		editModeEventArr[EM_COLLAPSE_BODIES].mouseMove = function(ev) {}
		editModeEventArr[EM_COLLAPSE_BODIES].keyDown = function(keyCode) {}

		editModeEventArr[EM_EDGE_SLICE] = {};
		editModeEventArr[EM_EDGE_SLICE].init = function() {
			domCanvas.style.cursor = "crosshair";

			if (selectionMode == SM_EDGES) {
				// Sort by incremental order
				selectedFeatureArr.sort(function(a, b) { return (a & 0xFFFF) - (b & 0xFFFF); });

				var new_selectedFeatureArr = [];
				var prev_shape_id = -1;
				var addedCount = 0;

				for (var i = 0; i < selectedFeatureArr.length; i++) {
					var edgeId = selectedFeatureArr[i];
					var shape_id = (edgeId >> 16) & 0xFFFF;
					var shape = space.shapeById(shape_id);

					if (shape_id != prev_shape_id) {
						addedCount = 0;
					}

					if (shape.type == Shape.TYPE_POLY) {
						var index1 = (edgeId & 0xFFFF) + addedCount;
						var index2 = index1 + 1;

						var new_vert = vec2.lerp(shape.verts[index1], shape.verts[index2 % shape.verts.length], 0.5);

						shape.verts.splice(index2, 0, new_vert);

						shape.finishVerts();
						shape.body.cacheData();

						var newEdgeId1 = (shape.id << 16) | index1;
						var newEdgeId2 = (shape.id << 16) | index2;

						new_selectedFeatureArr.push(newEdgeId1);
						new_selectedFeatureArr.push(newEdgeId2);

						addedCount++;
					}		

					prev_shape_id = shape_id;
				}

				selectedFeatureArr = new_selectedFeatureArr;
			}
		}
		editModeEventArr[EM_EDGE_SLICE].shutdown = function() {
		}
		editModeEventArr[EM_EDGE_SLICE].mouseDown = function(ev) {
			if (selectionMode == SM_BODIES && selectedFeatureArr.length == 2) {
				var p = canvasToWorld(mousePosition);								
			}
		}
		editModeEventArr[EM_EDGE_SLICE].mouseUp = function(ev) {
			onClickedEditMode("select");
		}
		editModeEventArr[EM_EDGE_SLICE].mouseMove = function(ev) {		
			if (mouseDown) {
				var p = canvasToWorld(mousePosition);
			}
		}
		editModeEventArr[EM_EDGE_SLICE].keyDown = function(keyCode) {}
	}	

	function onLoad() {
		// HACK
		onResize();

		// Add scenes from demos
		var combobox = domToolbar.querySelector("#scene");
		for (var i = 0; i < demoArr.length; i++) {
			var option = document.createElement("option");
			var name = demoArr[i].name();
			option.text = name;
			option.value = name;
			combobox.add(option);
			sceneNameArr.push(name);
		}
/*
		// Add scenes by loading JSON files from server
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

		renderer = RendererCanvas;

		selectionPattern = createCheckPattern(selectionColor);
		highlightPattern = createCheckPattern(highlightColor);
		//testImage = createImage("img/glyphicons-halflings-white.png");

		collision.init();

		space = new Space();

		mouseBody = new Body(Body.KINETIC);
		mouseBody.resetMassData();
		space.addBody(mouseBody);

		resetScene();

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
		var editButton = domToolbar.querySelector("#edit");
		var snapButton = domToolbar.querySelector("#toggle_snap");
		var playerSpan = domToolbar.querySelector("#player");
		var selectionModeSpan = domToolbar.querySelector("#selectionmode");		
		var selectionModeButtons = domToolbar.querySelectorAll("#selectionmode > [name=selectionmode]");
		
		if (editorEnabled) {
			// show / hide
			playerSpan.style.display = "none";
			selectionModeSpan.style.display = "inline";
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
		
			// snap button			
			if (snapEnabled) {
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
			snapButton.style.display = "none";

			// edit button
			editButton.innerHTML = "Edit";
		}

		updatePauseButton();
	}

	function updatePauseButton() {
		var button = domToolbar.querySelector("#player > [value=pause]");
		button.innerHTML = pause ? "<i class='icon-white icon-play'></i>" : "<i class='icon-white icon-pause'></i>";
	}

	function updateSidebar() {
		var editModeButtons = domSidebar.querySelectorAll("[name=editmode]");

		if (editorEnabled) {
			domSidebar.style.display = "table-cell";

			// edit mode buttons
			var value = ["select", "translate", "rotate", "scale", 
				"create_circle", "create_triangle", "create_box", "create_hexagon", "create_poly",
				"create_angle_joint", "create_revolute_joint", "create_weld_joint", 
				"create_line_joint", "create_prismatic_joint", "create_distance_joint",
				"collapse_bodies", "edge_slice"][editMode];

			for (var i = 0; i < editModeButtons.length; i++) {
				var e = editModeButtons[i];
				
				if (e.value == value) {
					if (e.className.indexOf(" pushed") == -1) {
						e.className += " pushed";
					}
				}
				else {
					e.className = e.className.replace(" pushed", "");
				}
			}

			domVertexInspector.style.display = "none";
			domEdgeInspector.style.display = "none";
			domShapeInspector.style.display = "none";
			domBodyInspector.style.display = "none";
			domJointInspector.style.display = "none";

			if (selectionMode == SM_VERTICES) {
				if (selectedFeatureArr.length == 1) {
					var vertexId = selectedFeatureArr[0];
					var shape = space.shapeById((vertexId >> 16) & 0xFFFF);
					var index = vertexId & 0xFFFF;

					domVertexInspector.style.display = "block";

					var v = getShapeVertex(shape, index);

					var el = domVertexInspector.querySelector("[name=index]");
					el.value = index;

					var el = domVertexInspector.querySelector("[name=position_x]");
					el.value = v.x.toFixed(2);

					var el = domVertexInspector.querySelector("[name=position_y]");
					el.value = v.y.toFixed(2);
				}
			}
			else if (selectionMode == SM_EDGES) {
				if (selectedFeatureArr.length == 1) {
					var edgeId = selectedFeatureArr[0];
					var shape = space.shapeById((edgeId >> 16) & 0xFFFF);
					var index = edgeId & 0xFFFF;

					domEdgeInspector.style.display = "block";

					var v1 = getShapeVertex(shape, index);
					var v2 = getShapeVertex(shape, index + 1);

					var el = domEdgeInspector.querySelector("[name=index]");
					el.value = index;

					var el = domEdgeInspector.querySelector("[name=v1_position_x]");
					el.value = v1.x.toFixed(2);

					var el = domEdgeInspector.querySelector("[name=v1_position_y]");
					el.value = v1.y.toFixed(2);

					var el = domEdgeInspector.querySelector("[name=v2_position_x]");
					el.value = v2.x.toFixed(2);

					var el = domEdgeInspector.querySelector("[name=v2_position_y]");
					el.value = v2.y.toFixed(2);
				}
			}
			else if (selectionMode == SM_SHAPES) {
				if (selectedFeatureArr.length == 1) {
					var shape = selectedFeatureArr[0];

					domShapeInspector.style.display = "block";

					var el = domShapeInspector.querySelector("[name=type]");
					el.value = ["Circle", "Segment", "Poly"][shape.type];

					var el = domShapeInspector.querySelector("[name=radius]");
					if (shape.type == Shape.TYPE_CIRCLE || shape.type == Shape.TYPE_SEGMENT) {
						el.parentNode.style.display = "block";
						el.value = shape.r.toFixed(2);
					}
					else {
						el.parentNode.style.display = "none";
					}

					var el = domShapeInspector.querySelector("[name=density]");
					el.value = shape.density.toFixed(6);

					var el = domShapeInspector.querySelector("[name=restitution]");
					el.value = shape.e.toFixed(2);

					var el = domShapeInspector.querySelector("[name=friction]");
					el.value = shape.u.toFixed(2);					
				}
			}
			else if (selectionMode == SM_BODIES) {			
				if (selectedFeatureArr.length == 1) {				
					var body = selectedFeatureArr[0];

					domBodyInspector.style.display = "block";

					var el = domBodyInspector.querySelector("[name=type]");
					el.value = ["Static", "Kinetic", "Dynamic"][body.type];

					var el = domBodyInspector.querySelector("[name=name]");
					el.value = body.name;

					var el = domBodyInspector.querySelector("[name=position_x]");
					el.value = body.xf.t.x.toFixed(2);

					var el = domBodyInspector.querySelector("[name=position_y]");
					el.value = body.xf.t.y.toFixed(2);

					var el = domBodyInspector.querySelector("[name=angle]");
					el.value = rad2deg(body.a).toFixed(1);

					if (!body.isStatic()) {
						var el = domBodyInspector.querySelector("[name=mass]");
						el.disabled = false;
						el.value = body.m.toFixed(2);

						var el = domBodyInspector.querySelector("[name=inertia]");
						el.disabled = false;
						el.value = body.i.toFixed(2);
					}
					else {
						var el = domBodyInspector.querySelector("[name=mass]");
						el.disabled = true;
						el.value = "0"

						var el = domBodyInspector.querySelector("[name=inertia]");
						el.disabled = true;
						el.value = "0";
					}
				}
			}
			else if (selectionMode == SM_JOINTS) {
				if (selectedFeatureArr.length == 1) {
					var jointId = selectedFeatureArr[0];
					var joint = space.jointById((jointId >> 16) & 0xFFFF);
					var anchorIndex = jointId & 0xFFFF;

					domJointInspector.style.display = "block";

					var el = domJointInspector.querySelector("[name=type]");
					el.value = ["Angle", "Revolute", "Weld", "Line", "Prismatic", "Distance", "Mouse"][joint.type];

					var el = domJointInspector.querySelector("[name=body1]");
					el.value = new String(joint.body1.name);

					var el = domJointInspector.querySelector("[name=body2]");
					el.value = new String(joint.body2.name);

					if (joint.type == Joint.TYPE_ANGLE) {
						var el = domJointInspector.querySelector("[name=anchor_position_x]");
						el.parentNode.style.display = "none";

						var el = domJointInspector.querySelector("[name=anchor_position_y]");
						el.parentNode.style.display = "none";
					}
					else {
						var el = domJointInspector.querySelector("[name=anchor_position_x]");
						el.parentNode.style.display = "block";
						var anchor = anchorIndex == 0 ? joint.getWorldAnchor1() : joint.getWorldAnchor2();
						el.value = anchor.x.toFixed(2);

						var el = domJointInspector.querySelector("[name=anchor_position_y]");
						el.parentNode.style.display = "block";
						var anchor = anchorIndex == 0 ? joint.getWorldAnchor1() : joint.getWorldAnchor2();
						el.value = anchor.y.toFixed(2);
					}

					if (joint.type == Joint.TYPE_REVOLUTE) {
						var el = domJointInspector.querySelector("[name=enable_limit]");
						el.parentNode.style.display = "block";
						el.checked = joint.limitEnabled;

						if (joint.limitEnabled) {
							var el = domJointInspector.querySelector("[name=limit_lower_angle]");
							el.parentNode.style.display = "block";
							el.value = rad2deg(joint.limitLowerAngle).toFixed(1);

							var el = domJointInspector.querySelector("[name=limit_upper_angle]");
							el.parentNode.style.display = "block";
							el.value = rad2deg(joint.limitUpperAngle).toFixed(1);
						}
						else {
							var el = domJointInspector.querySelector("[name=limit_lower_angle]");
							el.parentNode.style.display = "none";

							var el = domJointInspector.querySelector("[name=limit_upper_angle]");
							el.parentNode.style.display = "none";
						}
					}
					else {
						var el = domJointInspector.querySelector("[name=enable_limit]");
						el.parentNode.style.display = "none";
						el.checked = false;

						var el = domJointInspector.querySelector("[name=limit_lower_angle]");
						el.parentNode.style.display = "none";

						var el = domJointInspector.querySelector("[name=limit_upper_angle]");
						el.parentNode.style.display = "none";
					}

					if (joint.type == Joint.TYPE_REVOLUTE || joint.type == Joint.TYPE_LINE) {
						var el = domJointInspector.querySelector("[name=enable_motor]");
						el.parentNode.style.display = "block";
						el.checked = joint.motorEnabled;

						if (joint.motorEnabled) {
							var el = domJointInspector.querySelector("[name=motor_speed]");
							el.parentNode.style.display = "block";
							el.value = joint.motorSpeed.toFixed(2);

							var el = domJointInspector.querySelector("[name=max_motor_torque]");
							el.parentNode.style.display = "block";
							el.value = joint.maxMotorTorque.toFixed(2);
						}
						else {
							var el = domJointInspector.querySelector("[name=motor_speed]");
							el.parentNode.style.display = "none";

							var el = domJointInspector.querySelector("[name=max_motor_torque]");
							el.parentNode.style.display = "none";
						}
					}
					else {
						var el = domJointInspector.querySelector("[name=enable_motor]");
						el.parentNode.style.display = "none";

						var el = domJointInspector.querySelector("[name=motor_speed]");
						el.parentNode.style.display = "none";

						var el = domJointInspector.querySelector("[name=max_motor_torque]");
						el.parentNode.style.display = "none";
					}

					if (joint.type == Joint.TYPE_DISTANCE) {
						var el = domJointInspector.querySelector("[name=spring_frequency_hz]");
						el.parentNode.style.display = "block";
						el.value = joint.frequencyHz.toFixed(0);

						var el = domJointInspector.querySelector("[name=spring_damping_ratio]");
						el.parentNode.style.display = "block";
						el.value = joint.dampingRatio.toFixed(2);
					}
					else {
						var el = domJointInspector.querySelector("[name=spring_frequency_hz]");
						el.parentNode.style.display = "none";

						var el = domJointInspector.querySelector("[name=spring_damping_ratio]");
						el.parentNode.style.display = "none";
					}
					
					var el = domJointInspector.querySelector("[name=max_force]");
					el.value = joint.maxForce.toFixed(2);

					var el = domJointInspector.querySelector("[name=collide_connected]");
					el.checked = joint.collideConnected;

					var el = domJointInspector.querySelector("[name=breakable]");
					el.checked = joint.breakable;
				}
			}
		}
		else {
			domSidebar.style.display = "none";
		}
	}	

	function createCheckPattern(color) {		
		var c = Color.parse(color);
    	var r = c.channels[0];
    	var g = c.channels[1];
    	var b = c.channels[2];
    	var a = 255;

		var patternCanvas = document.createElement("canvas");
		patternCanvas.width = 4;
		patternCanvas.height = 2;

		var ctx = patternCanvas.getContext("2d");

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

		return ctx.createPattern(patternCanvas, "repeat");
	}

	function createImage(filename) {
		var image = new Image();
		image.onload = function() {
			var ctx = domCanvas.getContext("2d");
			image.pattern = ctx.createPattern(image, "repeat");
		}

		image.src = filename;
		return image;
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

	function resetScene() {
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
		dirtyBounds.set(canvasToWorld(new vec2(0, domCanvas.height)), canvasToWorld(new vec2(domCanvas.width, 0)));
		bg.outdated = true;
	}

	function worldToCanvas(p) {
		return new vec2(
			domCanvas.width * 0.5 + (p.x * camera.scale - camera.origin.x),
			domCanvas.height - (p.y * camera.scale - camera.origin.y));
	}

	function canvasToWorld(p) {
		return new vec2(
			(camera.origin.x + (p.x - domCanvas.width * 0.5)) / camera.scale,
			(camera.origin.y - (p.y - domCanvas.height)) / camera.scale);
	}

	function screenAlign(bounds) {
		var mins = worldToCanvas(bounds.mins);
		mins.x = Math.max(Math.floor(mins.x), 0);
		mins.y = Math.min(Math.ceil(mins.y), domCanvas.height);
		bounds.mins = canvasToWorld(mins);

		var maxs = worldToCanvas(bounds.maxs);
		maxs.x = Math.min(Math.ceil(maxs.x), domCanvas.width);
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
			if (window.requestAnimFrame) {
				frameTime = Math.floor(frameTime * 60 + 0.5) / 60;
			}

			if (!editorEnabled) {
				if (!mouseDown) {
					var p = canvasToWorld(mousePosition);
					var shape = space.findShapeByPoint(p);
					domCanvas.style.cursor = shape ? "pointer" : "default";
				}

				if (!pause || step) {
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
			else {			
				updateScreen(frameTime);
			}
		}

		frameCount++;
			
		// Calculate frame per second
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
		
		// Show statistaics
		if (showStats) {
			// Update info once per every 10 frames
			if ((frameCount % 10) == 0) {
				domInfo.innerHTML =					
					["fps:", fps.toFixed(1), "tm_draw:", stats.timeDrawFrame, "step_cnt:", stats.stepCount, "tm_step:", stats.timeStep, "<br />"].join(" ") +
					["tm_col:", stats.timeCollision, "tm_init_sv:", stats.timeInitSolver, "tm_vel_sv:", stats.timeVelocitySolver, "tm_pos_sv:", stats.timePositionSolver, "<br />"].join(" ") +
					["bodies:", space.numBodies, "joints:", space.numJoints, "contacts:", space.numContacts, "pos_iters:", stats.positionIterations].join(" ");
			}
		}
		else {
			domInfo.innerHTML = "";
		}		
	}

	function drawFrame(frameTime) {
		// camera.bounds for culling
		camera.bounds.set(canvasToWorld(new vec2(0, domCanvas.height)), canvasToWorld(new vec2(domCanvas.width, 0)));

		// Check the visibility of shapes for all bodies
		for (var i in space.bodyHash) {
			var body = space.bodyHash[i];

			body.visible = false;

			for (var j = 0; j < body.shapeArr.length; j++) {
				var shape = body.shapeArr[j];
				var bounds = new Bounds(shape.bounds.mins, shape.bounds.maxs);
				if (camera.bounds.intersectsBounds(bounds)) {
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
			bg.ctx.fillRect(0, 0, domCanvas.width, domCanvas.height);

			bg.ctx.save();
			bg.ctx.setTransform(camera.scale, 0, 0, -camera.scale, domCanvas.width * 0.5 - camera.origin.x, domCanvas.height + camera.origin.y);
			
			if (editorEnabled) {
				scaledGridSize = computeScaledGridSize(gridSize);
				drawGrids(bg.ctx);
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
				var w = Math.min(Math.ceil(maxs.x + 1), domCanvas.width) - x;
				var h = Math.min(Math.ceil(mins.y + 1), domCanvas.height) - y;
				
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
		/*fg.ctx.translate(domCanvas.width * 0.5, domCanvas.height);
		fg.ctx.scale(1, -1);

		// Transform world coordinates to view
		fg.ctx.translate(-camera.origin.x, -camera.origin.y);
		fg.ctx.scale(camera.scale, camera.scale);*/

		fg.ctx.setTransform(camera.scale, 0, 0, -camera.scale, domCanvas.width * 0.5 - camera.origin.x, domCanvas.height + camera.origin.y);

		dirtyBounds.clear();

		// Draw bodies except for static bodies
		for (var i in space.bodyHash) {
			var body = space.bodyHash[i];
			if (body.visible) {
				if (editorEnabled || (!editorEnabled && !body.isStatic())) {				
					drawBody(fg.ctx, body, 1, "#000", bodyColor(body));					
				}
			}
		}
		
		// Draw joints
		if (!editorEnabled) {
			if (showAxis) {
				for (var i in space.bodyHash) {
					drawHelperBodyAxis(fg.ctx, space.bodyHash[i]);
				}
			}

			if (showJoints) {
				for (var i in space.jointHash) {
					drawHelperJointAnchors(fg.ctx, space.jointHash[i]);
				}
			}			
		}		
		else {
			drawEditorHelpers(fg.ctx);
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

		if (showDirtyBounds) {
			renderer.drawRect(fg.ctx, dirtyBounds.mins, dirtyBounds.maxs, 1, "#00F");
			dirtyBounds.expand(1, 1);
		}

		fg.ctx.restore();
	}	

	function drawBody(ctx, body, lineWidth, outlineColor, fillColor) {
		for (var i = 0; i < body.shapeArr.length; i++) {
			var shape = body.shapeArr[i];
			if (!shape.visible) {
				continue;
			}			

			/*if (editorEnabled) {
				drawCanvasTransformedBodyShape(ctx, shape, lineWidth, outlineColor, fillColor);
			}
			else {*/
				drawBodyShape(ctx, shape, lineWidth, outlineColor, fillColor);
			//}

			if (showBounds) {
				var bounds = new Bounds(shape.bounds.mins, shape.bounds.maxs);
				bounds.expand(1, 1);
				renderer.drawRect(ctx, bounds.mins, bounds.maxs, lineWidth, "#0A0");
				dirtyBounds.addBounds(bounds);
			}

			if (editorEnabled || (!editorEnabled && !body.isStatic())) {
				var expand = showBounds ? 2 : 1;
				var bounds = Bounds.expand(shape.bounds, expand, expand);
				dirtyBounds.addBounds(bounds);
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
			if (shape.convexity) renderer.drawPolygon(ctx, shape.tverts, lineWidth, outlineColor, fillColor);
			else renderer.drawPolygon(ctx, shape.tverts, 2, "#F00", fillColor);
			break;
		}
	}

	function drawCanvasTransformedBodyShape(ctx, shape, lineWidth, outlineColor, fillColor) {
		ctx.save();
		ctx.setTransform(1, 0, 0, 1, 0, 0);

		ctx.lineWidth = camera.scale;

		switch (shape.type) {
		case Shape.TYPE_CIRCLE:
			renderer.drawCircle(ctx, worldToCanvas(shape.tc), shape.r * camera.scale, -shape.body.a, lineWidth, outlineColor, fillColor);
			break;
		case Shape.TYPE_SEGMENT:
			renderer.drawSegment(ctx, worldToCanvas(shape.ta), worldToCanvas(shape.tb), shape.r * camera.scale, lineWidth, outlineColor, fillColor);
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

	function computeScaledGridSize(gridSize) {
		var n = gridSize * camera.scale;
		
		// previous power of two
		var p = 1; 
		while (p <= n) {
			p <<= 1;
		}
		p >>= 1;

		return gridSize * gridSize / p;
	}

	function drawGrids(ctx) {
		var start_x = Math.floor(camera.bounds.mins.x / scaledGridSize) * scaledGridSize;
		var start_y = Math.floor(camera.bounds.mins.y / scaledGridSize) * scaledGridSize;
		var end_x = Math.ceil(camera.bounds.maxs.x / scaledGridSize) * scaledGridSize;
		var end_y = Math.ceil(camera.bounds.maxs.y / scaledGridSize) * scaledGridSize;

		var v1 = new vec2(start_x, start_y);
		var v2 = new vec2(start_x, end_y);

		ctx.save();
		ctx.setTransform(1, 0, 0, 1, 0, 0);

		// Draw vertical lines
		for (var x = start_x; x <= end_x; x += scaledGridSize) {
			v1.x = x;
			v2.x = x;
			renderer.drawLine(ctx, worldToCanvas(v1), worldToCanvas(v2), 1, x % gridFrameSize == 0 ? gridFrameColor : gridColor);
		}

		v1.set(start_x, start_y);
		v2.set(end_x, start_y);

		// Draw horizontal lines
		for (var y = start_y; y <= end_y; y += scaledGridSize) {
			v1.y = y;
			v2.y = y;
			renderer.drawLine(ctx, worldToCanvas(v1), worldToCanvas(v2), 1, y % gridFrameSize == 0 ? gridFrameColor : gridColor);
		}

		ctx.restore();
	}

	function snapPointByGrid(p) {
		var v = new vec2;
		v.x = Math.round(p.x / scaledGridSize) * scaledGridSize;
		v.y = Math.round(p.y / scaledGridSize) * scaledGridSize;

		return v;
	}

	function snapAngle(angle) {
		var snapSize = Math.PI * 10 / 180;
		return Math.round(angle / snapSize) * snapSize;
	}

	function drawEditorHelpers(ctx) {
		for (var i in space.bodyHash) {
			drawHelperBodyAxis(ctx, space.bodyHash[i]);
		}
		
		for (var i in space.jointHash) {
			drawHelperJointAnchors(ctx, space.jointHash[i]);
		}

		if (selectionMode == SM_VERTICES) {
			// Draw vertices
			for (var i in space.bodyHash) {
				var body = space.bodyHash[i];

				for (var j = 0; j < body.shapeArr.length; j++) {
					var shape = body.shapeArr[j];
					if (shape.visible) {
						switch (shape.type) {
						case Shape.TYPE_CIRCLE:
							drawHelperVertex(ctx, shape.tc, vertexColor);
							dirtyBounds.addExtents(shape.tc, HELPER_VERTEX_EXTENT, HELPER_VERTEX_EXTENT);
							break;
						case Shape.TYPE_SEGMENT:
							drawHelperVertex(ctx, shape.ta, vertexColor);
							drawHelperVertex(ctx, shape.tb, vertexColor);
							dirtyBounds.addExtents(shape.ta, HELPER_VERTEX_EXTENT, HELPER_VERTEX_EXTENT);
							dirtyBounds.addExtents(shape.ta, HELPER_VERTEX_EXTENT, HELPER_VERTEX_EXTENT);
							break;
						case Shape.TYPE_POLY:
							for (var k = 0; k < shape.tverts.length; k++) {
								drawHelperVertex(ctx, shape.tverts[k], vertexColor);
							}
							dirtyBounds.addBounds(Bounds.expand(shape.bounds, HELPER_VERTEX_EXTENT, HELPER_VERTEX_EXTENT));
							break;
						}
					}
				}
			}
	
			// Draw selected vertices
			for (var i = 0; i < selectedFeatureArr.length; i++) {
				var vertexId = selectedFeatureArr[i];
				var shape = space.shapeById((vertexId >> 16) & 0xFFFF);
				if (shape && shape.visible) {
					var index = vertexId & 0xFFFF;
					var p = drawHelperShapeVertex(ctx, shape, index, selectionColor);
					//dirtyBounds.addExtents(p, HELPER_VERTEX_EXTENT, HELPER_VERTEX_EXTENT);
				}
			}

			// Draw highlighted vertex			
			for (var i = 0; i < highlightFeatureArr.length; i++) {
				var vertexId = highlightFeatureArr[i];
				var shape = space.shapeById((vertexId >> 16) & 0xFFFF);
				if (shape && shape.visible) {
					var index = vertexId & 0xFFFF;
					var p = drawHelperShapeVertex(ctx, shape, index, highlightColor);
					//dirtyBounds.addExtents(p, HELPER_VERTEX_EXTENT, HELPER_VERTEX_EXTENT);
				}
			}
		}
		else if (selectionMode == SM_EDGES) {
			// Draw selected edges
			for (var i = 0; i < selectedFeatureArr.length; i++) {
				var edgeId = selectedFeatureArr[i];
				var shape = space.shapeById((edgeId >> 16) & 0xFFFF);
				if (shape && shape.visible) {
					var index1 = edgeId & 0xFFFF;
					var index2 = (index1 + 1) % shape.tverts.length;
					var v1 = shape.tverts[index1];
					var v2 = shape.tverts[index2];

			 		renderer.drawLine(ctx, v1, v2, 2, selectionColor);
			 	
					dirtyBounds.addPoint(v1);
					dirtyBounds.addPoint(v2);
				}
			}

			// Draw highlighted edges
			for (var i = 0; i < highlightFeatureArr.length; i++) {
				var edgeId = highlightFeatureArr[i];
				var shape = space.shapeById((edgeId >> 16) & 0xFFFF);
				if (shape && shape.visible) {
					var index1 = edgeId & 0xFFFF;
					var index2 = (index1 + 1) % shape.tverts.length;
					var v1 = shape.tverts[index1];
					var v2 = shape.tverts[index2];

			 		renderer.drawLine(ctx, v1, v2, 2, highlightColor);			 
					
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
					drawCanvasTransformedBodyShape(ctx, shape, 1, selectionColor, selectionPattern);
					dirtyBounds.addBounds(Bounds.expand(shape.bounds, 2, 2));
				}
			}

			// Draw highlighted shape
			for (var i = 0; i < highlightFeatureArr.length; i++) {
				var shape = highlightFeatureArr[i];
				if (shape.visible) {
					drawCanvasTransformedBodyShape(ctx, shape, 1, "", highlightPattern);
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
						drawCanvasTransformedBodyShape(ctx, shape, 1, selectionColor, selectionPattern);
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
						drawCanvasTransformedBodyShape(ctx, shape, 1, "", highlightPattern);
						dirtyBounds.addBounds(shape.bounds);
					}
				}
			}
		}
		else if (selectionMode == SM_JOINTS) {
			// Draw selected joints
			for (var i = 0; i < selectedFeatureArr.length; i++) {
				var jointId = selectedFeatureArr[i];
				var joint = space.jointById((jointId >> 16) & 0xFFFF);
				var anchorIndex = jointId & 0xFFFF;
				
				if (joint) {
					drawHelperJoint(ctx, joint);
				}

				var p1 = joint.getWorldAnchor1();
				var p2 = joint.getWorldAnchor2();

				var p = anchorIndex == 0 ? p1 : p2;
				renderer.drawCircle(ctx, p, HELPER_JOINT_ANCHOR_RADIUS, undefined, 1, "", jointHelperColor);
				dirtyBounds.addExtents(p, HELPER_JOINT_ANCHOR_RADIUS, HELPER_JOINT_ANCHOR_RADIUS);
			}

			// Draw highlighted joint
			for (var i = 0; i < highlightFeatureArr.length; i++) {
				var jointId = highlightFeatureArr[i];
				var joint = space.jointById((jointId >> 16) & 0xFFFF);
				var anchorIndex = jointId & 0xFFFF;

				var body1 = joint.body1;
				var body2 = joint.body2;

				var color = Color.parse(jointHelperColor);
				color.channels[3] = 0.2;

				for (var j = 0; j < body1.shapeArr.length; j++) {
					var shape = body1.shapeArr[j];
					if (shape.visible) {
						drawBodyShape(ctx, shape, 1, "", color.rgba());
						dirtyBounds.addBounds(shape.bounds);
					}
				}

				for (var j = 0; j < body2.shapeArr.length; j++) {
					var shape = body2.shapeArr[j];
					if (shape.visible) {
						drawBodyShape(ctx, shape, 1, "", color.rgba());
						dirtyBounds.addBounds(shape.bounds);
					}
				}

				var p1 = joint.getWorldAnchor1();
				var p2 = joint.getWorldAnchor2();
				
				renderer.drawDashLine(ctx, body1.xf.t, p1, 2, 5, jointHelperColor);
				renderer.drawDashLine(ctx, body2.xf.t, p2, 2, 5, jointHelperColor);

				var p = anchorIndex == 0 ? p1 : p2;
				renderer.drawCircle(ctx, p, HELPER_JOINT_ANCHOR_RADIUS, undefined, 1, "", jointHelperColor);
				dirtyBounds.addExtents(p, HELPER_JOINT_ANCHOR_RADIUS, HELPER_JOINT_ANCHOR_RADIUS);

				dirtyBounds.addPoint(p1);
				dirtyBounds.addPoint(p2);		
			}
		}

		if (editMode != EM_SELECT && selectedFeatureArr.length > 0) {
			drawGizmo(ctx);
		}
	}

	function drawHelperVertex(ctx, p, color) {
		var extent = new vec2(HELPER_VERTEX_EXTENT, HELPER_VERTEX_EXTENT);
		var mins = vec2.sub(p, extent);
		var maxs = vec2.add(p, extent);

		renderer.drawRect(ctx, mins, maxs, 1, "", color);
	}

	function drawHelperShapeVertex(ctx, shape, index, color) {
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

		drawHelperVertex(ctx, p, color, false);
		return p;
	}

	function drawHelperBodyAxis(ctx, body) {
		if (!body.visible) {
			return;
		}

		ctx.save();
		ctx.setTransform(1, 0, 0, 1, 0, 0);

		var rvec = body.xf.rotate(new vec2(HELPER_BODY_AXIS_SIZE, 0));
		var origin = body.xf.t;
		var px = vec2.add(origin, rvec);
		var py = vec2.add(origin, vec2.perp(rvec));

		renderer.drawLine(ctx, worldToCanvas(origin), worldToCanvas(px), 1, "#F00");
		renderer.drawLine(ctx, worldToCanvas(origin), worldToCanvas(py), 1, "#0F0");

		var bounds = new Bounds;
		bounds.addPoint(origin);
		bounds.addPoint(px);
		bounds.addPoint(py);
		bounds.expand(1, 1);
		dirtyBounds.addBounds(bounds);
		
		ctx.restore();
	}

	function drawGizmo(ctx) {
		ctx.save();
		ctx.setTransform(1, 0, 0, 1, 0, 0);

		var center = worldToCanvas(transformCenter);

		var extent = new vec2(GIZMO_RADIUS / camera.scale, GIZMO_RADIUS / camera.scale);
		var mins = vec2.sub(transformCenter, extent);
		var maxs = vec2.add(transformCenter, extent);
		var bounds = new Bounds(mins, maxs);
		bounds.expand(4, 4); // expand for outline

		if (editMode == EM_TRANSLATE) {
			var p1 = vec2.add(center, new vec2(GIZMO_RADIUS, 0));
			var p2 = vec2.add(center, new vec2(0, -GIZMO_RADIUS));

			var s1 = vec2.add(center, new vec2(GIZMO_INNER_OFFSET, 0));
			var s2 = vec2.add(center, new vec2(0, -GIZMO_INNER_OFFSET));

			var x_color = transformAxis == TRANSFORM_AXIS_X ? "#FC0" : "#F00";
			var y_color = transformAxis == TRANSFORM_AXIS_Y ? "#FC0" : "#0F0";

			renderer.drawArrow(ctx, s1, p1, ARROW_TYPE_NONE, ARROW_TYPE_NORMAL, 16, 2, x_color, x_color);
			renderer.drawArrow(ctx, s2, p2, ARROW_TYPE_NONE, ARROW_TYPE_NORMAL, 16, 2, y_color, y_color);
			
			var mins = vec2.sub(center, new vec2(GIZMO_INNER_RADIUS, -GIZMO_INNER_RADIUS));
			var maxs = vec2.add(center, new vec2(GIZMO_INNER_RADIUS, -GIZMO_INNER_RADIUS));

			var color1 = transformAxis == TRANSFORM_AXIS_XY ? "#FC0" : "#FF0";
			var color2 = Color.parse(color1); color2.channels[3] = 0.4;

			renderer.drawRect(ctx, mins, maxs, 0, color1, color2.rgba());
		}	
		else if (editMode == EM_ROTATE) {
			var color = transformAxis & TRANSFORM_AXIS_Z ? "#FC0" : "#00F";

			renderer.drawCircle(ctx, center, 2, undefined, 0, "", color);
			renderer.drawCircle(ctx, center, GIZMO_RADIUS, undefined, 2, color);
			
			if (mouseDownMoving && transformAxis & TRANSFORM_AXIS_Z) {
				var r = vec2.scale(vec2.normalize(vec2.sub(mousePosition, center)), GIZMO_RADIUS);
				var p = vec2.add(center, r);
				renderer.drawLine(ctx, center, p, 2, "#F55");
			}			
		}
		else if (editMode == EM_SCALE) {
			var p1 = vec2.add(center, new vec2(GIZMO_RADIUS, 0));
			var p2 = vec2.add(center, new vec2(0, -GIZMO_RADIUS));

			var s1 = vec2.add(center, new vec2(GIZMO_INNER_OFFSET, 0));
			var s2 = vec2.add(center, new vec2(0, -GIZMO_INNER_OFFSET));			

			var x_color = transformAxis == TRANSFORM_AXIS_X ? "#FC0" : "#F00";
			var y_color = transformAxis == TRANSFORM_AXIS_Y ? "#FC0" : "#0F0";

			renderer.drawArrow(ctx, s1, p1, ARROW_TYPE_NONE, ARROW_TYPE_BOX, GIZMO_SCALE_AXIS_BOX_EXTENT, 2, x_color, x_color);
			renderer.drawArrow(ctx, s2, p2, ARROW_TYPE_NONE, ARROW_TYPE_BOX, GIZMO_SCALE_AXIS_BOX_EXTENT, 2, y_color, y_color);

			var color1 = transformAxis == TRANSFORM_AXIS_XY ? "#FC0" : "#FF0";
			var color2 = Color.parse(color1); color2.channels[3] = 0.4;
			
			renderer.drawCircle(ctx, center, GIZMO_INNER_RADIUS, undefined, 2, color1, color2.rgba());

			var extent = (GIZMO_SCALE_AXIS_BOX_EXTENT + 2) / camera.scale;
			bounds.addExtents(canvasToWorld(p1), extent, extent);
			bounds.addExtents(canvasToWorld(p2), extent, extent);
		}

		//renderer.drawDashLine(ctx, vec2.sub(center, new vec2(15, 0)), vec2.add(center, new vec2(15, 0)), 1, 20, "#00F");
		//renderer.drawDashLine(ctx, vec2.sub(center, new vec2(0, 15)), vec2.add(center, new vec2(0, 15)), 1, 20, "#00F");			

		dirtyBounds.addBounds(bounds);

		ctx.restore();
	}

	function drawHelperJointAnchors(ctx, joint) {
		var body1 = joint.body1;
		var body2 = joint.body2;

		var bounds = new Bounds;

		var p1 = joint.getWorldAnchor1();
		var p2 = joint.getWorldAnchor2();

		renderer.drawCircle(ctx, p1, HELPER_JOINT_ANCHOR_RADIUS, undefined, 1, "", jointAnchorColor);
		renderer.drawCircle(ctx, p2, HELPER_JOINT_ANCHOR_RADIUS, undefined, 1, "", jointAnchorColor);

		bounds.addExtents(p1, HELPER_JOINT_ANCHOR_RADIUS, HELPER_JOINT_ANCHOR_RADIUS);
		bounds.addExtents(p2, HELPER_JOINT_ANCHOR_RADIUS, HELPER_JOINT_ANCHOR_RADIUS);

		renderer.drawLine(ctx, p1, p2, 1, jointAnchorColor);

		bounds.addPoint(p1);
		bounds.addPoint(p2);

		if (!body1.isStatic() || !body2.isStatic()) {
			bounds.expand(2, 2);
			dirtyBounds.addBounds(bounds);
		}
	}
	
	function drawHelperJoint(ctx, joint) {
		var body1 = joint.body1;
		var body2 = joint.body2;

		var bounds = new Bounds;

		var p1 = joint.getWorldAnchor1();
		var p2 = joint.getWorldAnchor2();		
		
		if (joint.type == Joint.TYPE_REVOLUTE) {
			var color = Color.parse(jointHelperColor);
			color.channels[3] = 0.2;

			if (joint.limitEnabled) {
				var a1 = body1.a + joint.limitLowerAngle;
				var a2 = body1.a + joint.limitUpperAngle;

				renderer.drawArc(ctx, p1, HELPER_REVOLUTE_JOINT_RADIUS, a1, a2, 1, jointHelperColor, color.rgba());
			}
			else {
				renderer.drawCircle(ctx, p1, HELPER_REVOLUTE_JOINT_RADIUS, undefined, 1, jointHelperColor, color.rgba());
			}

			renderer.drawLine(ctx, p1, vec2.add(p2, vec2.scale(vec2.rotation(body2.a), HELPER_REVOLUTE_JOINT_RADIUS)), 1, jointHelperColor);

			bounds.addExtents(p1, HELPER_REVOLUTE_JOINT_RADIUS, HELPER_REVOLUTE_JOINT_RADIUS);
		}
		else if (joint.type == Joint.TYPE_WELD) {
			var color = Color.parse(jointHelperColor);
			color.channels[3] = 0.2;

			var rvec = vec2.rotate(new vec2(HELPER_WELD_JOINT_EXTENT, 0), body1.a);
			var uvec = vec2.rotate(new vec2(0, HELPER_WELD_JOINT_EXTENT), body1.a);

			renderer.drawBox(ctx, p1, rvec, uvec, 1, jointHelperColor, color.rgba());

			bounds.addExtents(p1, HELPER_WELD_JOINT_EXTENT, HELPER_WELD_JOINT_EXTENT);
		}
		else if (joint.type == Joint.TYPE_LINE) {
			var color = Color.parse(jointHelperColor);
			color.channels[3] = 0.2;
			renderer.drawArrow(ctx, p1, p2, ARROW_TYPE_CIRCLE, ARROW_TYPE_CIRCLE, HELPER_LINE_JOINT_RADIUS, 1, jointHelperColor, color.rgba());

			bounds.addExtents(p1, HELPER_LINE_JOINT_RADIUS, HELPER_LINE_JOINT_RADIUS);
			bounds.addExtents(p2, HELPER_LINE_JOINT_RADIUS, HELPER_LINE_JOINT_RADIUS);
		}
		else if (joint.type == Joint.TYPE_PRISMATIC) {
			renderer.drawArrow(ctx, p1, p2, ARROW_TYPE_NORMAL, ARROW_TYPE_NORMAL, HELPER_PRISMATIC_JOINT_ARROW_SIZE, 1, jointHelperColor, jointHelperColor);

			bounds.addExtents(p1, HELPER_PRISMATIC_JOINT_ARROW_SIZE, HELPER_PRISMATIC_JOINT_ARROW_SIZE);
			bounds.addExtents(p2, HELPER_PRISMATIC_JOINT_ARROW_SIZE, HELPER_PRISMATIC_JOINT_ARROW_SIZE);
		}		
		else if (joint.type == Joint.TYPE_DISTANCE) {
			renderer.drawLine(ctx, p1, p2, 1, jointHelperColor);
		}
		else if (joint.type == Joint.TYPE_MOUSE) {
			renderer.drawLine(ctx, p1, p2, 1, "#00F");
		}		
		
		if (!body1.isStatic() || !body2.isStatic()) {
			bounds.expand(2, 2);
			dirtyBounds.addBounds(bounds);
		}
	}

	function onResize(ev) {
		window.scrollTo(0, 0);

		fg.canvas.width = window.innerWidth - domView.offsetLeft;
		fg.canvas.height = window.innerHeight - domView.offsetTop;

		//console.log(fg.canvas.width, fg.canvas.height);

		bg.canvas.width = fg.canvas.width;
		bg.canvas.height = fg.canvas.height;

		//console.log([domView.offsetLeft, domView.offsetTop, domView.clientWidth, domView.clientHeight].join(" "));

		// Set dirtyBounds to full screen
		dirtyBounds.set(canvasToWorld(new vec2(0, domCanvas.height)), canvasToWorld(new vec2(domCanvas.width, 0)));		
		bg.outdated = true;		
	}

	function getMousePosition(ev) {
		return new vec2(
			ev.clientX + document.body.scrollLeft - domView.offsetLeft, 
			ev.clientY + document.body.scrollTop - domView.offsetTop);
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
			return feature != -1 ? true : false;
		}

		console.log("invalid select mode");
		return false;
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
			if (!shape) {
				return null;
			}

			return shape.body;
		}
		else if (selectionMode == SM_JOINTS) {
			return space.findJointByPoint(p, SELECTABLE_POINT_DIST_THREHOLD, selectedFeatureArr[0])
		}

		console.error("getFeatureByPoint");
		return null;
	}

	function doSelect(p, flags) {
		var feature = getFeatureByPoint(p);
		if (!isValidFeature(feature)) {			
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
				var vertexId = selectedFeatureArr[i];
				var shape = space.shapeById((vertexId >> 16) & 0xFFFF);
				var index = vertexId & 0xFFFF;
				var v = getShapeVertex(shape, index);

				center.addself(v);
			}

			center.scale(1 / selectedFeatureArr.length);
			transformCenter.copy(center);
		}
		else if (selectionMode == SM_EDGES) {
			var center = new vec2(0, 0);

			for (var i = 0; i < selectedFeatureArr.length; i++) {
				var edgeId = selectedFeatureArr[i];
				var shape = space.shapeById((edgeId >> 16) & 0xFFFF);
				var index = edgeId & 0xFFFF;
				var v1 = getShapeVertex(shape, index);
				var v2 = getShapeVertex(shape, index + 1);

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
				var body = selectedFeatureArr[i];

				center.addself(body.xf.t);
			}

			center.scale(1 / selectedFeatureArr.length);
			transformCenter.copy(center);
		}
		else if (selectionMode == SM_JOINTS) {
			var center = new vec2(0, 0);

			for (var i = 0; i < selectedFeatureArr.length; i++) {
				var jointId = selectedFeatureArr[i];
				var joint = space.jointById((jointId >> 16) & 0xFFFF);
				var anchorIndex = jointId & 0xFFFF;

				if (anchorIndex == 0) {
					center.addself(joint.getWorldAnchor1());
				}
				else {
					center.addself(joint.getWorldAnchor2());
				}
			}

			center.scale(1 / selectedFeatureArr.length);
			transformCenter.copy(center);
		}

		transformScale.set(1, 1);
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

		mousePosition.x = pos.x;
		mousePosition.y = pos.y;

		mouseDownPosition.x = mousePosition.x;
		mouseDownPosition.y = mousePosition.y;

		if (!editorEnabled) {
			// Remove previous mouse joint
			if (mouseJoint) {
				space.removeJoint(mouseJoint);
				mouseJoint = null;
			}

			var p = canvasToWorld(pos);

			// If we picked shape then create mouse joint
			var shape = space.findShapeByPoint(p);
			if (shape) {
				mouseBody.p.copy(p);
				mouseBody.syncTransform();
				mouseJoint = new MouseJoint(mouseBody, shape.body, p);
				mouseJoint.maxForce = shape.body.m * 20000;
				space.addJoint(mouseJoint);
			}
		}
		else {
			editModeEventArr[editMode].mouseDown(ev);
		}

		// HACK !
		document.body.tabIndex = 0;
		document.body.focus();
		
		// for the touch device
		mousePositionOld.x = mousePosition.x;
		mousePositionOld.y = mousePosition.y;		

		ev.preventDefault();
	}

	function onMouseUp(ev) {
		var pos = getMousePosition(ev);
		var p = canvasToWorld(pos);

		if (!editorEnabled) {
			if (mouseJoint) {
				space.removeJoint(mouseJoint);
				mouseJoint = null;
			}
		}
		else {
			editModeEventArr[editMode].mouseUp(ev);
		}

		markedFeatureArr = [];
		
		mouseDown = false;
		mouseDownMoving = false;

		ev.preventDefault();
	}

	function scrollView(dx, dy) {
		camera.origin.x += dx;
		camera.origin.y += dy;

		//camera.origin.y = Math.clamp(camera.origin.y, 0, 0);

		// Set dirtyBounds to full screen
		dirtyBounds.set(canvasToWorld(new vec2(0, domCanvas.height)), canvasToWorld(new vec2(domCanvas.width, 0)));
		bg.outdated = true;
	}

	function onMouseMove(ev) {
		mousePosition = getMousePosition(ev);

		if (!editorEnabled) {
			if (mouseDown) {
				if (mouseJoint) {
					mouseBody.p.copy(canvasToWorld(mousePosition));
					mouseBody.syncTransform();
				}
				else {
					var dx = mousePosition.x - mousePositionOld.x;
					var dy = mousePosition.y - mousePositionOld.y;
					
					scrollView(-dx, dy);
				}
			}
		}
		else {
			if (mouseDown && ev.altKey) {
				var dx = mousePosition.x - mousePositionOld.x;
				var dy = mousePosition.y - mousePositionOld.y;

				scrollView(-dx, dy);
			}
			else {
				editModeEventArr[editMode].mouseMove(ev);			
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

	function onMouseDoubleClick(ev) {
		var pos = getMousePosition(ev);
		var p = canvasToWorld(pos);

		if (editorEnabled) {
			if (editMode == EM_SELECT) {
				var flag = ev.shiftKey ? SF_ADDITIVE : (ev.metaKey ? SF_XOR : SF_REPLACE);				

				if (flag == SF_REPLACE) {
					selectedFeatureArr = [];
				}

				var feature = getFeatureByPoint(p);

				if (isValidFeature(feature)) {
					if (selectionMode == SM_VERTICES) {
						var shape_id = (feature >> 16) & 0xFFFF;
						var shape = space.shapeById(shape_id);
						
						for (var i = 0; i < shape.tverts.length; i++) {
							var vertexId = (shape_id << 16) | i;
							selectedFeatureArr.push(vertexId);
						}
					}
					else if (selectionMode == SM_EDGES) {
						var shape_id = (feature >> 16) & 0xFFFF;
						var shape = space.shapeById(shape_id);
						
						for (var i = 0; i < shape.tverts.length; i++) {
							var vertexId = (shape_id << 16) | i;
							selectedFeatureArr.push(vertexId);
						}
					}
					else if (selectionMode == SM_SHAPES) {
						var body = feature.body;

						for (var i = 0; i < body.shapeArr.length; i++) {
							var shape = body.shapeArr[i];
							selectedFeatureArr.push(shape);
						}
					}
					else if (selectionMode == SM_BODIES) {
						// NOT AVAILABLE
					}
					else if (selectionMode == SM_JOINTS) {

					}

					resetTransformCenter();
				}
			}		
		}
	}

	function onMouseWheel(ev) {
		// Zoom in and out using vertical mouse wheel
		var ds = -ev.wheelDeltaY * 0.001;
		var oldViewScale = camera.scale;
		camera.scale = Math.clamp(oldViewScale + ds, camera.minScale, camera.maxScale);
		ds = camera.scale - oldViewScale;

		// Adjust view origin for focused zoom in and out
		// p = (1 + ds) * p - ds * p
		var p = canvasToWorld(getMousePosition(ev));
		camera.origin.x += p.x * ds;
		camera.origin.y += p.y * ds;

		// Horizontal scroll using horizontal mouse wheel
		var dx = ev.wheelDeltaX * 0.2;
		camera.origin.x -= dx;

		// Clamp view origin limit
		//camera.origin.y = Math.clamp(camera.origin.y, 0, 0);

		// Set dirtyBounds to full screen
		dirtyBounds.set(canvasToWorld(new vec2(0, domCanvas.height)), canvasToWorld(new vec2(domCanvas.width, 0)));
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

				var oldScale = camera.scale;
				camera.scale = Math.clamp(gestureScale, camera.minScale, camera.maxScale);
				var ds = camera.scale - oldScale;				
		
				camera.origin.x += touchScaleCenter.x * ds;
				camera.origin.y += touchScaleCenter.y * ds;

				// Set dirtyBounds to full screen
				dirtyBounds.set(canvasToWorld(new vec2(0, domCanvas.height)), canvasToWorld(new vec2(domCanvas.width, 0)));
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
		gestureStartScale = camera.scale;

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

		if (ev.target.tagName != "BODY") {
			return;
		}

		editModeEventArr[editMode].keyDown(ev.keyCode);

		switch (ev.keyCode) {
		case 123: // F12
			// TODO: Screenshot
			var dataURL = domCanvas.toDataURL();
			ev.preventDefault();
			break;
		case 32: // Space
			if (!editorEnabled) {
				onClickedPlayer("step");
				ev.preventDefault();
			}
			break;
		case 17: // Ctrl
			ev.preventDefault();
			break;
		case 8: // Delete
			if (editorEnabled) {
				onDelete();
				ev.preventDefault();
			}
			break;
		case 81: // 'q'
			if (editorEnabled) {
				onClickedEditMode("select");
				ev.preventDefault();
			}			
			break;
		case 87: // 'w'
			if (editorEnabled) {
				onClickedEditMode("translate");
				ev.preventDefault();
			}			
			break;
		case 69: // 'e'
			if (ev.ctrlKey) {
				onClickedEdit();
				ev.preventDefault();
			}
			else if (editorEnabled) {
				onClickedEditMode("rotate");
				ev.preventDefault();
			}
			break;	
		case 82: // 'r'			
			if (editorEnabled) {
				onClickedEditMode("scale");
				ev.preventDefault();
			}
			break;		
		case 74: // 'j'
			break;	
		case 49: // '1'
		case 50: // '2'
		case 51: // '3'
		case 52: // '4'
		case 53: // '5'
			if (editorEnabled) {
				onClickedSelectionMode(["vertices", "edges", "shapes", "bodies", "joints"][(ev.keyCode - 48) - 1]);				
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
		resetScene();

		selectedFeatureArr = [];
		markedFeatureArr = [];
		highlightFeatureArr = [];
	}

	function onChangedVertexPositionX(value) {
		if (selectedFeatureArr.length == 1) {		
			var vertexId = selectedFeatureArr[0];
			var shape = space.shapeById((vertexId >> 16) & 0xFFFF);
			var index = vertexId & 0xFFFF;

			var v = getShapeVertex(shape, index);

			setShapeVertex(shape, index, new vec2(parseFloat(value), v.y));
			
			shape.finishVerts();
			shape.body.resetMassData();
			shape.body.cacheData();
		}
	}

	function onChangedVertexPositionY(value) {
		if (selectedFeatureArr.length == 1) {		
			var vertexId = selectedFeatureArr[0];
			var shape = space.shapeById((vertexId >> 16) & 0xFFFF);
			var index = vertexId & 0xFFFF;

			var v = getShapeVertex(shape, index);

			setShapeVertex(shape, index, new vec2(v.x, parseFloat(value)));

			shape.finishVerts();
			shape.body.resetMassData();
			shape.body.cacheData();
		}
	}

	function onChangedEdgePositionX(offset, value) {
		if (selectedFeatureArr.length == 1) {		
			var edgeId = selectedFeatureArr[0];
			var shape = space.shapeById((edgeId >> 16) & 0xFFFF);
			var index = (edgeId & 0xFFFF) + offset;

			var v = getShapeVertex(shape, index);

			setShapeVertex(shape, index, new vec2(parseFloat(value), v.y));

			shape.finishVerts();
			shape.body.resetMassData();			
			shape.body.cacheData();
		}
	}

	function onChangedEdgePositionY(offset, value) {
		if (selectedFeatureArr.length == 1) {		
			var edgeId = selectedFeatureArr[0];
			var shape = space.shapeById((edgeId >> 16) & 0xFFFF);
			var index = (edgeId & 0xFFFF) + offset;

			var v = getShapeVertex(shape, index);

			setShapeVertex(shape, index, new vec2(v.x, parseFloat(value)));

			shape.finishVerts();
			shape.body.resetMassData();
			shape.body.cacheData();
		}
	}

	function onChangedShapeRadius(value) {
		if (selectedFeatureArr.length == 1) {
			var shape = selectedFeatureArr[0];
			shape.r = parseFloat(value);

			shape.finishVerts();
			shape.body.resetMassData();
			shape.body.cacheData();			
		}
	}

	function onChangedShapeDensity(value) {
		if (selectedFeatureArr.length == 1) {
			var shape = selectedFeatureArr[0];
			shape.density = parseFloat(value);
			shape.body.resetMassData();
		}
	}

	function onChangedShapeRestitution(value) {
		if (selectedFeatureArr.length == 1) {
			var shape = selectedFeatureArr[0];
			shape.e = parseFloat(value);
		}	
	}

	function onChangedShapeFriction(value) {
		if (selectedFeatureArr.length == 1) {
			var shape = selectedFeatureArr[0];
			shape.u = parseFloat(value);
		}	
	}

	function onChangedBodyType(value) {
		if (selectedFeatureArr.length == 1) {
			var body = selectedFeatureArr[0];
			body.type = { "Static": Body.STATIC, "Kinetic": Body.KINETIC, "Dynamic": Body.DYNAMIC }[value];
			body.resetMassData();
			body.cacheData();
		}
	}

	function onChangedBodyName(value) {
		if (selectedFeatureArr.length == 1) {
			var body = selectedFeatureArr[0];
			body.name = new String(value);
		}
	}

	function onChangedBodyPositionX(value) {
		if (selectedFeatureArr.length == 1) {
			var body = selectedFeatureArr[0];			
			var p = new vec2(parseFloat(value), body.xf.t.y);
			body.setTransform(p, body.a);
			body.resetJointAnchors();
			body.cacheData();
		}
	}

	function onChangedBodyPositionY(value) {
		if (selectedFeatureArr.length == 1) {
			var body = selectedFeatureArr[0];			
			var p = new vec2(body.xf.t.x, parseFloat(value));
			body.setTransform(p, body.a);
			body.resetJointAnchors();
			body.cacheData();			
		}
	}

	function onChangedBodyAngle(value) {
		if (selectedFeatureArr.length == 1) {
			var body = selectedFeatureArr[0];
			body.setTransform(body.xf.t, deg2rad(parseFloat(value)));
			body.resetJointAnchors();
			body.cacheData();
		}
	}

	function onChangedBodyMass(value) {
		if (selectedFeatureArr.length == 1) {
			if (parseFloat(value) > 0) {
				var body = selectedFeatureArr[0];
				var fraction = parseFloat(value) / body.m;

				for (var i = 0; i < body.shapeArr.length; i++) {
					var shape = body.shapeArr[i];
					shape.density *= fraction;
				}

				body.resetMassData();

				updateSidebar();
			}
		}
	}

	function onChangedJointBody(anchorIndex, value) {
		if (selectedFeatureArr.length == 1) {		
			var joint = selectedFeatureArr[0];	
		}
	}

	function onChangedJointAnchorPositionX(value) {
		if (selectedFeatureArr.length == 1) {
			var jointId = selectedFeatureArr[0];
			var joint = space.jointById((jointId >> 16) & 0xFFFF);
			var anchorIndex = jointId & 0xFFFF;

			if (anchorIndex == 0) {
				var anchor = joint.getWorldAnchor1();
				anchor.x = parseFloat(value);
				joint.setWorldAnchor1(anchor);
			}
			else {
				var anchor = joint.getWorldAnchor2();
				anchor.x = parseFloat(value);
				joint.setWorldAnchor2(anchor);
			}
		}
	}

	function onChangedJointAnchorPositionY(value) {
		if (selectedFeatureArr.length == 1) {		
			var jointId = selectedFeatureArr[0];
			var joint = space.jointById((jointId >> 16) & 0xFFFF);
			var anchorIndex = jointId & 0xFFFF;

			if (anchorIndex == 0) {
				var anchor = joint.getWorldAnchor1();
				anchor.y = parseFloat(value);
				joint.setWorldAnchor1(anchor);
			}
			else {
				var anchor = joint.getWorldAnchor2();
				anchor.y = parseFloat(value);
				joint.setWorldAnchor2(anchor);
			}
		}
	}

	function onChangedJointMaxForce(value) {
		if (selectedFeatureArr.length == 1) {			
			var jointId = selectedFeatureArr[0];
			var joint = space.jointById((jointId >> 16) & 0xFFFF);
			console.log(value);
			joint.maxForce = parseFloat(value);
		}
	}

	function onClickedJointCollideConnected() {
		if (selectedFeatureArr.length == 1) {
			var jointId = selectedFeatureArr[0];
			var joint = space.jointById((jointId >> 16) & 0xFFFF);
			joint.collideConnected = !joint.collideConnected;
		}
	}

	function onClickedJointBreakable() {
		if (selectedFeatureArr.length == 1) {
			var jointId = selectedFeatureArr[0];
			var joint = space.jointById((jointId >> 16) & 0xFFFF);			
			joint.breakable = !joint.breakable;
		}
	}

	function onClickedJointEnableLimit() {
		if (selectedFeatureArr.length == 1) {
			var jointId = selectedFeatureArr[0];
			var joint = space.jointById((jointId >> 16) & 0xFFFF);
			joint.limitEnabled = !joint.limitEnabled;

			updateSidebar();
		}
	}

	function onChangedJointLimitLowerAngle(value) {
		if (selectedFeatureArr.length == 1) {			
			var jointId = selectedFeatureArr[0];
			var joint = space.jointById((jointId >> 16) & 0xFFFF);
			joint.limitLowerAngle = deg2rad(parseFloat(value));
		}
	}

	function onChangedJointLimitUpperAngle(value) {
		if (selectedFeatureArr.length == 1) {			
			var jointId = selectedFeatureArr[0];
			var joint = space.jointById((jointId >> 16) & 0xFFFF);
			joint.limitUpperAngle = deg2rad(parseFloat(value));
		}
	}

	function onClickedJointEnableMotor() {
		if (selectedFeatureArr.length == 1) {
			var jointId = selectedFeatureArr[0];
			var joint = space.jointById((jointId >> 16) & 0xFFFF);
			joint.motorEnabled = !joint.motorEnabled;

			updateSidebar();
		}
	}

	function onChangedJointMotorSpeed(value) {
		if (selectedFeatureArr.length == 1) {			
			var jointId = selectedFeatureArr[0];
			var joint = space.jointById((jointId >> 16) & 0xFFFF);
			joint.motorSpeed = parseFloat(value);
		}
	}

	function onChangedJointMaxMotorTorque(value) {
		if (selectedFeatureArr.length == 1) {			
			var jointId = selectedFeatureArr[0];
			var joint = space.jointById((jointId >> 16) & 0xFFFF);
			joint.maxMotorTorque = parseFloat(value);
		}
	}

	function onChangedJointSpringFrequencyHz(value) {
		if (selectedFeatureArr.length == 1) {			
			var jointId = selectedFeatureArr[0];
			var joint = space.jointById((jointId >> 16) & 0xFFFF);
			joint.setSpringFrequencyHz(parseFloat(value));
		}
	}

	function onChangedJointSpringDampingRatio(value) {
		if (selectedFeatureArr.length == 1) {			
			var jointId = selectedFeatureArr[0];
			var joint = space.jointById((jointId >> 16) & 0xFFFF);
			joint.setSpringDampingRatio(parseFloat(value));
		}
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

	function onClickedShowDirtyRect() {
		showDirtyBounds = !showDirtyBounds;
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

		domInfo.style.display = showStats ? "block" : "none";
	}	

	function onClickedPlayer(value) {
		switch (value) {
		case "restart":
			resetScene();
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
		editorEnabled = !editorEnabled;
		pause = false;
		step = false;		

		selectedFeatureArr = [];
		markedFeatureArr = [];
		highlightFeatureArr = [];

		updateToolbar();
		updateSidebar();

		onResize();

		domCanvas.style.cursor = "default";

		initFrame();
		
		return false;
	}

	function onClickedSelectionMode(value) {
		selectionMode = { vertices: SM_VERTICES, edges: SM_EDGES, shapes: SM_SHAPES, bodies: SM_BODIES, joints: SM_JOINTS }[value];
		selectedFeatureArr = [];
		markedFeatureArr = [];
		highlightFeatureArr = [];

		updateToolbar();

		onClickedEditMode("select");

		return false;
	}

	function onClickedEditMode(value) {
		editModeEventArr[editMode].shutdown();

		editMode = { create_circle: EM_CREATE_CIRCLE, create_triangle: EM_CREATE_TRIANGLE, create_box: EM_CREATE_BOX, create_hexagon: EM_CREATE_HEXAGON, create_poly: EM_CREATE_POLY,
			create_angle_joint: EM_CREATE_ANGLE_JOINT, create_revolute_joint: EM_CREATE_REVOLUTE_JOINT, create_weld_joint: EM_CREATE_WELD_JOINT, 
			create_line_joint: EM_CREATE_LINE_JOINT, create_prismatic_joint: EM_CREATE_PRISMATIC_JOINT, create_distance_joint: EM_CREATE_DISTANCE_JOINT,
			select: EM_SELECT, translate: EM_TRANSLATE, rotate: EM_ROTATE, scale: EM_SCALE,
			collapse_bodies: EM_COLLAPSE_BODIES, edge_slice: EM_EDGE_SLICE }[value];

		editModeEventArr[editMode].init();

		highlightFeatureArr = [];

		updateSidebar();		

		return false;
	}

	function deleteShape(shape) {
		var body = shape.body;

		body.removeShape(shape);
		if (body.shapeArr.length != 0) {
			body.resetMassData();
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
				var vertexId = selectedFeatureArr[i];
				var shape = space.shapeById((vertexId >> 16) & 0xFFFF);
				var index = vertexId & 0xFFFF;

				if (shape.type == Shape.TYPE_POLY) {
					shape.verts.splice(index, 1);

					shape.finishVerts();
					shape.body.resetMassData();
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
				var edgeId = selectedFeatureArr[i];
				var shape = space.shapeById((edgeId >> 16) & 0xFFFF);				

				if (shape.type == Shape.TYPE_POLY) {
					var index = edgeId & 0xFFFF;

					shape.verts.splice(index, 1);

					shape.finishVerts();
					shape.body.resetMassData();
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
			for (var i = 0; i < selectedFeatureArr.length; i++) {
				var jointId = selectedFeatureArr[i];
				var joint = space.jointById((jointId >> 16) & 0xFFFF);				
				space.removeJoint(joint);
				delete joint;
			}
		}

		selectedFeatureArr = [];
		highlightFeatureArr = [];
	}

	function onClickedSnap() {
		snapEnabled = !snapEnabled;

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
			layout.style.left = (domCanvas.width - layout.clientWidth) - 4 + "px";
			layout.style.top = "4px";				

			if (button.className.indexOf(" pushed") == -1) {
				button.className += " pushed";
			}

			button.innerHTML = "<i class='icon-cog'></i>";
		}
		else {
			layout.style.display = "none";

			button.className = button.className.replace(" pushed", "");

			button.innerHTML = "<i class='icon-white icon-cog'></i>";
		}

		return false;
	}

	function onClickedHelp() {
		showHelp = !showHelp;	

		var layout = document.getElementById("help");
		var button = document.getElementById("toggle_help");

		if (showHelp) {
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
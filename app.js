App = function() {
    var canvas;
    var ctx;
    var lastTime;
    var timeOffset;
    var frameSkip;
    var mouseDown;
    var canvasBounds;
    var clearBounds;
    var showBounds = false;
    var showContacts = false;
    var randomColor;
    var space;

    function main() {
        canvas = document.getElementById("canvas");
        if (!canvas.getContext) {
            alert("Couldn't get canvas object !");
        }

        ctx = canvas.getContext("2d");

        canvas.addEventListener("mousedown", function(e) { onMouseDown(e) }, false);
        canvas.addEventListener("mouseup", function(e) { onMouseUp(e) }, false);
        canvas.addEventListener("mousemove", function(e) { onMouseMove(e) }, false);

        canvas.addEventListener("touchstart", touchHandler, false);
        canvas.addEventListener("touchend", touchHandler, false);
        canvas.addEventListener("touchmove", touchHandler, false);
        canvas.addEventListener("touchcancel", touchHandler, false);
        
        // prevent elastic scrolling on iOS
        //document.body.addEventListener('touchmove', function(event) { event.preventDefault(); }, false);

        if (document.addEventListener)
        {
            document.addEventListener("keydown", onKeyDown, false);
            document.addEventListener("keyup", onKeyUp, false);
            document.addEventListener("keypress", onKeyPress, false);
        }
        else if (document.attachEvent)
        {
            document.attachEvent("onkeydown", onKeyDown);
            document.attachEvent("onkeyup", onKeyUp);
            document.attachEvent("onkeypress", onKeyPress);
        }
        else
        {
            document.onkeydown = onKeyDown;
            document.onkeyup = onKeyUp
            document.onkeypress = onKeyPress;
        }

        randomColor = ["#57C", "#888", "DFC", "#7CF", "#A8F", "#FAF", "#FC7", "#9E0", "#8AD", "#FF8", "#DBB", "CDE"];

        Collision.init();

        // transform fundamental coordinate system
        ctx.translate(canvas.width * 0.5, canvas.height);
        ctx.scale(1, -1);

        canvasBounds = new Bounds(new vec2(-canvas.width * 0.5, 0), new vec2(canvas.width * 0.5, canvas.height));
        clearBounds = new Bounds;

        init();

        window.requestAnimFrame = (function() {
            return window.requestAnimationFrame || window.webkitRequestAnimationFrame || window.mozRequestAnimationFrame || window.oRequestAnimationFrame || window.msRequestAnimationFrame || 
                function(callback, element) { window.setTimeout(callback, 1000 / 60); };
        })();

        timeOffset = 0;
        frameSkip = 0;
        lastTime = (new Date).getTime();

		window.requestAnimFrame(function() { runFrame(); });        
    }

    function init() {
        var body, body1, body2;
        var shape;

        space = new Space();
        space.gravity = new vec2(0, -700);

        shape = new ShapeSegment(new vec2(-400, 0), new vec2(400, 0), 0);
        space.staticBody.addStaticShape(shape);

        shape = new ShapeSegment(new vec2(-400, 0), new vec2(-400, 600), 0);
        space.staticBody.addStaticShape(shape);

        shape = new ShapeSegment(new vec2(400, 0), new vec2(400, 600), 0);
        space.staticBody.addStaticShape(shape);
        
        shape = new ShapeBox(140, 80);
        shape.e = 0.1;
        shape.u = 1.0;
        body = new Body(10, shape.inertia(10));
        body.addShape(shape);
        body.p.set(-150, 80);
        space.addBody(body);
        
        shape = new ShapeBox(600, 10);
        shape.e = 0.7;
        shape.u = 0.5;
        body = new Body(2, shape.inertia(2));
        body.addShape(shape);
        body.p.set(0, 140);
        space.addBody(body);

        for (var i = 0; i < 5; i++) {
            for (var j = 0; j <= i; j++) {
                shape = new ShapeBox(40, 40);
                shape.e = 0.3;
                shape.u = 0.8;
                body = new Body(0.4, shape.inertia(0.4));
                body.addShape(shape);
                body.p.set((j - i * 0.5) * 44 - 150, 350 - i * 44);
                space.addBody(body);
            }
        }

        shape = new ShapeCircle(15);
        shape.e = 0.5;
        shape.u = 0.4;
        body1 = new Body(0.2, shape.inertia(0.2));
        body1.addShape(shape);
        body1.p.set(0, 400);
        space.addBody(body1);

        shape = new ShapeCircle(15);
        shape.e = 0.5;
        shape.u = 0.4;
        body2 = new Body(0.2, shape.inertia(0.2));
        body2.addShape(shape);
        body2.p.set(0, 350);
        space.addBody(body2);

        space.addConstraint(new DampedSpring(body1, body2, new vec2(0, 0), new vec2(0, 0)));

        shape = new ShapePoly([new vec2(-35, 35), new vec2(-50, 0), new vec2(-35, -35), new vec2(35, -35), new vec2(50, 0), new vec2(35, 35)]);
        shape.e = 0.1;
        shape.u = 1.0;
        body = new Body(4, shape.inertia(4));
        body.addShape(shape);
        body.p.set(250, 2000);
        space.addBody(body);
        body.applyForce(new vec2(0, 100), new vec2(0, 100));
/*
        for (var i = 0; i < 8; i++) {
            for (var j = 0; j <= i; j++) {
                shape = new ShapeBox(50, 50);
                shape.e = 0.2;
                shape.u = 1.0;
                body = new Body(1, shape.inertia(1));
                body.addShape(shape);
                body.p.set((j - i * 0.5) * 52, 600 - i * 52);
                space.addBody(body);
            }
        }

        shape = new ShapeCircle(25);
        shape.e = 0.5;
        shape.u = 1;
        body = new Body(1, shape.inertia(1));
        body.addShape(shape);
        body.p.set(0, 25);
        space.addBody(body);*/
    }

    function bodyColor(index) {        
        return randomColor[(index) % randomColor.length];
    }

    function runFrame() {
        var time = (new Date).getTime();
        var frameTime = time - lastTime;

        lastTime = time;

        timeOffset += frameTime;

        if (timeOffset >= 1000 / 60) {
            var step = 0;

            while (timeOffset >= 1000 / 60 && step < 10) {
                space.step(1 / 60, 10);
                timeOffset -= 1000 / 60;
                step++;
            }

            if (step <= 1 || frameSkip >= 10) {
                drawFrame(frameTime);
                frameSkip = 0;
            }
            else {
                frameSkip += step - 1;
            }
        }

        window.requestAnimFrame(function() { runFrame(); });   
    }

    function drawFrame(ms) {
        ctx.clearRect(clearBounds.mins.x - 2, clearBounds.mins.y - 2, clearBounds.maxs.x - clearBounds.mins.x + 4, clearBounds.maxs.y - clearBounds.mins.y + 4);
        clearBounds.clear();

        drawBody(space.staticBody, "#888", "#000");
        for (var i = 0; i < space.bodyArr.length; i++) {
            drawBody(space.bodyArr[i], bodyColor(i), "#000");
        }

        //drawBox(clearBounds.mins, clearBounds.maxs, null, "#F00");

        if (showContacts) {
            for (var i = 0; i < space.arbiterArr.length; i++) {
                var arbiter = space.arbiterArr[i];
                for (var j = 0; j < arbiter.contactArr.length; j++) {
                    var con = arbiter.contactArr[j];
                    drawCircle(con.p, 2.5, 0, "#F00");
                    drawArrow(con.p, vec2.add(con.p, vec2.scale(con.n, con.d)), "#F00");
                }
            }
        }
    }

    function drawBody(body, fillColor, outlineColor) {
        for (var i = 0; i < body.shapeArr.length; i++) {
            var shape = body.shapeArr[i];

            if (!canvasBounds.intersectsBounds(shape.bounds)) {
                continue;
            }

            if (!body.isStatic()) {
                clearBounds.addBounds(shape.bounds);
            }

            drawBodyShape(body, shape, fillColor, outlineColor);
        }
    }

    function drawBodyShape(body, shape, fillColor, outlineColor) {
        switch (shape.type) {
        case Shape.TYPE_CIRCLE:
            drawCircle(shape.tc, shape.r, body.a, fillColor, outlineColor);
            break;
        case Shape.TYPE_SEGMENT:
            drawSegment(shape.ta, shape.tb, shape.r, fillColor, outlineColor);
            break;
        case Shape.TYPE_POLY:
            drawPolygon(shape.tverts, fillColor, outlineColor);
            break;
        }

        if (showBounds) {
            var offset = new vec2(1, 1);
            drawBox(vec2.sub(shape.bounds.mins, offset), vec2.add(shape.bounds.maxs, offset), null, "#0A0");
        }
    }

    function drawArrow(p1, p2, strokeStyle) {
        var angle = vec2.toAngle(vec2.sub(p2, p1)) - Math.PI;

        ctx.strokeStyle = strokeStyle;
        ctx.beginPath();

        ctx.moveTo(p1.x, p1.y);
        ctx.lineTo(p2.x, p2.y);

        ctx.save();
        ctx.translate(p2.x, p2.y);

        ctx.rotate(angle - Math.PI * 0.15);
        ctx.moveTo(6, 0);
        ctx.lineTo(0, 0);

        ctx.rotate(Math.PI * 0.3);
        ctx.lineTo(6, 0);
        
        ctx.lineJoint = "miter"
        ctx.stroke();
        ctx.restore();
    }

    function drawBox(mins, maxs, fillStyle, strokeStyle) {
        ctx.beginPath();
        ctx.rect(mins.x, mins.y, maxs.x - mins.x, maxs.y - mins.y);

        if (fillStyle) {
            ctx.fillStyle = fillStyle;
            ctx.fill();
        }

        if (strokeStyle) {
            ctx.strokeStyle = strokeStyle;
            ctx.stroke();
        }
    }

    function drawCircle(center, radius, angle, fillStyle, strokeStyle) {
        ctx.beginPath();

        ctx.arc(center.x, center.y, radius, 0, Math.PI*2, true);
        if (fillStyle) {
            ctx.fillStyle = fillStyle;
            ctx.fill();
        }
        
        if (strokeStyle) {
            ctx.strokeStyle = strokeStyle;
            ctx.moveTo(center.x, center.y);
            var rt = vec2.add(center, vec2.scale(vec2.rotation(angle), radius));
            ctx.lineTo(rt.x, rt.y);
            ctx.stroke();
        }
    }

    function drawSegment(a, b, radius, fillStyle, strokeStyle) {
        ctx.beginPath();

        var dn = vec2.normalize(vec2.perp(vec2.sub(b, a)));
        var start_angle = dn.toAngle(); 
        ctx.arc(a.x, a.y, radius, start_angle, start_angle + Math.PI, false);

        var ds = vec2.scale(dn, -radius);
        var bp = vec2.add(b, ds);
        ctx.lineTo(bp.x, bp.y);

        start_angle += Math.PI;
        ctx.arc(b.x, b.y, radius, start_angle, start_angle + Math.PI, false);

        ds = vec2.scale(dn, radius);
        var ap = vec2.add(a, ds);
        ctx.lineTo(ap.x, ap.y);

        if (fillStyle) {
            ctx.fillStyle = fillStyle;
            ctx.fill();
        }

        if (strokeStyle) {
            ctx.strokeStyle = strokeStyle;
            ctx.stroke();
        }
    }

    function drawPolygon(verts, fillStyle, strokeStyle) {
        ctx.beginPath();
        ctx.moveTo(verts[0].x, verts[0].y);
        
        for (var i = 0; i < verts.length; i++) {
            ctx.lineTo(verts[i].x, verts[i].y);
        }

        ctx.lineTo(verts[verts.length - 1].x, verts[verts.length - 1].y);
        ctx.closePath();

        if (fillStyle) {
            ctx.fillStyle = fillStyle;
            ctx.fill();
        }

        if (strokeStyle) {
            ctx.strokeStyle = strokeStyle;
            ctx.stroke();
        }
    }

    function getMousePoint(e) {
        return { x: e.clientX - canvas.offsetLeft, y: e.clientY - canvas.offsetTop } 
    }

    function onMouseDown(e) {
        mouseDown = true;
        var point = getMousePoint(e);

        shape = new ShapeCircle(20);
        shape.e = 0.8;
        shape.u = 0.5;
        body = new Body(0.1, shape.inertia(0.1));
        body.addShape(shape);
        body.p.set(point.x - canvas.width * 0.5, canvas.height - point.y);
        space.addBody(body);
    }

    function onMouseUp(e) { 
	    if (mouseDown) {
            mouseDown = false;
		}
	}

    function onMouseMove(e) {
        var point = getMousePoint(e);
        if (mouseDown) {
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

        if (e.keyCode == 32) { // 'space'
        }

        if (e.keyCode == 66) { // 'b'
            showBounds = !showBounds;
        }

        if (e.keyCode == 67) { // 'c'
            showContacts = !showContacts;
        }

        if (e.keyCode == 82) { // 'r'
            init();
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

	return { main: main };
}();
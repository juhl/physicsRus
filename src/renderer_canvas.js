RendererCanvas = function() {	
	function scissorRect(ctx, x, y, width, height) {
		ctx.beginPath();
  		ctx.rect(x, y, width, height);
 		ctx.closePath();
  		ctx.clip();
  	}

	function drawLine(ctx, p1, p2, lineWidth, strokeStyle) {		
		ctx.beginPath();
		
		ctx.moveTo(p1.x, p1.y);
		ctx.lineTo(p2.x, p2.y);

		ctx.lineWidth = lineWidth;
		ctx.strokeStyle = strokeStyle;
		ctx.stroke();
	}

	function drawDashLine(ctx, p1, p2, lineWidth, dashSize, strokeStyle) {
		var dashSize2 = dashSize * 0.5;
		var dsq = vec2.distsq(p1, p2);

		var d = vec2.truncate(vec2.sub(p2, p1), dashSize);
		var s1 = p1;
		var s2 = vec2.add(p1, d);
		
		ctx.beginPath();

		while (d.lengthsq() > 0) {
			var s3 = vec2.add(s1, vec2.truncate(vec2.sub(s2, s1), dashSize2));

			ctx.moveTo(s1.x, s1.y);
			ctx.lineTo(s3.x, s3.y);

			d = vec2.truncate(vec2.sub(p2, s2), dashSize);
			s1 = s2;
			s2 = vec2.add(s2, d);
		} 

		ctx.lineWidth = lineWidth;
		ctx.strokeStyle = strokeStyle;
		ctx.stroke();
	}

	function drawArrow(ctx, p1, p2, lineWidth, headSize, strokeStyle) {
		var angle = vec2.toAngle(vec2.sub(p2, p1)) - Math.PI;
		
		ctx.beginPath();

		ctx.moveTo(p1.x, p1.y);
		ctx.lineTo(p2.x, p2.y);

		ctx.save();
		ctx.translate(p2.x, p2.y);

		ctx.rotate(angle - Math.PI * 0.12);
		ctx.moveTo(headSize, 0);
		ctx.lineTo(0, 0);

		ctx.rotate(Math.PI * 0.24);
		ctx.lineTo(headSize, 0);

		ctx.restore();

		ctx.lineWidth = lineWidth;
		ctx.lineJoint = "miter";
		ctx.strokeStyle = strokeStyle;
		ctx.stroke();		
	}    

	function drawBox(ctx, mins, maxs, lineWidth, fillStyle, strokeStyle) {		
		ctx.beginPath();
		ctx.rect(mins.x, mins.y, maxs.x - mins.x, maxs.y - mins.y);

		if (fillStyle) {
			ctx.closePath();
			ctx.fillStyle = fillStyle;
			ctx.fill();
		}

		if (strokeStyle) {		
			ctx.lineWidth = lineWidth;	
			ctx.strokeStyle = strokeStyle;
			ctx.stroke();			
		}
	}

	function drawCircle(ctx, center, radius, angle, lineWidth, fillStyle, strokeStyle) {		
		ctx.beginPath();
		ctx.arc(center.x, center.y, radius, 0, Math.PI*2, true);

		if (fillStyle) {
			ctx.closePath();
			ctx.fillStyle = fillStyle;
			ctx.fill();
		}		

		if (strokeStyle) {
			if (typeof angle == "number") {
				ctx.moveTo(center.x, center.y);
				var rt = vec2.add(center, vec2.scale(vec2.rotation(angle), radius));
				ctx.lineTo(rt.x, rt.y);
			}

			ctx.lineWidth = lineWidth;
			ctx.strokeStyle = strokeStyle;
			ctx.stroke();
		}	
	}

	function drawSegment(ctx, a, b, radius, lineWidth, fillStyle, strokeStyle) {
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
			ctx.closePath();
			ctx.fillStyle = fillStyle;
			ctx.fill();
		}

		if (strokeStyle) {			
			ctx.lineWidth = lineWidth;
			ctx.strokeStyle = strokeStyle;
			ctx.stroke();			
		}
	}

	function drawPolygon(ctx, verts, lineWidth, fillStyle, strokeStyle) {		
		ctx.beginPath();
		ctx.moveTo(verts[0].x, verts[0].y);

		for (var i = 0; i < verts.length; i++) {
			ctx.lineTo(verts[i].x, verts[i].y);
		}

		ctx.lineTo(verts[verts.length - 1].x, verts[verts.length - 1].y);		

		if (fillStyle) {
			ctx.closePath();
			ctx.fillStyle = fillStyle;
			ctx.fill();
		}

		if (strokeStyle) {
			ctx.lineWidth = lineWidth;
			ctx.strokeStyle = strokeStyle;
			ctx.stroke();
		}		
	}

	return {
		scissorRect: scissorRect,
		drawLine: drawLine,
		drawDashLine: drawDashLine,
		drawArrow: drawArrow,
		drawBox: drawBox,
		drawCircle: drawCircle,
		drawSegment: drawSegment,
		drawPolygon: drawPolygon
	}
}();

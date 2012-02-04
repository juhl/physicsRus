RendererWebGL = function() {
	var gl;
	var config;

	var pendingTextureLoads = 0;

	function init(canvas) {
		if (!canvas.getContext) {
			console.log("Your browser doesn't support canvas.");
		}

		if (!window.WebGLRenderingContext) {
			console.log("Your browser doesn't support WebGL.");
		}

		var names = [ "webgl", "experimental-webgl", "moz-webgl", "webkit-3d" ];
		var ctx = null;
		for (var i = 0; i < names.length; i++) {
			try {
				ctx = canvas.getContext(names[i], { antialias: false, depth: false, stencil: false });
			} catch (e) {}

			if (ctx) {
				break;
			}
		}

		if (!ctx) {
			alert("Couldn't fetch WebGL rednering context for canvas.");
		}

		gl = ctx;

		if (gl.getSupportedExtensions) {
			config.extensions = gl.getSupportedExtensions();
		}
		else {
			config.extensions = [];
		}
		
		config.maxTextureSize = gl.getParameter(gl.MAX_TEXTURE_SIZE);
		config.maxTextureImageUnits = gl.getParameter(gl.MAX_TEXTURE_IMAGE_UNITS);
		//config.maxVertexTextureImageUnits = gl.getParameter(gl.MAX_VERTEX_TEXTURE_IMAGE_UNITS);
		//config.maxVertexUniformVectors = gl.getParameter(gl.MAX_VERTEX_UNIFORM_VECTORS);
		//config.maxFragmentUniformVectors = gl.getParameter(gl.MAX_FRAGMENT_UNIFORM_VECTORS);

		gl.clearColor(0.0, 0.0, 0.0, 1.0);		
		gl.frontFace(gl.CCW)
		gl.cullFace(gl.BACK);
		gl.enable(gl.CULL_FACE);
	}

	function checkGLError(msg) {
		var err = gl.getError();
		var str;

		if (err === gl.NO_ERROR)
			return;

		switch (err) {
		case gl.INVALID_ENUM:
			str = "INVALID_ENUM";
			break;
		case gl.INVALID_VALUE:
			str = "INVALID_VALUE";
			break;
		case gl.INVALID_OPERATION:
			str = "INVALID_OPERATION";
			break;
		case gl.OUT_OF_MEMORY:
			str = "OUT_OF_MEMORY";
			break;
		default:
			str = "unknown " + err.toString();
			break;
		}

		console.log("checkGLError: " + str + " on " + msg);
	}

	 function isPowerOfTwo(x) {
		return (x & (x - 1)) == 0;
	}
	
	function nextHighestPowerOfTwo(x) {
		--x;
		for (var i = 1; i < 32; i <<= 1) {
			x = x | x >> i;
		}
		return x + 1;
	}

	function loadTexture(src) {
		var texture = {};
		texture.image = new Image;

		pendingTextureLoads++;
		
		texture.image.onload = function () {    
			if (!isPowerOfTwo(texture.image.width) || !isPowerOfTwo(texture.image.height)) {
				var canvas = document.createElement("canvas");
				canvas.width = nextHighestPowerOfTwo(texture.image.width);
				canvas.height = nextHighestPowerOfTwo(texture.image.height);
				var ctx = canvas.getContext("2d");
				ctx.drawImage(texture.image, 0, 0, texture.image.width, texture.image.height, 0, 0, canvas.width, canvas.height);
				texture.image = canvas;
			}
			
			texture.texture = gl.createTexture();
			gl.bindTexture(gl.TEXTURE_2D, texture.texture);
			gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_LINEAR);
			gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
			gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.REPEAT);
			gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.REPEAT);
			//gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);
			gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGB, gl.RGB, gl.UNSIGNED_BYTE, texture.image);
			gl.generateMipmap(gl.TEXTURE_2D);

			//checkGLError("error loading texture: " + src);

			pendingTextureLoads--;
		}

		texture.image.onerror = function () {
			//alert(texture.image.src);

			pendingTextureLoads--;
		}

		texture.texture = null;//defaultTexture;
		texture.image.src = src;
		
		return texture;
	}

	function clearRect(x, y, width, height) {
		ctx.clearRect(x, y, width, height);
	}

	function drawLine(p1, p2, strokeStyle) {
		ctx.strokeStyle = strokeStyle;
		ctx.beginPath();

		ctx.moveTo(p1.x, p1.y);
		ctx.lineTo(p2.x, p2.y);

		ctx.save();
		ctx.stroke();
		ctx.restore();
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

		ctx.lineJoint = "miter";
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
		ctx.moveTo(verts[0].x, verts[0].y);

		for (var i = 0; i < verts.length; i++) {
			ctx.lineTo(verts[i].x, verts[i].y);
		}

		ctx.lineTo(verts[verts.length - 1].x, verts[verts.length - 1].y);

		if (fillStyle) {
			ctx.fillStyle = fillStyle;
			ctx.fill();
		}

		if (strokeStyle) {
			ctx.strokeStyle = strokeStyle;
			ctx.stroke();
		}
	}

	return {
		init: init,
		clearRect: clearRect,
		drawLine: drawLine,
		drawArrow: drawArrow,
		drawBox: drawBox,
		drawCircle: drawCircle,
		drawSegment: drawSegment,
		drawPolygon: drawPolygon
	}
}();

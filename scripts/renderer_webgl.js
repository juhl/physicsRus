RendererWebGL = function() {
	var gl;
	var config = {};

	var pendingTextureLoads = 0;

	function init(canvas) {
		if (!canvas.getContext) {
			console.error("Your browser doesn't support canvas.");
			return;
		}

		if (!window.WebGLRenderingContext) {
			console.error("Your browser doesn't support WebGL.");
			return;
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

		gl.clearColor(1.0, 1.0, 1.0, 1.0);
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

		console.warn("checkGLError: " + str + " on " + msg);
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
		gl.viewport(x, y, width, height);
        gl.colorMask(true, true, true, true);
        gl.clear(gl.COLOR_BUFFER_BIT);
	}

	function scissorRect(x, y, width, height) {
		
	}

	function drawLine(p1, p2, strokeStyle) {
		gl.drawArrays(gl.LINES, 0, triangleVertexPositionBuffer.numItems);
	}

	function drawArrow(p1, p2, strokeStyle) {
		gl.drawArrays(gl.LINES, 0, triangleVertexPositionBuffer.numItems);
	}    

	function drawBox(mins, maxs, fillStyle, strokeStyle) {
		gl.drawArrays(gl.LINES, 0, triangleVertexPositionBuffer.numItems);
	}

	function drawCircle(center, radius, angle, fillStyle, strokeStyle) {
		gl.drawArrays(gl.LINES, 0, triangleVertexPositionBuffer.numItems);
	}

	function drawSegment(a, b, radius, fillStyle, strokeStyle) {
		gl.drawArrays(gl.LINES, 0, triangleVertexPositionBuffer.numItems);
	}

	function drawPolygon(verts, fillStyle, strokeStyle) {
		var buffer = gl.createBuffer();
		gl.bindBuffer(gl.ARRAY_BUFFER, buffer);

		var data = new Float32Array(verts.length * 2);
		for (var i = 0; i < verts.length;) {
			data[i++] = verts.x;
			data[i++] = verts.y;
		}

		gl.bufferData(gl.ARRAY_BUFFER, data, gl.STREAM_DRAW);
		gl.drawArrays(gl.LINES, 0, verts.length);

		gl.deleteBuffer(buffer);
	}

	return {
		init: init,
		clearRect: clearRect,
		scissorRect: scissorRect,
		drawLine: drawLine,
		drawArrow: drawArrow,
		drawBox: drawBox,
		drawCircle: drawCircle,
		drawSegment: drawSegment,
		drawPolygon: drawPolygon
	}
}();

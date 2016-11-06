
var App = function() {
	var self = this;
	var canvas, gl;
	var textures = [];
	var program;
	var vertPosAttr, texCoordAttr;
	var pMatrix, vMatrix, mMatrix;
	var previousTimestamp;

	var uSampler, uPMatrix, uVMatrix, uMMatrix;
	
	var grass = [];
	var houses = [];
	var keyStates = [];
	
	var fov = 65;

	var moveSpeed = 0.06;
	var turnSpeed = 0.8;
	var camYaw = 0;
	
	var xCam = 0;
	var yCam = 0;
	var zCam = 0;

	var jumping = false;
	var yVel = 0;
	var yAcc = 0;

	self.Start = function(canvasID) {
		canvas = document.getElementById(canvasID);

		if (canvas === null)
			throw new Error('Canvas element of type ' + canvasID + ' could not be found');

		gl = self.GetWebGLRenderingContext(canvas);

		if (gl === null)
			throw new Error('Your browser does not support WebGL.');

		self.ExpandCanvas();

		window.onresize = self.ExpandCanvas;
		window.onblur = () => Object.keys(keyStates).forEach(x => keyStates[x] = false);

		var textureFiles = ['test.png', 'grass.png', 'house.png'];
		var texturesToLoad = textures.length;
		var onAllLoaded = function() {
			self.RegisterKeyPresses();
			self.LoadShaderProgram();

			uSampler = gl.getUniformLocation(program, 'uSampler');
			uPMatrix = gl.getUniformLocation(program, 'uPMatrix');
			uVMatrix = gl.getUniformLocation(program, 'uVMatrix');
			uMMatrix = gl.getUniformLocation(program, 'uMMatrix');

			for (var z = -10; z < 10; z++) {
				for (var x = -30; x < 30; x++) {
					var newGrass = new GrassTile();
					newGrass.Transform = newGrass.Transform.Translate(x, 0, z);
					grass.push(newGrass);
				}
			}

			for (var x = -3; x < 3; x++) {
				var newHouse = new House();
				newHouse.Transform = newHouse.Transform
					.Scale(6, 4, 2)
					.Translate(x * 6, 2, -10);
				houses.push(newHouse);
			}

			mMatrix = Matrix4.Identity();

			self.Load();

			window.requestAnimationFrame(self.Tick);
		};
		var onTextureLoaded = function() {
			if (--texturesToLoad < 1) 
				onAllLoaded();
		};

		for (var i = 0; i < textureFiles.length; i++) {
			self.LoadTexture(textureFiles[i], onTextureLoaded);
		}
	};

	self.Tick = function() {
		self.Update();
		self.Render();

		window.requestAnimationFrame(self.Tick);
	}

	self.Update = function() {
		if (keyStates['w']) {
			xCam -= Math.sin(camYaw * Math.PI / 180.0) * moveSpeed;
			zCam += Math.cos(camYaw * Math.PI / 180.0) * moveSpeed;
		}
		if (keyStates['s']) {
			xCam += Math.sin(camYaw * Math.PI / 180.0) * moveSpeed;
			zCam -= Math.cos(camYaw * Math.PI / 180.0) * moveSpeed;
		}
		if (keyStates['a'])
			camYaw = self.ClampRotationOverflow(camYaw - 2.0 * turnSpeed);
		if (keyStates['d'])
			camYaw = self.ClampRotationOverflow(camYaw + 2.0 * turnSpeed);
		if (keyStates[' '] && !jumping) {
			yAcc -= 0.01;
			jumping = true;
		}

		yVel += yAcc;
		yCam -= yVel;
		yAcc += 0.0005;
		
		if (yCam <= 0) {
			yCam = 0;
			yVel = 0;
			yAcc = 0;
			jumping = false;
		}
	};

	self.RegisterKeyPresses = function() {
		window.onkeyup = window.onkeydown = function(e) {
			keyStates[e.key] = e.type == 'keyup' ? false : true;
		};
	};

	self.ClampRotationOverflow = function(source) {
		if (source > 360)
			return source % 360;
		if (source < 0)
			return 360 - (source % 360);
		return source;
	};

	self.LoadShaderProgram = function() {
		var vertShader = self.LoadShader('vert-shader');
		var fragShader = self.LoadShader('frag-shader');
		program = gl.createProgram();
		gl.attachShader(program, vertShader);
		gl.attachShader(program, fragShader);
		gl.linkProgram(program);

		if (!gl.getProgramParameter(program, gl.LINK_STATUS)) 
			throw new Error('Failed to link program. Information: ' + gl.getProgramInfoLog());
		
		gl.useProgram(program);

		vertPosAttr = gl.getAttribLocation(program, 'aVertexPosition');
		gl.enableVertexAttribArray(vertPosAttr);

		texCoordAttr = gl.getAttribLocation(program, 'aTextureCoord');
		gl.enableVertexAttribArray(texCoordAttr);
	};

	self.LoadShader = function(shaderID) {
		var shaderScript = document.getElementById(shaderID);

		if (shaderScript == null)
			throw new Error('Shader script ' + shaderID + ' is not present in the document');

		var type = null;
		if (shaderScript.type == 'x-shader/x-vertex')
			type = gl.VERTEX_SHADER;
		else if (shaderScript.type == 'x-shader/x-fragment')
			type = gl.FRAGMENT_SHADER;
		else
			throw new Error('Invalid shader type: ' + shaderScript.type);
		
		var shader = gl.createShader(type);
		gl.shaderSource(shader, shaderScript.text);
		gl.compileShader(shader);

		if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
			gl.deleteShader(shader);
			throw new Error('Error compiling shader. Information: ' + gl.getShaderInfoLog(shader));
		}

		return shader;
	};

	self.Render = function(timestamp) {
		gl.clearColor(0, 0, 0, 1);
		gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

		vMatrix = Matrix4.Identity()
			.Translate(xCam, -yCam - 2.0, zCam)
			.Rotate(camYaw, 0, 1, 0);
		
		self.DrawGround();
		self.DrawHouses();
	};

	self.Load = function() {
		self.LoadGround();
		self.LoadHouses();
	};

	var grassVertBuffer, grassTexBuffer, grassIndexBuffer;
	var grassIndexCount = 0;

	var houseVertBuffer, houseTexBuffer, houseIndexBuffer;
	var houseIndexCount = 0;

	self.LoadGround = function() {
		var grassVerts = [];
		var grassTexCoords = [];
		var grassIndices = [];
		var uniqueIndices = 0;
		
		for (var i = 0; i < grass.length; i++) {
			var g = grass[i];
			var verts = g.ModelData.GetVertices();
			var indices = g.ModelData.GetIndices();
			var newVertices = [];
			var newIndices = [];
			
			var trans = g.Transform.GetValues();
			for (var j = 0; j < verts.length; j += 3) {
				newVertices[j + 0] = verts[j + 0] * trans[0] + trans[12];
				newVertices[j + 1] = verts[j + 1] * trans[5] + trans[13];
				newVertices[j + 2] = verts[j + 2] * trans[10] + trans[14];
			}

			for (var j = 0; j < indices.length; j++) {
				newIndices[j] = indices[j] + uniqueIndices;
			}

			uniqueIndices += indices.length - 2;

			grassVerts = grassVerts.concat(newVertices);
			grassTexCoords = grassTexCoords.concat(g.ModelData.GetTexCoords());
			grassIndices = grassIndices.concat(newIndices);
		}

		grassVertBuffer = gl.createBuffer();
		gl.bindBuffer(gl.ARRAY_BUFFER, grassVertBuffer);
		gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(grassVerts), gl.STATIC_DRAW);

		grassTexBuffer = gl.createBuffer();
		gl.bindBuffer(gl.ARRAY_BUFFER, grassTexBuffer);
		gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(grassTexCoords), gl.STATIC_DRAW);

		grassIndexBuffer = gl.createBuffer();
		gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, grassIndexBuffer);
		gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(grassIndices), gl.STATIC_DRAW);
		grassIndexCount = grassIndices.length;

		gl.bindBuffer(gl.ARRAY_BUFFER, null);
		gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, null);
	};

	self.DrawGround = function() {
		gl.bindBuffer(gl.ARRAY_BUFFER, grassVertBuffer);
		gl.vertexAttribPointer(vertPosAttr, 3, gl.FLOAT, false, 0, 0);

		gl.bindBuffer(gl.ARRAY_BUFFER, grassTexBuffer);
		gl.vertexAttribPointer(texCoordAttr, 2, gl.FLOAT, false, 0, 0);

		gl.activeTexture(gl.TEXTURE0);
		gl.bindTexture(gl.TEXTURE_2D, textures[1]);
		gl.uniform1i(uSampler, 0);

		gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, grassIndexBuffer);
		gl.uniformMatrix4fv(uPMatrix, false, new Float32Array(pMatrix.GetValues()));
		gl.uniformMatrix4fv(uVMatrix, false, new Float32Array(vMatrix.GetValues()));
		gl.uniformMatrix4fv(uMMatrix, false, new Float32Array(mMatrix.GetValues()));

		gl.drawElements(gl.TRIANGLES, grassIndexCount, gl.UNSIGNED_SHORT, 0);
		gl.bindTexture(gl.TEXTURE_2D, null);
	};

	self.LoadHouses = function() {
		var houseVerts = [];
		var houseTexCoords = [];
		var houseIndices = [];
		var uniqueIndices = 0;

		for (var i = 0; i < houses.length; i++) {
			var h = houses[i];
			var verts = h.ModelData.GetVertices();
			var indices = h.ModelData.GetIndices();
			var newVertices = [];
			var newIndices = [];

			var trans = h.Transform.GetValues();
			for (var j = 0; j < verts.length; j += 3) {
				newVertices[j + 0] = verts[j + 0] * trans[0] + trans[12];
				newVertices[j + 1] = verts[j + 1] * trans[5] + trans[13];
				newVertices[j + 2] = verts[j + 2] * trans[10] + trans[14];
			}

			for (var j = 0; j < indices.length; j++) {
				newIndices[j] = indices[j] + uniqueIndices;
			}

			uniqueIndices += indices.length - 4;

			houseVerts = houseVerts.concat(newVertices);
			houseTexCoords = houseTexCoords.concat(h.ModelData.GetTexCoords());
			houseIndices = houseIndices.concat(newIndices);
		}

		houseVertBuffer = gl.createBuffer();
		gl.bindBuffer(gl.ARRAY_BUFFER, houseVertBuffer);
		gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(houseVerts), gl.STATIC_DRAW);

		houseTexBuffer = gl.createBuffer();
		gl.bindBuffer(gl.ARRAY_BUFFER, houseTexBuffer);
		gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(houseTexCoords), gl.STATIC_DRAW);

		houseIndexBuffer = gl.createBuffer();
		gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, houseIndexBuffer);
		gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(houseIndices), gl.STATIC_DRAW);
		houseIndexCount = houseIndices.length;

		gl.bindBuffer(gl.ARRAY_BUFFER, null);
		gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, null);
	};

	self.DrawHouses = function() {
		gl.bindBuffer(gl.ARRAY_BUFFER, houseVertBuffer);
		gl.vertexAttribPointer(vertPosAttr, 3, gl.FLOAT, false, 0, 0);

		gl.bindBuffer(gl.ARRAY_BUFFER, houseTexBuffer);
		gl.vertexAttribPointer(texCoordAttr, 2, gl.FLOAT, false, 0, 0);

		gl.activeTexture(gl.TEXTURE0);
		gl.bindTexture(gl.TEXTURE_2D, textures[2]);
		gl.uniform1i(uSampler, 0);

		gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, houseIndexBuffer);
		gl.uniformMatrix4fv(uPMatrix, false, new Float32Array(pMatrix.GetValues()));
		gl.uniformMatrix4fv(uVMatrix, false, new Float32Array(vMatrix.GetValues()));
		gl.uniformMatrix4fv(uMMatrix, false, new Float32Array(mMatrix.GetValues()));

		gl.drawElements(gl.TRIANGLES, houseIndexCount, gl.UNSIGNED_SHORT, 0);
		gl.bindTexture(gl.TEXTURE_2D, null);
	};

	self.ExpandCanvas = function() {
		canvas.width = window.innerWidth;
		canvas.height = window.innerHeight;

		self.InitialiseWebGL();
	};

	self.LoadTexture = function(src, loadedCallback) {
		var texture = gl.createTexture();
		var image = new Image();
		image.src = src;
		image.onload = function() {
			self.HandleLoadedTexture(texture, image);
			loadedCallback();
		};

		textures.push(texture);
	};

	self.HandleLoadedTexture = function(texture, image) {
		gl.bindTexture(gl.TEXTURE_2D, texture);
		gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, image);
		gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
		gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
		gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
		gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
		gl.generateMipmap(gl.TEXTURE_2D);
		gl.bindTexture(gl.TEXTURE_2D, null);
	};

	self.GetWebGLRenderingContext = function() {
		return canvas.getContext('experimental-webgl')
			|| canvas.getContext('webgl');
	};

	self.InitialiseWebGL = function() {
		gl.clearColor(0, 0, 0, 1);
		gl.clearDepth(1.0);
		gl.enable(gl.BLEND);
		gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
		gl.enable(gl.DEPTH_TEST);
		gl.depthFunc(gl.LEQUAL);
		gl.enable(gl.CULL_FACE);
		gl.frontFace(gl.CCW);
		gl.cullFace(gl.BACK);
		gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);

		pMatrix = CameraHelpers.CreatePerspective(fov, gl.canvas.width / gl.canvas.height, 0.1, 100.0);
	};
};

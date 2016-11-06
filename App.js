
var App = function() {
	var self = this;
	var canvas, gl;
	var textures = [];
	var program;
	var vertPosAttr, texCoordAttr;
	var pMatrix, mvMatrix;
	var previousTimestamp;

	var uSampler, uPMatrix, uMVMatrix;
	
	var grass;
	var cube;
	var house;
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

		var textureFiles = ['test.png', 'grass.png', 'house.png'];
		var texturesToLoad = textures.length;
		var onAllLoaded = function() {
			self.RegisterKeyPresses();
			self.LoadShaderProgram();

			uSampler = gl.getUniformLocation(program, 'uSampler');
			uPMatrix = gl.getUniformLocation(program, 'uPMatrix');
			uMVMatrix = gl.getUniformLocation(program, 'uMVMatrix');

			for (var i = 0; i < 100; i++) {
				cube = new CubeRender();
				cube.LoadBuffers(gl);
			}

			grass = new GrassRender();
			grass.LoadBuffers(gl);

			house = new HouseRender();
			house.LoadBuffers(gl);

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

		mvMatrix = Matrix4.Identity()
			.Translate(xCam, -yCam - 2.0, zCam)
			.Rotate(camYaw, 0, 1, 0);

		//self.DrawCube(cube, textures[0]);
		
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
		
		for (var z = -10; z < 10; z++) {
			for (var x = -30; x < 30; x++) {
				var verts = grass.GetVertices();
				var indices = grass.GetIndices();
				var newVertices = [];
				var newIndices = [];

				for (var i = 0; i < verts.length; i += 3) {
					newVertices[i + 0] = verts[i + 0] + x;
					newVertices[i + 1] = verts[i + 1];
					newVertices[i + 2] = verts[i + 2] + z;
				}

				for (var i = 0; i < indices.length; i++) {
					newIndices[i] = indices[i] + uniqueIndices;
				}
				uniqueIndices += indices.length - 2;
				
				grassVerts = grassVerts.concat(newVertices);
				grassTexCoords = grassTexCoords.concat(grass.GetTexCoords());
				grassIndices = grassIndices.concat(newIndices);
			}
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
		gl.uniformMatrix4fv(uMVMatrix, false, new Float32Array(mvMatrix.GetValues()));

		gl.drawElements(gl.TRIANGLES, grassIndexCount, gl.UNSIGNED_SHORT, 0);
	};

	self.LoadHouses = function() {
		var houseVerts = [];
		var houseTexCoords = [];
		var houseIndices = [];
		var uniqueIndices = 0;

		for (var i = -3; i < 3; i++) {
			var verts = house.GetVertices();
			var indices = house.GetIndices();
			var newVertices = [];
			var newIndices = [];

			for (var j = 0; j < verts.length; j += 3) {
				newVertices[j + 0] = verts[j + 0] + i;
				newVertices[j + 1] = verts[j + 1];
				newVertices[j + 2] = verts[j + 2];
			}

			for (var j = 0; j < indices.length; j++) {
				newIndices[j] = indices[j] + uniqueIndices;
			}
			uniqueIndices += indices.length - 4;
			
			houseVerts = houseVerts.concat(newVertices);
			houseTexCoords = houseTexCoords.concat(house.GetTexCoords());
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
		gl.uniformMatrix4fv(uMVMatrix, false, new Float32Array(Matrix4.Identity()
			.Scale(6, 4.5, 1)
			.Translate(0, 2.3, -8)
			.Multiply(mvMatrix)
			.GetValues()));

		gl.drawElements(gl.TRIANGLES, houseIndexCount, gl.UNSIGNED_SHORT, 0);
	};

	self.DrawCube = function(obj, texture) {
		gl.bindBuffer(gl.ARRAY_BUFFER, obj.GetVertexBuffer());
		gl.vertexAttribPointer(vertPosAttr, 3, gl.FLOAT, false, 0, 0);

		gl.bindBuffer(gl.ARRAY_BUFFER, obj.GetTextureBuffer());
		gl.vertexAttribPointer(texCoordAttr, 2, gl.FLOAT, false, 0, 0);

		gl.activeTexture(gl.TEXTURE0);
		gl.bindTexture(gl.TEXTURE_2D, texture);
		gl.uniform1i(uSampler, 0);

		var indices = obj.GetIndexBuffer();
		var indexCount = obj.GetIndexCount();

		gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indices);
		gl.uniformMatrix4fv(uPMatrix, false, new Float32Array(pMatrix.GetValues()));
		gl.uniformMatrix4fv(uMVMatrix, false, new Float32Array(mvMatrix.GetValues()));

		gl.drawElements(gl.TRIANGLES, indexCount, gl.UNSIGNED_SHORT, 0);
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

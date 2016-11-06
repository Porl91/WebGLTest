var CubeRender = function() {
	var self = this;
	var vertexBuffer, textureBuffer, indicesBuffer;
	var vertices, texCoords, indices;
	var angle = 0;
	var rad = 1 / Math.sqrt(2);

	self.LoadBuffers = function(gl) {
		vertexBuffer = gl.createBuffer();
		gl.bindBuffer(gl.ARRAY_BUFFER, vertexBuffer);

		vertices = [
			-1.0, -1.0,  1.0,
			1.0, -1.0,  1.0,
			1.0,  1.0,  1.0,
			-1.0,  1.0,  1.0,

			// Back face
			-1.0, -1.0, -1.0,
			-1.0,  1.0, -1.0,
			1.0,  1.0, -1.0,
			1.0, -1.0, -1.0,

			// Top face
			-1.0,  1.0, -1.0,
			-1.0,  1.0,  1.0,
			1.0,  1.0,  1.0,
			1.0,  1.0, -1.0,

			// Bottom face
			-1.0, -1.0, -1.0,
			1.0, -1.0, -1.0,
			1.0, -1.0,  1.0,
			-1.0, -1.0,  1.0,

			// Right face
			1.0, -1.0, -1.0,
			1.0,  1.0, -1.0,
			1.0,  1.0,  1.0,
			1.0, -1.0,  1.0,

			// Left face
			-1.0, -1.0, -1.0,
			-1.0, -1.0,  1.0,
			-1.0,  1.0,  1.0,
			-1.0,  1.0, -1.0
		];

		gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertices), gl.STATIC_DRAW);

		textureBuffer = gl.createBuffer();
		gl.bindBuffer(gl.ARRAY_BUFFER, textureBuffer);

		texCoords = [
			0.0, 1.0,
			1.0, 1.0,
			1.0, 0.0,
			0.0, 0.0, 
			
			0.0, 1.0,
			1.0, 1.0,
			1.0, 0.0,
			0.0, 0.0, 
			
			0.0, 1.0,
			1.0, 1.0,
			1.0, 0.0,
			0.0, 0.0, 
			
			0.0, 1.0,
			1.0, 1.0,
			1.0, 0.0,
			0.0, 0.0, 
			
			0.0, 1.0,
			1.0, 1.0,
			1.0, 0.0,
			0.0, 0.0, 
			
			0.0, 1.0,
			1.0, 1.0,
			1.0, 0.0,
			0.0, 0.0
		];

		gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(texCoords), gl.STATIC_DRAW);

		indicesBuffer = gl.createBuffer();

		indices = [
			0,  1,  2,      0,  2,  3,    // front
			4,  5,  6,      4,  6,  7,    // back
			8,  9,  10,     8,  10, 11,   // top
			12, 13, 14,     12, 14, 15,   // bottom
			16, 17, 18,     16, 18, 19,   // right
			20, 21, 22,     20, 22, 23    // left
		];

		gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indicesBuffer);
		gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(indices), gl.STATIC_DRAW);

		gl.bindBuffer(gl.ARRAY_BUFFER, null);
		gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, null);
	};

	self.GetVertexBuffer = function() {
		return vertexBuffer;
	};

	self.GetTextureBuffer = function() {
		return textureBuffer;
	};

	self.GetIndexBuffer = function() {
		return indicesBuffer;
	};

	self.GetIndexCount = function() {
		return indices.length;
	};

	self.Update = function() {
		angle += Math.random() * 3;
	};

	var scaledTransform = Matrix4.Identity()
			.Scale(0.25, 0.25, 0.25);
			
	self.GetTransform = function() {
		return scaledTransform
			.Rotate(angle % 360, rad, rad, 0);
	};
};
var HouseRender = function() {
	var self = this;
	var vertices, texCoords, indices;

	self.LoadBuffers = function(gl) {
		vertices = [
			// Top face
			-0.5, 0.5, 0.0, 
			0.5, 0.5, 0.0, 
			0.5, 0.7, -2.5, 
			-0.5, 0.7, -2.5, 

			// Front face
			0.5, -0.5, 0.0, 
			0.5, 0.5, 0.0, 
			-0.5, 0.5, 0.0,
			-0.5, -0.5, 0.0
		];

		texCoords = [
			// Top face
			1.0, 0.4, 
			1.0, 0.0, 
			0.0, 0.0,
			0.0, 0.4,

			// Front face
			1.0, 1.0, 
			1.0, 0.4, 
			0.0, 0.4, 
			0.0, 1.0
		];

		indices = [
			0, 1, 2, 
			0, 2, 3, 

			4, 5, 6, 
			4, 6, 7
		];
	};

	self.GetVertices = function() {
		return vertices;
	};

	self.GetTexCoords = function() {
		return texCoords;
	};

	self.GetIndices = function() {
		return indices;
	};

	self.GetIndexCount = function() {
		return indices.length;
	};

	self.Update = function() {
	};

	self.GetTransform = function() {
		return Matrix4.Identity();
	};
};
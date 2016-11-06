var GrassRender = function() {
	var self = this;
	var vertices, texCoords, indices;

	self.LoadBuffers = function(gl) {
		vertices = [
			-0.5, 0.0, -0.5, 
			-0.5, 0.0, 0.5, 
			0.5, 0.0, 0.5, 
			0.5, 0.0, -0.5
		];

		texCoords = [
			0.0, 0.0, 
			0.0, 1.0, 
			1.0, 1.0, 
			1.0, 0.0
		];

		indices = [
			0, 1, 2, 
			0, 2, 3
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
};
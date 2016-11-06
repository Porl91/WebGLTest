var GrassTile = function() {
	var self = this;

	self.Transform = null;
	self.ModelData = null;

	self.Create = function() {
		self.Transform = Matrix4.Identity();
		self.ModelData = new GrassRender();
		self.ModelData.LoadBuffers();
	};

	self.Update = function() {
	};

	self.Create();
};
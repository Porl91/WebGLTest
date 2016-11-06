var House = function() {
	var self = this;

	self.Transform = null;
	self.ModelData = null;

	self.Create = function() {
		self.Transform = Matrix4.Identity();
		self.ModelData = new HouseRender();
		self.ModelData.LoadBuffers();
	};

	self.Update = function() {
	};

	self.Create();
};
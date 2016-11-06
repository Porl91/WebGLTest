var CameraHelpers = {
	CreatePerspective: function(fovInDegrees, aspectRatio, near, far) {
		var fovInRadians = fovInDegrees * Math.PI / 180.0;
		var tan = Math.tan(Math.PI * 0.5 - 0.5 * fovInRadians);
		var rangeInverted = 1.0 / (near - far);
		
		return new Matrix4([
			tan / aspectRatio, 
			0, 
			0, 
			0,

			0, 
			tan, 
			0,
			0, 

			0, 
			0, 
			(near + far) * rangeInverted,
			-1, 

			0, 
			0, 
			near * far * rangeInverted * 2, 
			0
		]);
	}, 
	CreateOrthographic: function(left, right, bottom, top, near, far) {
		return new Matrix4([
			2.0 / (right - left), 
			0, 
			0, 
			0, 

			0, 
			2.0 / (top - bottom), 
			0, 
			0, 

			0, 
			0, 
			2.0 / (near - far), 
			0, 

			(left + right) / (left - right), 
			(bottom + top) / (bottom - top), 
			(near + far) / (near - far), 
			1
		]);
	}
};
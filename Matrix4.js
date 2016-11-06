var Matrix4 = function(newValues) {
	var self = this;
	var values = newValues;

	self.Translate = function(dx, dy, dz) {
		return this.Multiply(new Matrix4([
			1, 0, 0, 0, 
			0, 1, 0, 0, 
			0, 0, 1, 0, 
			dx, dy, dz, 1
		]));
	};

	self.Scale = function(sx, sy, sz) {
		return this.Multiply(new Matrix4([
			sx, 0, 0, 0, 
			0, sy, 0, 0, 
			0, 0, sz, 0, 
			0, 0, 0, 1
		]));
	};

	self.Rotate = function(angle, x, y, z) {
		angle = angle * Math.PI / 180.0;
		
		var len = Math.sqrt(x * x + y * y + z * z);
		if (len != 1) {
			var rlen = 1 / len;
			x *= len;
			y *= len;
			z *= len;
		}
		
		var c = Math.cos(angle);
		var s = Math.sin(angle);
		var nc = 1.0 - c;
		var xy = x * y;
		var yz = y * z;
		var xz = x * z;
		var xs = x * s;
		var ys = y * s;
		var zs = z * s;
		
		return this.Multiply(new Matrix4([
			x * x * nc + c, 
			xy 	  * nc + zs, 
			xz 	  * nc - ys, 
			0, 

			xy 	  * nc - zs,
			y * y * nc + c,
			yz 	  * nc + xs,
			0, 

			xz 	  * nc + ys,
			yz 	  * nc - xs,
			z * z * nc + c,
			0, 

			0, 
			0, 
			0, 
			1
		]));
	};

	self.Multiply = function(o) {
		var ov = o.GetValues();

		return new Matrix4([
			values[0] * ov[0] + values[1] * ov[4] + values[2] * ov[8] + values[3] * ov[12], 
			values[0] * ov[1] + values[1] * ov[5] + values[2] * ov[9] + values[3] * ov[13], 
			values[0] * ov[2] + values[1] * ov[6] + values[2] * ov[10] + values[3] * ov[14], 
			values[0] * ov[3] + values[1] * ov[7] + values[2] * ov[11] + values[3] * ov[15], 

			values[4] * ov[0] + values[5] * ov[4] + values[6] * ov[8] + values[7] * ov[12], 
			values[4] * ov[1] + values[5] * ov[5] + values[6] * ov[9] + values[7] * ov[13], 
			values[4] * ov[2] + values[5] * ov[6] + values[6] * ov[10] + values[7] * ov[14], 
			values[4] * ov[3] + values[5] * ov[7] + values[6] * ov[11] + values[7] * ov[15], 

			values[8] * ov[0] + values[9] * ov[4] + values[10] * ov[8] + values[11] * ov[12], 
			values[8] * ov[1] + values[9] * ov[5] + values[10] * ov[9] + values[11] * ov[13], 
			values[8] * ov[2] + values[9] * ov[6] + values[10] * ov[10] + values[11] * ov[14], 
			values[8] * ov[3] + values[9] * ov[7] + values[10] * ov[11] + values[11] * ov[15], 

			values[12] * ov[0] + values[13] * ov[4] + values[14] * ov[8] + values[15] * ov[12], 
			values[12] * ov[1] + values[13] * ov[5] + values[14] * ov[9] + values[15] * ov[13], 
			values[12] * ov[2] + values[13] * ov[6] + values[14] * ov[10] + values[15] * ov[14], 
			values[12] * ov[3] + values[13] * ov[7] + values[14] * ov[11] + values[15] * ov[15]
		]);
	};

	self.Transpose = function() {
		var newValues = [];

		for (var i = 0; i < 4; i++) {
			for (var j = 0; j < 4; j++) {
				newValues[i * 4 + j] = values[j * 4 + i];
			}
		}

		return new Matrix4(newValues);
	};

	self.GetValues = function() { 
		return values;
	}
};

Matrix4.Identity = function() {
	return new Matrix4([
		1, 0, 0, 0, 
		0, 1, 0, 0, 
		0, 0, 1, 0, 
		0, 0, 0, 1
	]);
};
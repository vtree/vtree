customMatchers = {
	toBeObject: function(obj) {
		return Object.identical(this.actual, obj);
	},
	toBeNode: function(node) {
		return Object.identical(this.actual.toJson(), node.toJson());
	},
	toBeArray: function(arr) {
		isSimilar = true;
		if (!this.actual) {
			isSimilar = false;
		}
		if (this.actual.constructor != Array) {
			isSimilar = false;
		}
		if (this.actual.length !== arr.length) {
			isSimilar = false;
		}
		for (var i = 0; i < this.actual.length; i++) {
			var el = this.actual[i];
			var expectedEl = arr[i];
			if (el !== expectedEl) {
				isSimilar = false;
			}
		}

      return isSimilar ;
    }

};

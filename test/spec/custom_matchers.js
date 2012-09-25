customMatchers = {
	toBeObject: function(obj) {
		return Object.identical(this.actual, obj)
	},
	toBeNode: function(node) {
		return Object.identical(this.actual.toJson(), node.toJson())
	}
};

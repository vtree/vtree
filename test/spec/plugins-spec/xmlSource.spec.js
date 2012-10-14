describe("xml source plugin", function() {
	var pluginName = "xmlSource";
	beforeEach(function() {
		this.addMatchers(customMatchers);
		appendSetFixtures(sandbox());
		data = getJSONFixture('sourceData.json');
		container = $('#sandbox');
		tree = Vtree.create({
			container:container,
			dataSource: data,
			plugins:[pluginName]
		});
	});


	describe("nodeStore plugin", function() {
		var className = "nodeStore";
		describe("functions", function() {

		});

	});
});
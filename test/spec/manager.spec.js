describe("Vtree manager functions", function() {
	var data, tree, container, container2;
	beforeEach(function() {
		this.addMatchers(customMatchers);
		appendSetFixtures(sandbox())
		appendSetFixtures(sandbox({id: 'sandbox2'}));
		data = getJSONFixture('sourceData.json');
		container = $('#sandbox')
		container2 = $('#sandbox2')
		tree = Vtree.create({
			container:container,
			dataSource: data
		})
	});
	afterEach(function() {
		try{ Vtree.destroy("tree")}catch(e){}
		try{ Vtree.destroy("tree2")}catch(e){}
	});
	describe("adding a plugin to an object", function() {
		
	});
	describe("initializing an object", function() {
		
	});
	describe("creating a tree", function() {
		
	});
	describe("destroying a tree", function() {
		var param;
		beforeEach(function() {
			param = "tree";
		});
		it("should call getTree", function() {
			spyOn(Vtree, "getTree").andReturn(tree);
			Vtree.destroy(param);
			
			expect(Vtree.getTree).toHaveBeenCalledWith(param);
		});
		it("should call tree.destroy", function() {
			spyOn(tree, "destroy");
			Vtree.destroy(param);
			expect(tree.destroy).toHaveBeenCalled();
		});
		it("the deleted tree should not appear in the trees list ", function() {
			data.tree.id = "tree2"
			var other_tree = Vtree.create({
				container:container2,
				dataSource: data
			})
			expect(Vtree.getTrees().length).toBe(2);
			expect(Vtree.getTrees()[0].id).toBe("tree");
			expect(Vtree.getTrees()[1].id).toBe("tree2");
			Vtree.destroy(param);
			expect(Vtree.getTrees().length).toBe(1);
			expect(Vtree.getTrees()[0].id).toBe("tree2");
		});
		
		
		
		
	});
	describe("getting a tree", function() {
		var other_tree;
		beforeEach(function() {
			var data2 = $.extend({}, data)
		  	data2.tree.id = "tree2"
			other_tree = Vtree.create({
				container:container2,
				dataSource: data2
			})
		});
		it("when passing a tree instance", function() {
			var res = Vtree.getTree(tree)
			expect(res instanceof Vtree.Tree).toBeTruthy();
			expect(res.id).toBe(tree.id);
			
			res = Vtree.getTree(other_tree)
			expect(res instanceof Vtree.Tree).toBeTruthy();
			expect(res.id).toBe(other_tree.id);
		});
		
		it("when passing a tree id", function() {
			var res = Vtree.getTree(tree.id)
			expect(res instanceof Vtree.Tree).toBeTruthy();
			expect(res.id).toBe(tree.id);	
			
			res = Vtree.getTree(other_tree.id)
			expect(res instanceof Vtree.Tree).toBeTruthy();
			expect(res.id).toBe(other_tree.id);		
		});
		
		it("when passing a container jquery element", function() {
			var res = Vtree.getTree(container)
			expect(res instanceof Vtree.Tree).toBeTruthy();
			expect(res.id).toBe(tree.id);
			
			res = Vtree.getTree(container2)
			expect(res instanceof Vtree.Tree).toBeTruthy();
			expect(res.id).toBe(other_tree.id);
		});
		
		it("when passing a container selector", function() {
			var res = Vtree.getTree("#sandbox")
			expect(res instanceof Vtree.Tree).toBeTruthy();
			expect(res.id).toBe(tree.id);
			
			res = Vtree.getTree("#sandbox2")
			expect(res instanceof Vtree.Tree).toBeTruthy();
			expect(res.id).toBe(other_tree.id);
		});
		
		
		
	});
	describe("getting all trees", function() {
		it("should return all trees", function() {
			var trees = Vtree.getTrees();
			expect(trees.length).toBe(1);
			expect(trees[0] instanceof Vtree.Tree).toBeTruthy();
			expect(trees[0].id).toBe("tree");

			data.tree.id = "tree2"
			var other_tree = Vtree.create({
				container:container2,
				dataSource: data
			})
			
			trees = Vtree.getTrees();
			expect(trees.length).toBe(2);
			expect(trees[0] instanceof Vtree.Tree).toBeTruthy();
			expect(trees[1] instanceof Vtree.Tree).toBeTruthy();
			expect(trees[0].id).toBe("tree");			
			expect(trees[1].id).toBe("tree2");			
		});
		
	});
	describe("generating an identificator for a tree", function() {
		it("should generate an id with 12 caracteres composed of numbers and letters ", function() {
			expect(/([a-z0-9]){12}/.test(Vtree._generateTreeId())).toBeTruthy();
		});
		
	});
});
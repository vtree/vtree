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
		var TestObject, testObject, pluginGroup;
		beforeEach(function() {
			pluginGroup = "tree";

		});
		it("should throw if plugin name does not exist", function() {
			TestObject = function() {
				this.pluginFns = {};
				Vtree.addPlugin.apply(this, ["inexistantPlugin", pluginGroup])
			}
			expect(function(){testObject = new TestObject();}).toThrow();
		});

		it("should extends the object with the default object of the plugin", function() {
			TestObject = function() {
				this.pluginFns = {};
				Vtree.addPlugin.apply(this, ["core", pluginGroup])
			}
			testObject = new TestObject();
			coreDefaults = Vtree.plugins.defaults.core[pluginGroup].defaults;
			for (var attr in coreDefaults) {
				 var attrVal = coreDefaults[attr];
				 expect(testObject[attr]).toBeDefined();
				 if (testObject[attr] && typeof testObject[attr].is != "function" ) {
				 	expect(testObject[attr]).toBe(attrVal);
				 }

			}

		});

		it("should add a function for each functions from the plugin", function() {
			TestObject = function() {
				this.pluginFns = {};
				Vtree.addPlugin.apply(this, ["core", pluginGroup])
			}
			testObject = new TestObject();
			coreFns = Vtree.plugins.defaults.core[pluginGroup]._fn;
			for (var fnName in coreFns) {
				 var fn = coreFns[fnName];
				 expect(testObject[fnName]).toBeDefined();
				 expect(typeof testObject[fnName]).toBe("function");
			}
		});


		describe("when several plugins that we attach to the object, define the same function ", function() {
			beforeEach(function() {
			  			// define 2 plugins with same function
				Vtree.plugins.plugin_1 = {
					tree:{
						defaults:{
							res:""
						},
						_fn:{
							a_function: function(){
								return "plugin_1"
							}
						}
					}
				}
				Vtree.plugins.plugin_2 = {
					tree:{
						defaults:{},
						_fn:{
							a_function: function(){
								return this._call_prev()+ "plugin_2"
							}
						}
					}
				}
				TestObject = function() {
					this.pluginFns = {};
					Vtree.addPlugin.apply(this, ["plugin_1", "tree"])
					Vtree.addPlugin.apply(this, ["plugin_2", "tree"])
				}

			});
			it("they should be both called when calling the function and in the order they have been added to the object", function() {
				testObject = new TestObject();
				var res = testObject.a_function()
				expect(res).toBe("plugin_1plugin_2");
			});

		});

	});
	describe("initializing an object", function() {
		var TestObject, testObject, pluginGroup, settingsPlugins;
		beforeEach(function() {
			pluginGroup = "tree";
			settingsPlugins = ["checkbox","cookie"];
		 	TestObject = function(settings) {
				Vtree.init.apply(this, [settings, pluginGroup])
			}
			spyOn(Vtree.addPlugin, "apply");
			testObject = new TestObject({
				plugins: settingsPlugins
			});
		});
		it("for each default plugins, it should call addPlugins", function() {
			for (var plugin in Vtree.plugins.defaults) {
				expect(Vtree.addPlugin.apply).toHaveBeenCalledWith(testObject, [plugin , pluginGroup]);
			}
		});
		it("should add all plugins passed in parameters", function() {
			$.each(settingsPlugins, function(index, pluginName) {
				expect(Vtree.addPlugin.apply).toHaveBeenCalledWith(testObject, [pluginName , pluginGroup]);
			});
		});


	});
	describe("creating a tree", function() {
		it("should destroy a tree which exists in the same container", function() {
			expect(function(){Vtree.getTree("tree")}).not.toThrow()
			expect(Vtree.getTree("tree").id).toBe("tree");
			var data2 = $.extend({}, data)
		  	data2.tree.id = "tree2"
			tree2 = Vtree.create({
				container:container,
				dataSource: data2
			})
			expect(function(){Vtree.getTree("tree")}).toThrow()
			expect(function(){Vtree.getTree("tree2")}).not.toThrow()
			expect(Vtree.getTree("tree2").id).toBe("tree2");
		});
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
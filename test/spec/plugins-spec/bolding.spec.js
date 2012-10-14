describe("bolding plugin", function() {
	var pluginName = "bolding",
		tree,
		container,
		data;
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
	describe("tree plugin", function() {
		var className = "tree";
		it("should set default variables", function() {
			expect(Vtree.plugins[pluginName][className].defaults).toBeObject({
				initially_bold: [],
				cascading_bold: false
			});
		});
		describe("functions", function() {
			it("should get currently bold nodes", function() {
				spyOn(tree.nodeStore, "getBoldNodes");
				expect(tree.getBoldNodes).toBeDefined();
				expect(typeof tree.getBoldNodes).toBe("function");
				tree.getBoldNodes()
				expect(tree.nodeStore.getBoldNodes).toHaveBeenCalled();
			});
			describe("attaching new event", function() {
				it("on click event it should get the node and toggle his bolding state", function() {
					tree._attachEvents();
					var node = tree.getNode("test_1");
					spyOn(node, "toggleBold");
					tree.getNode("test_1").getEl().click();
					expect(node.toggleBold).toHaveBeenCalled();
				});
				it("should call all functions _attachEvens, the core and the plugin one", function() {
					spyOn(tree.pluginFns._attachEvents[0], "apply").andCallThrough();
					spyOn(tree.pluginFns._attachEvents[1], "apply").andCallThrough();
					tree._attachEvents()
					expect(tree.pluginFns._attachEvents[0].apply).toHaveBeenCalled();
					expect(tree.pluginFns._attachEvents[1].apply).toHaveBeenCalled();
				});


			});

		});

	});
	describe("node plugin", function() {
		var className = "node",
			node;
		beforeEach(function() {
			node = tree.getNode("test_1")
		});
		it("should set default variables", function() {
			expect(Vtree.plugins[pluginName][className].defaults).toBeObject({
				isBold:false
			});
		});
		describe("functions", function() {
			describe("toggling bolding state", function() {
				beforeEach(function() {
				  	spyOn(node, 'bold');
					spyOn(node, 'unbold');
				});
				it("should call bold if it is unbold", function() {
					node.toggleBold();
					expect(node.bold).toHaveBeenCalled();
					expect(node.unbold).not.toHaveBeenCalled();
				});

				it("should call unbold if it is bold", function() {
					node.isBold = true
					node.toggleBold();
					expect(node.unbold).toHaveBeenCalled();
					expect(node.bold).not.toHaveBeenCalled();

				});
			});
			describe("bolding a node", function() {
				var eventSpy;
				beforeEach(function() {
					eventSpy = spyOnEvent('#sandbox', 'bold.node');
					node.bold();
				});
				it("should set a class 'bold' to the li element", function() {
					expect(node.getEl()[0]).toHaveClass("bold")
				});
				it("should set the variable isBold to true", function() {
					expect(node.isBold).toBeTruthy();
				});
				it("should trigger a bold.node event", function() {
					expect(eventSpy).toHaveBeenTriggered();
				});
				it("should bold parents when cascading_bold is set to true", function() {
					node.tree.cascading_bold = true;
					node.bold();
					for (var i=0, parents = node.parents, len = node.parents.length; i < len; i++) {
						var parent = parents[i];
						expect(parent.isBold).toBeTruthy();
						if (parent.id !== "root") {
							expect(parent.getEl()[0]).toHaveClass("bold");
						}
					}
				});
				it("should not bold parents when cascading_bold is false", function() {
					node.tree.cascading_bold = false;
					for (var i=0, parents = node.parents, len = node.parents.length; i < len; i++) {
						var parent = parents[i];
						expect(parent.isBold).toBeFalsy();
						if (parent.id !== "root") {
							expect(parent.getEl()[0]).not.toHaveClass("bold");
						}
					}
				});
			});
			describe("unbolding a node", function() {
				var eventSpy;
				beforeEach(function() {
					node.bold();
					eventSpy = spyOnEvent('#sandbox', 'unbold.node');
					node.open();
					for (var i=0, children = node.children, len = node.children.length; i < len; i++) {
						var child = children[i];
						child.bold();
					}
					node.unbold();
				});
				it("should remove the class 'bold' to the li element", function() {
					expect(node.getEl()[0]).not.toHaveClass("bold")
				});
				it("should set the variable isBold to false", function() {
					expect(node.isBold).toBeFalsy();
				});
				it("should trigger a unbold.node event", function() {
					expect(eventSpy).toHaveBeenTriggered();
				});
				it("should unbold children when cascading_bold is set to true", function() {
					node.tree.cascading_bold = true;

					node.unbold();
					for (var i=0, children = node.children, len = node.children.length; i < len; i++) {
						var child = children[i];
						expect(child.isBold).toBeFalsy();
						expect(child.getEl()[0]).not.toHaveClass("bold");
					}
				});
				it("should not unbold children when cascading_bold is false", function() {
					node.tree.cascading_bold = false;
					for (var i=0, children = node.children, len = node.children.length; i < len; i++) {
						var child = children[i];
						expect(child.isBold).toBeTruthy();
						expect(child.getEl()[0]).toHaveClass("bold");
					}
				});

			});
			describe("getting the node html", function() {
				it("should add a class bold if is_bold is set to true", function() {
					node.bold();
					var li = node.getHTML();
					expect(li[0]).toHaveClass("bold");
				});
				it("should not add a class bold if is_bold is set to false", function() {
					node.unbold();
					var li = node.getHTML();
					expect(li[0]).not.toHaveClass("bold");
				});
				it("should call all the functions getHTML of the node", function() {
					spyOn(node.pluginFns.getHTML[0], "apply").andCallThrough();
					spyOn(node.pluginFns.getHTML[1], "apply").andCallThrough();
					node.getHTML()
					expect(node.pluginFns.getHTML[0].apply).toHaveBeenCalled();
					expect(node.pluginFns.getHTML[1].apply).toHaveBeenCalled();
				});



			});
		});

	});
	describe("nodeStore plugin", function() {
		var className = "nodeStore";
		it("should set default variables", function() {
			expect(Vtree.plugins[pluginName][className].defaults).toBeObject({});
		});
		describe("functions", function() {
			var nodeStore,node;
			beforeEach(function() {
				nodeStore = tree.nodeStore;
				node = "test_2"
				nodeStore.tree.initially_bold = [node]
			});
			describe("initalizing the structure", function() {
				it("should call all the functions initStructure", function() {
					spyOn(nodeStore.pluginFns.initStructure[0], "apply").andCallThrough();
					spyOn(nodeStore.pluginFns.initStructure[1], "apply").andCallThrough();
					nodeStore.initStructure();
					expect(nodeStore.pluginFns.initStructure[0].apply).toHaveBeenCalled();
					expect(nodeStore.pluginFns.initStructure[1].apply).toHaveBeenCalled();
				});
				it("should bold the nodes that are in the initially_bold list", function() {
					expect(tree.getNode(node).isBold).toBeFalsy();
					nodeStore.initStructure();
					expect(tree.getNode(node).isBold).toBeTruthy();
				});
				it("should also bold the parents of the nodes in the initially_bold list if cascading_bold is set to true", function() {
					node = nodeStore.getNode("test_2");
					for (var i=0, parents = node.parents, len = node.parents.length; i < len; i++) {
						var parent = parents[i];
						expect(parent.isBold).toBeFalsy();
					}
					nodeStore.tree.cascading_bold = true;

					nodeStore.initStructure();
					node = nodeStore.getNode("test_2");
					for (var i=0, parents = node.parents, len = node.parents.length; i < len; i++) {
						var parent = parents[i];
						expect(parent.isBold).toBeTruthy();
					}
				});



			});

			describe("getting the list of bold nodes", function() {
				var list;
				beforeEach(function() {
					nodeStore.initStructure();
					list = nodeStore.getBoldNodes();
				});
				it("should return a list of bold nodes in the tree", function() {
					expect(list.length).toBe(2);
					var node = nodeStore.getNode("test_2");
					expect(list[0].id).toBe(node.parent.id);
					expect(list[0] instanceof Vtree.Node).toBeTruthy();
					expect(list[1].id).toBe(node.id);
					expect(list[1] instanceof Vtree.Node).toBeTruthy();
				});

			});
		});

	});
});
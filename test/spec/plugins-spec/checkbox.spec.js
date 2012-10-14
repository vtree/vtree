describe("checkbox plugin", function() {
	var pluginName = "checkbox",
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
				initially_checked: [],
				disabled_checkboxes: []
			});
		});
		describe("functions", function() {
			it("should get currently checked nodes", function() {
				spyOn(tree.nodeStore, "getCheckedNodes");
				expect(tree.getCheckedNodes).toBeDefined();
				expect(typeof tree.getCheckedNodes).toBe("function");
				tree.getCheckedNodes()
				expect(tree.nodeStore.getCheckedNodes).toHaveBeenCalled();
			});
			describe("attaching new event", function() {
				it("on click event it should get the node and toggle his checkbox state", function() {
					tree._attachEvents();
					var node = tree.getNode("test_1");
					spyOn(node, "toggleCheck");
					tree.getNode("test_1").getEl().find("input[type=checkbox]").click();
					expect(node.toggleCheck).toHaveBeenCalled();
				});
				it("should call all functions _attachEvens", function() {
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
				isChecked:false,
				isDisabled: false
			});
		});
		describe("functions", function() {
			describe("toggling checkbox state", function() {
				beforeEach(function() {
				  	spyOn(node, 'check');
					spyOn(node, 'uncheck');
				});
				it("should call check if it is uncheck", function() {
					node.toggleCheck();
					expect(node.check).toHaveBeenCalled();
					expect(node.uncheck).not.toHaveBeenCalled();
				});

				it("should call uncheck if it is check", function() {
					node.isChecked = true
					node.toggleCheck();
					expect(node.uncheck).toHaveBeenCalled();
					expect(node.check).not.toHaveBeenCalled();

				});
			});
			describe("checking a node", function() {
				var eventSpy;
				beforeEach(function() {
					eventSpy = spyOnEvent('#sandbox', 'check.node');
					node.check();
				});

				it("should set the variable isChecked to true", function() {
					expect(node.isChecked).toBeTruthy();
				});
				it("should trigger a check.node event", function() {
					expect(eventSpy).toHaveBeenTriggered();
				});
				it("should check parents", function() {
					for (var i=0, parents = node.parents, len = node.parents.length; i < len; i++) {
						var parent = parents[i];
						expect(parent.isChecked).toBeTruthy();
					}
				});
			});
			describe("unchecking a node", function() {
				var eventSpy;
				beforeEach(function() {
					node.check();
					eventSpy = spyOnEvent('#sandbox', 'uncheck.node');
					node.open();
					for (var i=0, children = node.children, len = node.children.length; i < len; i++) {
						var child = children[i];
						child.check();
					}
					node.uncheck();
				});

				it("should set the variable isChecked to false", function() {
					expect(node.isChecked).toBeFalsy();
				});
				it("should trigger a uncheck.node event", function() {
					expect(eventSpy).toHaveBeenTriggered();
				});
				it("should uncheck children", function() {
					for (var i=0, children = node.children, len = node.children.length; i < len; i++) {
						var child = children[i];
						expect(child.isChecked).toBeFalsy();
					}
				});

			});
			describe("getting the node html", function() {
				var li;
				beforeEach(function() {
					li = node.getHTML();
				});
				it("should call all the functions getHTML of the node", function() {
					spyOn(node.pluginFns.getHTML[0], "apply").andCallThrough();
					spyOn(node.pluginFns.getHTML[1], "apply").andCallThrough();
					node.getHTML()
					expect(node.pluginFns.getHTML[0].apply).toHaveBeenCalled();
					expect(node.pluginFns.getHTML[1].apply).toHaveBeenCalled();
				});
				it("should add checkbox", function() {
					expect(li.children("label").children("input[type=checkbox]").length).toBe(1);

				});
				it("should check the checkbox if isChecked is true", function() {
					var node = tree.getNode("test_4")
					node.check();
					var li = node.getHTML();
					expect(node.isChecked).toBeTruthy();
					expect(li.find("input[type='checkbox']").attr("checked")).toBeTruthy();
				});
				it("should check the checkbox if isChecked is false", function() {
					expect(node.isChecked).toBeFalsy();
					expect(li.find("input[type='checkbox']").attr("checked")).toBeFalsy();
				});

				it("should disable the checkbox if isDisabled is true", function() {
					var node = tree.getNode("test_4")
					node.isDisabled = true;
					var li = node.getHTML();
					expect(li.find("input[type='checkbox']").attr("disabled")).toBeTruthy();

				});
				it("should replace the a.title tag by a label tag", function() {
					expect(li.children("label").length).toBe(1);
				});


			});
		});

	});
	describe("nodeStore plugin", function() {
		var className = "nodeStore";
		describe("functions", function() {
			var nodeStore,node;
			beforeEach(function() {
				nodeStore = tree.nodeStore;
				node = "test_2"
				nodeStore.tree.initially_checked = [node]
			});
			describe("initializing the structure", function() {
				it("should call all the functions initStructure", function() {
					spyOn(nodeStore.pluginFns.initStructure[0], "apply").andCallThrough();
					spyOn(nodeStore.pluginFns.initStructure[1], "apply").andCallThrough();
					nodeStore.initStructure();
					expect(nodeStore.pluginFns.initStructure[0].apply).toHaveBeenCalled();
					expect(nodeStore.pluginFns.initStructure[1].apply).toHaveBeenCalled();
				});
				it("should check nodes that are in the initially_checked list", function() {
					expect(tree.getNode(node).isChecked).toBeFalsy();
					nodeStore.initStructure();
					expect(tree.getNode(node).isChecked).toBeTruthy();
				});
				it("should also check the parents of the nodes in the initially_checked list", function() {
					node = nodeStore.getNode("test_2");
					for (var i=0, parents = node.parents, len = node.parents.length; i < len; i++) {
						var parent = parents[i];
						expect(parent.isChecked).toBeFalsy();
					}

					nodeStore.initStructure();
					node = nodeStore.getNode("test_2");
					for (var i=0, parents = node.parents, len = node.parents.length; i < len; i++) {
						var parent = parents[i];
						expect(parent.isChecked).toBeTruthy();
					}
				});

				it("should disable nodes that are in the disabled_checkboxes list", function() {
					nodeStore.tree.disabled_checkboxes= [node]
					nodeStore.tree.initially_checked = []

					expect(tree.getNode(node).isDisabled).toBeFalsy();
					nodeStore.initStructure();
					expect(tree.getNode(node).isDisabled).toBeTruthy();
				});
				it("should also disabled the children of the nodes in the disabled_checkboxes list", function() {
					nodeStore.tree.disabled_checkboxes= [node]
					nodeStore.tree.initially_checked = []

					node = nodeStore.getNode(node);
					for (var i=0, children = node.children, len = node.children.length; i < len; i++) {
						var child = children[i];
						expect(child.isDisabled).toBeFalsy();
					}
					nodeStore.initStructure();
					node = nodeStore.getNode("test_2");
					for (var i=0, children = node.children, len = node.children.length; i < len; i++) {
						var child = children[i];
						expect(child.isDisabled).toBeTruthy();
					}
				});


			});

			describe("getting the list of checked nodes", function() {
				var list;
				beforeEach(function() {
					nodeStore.initStructure();
					list = nodeStore.getCheckedNodes();
				});
				it("should return a list of checked nodes in the tree", function() {
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
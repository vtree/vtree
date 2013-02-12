describe("checkbox plugin", function() {
	var pluginName = "checkbox",
	tree,
	container,
	data,
	ajaxResponse;
	beforeEach(function() {
		this.addMatchers(customMatchers);
		appendSetFixtures(sandbox());
		data = getJSONFixture('sourceData.json');
		ajaxResponse = getJSONFixture('ajaxData_children.json');
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
				initiallyChecked: [],
				disabledCheckboxes: [],
				checkBehaviour: "checkParents",
				uncheckBehaviour: "uncheckChildren",
				displayCheckbox: true,
				checkedClass: "checked",
				disableBehaviour: "disableChildren",
				disabledClass: "disabled"
			});
		});
		describe("on event 'afterChildrenLoaded.node'", function() {
			describe("if node is checked and checking behaviour is to check children", function() {
				it("should check the children", function() {

					var id = "sandboxAfterChildren";
					appendSetFixtures(sandbox({id:id}));
					var data = getJSONFixture('sourceData_ajax.json');
					container = $('#'+id);
					var tree = Vtree.create({
						container:container,
						dataSource: data,
						plugins:[pluginName, "ajax_loading"],
						initiallyChecked: ["test_1"],
						checkBehaviour:"checkChildren"
					});
					var node1 = tree.getNode("test_1")
					node1.onAjaxResponse(ajaxResponse);
					$('#'+id).trigger("afterChildrenLoaded.node",[tree, node1]);
					expect(node1.children[0].isChecked).toBeTruthy();
					expect(node1.children[0].getEl().find("input[type=checkbox]").eq(0).prop("checked")).toBeTruthy();
				});
			});
			describe("if node is unchecked and unchecking behaviour is to uncheck children", function() {
				it("should uncheck the children", function() {
					var id = "sandboxAfterChildren2";
					appendSetFixtures(sandbox({id:id}));
					var data = getJSONFixture('sourceData_ajax.json');
					container = $('#'+id);
					var tree = Vtree.create({
						container:container,
						dataSource: data,
						plugins:[pluginName, "ajax_loading"],
						uncheckBehaviour:"uncheckChildren"
					});
					var node1 = tree.getNode("test_1");
					node1.onAjaxResponse(ajaxResponse);
					$('#'+id).trigger("afterChildrenLoaded.node",[tree, node1]);
					expect(node1.children[0].isChecked).toBeFalsy();
					expect(node1.children[0].getEl().find("input[type=checkbox]").eq(0).prop("checked")).toBeFalsy();
				});
			});
			describe("when a child was on the list initiallyChecked", function() {
				it("should be checked", function() {
					var id = "sandboxAfterChildren3";
					appendSetFixtures(sandbox({id:id}));
					var data = getJSONFixture('sourceData_ajax.json');
					container = $('#'+id);
					var tree = Vtree.create({
						container:container,
						dataSource: data,
						plugins:[pluginName, "ajax_loading"],
						initiallyChecked:["test_2"],
						checkChildren:false
					});
					var node1 = tree.getNode("test_1");
					node1.onAjaxResponse(ajaxResponse);
					$('#'+id).trigger("afterChildrenLoaded.node",[tree, node1]);
					expect(tree.getNode("test_2").isChecked).toBeTruthy();
					expect(tree.getNode("test_2").getEl().find("input[type=checkbox]").eq(0).prop("checked")).toBeTruthy();
				});

			});
		});
		describe("on event 'onReady.tree'", function() {
			var id, tree, spy1, spy2, node1;
			beforeEach(function() {
				id = "sandboxOnReady";
				appendSetFixtures(sandbox({id:id}));
				container = $('#'+id);
				tree = Vtree.create({
					container:container,
					dataSource: data,
					id:"tree"+id,
					plugins:[pluginName, "ajax_loading"]
				});
				node1 = tree.getNode("test_1");
				spy1 = spyOn(tree, "initiateCheckedNodes");
				spy2 = spyOn(tree, "initiateDisabledNodes");
				$('#'+id).trigger("onReady.tree",[tree, node1]);
			});
			it("should intialize the checked nodes", function() {
				expect(spy1).toHaveBeenCalled();
			});
			it("should intialize the disabled nodes", function() {
				expect(spy2).toHaveBeenCalled();
			});
		});
		describe("functions", function() {
			it("should get currently checked nodes", function() {
				var id = "sandboxgetChecked";
				appendSetFixtures(sandbox({id:id}));
				var container = $('#'+id);
				var tree = Vtree.create({
					container:container,
					dataSource: data,
					plugins:[pluginName],

				});
				tree.getNode("test_1").check();
				var res = tree.getCheckedNodes();
				expect(res.length).toBe(1);
				expect(res[0].id).toBe("test_1");
			});
			describe("initializing the checked nodes", function() {
				var id, tree, spy1, spy2, node1, node4, spy3;
				beforeEach(function() {
					id = "sandboxInitiallyCheckedList";
					appendSetFixtures(sandbox({id:id}));
					container = $('#'+id);
					tree = Vtree.create({
						container:container,
						dataSource: data,
						id:"tree"+id,
						plugins:[pluginName],
						initiallyChecked:["test_1", "test_4", "unexistingNode"]
					});
					node1 = tree.getNode("test_1");
					node4 = tree.getNode("test_4");
					spy1 = spyOn(node1, "check");
					spy2 = spyOn(node4, "check");
					spy3 = spyOn(tree, "initiateCheckedNodes").andCallThrough();
					tree.initiateCheckedNodes();
				});
				it("should call function check() on nodes from the initiallyChecked list", function() {
					expect(spy1).toHaveBeenCalled();
					expect(spy2).toHaveBeenCalled();
				});

				it("should check the checkboxes of the nodes in the list", function() {
					expect(node1.getEl().find("input[type=checkbox]").eq(0).prop("checked")).toBeTruthy();
					expect(node4.getEl().find("input[type=checkbox]").eq(0).prop("checked")).toBeTruthy();

				});


			});
			describe("initializing the disabled nodes", function() {
				var id, tree, node1, node4;
				beforeEach(function() {
					id = "sandboxInitiallyCheckedList";
					appendSetFixtures(sandbox({id:id}));
					container = $('#'+id);
					tree = Vtree.create({
						container:container,
						dataSource: data,
						disabledClass: "disabledClass",
						id:"tree"+id,
						plugins:[pluginName],
						disableBehaviour: "disableChildren",
						disabledCheckboxes:["test_1", "test_4", "unexistingNode"],
						initiallyOpen:["test_1", "test_2"]
					});
					node1 = tree.getNode("test_1");
					node4 = tree.getNode("test_4");
					tree.initiateDisabledNodes();
				});
				it("should set isDisabled to all nodes in the list disabledCheckboxes", function() {

					expect(node1.isDisabled).toBeTruthy();
					expect(node4.isDisabled).toBeTruthy();
				});
				it("should add a class described in tree.disabledClass to all nodes in the list disabledCheckboxes", function() {
					expect(node1.getEl().hasClass(tree.disabledClass)).toBeTruthy();
					expect(node4.getEl().hasClass(tree.disabledClass)).toBeTruthy();

				});
				it("should disable all descendant of the nodes in the list 'initiallyDisabled' if disable behaviour is to disable children", function() {
					expect(node1.children[0].isDisabled).toBeTruthy();
					expect(node1.children[0].getEl().hasClass(tree.disabledClass)).toBeTruthy();
					expect(node1.children[0].children[0].isDisabled).toBeTruthy();
					expect(node1.children[0].children[0].getEl().hasClass(tree.disabledClass)).toBeTruthy();
				});

				it("should disable all parents of the nodes in the list if disable behaviour is to disable parents", function() {
					var id, tree, node;
					id = "sandboxInitiallyCheckedWithParentList";
					appendSetFixtures(sandbox({id:id}));
					container = $('#'+id);
					tree = Vtree.create({
						container:container,
						dataSource: data,
						disabledClass: "disabledClass",
						id:"tree"+id,
						plugins:[pluginName],
						disableBehaviour: "disableParents",
						disabledCheckboxes:["test_3"],
						initiallyOpen:["test_1", "test_2"]
					});
					node = tree.getNode("test_3");
					tree.initiateDisabledNodes();
					expect(node.isDisabled).toBeTruthy();
					expect(node.parent.isDisabled).toBeTruthy();
					expect(node.parent.getEl().hasClass(tree.disabledClass)).toBeTruthy();
					expect(node.parent.parent.isDisabled).toBeTruthy();
					expect(node.parent.parent.getEl().hasClass(tree.disabledClass)).toBeTruthy();
				});

			});
			describe("attaching new event", function() {
				it("on click of the checkbox it should get the node and toggle his checkbox state", function() {
					tree._attachEvents();
					var node = tree.getNode("test_1");
					spyOn(node, "toggleCheck");
					tree.getNode("test_1").getEl().find("input[type=checkbox]").click();
					expect(node.toggleCheck).toHaveBeenCalled();
				});
				it("if displayCheckbox = false, on click of the element it should toggle his checkbox state", function() {
					var id = "sandboxClickNode";
					appendSetFixtures(sandbox({id:id}));
					var container = $('#'+id);
					var tree = Vtree.create({
						container:container,
						dataSource: data,
						plugins:[pluginName],
						displayCheckbox: false
					});
					var res = tree.getCheckedNodes();
					var node = tree.getNode("test_1");
					spyOn(node, "toggleCheck");
					tree.getNode("test_1").getEl().click();
					expect(node.toggleCheck).toHaveBeenCalled();
				});
				it("if displayCheckbox = true (default), on click of the element it should not toggle his checkbox state", function() {
					tree._attachEvents();
					var node = tree.getNode("test_1");
					spyOn(node, "toggleCheck");
					tree.getNode("test_1").getEl().click();
					expect(node.toggleCheck).not.toHaveBeenCalled();
				});
				it("should call all functions _attachEvens", function() {
					spyOn(tree.pluginFns._attachEvents[0], "apply").andCallThrough();
					spyOn(tree.pluginFns._attachEvents[1], "apply").andCallThrough();
					tree._attachEvents()
					expect(tree.pluginFns._attachEvents[0].apply).toHaveBeenCalled();
					expect(tree.pluginFns._attachEvents[1].apply).toHaveBeenCalled();
				});


			});


			describe("opening a node", function() {
				it("should check children if the opened node is check and checking behaviour is to check children", function() {
					appendSetFixtures(sandbox({id:"sandboxopen1"}));
					container = $('#sandboxopen1');
					var tree = Vtree.create({
						container:container,
						dataSource: data,
						plugins:[pluginName],
						checkBehaviour: "checkChildren",
						uncheckBehaviour: "false"
					});
					tree.getNode("test_1").check();
					tree.getNode("test_1").open();
					expect(tree.getNode("test_2").isChecked).toBeTruthy();
				});
				it("should not check neither children nor parents if the opened node is check and checking behaviour is set to false", function() {
					appendSetFixtures(sandbox({id:"sandboxopen2"}));
					container = $('#sandboxopen2');
					var tree = Vtree.create({
						container:container,
						dataSource: data,
						plugins:[pluginName],
						checkBehaviour:false,
						uncheckBehaviour:false
					});
					tree.getNode("test_1").open();
					tree.getNode("test_2").check();
					tree.getNode("test_2").open();
					expect(tree.getNode("test_1").isChecked).toBeFalsy();
					expect(tree.getNode("test_3").isChecked).toBeFalsy();
				});
				it("should not check children if the opened node is uncheck and checking behaviour is to check children", function() {
					appendSetFixtures(sandbox({id:"sandboxopen3"}));
					container = $('#sandboxopen3');
					var tree = Vtree.create({
						container:container,
						dataSource: data,
						plugins:[pluginName],
						checkBehaviour:"checkChildren",
						uncheckBehaviour:false
					});
					tree.getNode("test_1").uncheck();
					tree.getNode("test_1").open();
					expect(tree.getNode("test_2").isChecked).toBeFalsy();
				});
				it("should uncheck children if the opened node is uncheck and uncheck behaviour is to uncheck children", function() {
					appendSetFixtures(sandbox({id:"sandboxopen4"}));
					container = $('#sandboxopen4');
					var tree = Vtree.create({
						container:container,
						dataSource: data,
						plugins:[pluginName],
						checkBehaviour:false,
						uncheckBehaviour:"uncheckChildren"
					});
					tree.getNode("test_2").isChecked = true;
					tree.getNode("test_1").uncheck();
					tree.getNode("test_1").open();
					expect(tree.getNode("test_2").isChecked).toBeFalsy();
				});
			});

			describe("generating html", function() {
				it("should add a class 'noCheckbox' to the top ul element of the tree ", function() {
					var id = "sandboxnoCheckbox";
					appendSetFixtures(sandbox({id:id}));
					var container = $('#'+id);
					var tree = Vtree.create({
						container:container,
						dataSource: data,
						plugins:[pluginName],
						displayCheckbox:false
					});
					expect(container.children("ul").hasClass("noCheckbox")).toBeTruthy();
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
				});

				it("should set the variable isChecked to true", function() {
					node.check();
					expect(node.isChecked).toBeTruthy();
				});

				it("should set the class passed in parameters to the li element", function() {
					node.check();
					expect(node.getEl().hasClass(node.tree.checkedClass)).toBeTruthy();
				});

				it("should trigger a check.node event", function() {
					node.check();
					expect(eventSpy).toHaveBeenTriggered();
				});

				it("should check parents if checking behaviour is to check parents", function() {
					id = "sandboxcheck1"
					appendSetFixtures(sandbox({id:id}));
					container = $('#'+id);
					var tree = Vtree.create({
						container:container,
						dataSource: data,
						plugins:[pluginName],
						checkBehaviour:"checkParents"
					});
					tree.getNode("test_1").open();
					tree.getNode("test_2").open();
					tree.getNode("test_3").check();
					expect(tree.getNode("test_1").isChecked).toBeTruthy();
					expect(tree.getNode("test_1").getEl().hasClass(tree.checkedClass)).toBeTruthy();
					expect(tree.getNode("test_2").isChecked).toBeTruthy();
					expect(tree.getNode("test_2").getEl().hasClass(tree.checkedClass)).toBeTruthy();
				});

				it("should not check neither parents nor children if checkingBehaviour is set to false", function() {
					id = "sandboxcheck2"
					appendSetFixtures(sandbox({id:id}));
					container = $('#'+id);
					var tree = Vtree.create({
						container:container,
						dataSource: data,
						plugins:[pluginName],
						checkBehaviour:false,
					});
					tree.getNode("test_1").open();
					tree.getNode("test_2").open();
					tree.getNode("test_2").check();
					expect(tree.getNode("test_1").isChecked).toBeFalsy();
					expect(tree.getNode("test_1").getEl().hasClass(tree.checkedClass)).toBeFalsy();
					expect(tree.getNode("test_2").isChecked).toBeTruthy();
					expect(tree.getNode("test_2").getEl().hasClass(tree.checkedClass)).toBeTruthy();
					expect(tree.getNode("test_3").isChecked).toBeFalsy();
					expect(tree.getNode("test_3").getEl().hasClass(tree.checkedClass)).toBeFalsy();
				});
				it("should check children if checking behaviour is to check children", function() {
					id = "sandboxcheck3"
					appendSetFixtures(sandbox({id:id}));
					container = $('#'+id);
					var tree = Vtree.create({
						container:container,
						dataSource: data,
						plugins:[pluginName],
						checkBehaviour:"checkChildren"
					});
					tree.getNode("test_1").open();
					tree.getNode("test_2").open();
					tree.getNode("test_1").check();
					expect(tree.getNode("test_2").isChecked).toBeTruthy();
					expect(tree.getNode("test_2").getEl().hasClass(tree.checkedClass)).toBeTruthy();
					expect(tree.getNode("test_3").isChecked).toBeTruthy();
					expect(tree.getNode("test_3").getEl().hasClass(tree.checkedClass)).toBeTruthy();
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
				it("should unset the class passed in parameters to the li element", function() {
					expect(node.getEl().hasClass(node.tree.checkedClass)).toBeFalsy();
				});

				it("should trigger a uncheck.node event", function() {
					expect(eventSpy).toHaveBeenTriggered();
				});
				it("should uncheck parents when uncheck behaviour is to uncheck parents", function() {
					id = "sandboxUncheck1"
					appendSetFixtures(sandbox({id:id}));
					container = $('#'+id);
					var tree = Vtree.create({
						container:container,
						dataSource: data,
						plugins:[pluginName],
						checkBehaviour:"checkParents",
						uncheckBehaviour:"uncheckParents"
					});
					tree.getNode("test_1").open().check();
					tree.getNode("test_2").open().check();
					tree.getNode("test_3").check();
					tree.getNode("test_3").uncheck();
					expect(tree.getNode("test_1").isChecked).toBeFalsy();
					expect(tree.getNode("test_1").getEl().hasClass(tree.checkedClass)).toBeFalsy();
					expect(tree.getNode("test_2").isChecked).toBeFalsy();
					expect(tree.getNode("test_2").getEl().hasClass(tree.checkedClass)).toBeFalsy();
				});
				it("should not uncheck neither parents nor children if uncheckBehaviour is set to false", function() {
					id = "sandboxUncheck2"
					appendSetFixtures(sandbox({id:id}));
					container = $('#'+id);
					var tree = Vtree.create({
						container:container,
						dataSource: data,
						plugins:[pluginName],
						uncheckBehaviour:false
					});
					tree.getNode("test_1").open().check();
					tree.getNode("test_2").open();
					tree.getNode("test_3").check();
					tree.getNode("test_2").check();
					tree.getNode("test_2").uncheck();
					expect(tree.getNode("test_1").isChecked).toBeTruthy();
					expect(tree.getNode("test_1").getEl().hasClass(tree.checkedClass)).toBeTruthy();
					expect(tree.getNode("test_3").isChecked).toBeTruthy();
					expect(tree.getNode("test_3").getEl().hasClass(tree.checkedClass)).toBeTruthy();
					expect(tree.getNode("test_2").isChecked).toBeFalsy();
					expect(tree.getNode("test_2").getEl().hasClass(tree.checkedClass)).toBeFalsy();
				});
				it("should uncheck children when unchecking behaviour is set to uncheck children", function() {
					id = "sandboxUncheck3"
					appendSetFixtures(sandbox({id:id}));
					container = $('#'+id);
					var tree = Vtree.create({
						container:container,
						dataSource: data,
						plugins:[pluginName],
						checkBehaviour:false,
						uncheckBehaviour:"uncheckChildren"
					});
					tree.getNode("test_1").open().check();
					tree.getNode("test_2").open().check();
					tree.getNode("test_3").check();
					tree.getNode("test_1").uncheck();
					expect(tree.getNode("test_2").isChecked).toBeFalsy();
					expect(tree.getNode("test_2").getEl().hasClass(tree.checkedClass)).toBeFalsy();
					expect(tree.getNode("test_3").isChecked).toBeFalsy();
					expect(tree.getNode("test_3").getEl().hasClass(tree.checkedClass)).toBeFalsy();
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
				it("should add the checkbox if displayCheckbox = true (default)", function() {
					expect(li.children("label").children("input[type=checkbox]").length).toBe(1);

				});
				it("should add the class described in param 'checkedClass' to the li element if the node is checked", function() {
					expect(node.getEl().hasClass(tree.checkedClass)).toBeFalsy();
					node.check()
					expect(node.getEl().hasClass(tree.checkedClass)).toBeTruthy();
				});
				it("the li element should not have a class described in param 'disabledClass' if it is not disabled", function() {
					expect(node.getEl().hasClass(tree.disabledClass)).toBeFalsy();
				});
				it("the li element should have a class described in param 'disabledClass' if the node is disabled", function() {
					id = "sandboxCheckboxDisabledHtml"
					appendSetFixtures(sandbox({id:id}));
					container = $('#'+id);
					var tree = Vtree.create({
						container:container,
						id:"disabledCheckboxes",
						dataSource: data,
						plugins:[pluginName],
						disabledClass: "thisIsDisable",
						disabledCheckboxes:["test_1"]
					});
					expect(tree.getNode("test_1").getEl().hasClass(tree.disabledClass)).toBeTruthy();
				});
				it("should not add checkbox if displayCheckbox = false", function() {
					id = "sandboxcheckboxhtml"
					appendSetFixtures(sandbox({id:id}));
					container = $('#'+id);
					var tree = Vtree.create({
						container:container,
						id: "treeCheckboxDisabledHtml",
						dataSource: data,
						plugins:[pluginName],
						displayCheckbox:false,
					});
					expect(tree.getNode("test_1").getEl().find("input[type=checkbox]").length).toBe(0);
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
			describe("testing isOneDescendantChecked", function() {
				it("should return true when a child is checked", function() {
					id = "sandboxisOneDesc1"
					appendSetFixtures(sandbox({id:id}));
					container = $('#'+id);
					var tree = Vtree.create({
						container:container,
						dataSource: data,
						plugins:[pluginName],
						checkChildren:false,
						checkParents:false,
						uncheckChildren:false,
						uncheckParents:false,
					});
					var node = tree.getNode("test_1");
					var directChild = node.children[0];
					var greatChild = directChild.children[0];
					greatChild.check();
					expect(node.isOneDescendantChecked()).toBeTruthy();
				});
				it("should return false when none of the children are checked", function() {
					id = "sandboxisOneDesc2"
					appendSetFixtures(sandbox({id:id}));
					container = $('#'+id);
					var tree = Vtree.create({
						container:container,
						dataSource: data,
						plugins:[pluginName],
						checkChildren:false,
						checkParents:false,
						uncheckChildren:false,
						uncheckParents:false,
					});
					var node = tree.getNode("test_1");
					var directChild = node.children[0];
					var greatChild = directChild.children[0];
					expect(node.isOneDescendantChecked()).toBeFalsy();
				});
			});
		});
	});
	describe("nodeStore plugin", function() {
		var className = "nodeStore";
		describe("functions", function() {
			describe("getting the list of checked nodes", function() {
				var id, tree,node, list;
				beforeEach(function() {
					id = "sandboxNodeStore";
					appendSetFixtures(sandbox({id:id}));
					container = $('#'+id);
					tree = Vtree.create({
						container:container,
						dataSource: data,
						id:"tree"+id,
						plugins:[pluginName],
						initiallyChecked:["test_2"],
						checkBehaviour: "checkParents", //by default, but this makes things clear
						uncheckBehaviour: "uncheckParents"
					});
					list = tree.getCheckedNodes();
					node = tree.getNode("test_2");
				});
				it("should return the nodes of this list + the one checked automatically depending on the checking behaviour", function() {
					expect(list.length).toBe(2);
					expect(list[0].id).toBe(node.parent.id);
					expect(list[1].id).toBe(node.id);
					expect(list[0] instanceof Vtree.Node).toBeTruthy();
					expect(list[1] instanceof Vtree.Node).toBeTruthy();
				});
				it("should not return nodes after we uncheck them, even if they are in the list initiallyChecked", function() {
					node.uncheck();
					list = tree.getCheckedNodes();
					expect(list.length).toBe(0);
				});
				it("should return nodes after we check them", function() {
					var node4 = tree.getNode("test_4");
					node4.check();
					node.uncheck(); //just to remove the other ones
					list = tree.getCheckedNodes();
					expect(list.length).toBe(1);
					expect(list[0].id).toBe(node4.id);
				});
			});
			describe("when used with the ajax loading plugin", function() {
				var id, tree,node, list, data;
				beforeEach(function() {
					id = "sandboxNodeStoreAjax";
					appendSetFixtures(sandbox({id:id}));
					container = $('#'+id);
					data = getJSONFixture('sourceData_ajax.json'); //test_2 not yet loaded
					tree = Vtree.create({
						container:container,
						dataSource: data,
						id:"tree"+id,
						plugins:[pluginName, "ajax_loading"],
						initiallyChecked:["test_1", "test_2"] //test_1 loaded, test_2 not yet loaded
					});
					list = tree.getCheckedNodes();
				});
				it("should also add the nodes in the list initiallyChecked that are not yet loaded in the page", function() {
					expect(list.length).toBe(2);
					expect(list[0].id).toBe("test_1");
					expect(list[1].id).toBe("test_2");
					expect(list[0] instanceof Vtree.Node).toBeTruthy();

				});
				it("should add the node not yet loaded with a 'pseudo instance of Node", function() {
					expect(list[1].id).toBe("test_2");
					expect(list[1].loaded).toBeFalsy();
					expect(list[1].initiallyChecked).toBeTruthy();
				});

			});
		});

	});
});
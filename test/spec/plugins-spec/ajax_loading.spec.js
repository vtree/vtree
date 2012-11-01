describe("ajax_loading plugin", function() {
	var pluginName = "ajax_loading",
	node1,
	ajaxUrl = "my/ajax/url";
	beforeEach(function() {
		this.addMatchers(customMatchers);
		appendSetFixtures(sandbox());
		data = getJSONFixture('sourceData_ajax.json');
		container = $('#sandbox');
		tree = Vtree.create({
			container:container,
			dataSource: data,
			ajaxUrl: ajaxUrl,
			plugins:[pluginName]
		});
		node1 = tree.getNode("test_1");
	});
	describe("tree plugin", function() {
		var className = "tree";
		it("should set default variables", function() {
			expect(Vtree.plugins[pluginName][className].defaults).toBeObject({
				ajaxUrl: "",
				ajaxParameters:{},
				asynchronous: true,
				forceAjaxReload: false
			});
		});
		describe("functions", function() {
			describe("build", function() {
				describe("before opening a node", function() {
					it("should do an ajax request if node has children but the list of children is empty", function() {
						var eventSpy = spyOn(jQuery, "ajax");
						node1.open();
						expect(eventSpy).toHaveBeenCalled();
					});

					it("should do an ajax request if node has children and we force reloading the children ", function() {
						tree.forceAjaxReload = true;
						var eventSpy = spyOn(jQuery, "ajax");
						node1.open();
						expect(eventSpy).toHaveBeenCalled();
						node1.close();
						node1.open();
						expect(eventSpy).toHaveBeenCalled();
					});
					describe("when node has children, the list is not empty and we don't force the relaoding", function() {
						var eventSpy, eventSpy2, node, tree, data;
						beforeEach(function() {
							data = getJSONFixture('sourceData.json'); //children ot test_1 are already preloaded
							appendSetFixtures(sandbox({id:"testbox"}));
							tree = Vtree.create({
								container:$("#testbox"),
								dataSource: data,
								forceAjaxReload:false,
								plugins:[pluginName]
							});
							node = tree.getNode("test_2");
							eventSpy = spyOn(jQuery, "ajax");
							eventSpy2 = spyOn(node, "continueOpening");
							node.open();
						});
						it("should not do an ajax request", function() {
							expect(eventSpy).not.toHaveBeenCalled();
							expect(eventSpy2).toHaveBeenCalled();
						});
					});


					describe("ajax call", function() {
						var eventSpy, args;
						beforeEach(function() {
							eventSpy = spyOn(jQuery, "ajax");
							node1.open();
							args = jQuery.ajax.mostRecentCall.args[0];

						});
						it("should call node.onAjaxResponse on response", function() {
							//to do...
						});
						it("should be json as data type", function() {
							expect(args.dataType).toBe('json');
						});
						it("should be a 'get' type", function() {
							expect(args.type).toBe("GET");
						});
						it("url should be the attribute that.ajaxUrl", function() {
							expect(args.url).toBe(ajaxUrl);
						});
						it("action should be 'getChildren'", function() {
							expect(args.data.action).toBe("getChildren");
						});
						it("node should be the node id", function() {
							expect(args.data.nodes).toBe("test_1");
						});
					});

					describe("when ajaxParameters is used", function() {
						var ajaxParameters,node1, eventSpy, args, tree;
						beforeEach(function() {
							ajaxParameters = {
								action: "getSubNodes",
								oneAttribute:"oneValue",
								secondAttribute: [1,2,3]
							};
							eventSpy = spyOn(jQuery, "ajax");
							appendSetFixtures(sandbox({id:"testbox2"}));
							tree = Vtree.create({
								container:$("#testbox2"),
								dataSource: data,
								ajaxUrl: ajaxUrl,
								ajaxParameters:ajaxParameters,
								plugins:[pluginName]
							});
							node1 = tree.getNode('test_1');
							node1.open();
							args = jQuery.ajax.mostRecentCall.args[0];
						});
						it("action should be 'getSubNodes'", function() {
							expect(args.data.action).toBe("getSubNodes");
						});
						it("every other attribute in ajaxParameters should be in the data passed to the ajax call", function() {
							expect(args.data.oneAttribute).toBe("oneValue");
							expect(args.data.secondAttribute).toBeArray([1,2,3]);
						});
					});

				});

				describe("after closing a node", function() {
					var nodeEl, tree, node1;
					beforeEach(function() {
						data = getJSONFixture('sourceData.json'); //children ot test_1 are already preloaded
						appendSetFixtures(sandbox({id:"testbox3"}));
							tree = Vtree.create({
								container:$("#testbox3"),
								dataSource: data,
								ajaxUrl: ajaxUrl,
								plugins:[pluginName]
							});
						node1 = tree.getNode("test_1");
						node1.open();
						nodeEl = node1.getEl();
					});
					describe("when forceAjaxReload is true", function() {
						beforeEach(function() {
							tree.forceAjaxReload = true;
						});
						it("should remove the ul element of the children", function() {
							expect(nodeEl.children("ul.children").length).not.toBe(0);
							node1.close();
							expect(nodeEl.children("ul.children").length).toBe(0);
						});

					});
					describe("when forceAjaxReload is false", function() {
						beforeEach(function() {
							tree.forceAjaxReload = false;
						});
						it("should not remove the ul element", function() {
							expect(nodeEl.children("ul.children").length).not.toBe(0);
							node1.close();
							expect(nodeEl.children("ul.children").length).not.toBe(0);
						});

					});
				});
				describe("before initialisation", function() {
					var tree;
					beforeEach(function() {
						appendSetFixtures(sandbox({id:"testbox4"}));
						spyOn(Vtree.plugins.ajax_loading.tree._fn, "fetchChildren");

						tree = Vtree.create({
							container:$("#testbox4"),
							dataSource: data,
							ajaxUrl: ajaxUrl,
							initially_open:["test_1"],
							plugins:[pluginName]
						});
					});

					it("should call tree.fetchChildren with test_1", function() {
						expect(Vtree.plugins.ajax_loading.tree._fn.fetchChildren).toHaveBeenCalled();
						expect(Vtree.plugins.ajax_loading.tree._fn.fetchChildren.mostRecentCall.args[0]).toBeArray(["test_1"]);
					});
				});
			});
			describe("fetch children", function() {
				describe("when list of nodes passed in param is empty ", function() {
					it("sould call to tree.continueBuilding", function() {
						spyOn(tree, "continueBuilding");
						tree.fetchChildren([]);
						expect(tree.continueBuilding).toHaveBeenCalled();
					});

				});


				describe("when the nodes passed in argument doesn't have the children preloaded", function() {
					it("should do the ajax call", function() {
						spyOn(jQuery, "ajax");
						tree.fetchChildren(["test_1"]);
						expect(jQuery.ajax).toHaveBeenCalled();
					});

				});
				describe("when the node passed in argument has the children preoloaded", function() {
					var tree, container;
					beforeEach(function() {
						var data = getJSONFixture('sourceData.json'); //children ot test_1 are already preloaded
						appendSetFixtures(sandbox({id:"testbox5"}));

						tree = Vtree.create({
							container:$("#testbox5"),
							dataSource: data,
							ajaxUrl: ajaxUrl,
							plugins:[pluginName]
						});

					});
					it("should continue building without making an ajax call", function() {
						spyOn(tree, "continueBuilding");
						tree.fetchChildren(["test_1"]);
						expect(tree.continueBuilding).toHaveBeenCalled();
					});
				});

				describe("about the ajax call", function() {
					var args;
					beforeEach(function() {
						spyOn(jQuery, "ajax");
						tree.fetchChildren(["test_1"]);
						args = jQuery.ajax.mostRecentCall.args[0]
					});
					it("should be a 'get' request", function() {
						expect(args.type).toBe("GET");
					});
					it("should be of type json", function() {
						expect(args.dataType).toBe("json");
					});
					it("action should be 'getChildren' or action passed in ajaxParamters", function() {
						expect(args.data.action).toBe("getChildren");
						tree.ajaxParameters = {action:"getSomethingElse"}
						tree.fetchChildren(["test_1"]);
						args = jQuery.ajax.mostRecentCall.args[0]
						expect(args.data.action).toBe("getSomethingElse");

					});
					it("nodes should be a string representing a list of node ids separated by comma", function() {
						expect(args.data.nodes).toBe("test_1");
						tree.fetchChildren(["test_1", "test_4"]);
						args = jQuery.ajax.mostRecentCall.args[0]
						expect(args.data.nodes).toBe(["test_1", "test_4"].join(","));
					});

				});


			});
			describe("getAjaxData", function() {
				it("should return the first argument", function() {
					var arg = "test argument"
					var res = tree.getAjaxData(arg)
					expect(res).toBe(arg);
				});

			});
			describe("onAjaxResponse", function() {
				var spy, spy2, spy3,
					dt = {
						"test_1": {
							id: "test_1",
							nodes:[{
								id:"test_2",
								title: "title_2",
								description: "desc",
								iconClass: "customFolder",
								hasChildren: false,
								nodes:[	]
							},
							{
								id:"test_3",
								title: "title_3",
								description: "desc",
								iconClass: "customFolder",
								hasChildren: false
							}]
						}
					};
				beforeEach(function() {
					spy = spyOn(tree, "getAjaxData").andCallThrough();
					spy2 = spyOn(tree, "addDataToNodeSource");
					spy3 = spyOn(tree, "continueBuilding");
					tree.onAjaxResponse(dt);
				});
				it("should call getAjaxData with the first argument", function() {
					expect(spy).toHaveBeenCalled();
					expect(spy.mostRecentCall.args[0]).toBeObject(dt)
				});
				it("should add the data received for each node to the dataSource", function() {
					expect(spy2).toHaveBeenCalled();
					expect(spy2.mostRecentCall.args[0]).toBeObject(dt["test_1"]);
				});

				it("should then continue building", function() {
					expect(spy3).toHaveBeenCalled();
				});


			});
			describe("addDataToNodeSource", function() {
				var nodeData = {
					id: "test_1",
					nodes:[{
						id:"test_2",
						title: "title_2",
						description: "desc",
						iconClass: "customFolder",
						hasChildren: false,
						nodes:[	]
					},
					{
						id:"test_3",
						title: "title_3",
						description: "desc",
						iconClass: "customFolder",
						hasChildren: false
					}]
				};

				it("should merge the data passed in arguments with the node data from the tree", function() {
					expect(tree.getNode("test_1").children).toBeArray([]);
					tree.addDataToNodeSource(nodeData);
					expect(tree.getNode("test_1").children.length).toBe(2);
					expect(tree.getNode("test_1").children[0]).toBeNode(tree.getNode("test_2"));
					expect(tree.getNode("test_1").children[1]).toBeNode(tree.getNode("test_3"));
				});

			});
		});

	});
	describe("node plugin", function() {
		var className = "node";
		describe("functions", function() {
			describe("onAjaxResponse", function() {
				var spy, spy2, tree, node1,
					nodeData = {
						"test_1":{
							nodes:[{
								id:"test_2",
								title: "title_2",
								description: "desc",
								iconClass: "customFolder",
								hasChildren: false,
								nodes:[	]
							},
							{
								id:"test_3",
								title: "title_3",
								description: "desc",
								iconClass: "customFolder",
								hasChildren: false
							}]
						}
					};
				beforeEach(function() {
					appendSetFixtures(sandbox({id:"sandbox6"}));
					tree = Vtree.create({
						container:$("#sandbox6"),
						dataSource: data,
						plugins:[pluginName]
					});
					node1 = tree.getNode("test_1");
					spy = spyOn(node1.tree, "getAjaxData").andCallThrough();
					spy2 = spyOn(node1, "continueOpening");
				});
				it("should call to this.tree.getAjaxData with the data received", function() {
					node1.onAjaxResponse(nodeData);
					expect(spy).toHaveBeenCalled();
					expect(spy.mostRecentCall.args[0]).toBeObject(nodeData)
				});

				it("should build the data structure of the children of the node with the data received", function() {
					expect(tree.getNode("test_1").children).toBeArray([]);
					node1.onAjaxResponse(nodeData);
					expect(tree.getNode("test_1").children.length).toBe(2);
					expect(tree.getNode("test_1").children[0]).toBeNode(tree.getNode("test_2"));
					expect(tree.getNode("test_1").children[1]).toBeNode(tree.getNode("test_3"));
				});
				it("should continueOpening", function() {
					node1.onAjaxResponse(nodeData);
					expect(node1.continueOpening).toHaveBeenCalled();
				});
			});
		});
	});
});
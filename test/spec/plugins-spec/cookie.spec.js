describe("cookie plugin", function() {
	var pluginName = "cookie",
	var fakeCookie = {};
	beforeEach(function() {
		this.addMatchers(customMatchers);
		appendSetFixtures(sandbox());
		data = getJSONFixture('sourceData.json');
		container = $('#sandbox');

		// we fake cookies for easier testing,
		// cookie is now a pure json object variable
		spyOn(Vtree, "readCookie").andCallFake(function(cookieName){
			return fakeCookie[cookieName];
		});
		spyOn(Vtree, "setCookie").andCallFake(function(cookieName,cookieValue,nDays){
			fakeCookie[cookieName] = JSON.parse(cookieValue)
		});

	});
	describe("tree plugin", function() {
		var className = "tree";

		describe("functions", function() {
			describe("building the tree", function() {
				describe("on initialisation", function() {
					describe("if there is no cookie set at all", function() {
						var eventSpy;
						beforeEach(function() {
							fakeCookie = {};
							eventSpy = spyOnEvent('#sandbox', 'OpenNodesFromCookie.tree');
							tree = Vtree.create({
								container:container,
								dataSource: data,
								plugins:[pluginName]
							});
						});
						it("should build an empty cookie", function() {
							expectedCookie = {
								Vtree:{
									trees:{}
								}
							}
							expectedCookie.Vtree.trees[tree.id] = {
								opened: tree.initially_open || [],
								checked: tree.initially_checked || [],
								bold: tree.initially_bold || []
							}
							expect(fakeCookie).toBeObject(expectedCookie);
						});
						it("should trigger an event OpenNodesFromCookie.tree", function() {
							expect(eventSpy).toHaveBeenTriggered()
						});

					});
					describe("when there is a Vtree cookie but not for the current tree", function() {
						beforeEach(function() {
							fakeCookie = {
								Vtree:{
									trees:{
										anothertreeId:{}
									}
								}
							};
							tree = Vtree.create({
								container:container,
								dataSource: data,
								plugins:[pluginName]
							});
						});
						it("should create the cookie for the current tree and add it the list of initally open, check and bold nodes", function() {
							var expectedCookie = jQuery.extend(true, {}, fakeCookie);
							expectedCookie.Vtree.trees[tree.id] = {
								opened: tree.initially_open || [],
								checked: tree.initially_checked || [],
								bold: tree.initially_bold || []
							};
							expect(fakeCookie).toBeObject(expectedCookie);

							});

					});
					describe("when there is an existing cookie for the current tree", function() {
						var eventSpy;
						beforeEach(function() {
							fakeCookie = {
								Vtree:{
									trees:{}
								}
							};
							fakeCookie.Vtree.trees[tree.id] = {
								opened:[1,2],
								checked:[2,3],
								bold:[3,4]
							}
							eventSpy = spyOnEvent('#sandbox', 'OpenNodesFromCookie.tree');

							tree = Vtree.create({
								container:container,
								dataSource: data,
								plugins:[pluginName]
							});
						});
						it("should set the initally_open array from the cookie value", function() {
							expect(tree.initally_open).toBeArray([1,2]);
						});
						it("should set the initially_bold array from the cookie value", function() {
							expect(tree.initially_checked).toBeArray([2,3]);
						});
						it("should set the initially_checked array from the cookie value", function() {
							expect(tree.initially_bold).toBeArray([3,4]);
						});
						it("should trigger a OpenNodesFromCookie.tree event", function() {
							expect(eventSpy).toHaveBeenTriggered()
						});

					});

				});
			});
			describe("closing a node", function() {
				var node1, node2;
				beforeEach(function() {
					fakeCookie = {};
					tree = Vtree.create({
						container:container,
						dataSource: data,
						plugins:[pluginName]
					});
					node1 = tree.getNode("test_1");
					node2 = tree.getNode("test_2");
					node1.open();
					node2.open();
				});
				it("should remove it and all his children from the cookie list of opened nodes", function() {
					expect(fakeCookie.Vtree.trees[tree.id].opened).toBeArray([node1.id, node2.id]);
					node1.close();
					expect(fakeCookie.Vtree.trees[tree.id].opened).toBeArray([]);
				});

			});
			describe("opening a node", function() {
				var node1, node2;
				beforeEach(function() {
					fakeCookie = {};
					tree = Vtree.create({
						container:container,
						dataSource: data,
						plugins:[pluginName]
					});
					node1 = tree.getNode("test_1");
					node2 = tree.getNode("test_2");
					node1.open();
				});
				it("should add it to the cookie list of opened nodes", function() {
					expect(fakeCookie.Vtree.trees[tree.id].opened).toBeArray([node1.id]);
					node2.open();
					expect(fakeCookie.Vtree.trees[tree.id].opened).toBeArray([node1.id, node2.id]);

				});
				it("shouldn't add it if the node is already on the list", function() {
					node2.open();
					expect(fakeCookie.Vtree.trees[tree.id].opened).toBeArray([node1.id, node2.id]);
					node2.open(); //second time we open it...
					expect(fakeCookie.Vtree.trees[tree.id].opened).toBeArray([node1.id, node2.id]);
				});
			});
			describe("checking a node", function() {
				var node1, node2, node3;
				beforeEach(function() {
					fakeCookie = {};
					tree = Vtree.create({
						container:container,
						dataSource: data,
						plugins:[pluginName, "checkbox"]
					});
					node1 = tree.getNode("test_1");
					node2 = tree.getNode("test_2");
					node3 = tree.getNode("test_3");
					node1.open();
					node2.open();

				});
				it("should add it and his parents to the cookie list of checked nodes", function() {
					expect(fakeCookie.Vtree.trees[tree.id].checked).toBeArray([]);
					node3.check();
					expect(fakeCookie.Vtree.trees[tree.id].checked).toBeArray([node3.id,node1.id,node2.id]);
				});

			});
			describe("unchecking a node", function() {
				var node1, node2, node3;
				beforeEach(function() {
					fakeCookie = {};
					tree = Vtree.create({
						container:container,
						dataSource: data,
						plugins:[pluginName, "checkbox"]
					});
					node1 = tree.getNode("test_1");
					node2 = tree.getNode("test_2");
					node3 = tree.getNode("test_3");
					node1.open();
					node2.open();
					node3.check();
				});
				it("should remove it and his children from the cookie list of checked nodes", function() {
					expect(fakeCookie.Vtree.trees[tree.id].checked).toBeArray([node3.id,node1.id,node2.id]);
					node1.uncheck();
					expect(fakeCookie.Vtree.trees[tree.id].checked).toBeArray([]);
				});


			});
			describe("bolding a node", function() {
				describe("when cascading_bold is false", function() {
					var node1, node2, node3;
					beforeEach(function() {
						fakeCookie = {};
						tree = Vtree.create({
							container:container,
							dataSource: data,
							cascading_bold: false,
							plugins:[pluginName, "bolding"]
						});
						node1 = tree.getNode("test_1");
						node2 = tree.getNode("test_2");
						node3 = tree.getNode("test_3");
						node1.open();
						node2.open();
					});
					it("should add it to the cookie list of bold nodes (without the parents)", function() {
						expect(fakeCookie.Vtree.trees[tree.id].bold).toBeArray([]);
						node3.bold();
						expect(fakeCookie.Vtree.trees[tree.id].bold).toBeArray([node3.id]);
					});

				});
				describe("when cascading_bold is true", function() {
					var node1, node2, node3;
					beforeEach(function() {
						fakeCookie = {};
						tree = Vtree.create({
							container:container,
							dataSource: data,
							cascading_bold: true,
							plugins:[pluginName, "bolding"]
						});
						node1 = tree.getNode("test_1");
						node2 = tree.getNode("test_2");
						node3 = tree.getNode("test_3");
						node1.open();
						node2.open();
					});
					it("should add it and his parents to the cookie list of bold nodes", function() {
						expect(fakeCookie.Vtree.trees[tree.id].bold).toBeArray([]);
						node3.bold();
						expect(fakeCookie.Vtree.trees[tree.id].bold).toBeArray([node3.id, node1.id, node2.id]);
					});
				});




			});
			describe("unbolding a node", function() {
				describe("when cascading_bold is set to false", function() {
					it("should remove it from the cookie list of bold nodes", function() {

					});
					it("if cascading_bold is set to true, it should also remove the bold children from the list ", function() {

					});
				});
				describe("when cascading_bold is set to true", function() {
					it("should remove it from the cookie list of bold nodes", function() {

					});
					it("if cascading_bold is set to true, it should also remove the bold children from the list ", function() {

					});
				});

			});
			describe("getting the cookie list of opened nodes ", function() {

			});
		});

	});
});
describe("cookie plugin", function() {
	var pluginName = "cookie",
		fakeCookie = {};
	beforeEach(function() {
		this.addMatchers(customMatchers);
		appendSetFixtures(sandbox());
		data = getJSONFixture('sourceData.json');
		container = $('#sandbox');

		// we fake cookies for easier testing,
		// cookie is now a pure json object variable
		spyOn(Vtree, "readCookie").andCallFake(function(cookieName){
			return JSON.stringify(fakeCookie[cookieName]);
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
								opened: tree.initiallyOpen || [],
								checked: tree.initiallyChecked || []
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
						it("should create the cookie for the current tree and add it the list of initally open and check and nodes", function() {
							var expectedCookie = jQuery.extend(true, {}, fakeCookie);
							expectedCookie.Vtree.trees[tree.id] = {
								opened: tree.initiallyOpen || [],
								checked: tree.initiallyChecked || []
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
								checked:[2,3]
							}
							eventSpy = spyOnEvent('#sandbox', 'OpenNodesFromCookie.tree');

							tree = Vtree.create({
								container:container,
								dataSource: data,
								plugins:[pluginName]
							});
						});
						it("should set the initally_open array from the cookie value", function() {
							expect(tree.initiallyOpen).toBeArray([1,2]);
						});
						it("should set the initiallyChecked array from the cookie value", function() {
							expect(tree.initiallyChecked).toBeArray([2,3]);
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
			describe("closing a node that has a checked child", function() {
				var node1,
					node2,
					node3;
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
				it("should not remove it from the opened list", function() {
					expect(node3.isChecked).toBeTruthy();
					expect(fakeCookie.Vtree.trees[tree.id].opened).toBeArray([node1.id, node2.id]);
					node2.close();
					expect(fakeCookie.Vtree.trees[tree.id].opened).toBeArray([node1.id, node2.id]);
					node2.open();
					node1.close();
					expect(fakeCookie.Vtree.trees[tree.id].opened).toBeArray([node1.id, node2.id]);
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
					expect(fakeCookie.Vtree.trees[tree.id].checked).toBeArray([node1.id,node2.id,node3.id]);
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
					expect(fakeCookie.Vtree.trees[tree.id].checked).toBeArray([node1.id,node2.id,node3.id]);
					node1.uncheck();
					expect(fakeCookie.Vtree.trees[tree.id].checked).toBeArray([]);
				});
			});
		});
	});
});
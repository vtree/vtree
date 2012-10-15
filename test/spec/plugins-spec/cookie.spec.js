describe("cookie plugin", function() {
	var pluginName = "cookie",
		fakeCookie = {};
	beforeEach(function() {
		this.addMatchers(customMatchers);
		appendSetFixtures(sandbox());
		data = getJSONFixture('sourceData.json');
		container = $('#sandbox');

		// we fake cookies for easier testing, cookie is now a pure json object
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
							console.log("fakeCookie:",fakeCookie)
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

						});

					});
					describe("when there is an existing cookie for the current tree", function() {
						it("should set the initally_open array from the cookie value", function() {

						});
						it("should set the initally_open array from the cookie value", function() {

						});
						it("should set the initally_open array from the cookie value", function() {

						});
						it("should trigger a OpenNodesFromCookie.tree event", function() {

						});

					});

				});
				describe("closing a node", function() {
					it("should remove it from the cookie list of opened nodes", function() {

					});

				});
				describe("opening a node", function() {
					it("should add it to the cookie list of opened nodes", function() {

					});
					it("shouldn't add it if the node is already on the list", function() {

					});
				});
				describe("checking a node", function() {
					it("should add it to the cookie list of checked nodes", function() {

					});
					it("should add the parents of the checked node", function() {

					});


				});
				describe("unchecking a node", function() {
					it("should remove it from the cookie list of checked nodes", function() {

					});
					it("should remove the checked children from the list", function() {

					});


				});
				describe("bolding a node", function() {
					it("should add it to the cookie list of bold nodes", function() {

					});
					it("if cascading_bold is set to true, it should also add the parents", function() {

					});


				});
				describe("unbolding a node", function() {
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
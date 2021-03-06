customMatchers = {
	toBeObject: function(obj) {
		return Object.identical(this.actual, obj)
	},
	toBeNode: function(node) {
		return Object.identical(this.actual.toJson(), node.toJson())
	}
};
describe("Node core functions", function() {
	describe("initialization", function() {
		var node;
		beforeEach(function () {
			node = new Vtree.Node({
				id: "root",
				title: "title",
				description: "description",
				plugins: ["checkbox"]
			})
		});

		it("should load settings pass in parameter", function() {
			expect(node.id).toBe("root");
			expect(node.title).toBe("title");
			expect(node.description).toBe("description");
		});

		it("should load default settings not pass in parameter", function() {
			expect(node.isOpen).toBeFalsy();
			expect(node.hasChildren).toBeFalsy();
		});

		it("should attach the core functions", function() {
			expect(typeof node.open).toBe("function");;
			expect(typeof node.close).toBe("function");;
			expect(typeof node.getHTML).toBe("function");;
		});

		it("should attach the functions from the plugins passed in parameter", function() {
			expect(typeof node.check).toBe("function");;
			expect(typeof node.uncheck).toBe("function");;
		});
	});

	describe("opening a node", function() {
		describe("if a node doesn't have children", function() {
			var node;
			beforeEach(function () {
				node = new Vtree.Node({
					id: "root",
					title: "title",
					hasChildren: false,
					children:[]
				});
			});
		  	it("should not do anything if it doesn't have children", function() {
				node.open()
				expect(node.isOpen).toBeFalsy();
			});
		});
		describe("if a node has children and they are already visible", function() {
			var node,
				spyBeforeOpen,
				spyAfterOpen;
			beforeEach(function () {
				appendSetFixtures(sandbox())
				mockTree = {
					container:$('#sandbox'),
					id: "treeId"
				}
				child = new Vtree.Node({
					id: "child",
					title: "child",
					hasChildren: false,
					tree: mockTree
				});
				parent = new Vtree.Node({
					id: "parent",
					title: "parent",
					hasChildren: true,
					hasVisibleChildren: true,
					hasRenderedChildren: true,
					isOpen: true,
					children:[child],
					tree: mockTree
				});
				spyOn(parent, 'toggleLoading');
				spyOn(parent, '_getChildrenHTML');
				spyBeforeOpen = spyOnEvent('#sandbox', 'beforeOpen.node');
				parent.open();
			});

			it("should not do anything", function() {
				expect(spyBeforeOpen).not.toHaveBeenTriggered()
			});

		});
		describe("if a node has children, they are not visible but they are already rendered", function() {
	  		var node,
				spyBeforeOpen,
				spyAfterOpen;
			beforeEach(function () {
				appendSetFixtures(sandbox())
				mockTree = {
					container:$('#sandbox'),
					id: "treeId"
				}
				child = new Vtree.Node({
					id: "child",
					title: "child",
					hasChildren: false,
					tree: mockTree
				});
				parent = new Vtree.Node({
					id: "parent",
					title: "parent",
					hasChildren: true,
					hasVisibleChildren: false,
					hasRenderedChildren: true,
					isOpen: false,
					children:[child],
					tree: mockTree
				});
				spyOn(parent, 'toggleLoading');
				spyOn(parent, '_getChildrenHTML');
				spyBeforeOpen = spyOnEvent('#sandbox', 'beforeOpen.node');
				parent.open();
			});

			it("should not build the html for the children ", function() {
				expect(parent._getChildrenHTML).not.toHaveBeenCalled()
			});

		});
		describe("if a node has children but they have never been loaded", function() {
			var parent,
				spyBeforeOpen,
				spyAfterOpen;
			beforeEach(function () {
				loadFixtures("node_close_with_children.html");
				appendSetFixtures(sandbox())
				mockTree = {
					container:$('#sandbox'),
					id: "treeId"
				}
				child = new Vtree.Node({
					id: "child",
					title: "child",
					hasChildren: false,
					tree: mockTree
				});
				parent = new Vtree.Node({
					id: "parent",
					title: "parent",
					hasChildren: true,
					children:[child],
					iconPath:{
						open:window.location.origin+"/images/file.png"
					},
					tree: mockTree
				});
				spyOn(parent, 'toggleLoading');
				spyOn(parent, '_getChildrenHTML');
				spyBeforeOpen = spyOnEvent('#sandbox', 'beforeOpen.node');
				spyAfterOpen = spyOnEvent('#sandbox', 'afterOpen.node');
				parent.open();
			});

			it("toggle loadding state", function() {
			  	expect(parent.toggleLoading).toHaveBeenCalled();
				expect(parent.toggleLoading.calls.length).toEqual(2);
			});
			it("gets htlm from the children", function() {
				expect(parent.toggleLoading).toHaveBeenCalled();
			});
			it("set the correct attribute", function() {
				expect(parent.isOpen).toBeTruthy();
				expect(parent.hasVisibleChildren).toBeTruthy();
				expect(parent.hasRenderedChildren).toBeTruthy();
			});
			it("should trigger a beforeOpen Event on the tree container element", function() {
				expect(spyBeforeOpen).toHaveBeenTriggered()
			});
			it("should trigger a afterOpen Event on the tree container element", function() {
				expect(spyAfterOpen).toHaveBeenTriggered()

			});
			it("should add a open class to the li element", function() {
				expect(parent.el).toHaveClass("open")
			});
			it("should change the open icon", function() {
				expect(parent.el.find("img")[0].src).toBe(window.location.origin+"/images/file.png");
			});
		});
		describe("if children are asynchronously loaded", function() {
			var parent,
			 	spyBeforeOpen,
				spyAfterOpen;
			beforeEach(function () {
				loadFixtures("node_close_with_children.html");
				appendSetFixtures(sandbox())
				var mockTree = {
					container:$('#sandbox'),
					id: "treeId",
					asynchronous:true
				}
				var child = new Vtree.Node({
					id: "child",
					title: "child",
					hasChildren: false,
					tree: mockTree
				});
				parent = new Vtree.Node({
					id: "parent",
					title: "parent",
					hasChildren: true,
					children:[child],
					iconPath:{
						open:"/images/file.png"
					},
					tree: mockTree
				});
				spyOn(parent, 'toggleLoading');
				spyOn(parent, 'continueOpening');
				spyBeforeOpen = spyOnEvent('#sandbox', 'beforeOpen.node');
				spyAfterOpen = spyOnEvent('#sandbox', 'afterOpen.node');
				parent.open();
			});
			it("should toggle laoding once", function() {
				expect(parent.toggleLoading).toHaveBeenCalled();
				expect(parent.toggleLoading.calls.length).toEqual(1);
			});
			it("should not call continueOpening", function() {
				expect(parent.continueOpening).not.toHaveBeenCalled();
			});
			it("should trigger beforeOpen event", function() {
				expect(spyBeforeOpen).toHaveBeenTriggered()
			});
			it("should not trigger afterOpen event", function() {
				expect(spyAfterOpen).not.toHaveBeenTriggered();
			});

			it("should change the open icon", function() {
				expect(parent.el.find("img")[0].src).toBe(window.location.origin+"/images/file.png");
			});


		});
	});

	describe("closing a node", function() {
		describe("if we close a node that doesnt have children", function() {
			var node,
				spyBeforeClose;
			beforeEach(function () {
				setFixtures(sandbox())
				mockTree = {
					container:$('#sandbox'),
					id: "treeId"
				}
				node = new Vtree.Node({
					id: "root",
					title: "title",
					hasChildren: false,
					children:[],
					tree: mockTree
				});
				spyBeforeClose = spyOnEvent('#sandbox', 'beforeClose.node');
				node.close();
			});
			it("should not do anything", function() {
				expect(spyBeforeClose).not.toHaveBeenTriggered()
			});

		});
		describe("if we close a node that's already close", function() {
			var node,
				spyBeforeClose;
			beforeEach(function () {
				setFixtures(sandbox())
				mockTree = {
					container:$('#sandbox'),
					id: "treeId"
				}
				node = new Vtree.Node({
					id: "root",
					title: "title",
					hasChildren: true,
					hasVisibleChildren: false,
					children:[],
					isOpen: false,
					tree: mockTree
				});
				spyBeforeClose = spyOnEvent('#sandbox', 'beforeClose.node');
				node.close();
			});
			it("should not do anything", function() {
				expect(spyBeforeClose).not.toHaveBeenTriggered()
			});
		});
		describe("if we close a node that has children visible on the page", function() {
			var node,
				spyBeforeClose,
				spyAfterClose;
			beforeEach(function () {
				loadFixtures("node_open_with_children.html");
				appendSetFixtures(sandbox())
				mockTree = {
					container:$('#sandbox'),
					id: "treeId"
				}
				child = new Vtree.Node({
					id: "child",
					title: "child",
					hasChildren: false,
					tree: mockTree
				});
				parent = new Vtree.Node({
					id: "parent",
					title: "parent",
					hasChildren: true,
					hasVisibleChildren: true,
					hasRenderedChildren: true,
					isOpen: true,
					children:[child],
					iconPath:{
						close:"/images/file.png"
					},
					tree: mockTree
				});
				spyBeforeClose = spyOnEvent('#sandbox', 'beforeClose.node');
				spyAfterClose = spyOnEvent('#sandbox', 'afterClose.node');
				parent.close();
			});
			it("triggers beforeClose event", function() {
				expect(spyBeforeClose).toHaveBeenTriggered()

			});
			it("triggers afterClose event", function() {
				expect(spyAfterClose).toHaveBeenTriggered()

			});
			it("removes the class open to the li element", function() {
				expect(parent.el).not.toHaveClass("open")

			});
			it("sets the correct attribute values", function() {
				expect(parent.isOpen).toBeFalsy();
				expect(parent.hasVisibleChildren).toBeFalsy();
				expect(parent.hasRenderedChildren).toBeTruthy();
			});
			it("change the icon path for the close button", function() {
				expect(parent.el.find("img")[0].src).toBe(window.location.origin+"/images/file.png");
			});


		});
	});

	describe("toggling open close", function() {
		it("should call open if it is closed", function() {
			var parent = new Vtree.Node({
				id: "parent",
				title: "parent",
				hasChildren: true,
				isOpen:false
			});
			spyOn(parent, 'open');
			spyOn(parent, 'close');
			parent.toggleOpen();
			expect(parent.open).toHaveBeenCalled();
			expect(parent.close).not.toHaveBeenCalled();
		});

		it("should call close if it is open", function() {
			var parent = new Vtree.Node({
				id: "parent",
				title: "parent",
				hasChildren: true,
				isOpen:true
			});
			spyOn(parent, 'open');
			spyOn(parent, 'close');
			parent.toggleOpen();
			expect(parent.close).toHaveBeenCalled();
			expect(parent.open).not.toHaveBeenCalled();

		});

	});

	describe("getting list of children nodes", function() {
		var child1,
			child2,
			parent,
			ul;
		beforeEach(function() {
			child1 = new Vtree.Node({
				id: "child1",
				title: "child1",
				hasChildren: false
			});
			child2 = new Vtree.Node({
				id: "child2",
				title: "child2",
				hasChildren: false
			});
			parent = new Vtree.Node({
				id: "parent",
				title: "parent",
				hasChildren: true,
				children:[child1, child2]
			});
			spyOn(child1, "getHTML").andReturn($("<li class='node1'>"));
			spyOn(child2, "getHTML").andReturn($("<li class='node2'>"));
			ul = parent._getChildrenHTML();

		});
		it("should call getHTML for each child node ", function() {
			expect(child1.getHTML).toHaveBeenCalled();
			expect(child2.getHTML).toHaveBeenCalled();
		});
		it("should return a jquery ul list with the li for each node", function() {
			expect(ul).toBe('ul');
			expect(ul).toContain("li.node1");
			expect(ul).toContain("li.node2");
		});
		it("should have a class 'children' on the ul element", function() {
			expect(ul.hasClass("children")).toBeTruthy();
		});





	});

	describe("building html for a node", function() {
		describe("when a node has children", function() {
			describe("and the node is open", function() {
				var node, html;
				beforeEach(function () {
					node = new Vtree.Node({
						id: "root",
						title: "title",
						description: "description",
						iconPath:{
							open: "/images/file.png",
							close: "/images/file.png"
						},
						hasChildren:true,
						isOpen: true,
						tree:{id:"tree"}
					})
					spyOn(node, "_getChildrenHTML").andReturn($("<ul class='children'/>"));
					html = node.getHTML();
				});
				it("should add an open close tag", function() {
					expect(html.children(":first")).toBe('a.openClose')
				});
				it("should get html for children", function() {
					expect(node._getChildrenHTML).toHaveBeenCalled();
					expect(html).toContain("ul.children");
				});
				it("should give a class open", function() {
					expect(html).toHaveClass("open")
				});
				it("should give a class folder", function() {
					expect(html).toHaveClass("folder");
				});
				it("should have the iconPath.open path in the image source", function() {
					expect(html.find("img")).toHaveAttr("src", "/images/file.png")
				});
			});
			describe("and the node is closed", function() {
				var node, html;
				beforeEach(function () {
					node = new Vtree.Node({
						id: "root",
						title: "title",
						description: "description",
						hasChildren:true,
						iconPath:{
							open: "/images/file.png",
							close: "/images/file.png"
						},
						isOpen:false,
						tree:{id:"tree"}
					})
					html = node.getHTML();
				});
				it("should add an open close tag", function() {
					expect(html.children(":first")).toBe("a.openClose")
				});
				it("should give a class folder", function() {
					expect(html).toHaveClass("folder");
				});
				it("shouldn't give a class open", function() {
					expect(html).not.toHaveClass("open")
				});
				it("should have the iconPath.close path in the image source", function() {
					expect(html.find("img")).toHaveAttr("src", "/images/file.png")

				});
			});

		});
		describe("when a node doesn't have children", function() {
			var node, html;
			beforeEach(function () {
				node = new Vtree.Node({
					id: "root",
					title: "title",
					description: "description",
					customClass: "customClass",
					hasChildren:false,
					tree:{id:"tree"}
				})
				html = node.getHTML();
			});
			it("should have a first child as an element for alignement", function() {
				expect(html.children(":first")).toBe("a.align")
			});
			it("should return a li element", function() {
				expect(html).toBe('li');
			});
			it("should be able to add a custom class to the li element with the attribute customClass", function() {
				expect(html).toHaveClass("customClass")
			});

			it("should have an attribute data-nodeid containing the node id", function() {
				expect(html).toHaveAttr("data-nodeid", "root")
			});
			it("should have an attribute data-treeid containing the tree id", function() {
				expect(html).toHaveAttr("data-treeid", "tree")
			});
			it("should contain a a tag with a class 'title'", function() {
				expect(html).toContain("a.title");
			});
			it("should contain a a tag with a title attribute corresponding to the node description", function() {
				expect(html).toContain("a[title='description']");
			});

		});
		describe("when we pass a customClass attribute as 'title'", function() {
			var node, html;
			beforeEach(function () {
				node = new Vtree.Node({
					id: "root",
					title: "title",
					description: "description",
					customClass: "title",
					hasChildren:false,
					tree:{id:"tree"}
				})
				html = node.getHTML();
			});
			it("should contains a h3 element with a text inside corresponding to the title node", function() {
				expect(html).toContain('h3');
				var h3 = html.find("h3")
				expect(h3).toHaveText("title")
			});

		});
		describe("the a tag, when we pass a iconClass attribute", function() {
			var node, html, a;
			beforeEach(function () {
				node = new Vtree.Node({
					id: "root",
					title: "title",
					description: "description",
					iconClass: "iconClass",
					hasChildren:false,
					tree:{id:"tree"}
				})
				html = node.getHTML();
				a = html.find("a")
			});
			it("should have a first child as a <i> tag with a class corresponding to the iconClass attribute", function() {
				expect(a.children(":first")).toBe("i.iconClass");
			});
			it("should have the last child as a em tag with a text corresponding to the title attribute ", function() {
				var em = a.children(":last")
				expect(em).toBe("em");
				expect(em).toHaveText("title")
			});


		});
		describe("the iconPath attribute", function() {
			var node, html, a;
			beforeEach(function () {
				node = new Vtree.Node({
					id: "root",
					title: "title",
					description: "description",
					iconPath:"/images/file.png",
					hasChildren:false,
					tree:{id:"tree"}
				})
				html = node.getHTML();
				a = html.find("a")
			});
			it("should have a first child as a <i> tag with a <img> inside", function() {
				var i = a.children(":first");
				expect(i).toBe("i");
				expect(i).toContain("img")
			});

			it("should have the iconPath path in the image source", function() {
				expect(a.find("img")).toHaveAttr("src", "/images/file.png")
			});
			it("should have  the last child as a em tag with a text corresponding to the title attribute ", function() {
				var em = a.children(":last")
				expect(em).toBe("em");
				expect(em).toHaveText("title")
			});


		});
		describe("when we don't pass any info for the icon", function() {
			var node, html, a;
			beforeEach(function () {
				node = new Vtree.Node({
					id: "root",
					title: "title",
					description: "description",
					hasChildren:false,
					tree:{id:"tree"}
				})
				html = node.getHTML();
				a = html.find("a")
			});
			it("should have the title inside the a tag", function() {
				expect(a).toHaveText("title");
			});
		});

	});

	describe("getting the li element for the node", function() {
		var node, el;
		beforeEach(function () {
			appendSetFixtures(sandbox())
			node = new Vtree.Node({
				id: "root",
				title: "title",
				description: "description",
				hasChildren:false,
				tree:{
					id:"tree",
					container: $("#sandbox")
				}
			})
			$('#sandbox').append(node.getHTML())
			el = node.getEl();
		});
		it("should return the li element corresponding to the node", function() {
			expect(el).toHaveAttr("data-nodeid", "root")
			expect(el).toHaveAttr("data-treeid", "tree")
		});

	});

	describe("toggling loading state", function() {
		var node, el;
		beforeEach(function () {
			appendSetFixtures(sandbox())
			node = new Vtree.Node({
				id: "root",
				title: "title",
				description: "description",
				hasChildren:false,
				tree:{
					id:"tree",
					container: $("#sandbox")
				}
			})
			$('#sandbox').append(node.getHTML())
			node.toggleLoading();
		});
		it("should toggle a loading class to the li element", function() {
			expect(node.getEl().hasClass("loading")).toBeTruthy();
			node.toggleLoading();
			expect(node.getEl().hasClass("loading")).toBeFalsy();
		});

		it("should toggle a 'Loading...' text", function() {
			expect(node.getEl().find("em").text()).toBe("Loading...");
			node.toggleLoading()
			expect(node.getEl().text()).not.toBe("Loading...");
		});


	});

	describe("getting json object describing the node", function() {
		var node, json;
		beforeEach(function () {
			this.addMatchers(customMatchers);
			appendSetFixtures(sandbox())
			node = new Vtree.Node({
				id: "root",
				title: "title",
				description: "description",
				hasChildren:false,
				tree:{
					id:"tree",
					container: $("#sandbox")
				}
			})
			$('#sandbox').append(node.getHTML())
			json = node.toJson();
		});
		it("should return the node without infinite loop", function() {
			expect(json).toBeObject({
				children: [],
				customClass: "",
				customHTML: "",
				description: "description",
				hasChildren: false,
				hasRenderedChildren: false,
				hasVisibleChildren: false,
				iconClass: "",
				iconPath: { open : '', close : '' },
				id: "root",
				isOpen: false,
				title: "title"
			})
		});

	});
});
describe("NodeStore core functions", function() {
	var data, tree;
	beforeEach(function() {
		this.addMatchers(customMatchers);
		data = getJSONFixture('sourceData.json');
		tree = {
			id: "treeId",
			dataSource: data
		};
	});

	describe("intialisation", function() {
		var ns;
		beforeEach(function() {
		  	ns = new Vtree.NodeStore({
				tree: tree
			});
		});
		it("should create the root node", function() {
			expect(ns.rootNode).not.toBeUndefined();
		});
		it("should load settings passed in parameters", function() {
			expect(ns.tree.id).toBe(tree.id)
		});



	});
	describe("intializing the structure", function() {
		var ns;
		beforeEach(function() {
		  	ns = new Vtree.NodeStore({
				tree: tree
			});
			spyOn(ns, "_recBuildNodes");
			spyOn(ns, "getDataSource").andReturn(tree.dataSource.tree);
			ns.initStructure();
		});
		it("should get the data source from the tree", function() {
			expect(ns.getDataSource).toHaveBeenCalled();
		});

		it("should call _recBuildNodes with correct parameters", function() {
			expect(ns._recBuildNodes).toHaveBeenCalledWith(ns.rootNode, [ns.rootNode], ns.getDataSource().nodes);
		});
		it("should store the rootNode as the tree structure", function() {
			expect(ns.structure.tree.toJson()).toBeObject(ns.rootNode.toJson())
		});

	});
	describe("getting the data Source from the tree", function() {
		var ns;
		beforeEach(function() {
		  	ns = new Vtree.NodeStore({
				tree: tree
			});
		});
		it("should return the json data source", function() {
			expect(ns.getDataSource()).toBeObject(data.tree)
		});

	});
	describe("building the node structure", function() {
		var ns;
		beforeEach(function() {
		  	ns = new Vtree.NodeStore({
				tree: tree
			});
			ns._recBuildNodes( ns.rootNode, [ns.rootNode], data.tree.nodes);

		});

		it("should set the children nodes to the parent", function() {
			expect(ns.rootNode.children.length).toBe(2);
			expect(ns.rootNode.children[0]).toBeNode(ns.getNode("test_1"));
			expect(ns.rootNode.children[1]).toBeNode(ns.getNode("test_4"));
		});
		it("should add nodes to the internal structure", function() {
			expect(ns.structure.id2NodeMap["test_1"]).toBeNode(ns.getNode("test_1"))
			expect(ns.structure.id2NodeMap["test_2"]).toBeNode(ns.getNode("test_2"))
			expect(ns.structure.id2NodeMap["test_3"]).toBeNode(ns.getNode("test_3"))
			expect(ns.structure.id2NodeMap["test_4"]).toBeNode(ns.getNode("test_4"))
		});
		describe("passing the right arguments to the node", function() {
			it("should pass the isOpen setting", function() {
				var nodeStore = new Vtree.NodeStore({
					tree: tree
				});
				nodeStore._recBuildNodes( nodeStore.rootNode, [nodeStore.rootNode], [{
					"id":"test_4",
					"title": "title_4",
					"description": "title_4",
					"hasChildren": false
				}]);
				expect(nodeStore.getNode("test_4").isOpen).toBeFalsy();
				nodeStore._recBuildNodes( nodeStore.rootNode, [nodeStore.rootNode], [{
					"id":"test_4",
					"title": "title_4",
					"description": "title_4",
					"isOpen": true
				}]);
				expect(nodeStore.getNode("test_4").isOpen).toBeTruthy();

			});
			it("should give nodes reference to the tree", function() {
				expect(ns.getNode("test_1").tree.id).toBe(tree.id)
			});
			it("should give reference to the node store", function() {
				expect(ns.getNode("test_1").nodeStore.tree.id).toBe(tree.id)
			});
			it("should pass the hasRenderedChildren setting", function() {
				var nodeStore = new Vtree.NodeStore({
					tree: tree
				});
				nodeStore._recBuildNodes( nodeStore.rootNode, [nodeStore.rootNode], [{
					"id":"test",
					"title": "title",
					"description": "desc",
					"hasRenderedChildren": true
				}]);
				expect(nodeStore.getNode("test").hasRenderedChildren).toBeTruthy();

			});
			it("should pass the hasVisibleChildren setting", function() {
				var nodeStore = new Vtree.NodeStore({
					tree: tree
				});
				nodeStore._recBuildNodes( nodeStore.rootNode, [nodeStore.rootNode], [{
					"id":"test",
					"title": "title",
					"description": "desc",
					"hasVisibleChildren": true
				}]);
				expect(nodeStore.getNode("test").hasVisibleChildren).toBeTruthy();

			});
			it("should pass the parent node", function() {
				expect(ns.getNode("test_2").parent.id).toBe("test_1")
				expect(ns.getNode("test_3").parent.id).toBe("test_2")
				expect(ns.getNode("test_1").parent.id).toBe("root")
				expect(ns.getNode("test_4").parent.id).toBe("root")

			});
			it("should pass the parent nodes in an array", function() {
				expect(ns.getNode("test_3").parents.length).toBe(3)
				expect(ns.getNode("test_3").parents[0].id).toBe("root")
				expect(ns.getNode("test_3").parents[1].id).toBe("test_1")
				expect(ns.getNode("test_3").parents[2].id).toBe("test_2")

				expect(ns.getNode("test_2").parents.length).toBe(2)
				expect(ns.getNode("test_2").parents[0].id).toBe("root")
				expect(ns.getNode("test_2").parents[1].id).toBe("test_1")

				expect(ns.getNode("test_1").parents.length).toBe(1)
				expect(ns.getNode("test_1").parents[0].id).toBe("root")
			});
			it("should pass the plugins from the tree if they exists", function() {
				tree = $.extend(true, tree, {
					plugins:["checkbox"]
				});
				var nodeStore = new Vtree.NodeStore({
					tree: tree
				});
				nodeStore._recBuildNodes( nodeStore.rootNode, [nodeStore.rootNode], [{
					"id":"test",
					"title": "title",
					"description": "desc",
					"hasVisibleChildren": true
				}]);
				expect(nodeStore.getNode("test").plugins[0]).toBe("checkbox");
			});
		});
		describe("when the node is in the array 'initiallyOpen' ", function() {
			beforeEach(function() {
				tree = $.extend(tree, {initiallyOpen:["test_2"]})
			  	ns = new Vtree.NodeStore({
					tree: tree
				});
				ns._recBuildNodes( ns.rootNode, [ns.rootNode], data.tree.nodes);
			});
			it("should set the node as open", function() {
				expect(ns.getNode("test_2").isOpen).toBeTruthy();
				expect(ns.getNode("test_2").hasVisibleChildren).toBeTruthy();
				expect(ns.getNode("test_2").hasRenderedChildren).toBeTruthy();
			});
			it("should open all parents as well", function() {
				expect(ns.getParents("test_2")[0].isOpen).toBeTruthy();
				expect(ns.getParents("test_2")[0].hasVisibleChildren).toBeTruthy();
				expect(ns.getParents("test_2")[0].hasRenderedChildren).toBeTruthy();
				expect(ns.getParents("test_2")[1].isOpen).toBeTruthy();
				expect(ns.getParents("test_2")[1].hasVisibleChildren).toBeTruthy();
				expect(ns.getParents("test_2")[1].hasRenderedChildren).toBeTruthy();

			});


		});



	});

	describe("getting the internal structure", function() {
		var ns;
		beforeEach(function() {
			ns = new Vtree.NodeStore({
				tree: tree
			});
		});
		it("should return the internal structure", function() {
			expect(ns.getStructure().id).toBeObject(ns.structure.tree.id)
		});


	});

	describe("traversing tree and getting nodes", function() {
		var ns;
		beforeEach(function() {
			ns = new Vtree.NodeStore({
				tree: tree
			});
		});
		describe("getting a node", function() {

			it("should return the correct node if you pass a node id", function() {
				expect(ns.getNode("test_3").toJson()).toBeObject({
					id : 'test_3',
					isOpen : false,
					title : 'title_3',
					description : 'title_3',
					customClass : '',
					hasVisibleChildren : false,
					hasRenderedChildren : false,
					hasChildren : false,
					children : [ ],
					iconClass : 'default',
					iconPath : { open : '', close : '' },
					customHTML : ''
				})
			});
			it("should return the correct node if you pass the node instance", function() {
				var nodeInstance = ns.getStructure().children[0].children[0].children[0]; // node title_3
				expect(ns.getNode(nodeInstance).toJson()).toBeObject({
					id : 'test_3',
					isOpen : false,
					title : 'title_3',
					description : 'title_3',
					customClass : '',
					hasVisibleChildren : false,
					hasRenderedChildren : false,
					hasChildren : false,
					children : [ ],
					iconClass : 'default',
					iconPath : { open : '', close : '' },
					customHTML : ''
				})
			});

		});
		describe("getting siblings", function() {
			it("should return all siblings without the node itself", function() {
				expect(ns.getSiblings("test_1")[0].toJson()).toBeObject(ns.getNode("test_4").toJson())
			});

		});
		describe("getting the direct parent", function() {
			it("should return the parent node", function() {
				expect(ns.getParent("test_3").toJson()).toBeObject(ns.getNode("test_2").toJson())
			});

		});
		describe("getting all the parents", function() {
			it("should return the parent nodes", function() {
				var parents = ns.getParents("test_3")
				expect(parents.length).toBe(3);
				expect(parents[0].id).toBeObject("root")
				expect(parents[1].toJson()).toBeObject(ns.getNode("test_1").toJson())
				expect(parents[2].toJson()).toBeObject(ns.getNode("test_2").toJson())
			});

		});

		describe("getting children", function() {
			it("should return all children", function() {
				expect(ns.getChildren("test_1")[0].toJson()).toBeObject(ns.getNode("test_2").toJson())
			});

		});
	});
});describe("core tree function", function() {
	var data, tree, container;
	beforeEach(function() {
		this.addMatchers(customMatchers);
		appendSetFixtures(sandbox())
		data = getJSONFixture('sourceData.json');
		container = $('#sandbox')
		tree = new Vtree.Tree({
			container:container,
			dataSource: data
		})
	});
	describe("intialisation", function() {
		it("should attach the settings passed in param", function() {

		});
		it("should call build function", function() {

		});
		it("should return the tree", function() {

		});
		it("should have defaults param", function() {

		});
	});
	describe("building the tree", function() {
		it("should return the tree", function() {

		});

	});
	describe("settings an id for the tree", function() {
		describe("when id is in dataSource", function() {
			it("should set the id", function() {
				tree.setId()
				expect(tree.id).toBe(data.tree.id);
			});
		});
		describe("when id is in settings", function() {
			var tree;
			beforeEach(function() {
				delete data.tree.id
			  	tree = new Vtree.Tree({
					container:$('#sandbox'),
					dataSource: data,
					id: "tree"
				})
				tree.setId()
			});
			it("should set the id", function() {
				expect(tree.id).toBe("tree");
			});

		});
		describe("when id is not defined", function() {
			var tree;
			beforeEach(function() {
				delete data.tree.id
				spyOn(Vtree, "_generateTreeId");
			  	tree = new Vtree.Tree({
					dataSource: data,
					container:$('#sandbox')
				})
				tree.setId()
			});
			it("should generate a random id", function() {
				expect(Vtree._generateTreeId).toHaveBeenCalled();
			});

		});
		describe("id should not have space", function() {
			var tree;
			beforeEach(function() {
				data.tree.id = "id      with space"
				spyOn(Vtree, "_generateTreeId");
			  	tree = new Vtree.Tree({
					dataSource: data,
					container:$('#sandbox')
				})
				tree.setId()
			});
			it("should replace space by _", function() {
				expect(tree.id).toBe("id_with_space");
			});

		});

	});
	describe("refreshing the tree", function() {
		var eventSpy;
		beforeEach(function() {
			spyOn(tree.container, "empty").andReturn(tree.container)
			spyOn(tree, "_generateHTML").andReturn("html")
			eventSpy = spyOnEvent('#sandbox', 'rendered.tree');

			tree.refresh()
		});
		it("should empty the container", function() {
			expect(tree.container.empty).toHaveBeenCalled();

		});
		it("should append the html of the tree by calling _generateHTML", function() {
			expect(tree._generateHTML).toHaveBeenCalled();
		});
		it("should trigger a rendered.tree event passing the tree", function() {
			expect(eventSpy).toHaveBeenTriggered();

		});
	});

	describe("attaching events to the tree", function() {
		it("should return the container", function() {
			var container = tree._attachEvents()
			expect(container.attr("id")).toBe("sandbox");
		});
		describe("click event", function() {
			it("trigger a click.node event", function() {
				var eventSpy = spyOnEvent('#sandbox', 'click.node');
				container.find("li:first").click()
				expect(eventSpy).toHaveBeenTriggered();

			});

		});
		describe("double click event", function() {
			it("trigger a dblclick.node event", function() {
				var eventSpy = spyOnEvent('#sandbox', 'dblclick.node');
				container.find("li:first").dblclick()
				expect(eventSpy).toHaveBeenTriggered();
			});

		});
		describe("right clicking a node", function() {
			it("trigger a contextMenu.node event", function() {
				var eventSpy = spyOnEvent('#sandbox', 'contextMenu.node');
				container.find("li:first").trigger({
				    type: 'contextMenu'
				});
				expect(eventSpy).toHaveBeenTriggered();
			});

		});
		describe("hover event on node", function() {
			it("triggers a mouseenter.node event and pass the node", function() {
				var eventSpy = spyOnEvent('#sandbox', 'mouseenter.node');
				container.find("li:first").trigger( 'mouseenter' )
				expect(eventSpy).toHaveBeenTriggered();

			});
			it("triggers a mouseleave.node event and pass the node", function() {
				var eventSpy = spyOnEvent('#sandbox', 'mouseleave.node');
				container.find("li:first").trigger( 'mouseleave' )
				expect(eventSpy).toHaveBeenTriggered();
			});

		});
		describe("open/close event on a node", function() {
			it("calls the toggleOpen function on the node", function() {
				spyOn(tree.getNode("test_1"), "toggleOpen");
				container.find("li:first .openClose").click();
				expect(tree.getNode("test_1").toggleOpen).toHaveBeenCalled();
			});

		});

	});

	describe("generating the html for the tree", function() {
		var ul, struc;
		beforeEach(function() {
			struc = tree.nodeStore.getStructure()
			for (var i=0, len = struc.children.length; i < len; i++) {
				var node = struc.children[i]
				spyOn(node, "getHTML")
			}
			ul = tree._generateHTML();
		});
		it("should add a class tree to the ul element", function() {
			expect(ul).toHaveClass("tree")
		});
		it("should get the structure form the node store", function() {
			spyOn(tree.nodeStore, "getStructure").andReturn({children:[]});
			ul = tree._generateHTML();

			expect(tree.nodeStore.getStructure).toHaveBeenCalled();
		});
		it("should call the getHTML function for each parent node of the tree and append it to the ul element", function() {
			for (var i=0, len = struc.children.length; i < len; i++) {
				var node = struc.children[i];
				expect(node.getHTML).toHaveBeenCalled();
			}

		});
		it("should return the ul element", function() {
			expect(ul[0].tagName).toBe("UL");
		});

	});

	describe("getting a node", function() {
		it("should call nodeStore.getNode", function() {

		});
		it("should return the node", function() {

		});
	});
	describe("destroying the node", function() {
		it("should empty the container", function() {

		});
		it("should unbind the events with namespace .node", function() {

		});
		it("should undelegate the container", function() {

		});
	});

	describe("the toJson function", function() {
		it("should call the nodeStore.toJson function", function() {

		});
		it("should return the json for the tree", function() {

		});
	});

	describe("the getSiblings function", function() {
		it("should call the nodeStore.getSiblings function and pass it the node", function() {

		});
		it("should return the result of the nodeStore.getSiblings ", function() {

		});
	});

	describe("the getParent function", function() {
		it("should call the nodeStore.getParent function and pass it the node", function() {

		});
		it("should return the result of the nodeStore.getParent ", function() {

		});
	});
	describe("the getParents function", function() {
		it("should call the nodeStore.getParents function and pass it the node", function() {

		});
		it("should return the result of the nodeStore.getParents", function() {

		});
	});
	describe("the getChildren function", function() {
		it("should call the nodeStore.getChildren function and pass it the node", function() {

		});
		it("should return the result of the nodeStore.getChildren", function() {

		});
	});
});/*
    Original script title: "Object.identical.js"; version 1.12
    Copyright (c) 2011, Chris O'Brien, prettycode.org
    http://github.com/prettycode/Object.identical.js

    Permission is hereby granted for unrestricted use, modification, and redistribution of this
    script, only under the condition that this code comment is kept wholly complete, appearing
    directly above the script's code body, in all original or modified non-minified representations
*/

Object.identical = function (a, b, sortArrays) {

    /* Requires ECMAScript 5 functions:
           - Array.isArray()
           - Object.keys()
           - Array.prototype.forEach()
           - JSON.stringify()
    */

    function sort(object) {

        if (sortArrays === true && Array.isArray(object)) {
            return object.sort();
        }
        else if (typeof object !== "object" || object === null) {
            return object;
        }

        var result = [];

        Object.keys(object).sort().forEach(function(key) {
            result.push({
                key: key,
                value: sort(object[key])
            });
        });

        return result;
    }

    return JSON.stringify(sort(a)) === JSON.stringify(sort(b));
};


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

		describe("adding a href attribute", function(){
			var node, html, a, href;
			beforeEach(function () {
				href = "http://wwww.google.com";
				node = new Vtree.Node({
					id: "root",
					href: href,
					title: "title",
					hasChildren:false,
					tree:{id:"tree"}
				})
				html = node.getHTML();
				a = html.find("a.title")
			});
			it("it should add a href to the a tag containing the title", function() {
				expect(a.attr("href")).toBe(href);
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
			expect(el).toHaveAttr("id", "tree_root")
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
			expect(node.getEl().find("a.title").text()).toBe("Loading...");
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

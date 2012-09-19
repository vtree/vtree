describe("Node", function() {
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
						open:"/path/to/open_icon.png"
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
				expect(parent.el.find("img")[0].src).toBe(window.location.origin+"/path/to/open_icon.png");
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
						open:"/path/to/open_icon.png"
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
				expect(parent.el.find("img")[0].src).toBe(window.location.origin+"/path/to/open_icon.png");
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
						close:"/path/to/close_icon.png"
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
				expect(parent.el.find("img")[0].src).toBe(window.location.origin+"/path/to/close_icon.png");
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

	// describe("getting list of children nodes", function() {
	// 	beforeEach(function() {
	// 		var child1 = new Vtree.Node({
	// 			id: "child1",
	// 			title: "child1",
	// 			hasChildren: false
	// 		});
	// 		var child2 = new Vtree.Node({
	// 			id: "child2",
	// 			title: "child2",
	// 			hasChildren: false
	// 		});
	// 		var parent = new Vtree.Node({
	// 			id: "parent",
	// 			title: "parent",
	// 			hasChildren: true,
	// 			children:[child1, child2]
	// 		});
	// 		spyOn(child1, "getHTML").andReturn($("li.node1"));
	// 		spyOn(child2, "getHTML").andReturn($("li.node2"));
	// 		var ul = parent._getChildrenHTML();
	// 	});
	// 	it("should call getHTML for each child node ", function() {
	// 		expect(child1.getHTML).toHaveBeenCalled();
	// 		expect(child2.getHTML).toHaveBeenCalled();
	// 	});
	// 	it("should return a jquery ul list with the li for each node", function() {
	// 		expect(ul).toBe('ul');
	// 		expect(ul).toContain("li.node1");
	// 		expect(ul).toContain("li.node2");
	// 	});
	// 	it("should have a class 'children' on the ul element", function() {
	// 		expect(ul.hasClass("children")).toBeTruthy();
	// 	});
	// 	
	// 	
	// 	
	// 	
	// 	
	// });
});

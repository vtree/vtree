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
		describe("when the node is in the array 'initially_open' ", function() {
			beforeEach(function() {
				tree = $.extend(tree, {initially_open:["test_2"]})
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
});
customMatchers = {
	toBeObject: function(obj) {
		return Object.identical(this.actual, obj)
	},
	toBeNode: function(node) {
		return Object.identical(this.actual.toJson(), node.toJson())
	}
};
/*
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

describe("Vtree manager functions", function() {
	var data, tree, container, container2;
	beforeEach(function() {
		this.addMatchers(customMatchers);
		appendSetFixtures(sandbox())
		appendSetFixtures(sandbox({id: 'sandbox2'}));
		data = getJSONFixture('sourceData.json');
		container = $('#sandbox')
		container2 = $('#sandbox2')
		tree = Vtree.create({
			container:container,
			dataSource: data
		})
	});
	afterEach(function() {
		try{ Vtree.destroy("tree")}catch(e){}
		try{ Vtree.destroy("tree2")}catch(e){}
	});
	describe("adding a plugin to an object", function() {
		var TestObject, testObject, pluginGroup;
		beforeEach(function() {
			pluginGroup = "tree";

		});
		it("should throw if plugin name does not exist", function() {
			TestObject = function() {
				this.pluginFns = {};
				Vtree.addPlugin.apply(this, ["inexistantPlugin", pluginGroup])
			}
			expect(function(){testObject = new TestObject();}).toThrow();
		});

		it("should extends the object with the default object of the plugin", function() {
			TestObject = function() {
				this.pluginFns = {};
				Vtree.addPlugin.apply(this, ["core", pluginGroup])
			}
			testObject = new TestObject();
			coreDefaults = Vtree.plugins.defaults.core[pluginGroup].defaults;
			for (var attr in coreDefaults) {
				 var attrVal = coreDefaults[attr];
				 expect(testObject[attr]).toBeDefined();
				 expect(testObject[attr]).toBe(attrVal);
			}

		});

		it("should add a function for each functions from the plugin", function() {
			TestObject = function() {
				this.pluginFns = {};
				Vtree.addPlugin.apply(this, ["core", pluginGroup])
			}
			testObject = new TestObject();
			coreFns = Vtree.plugins.defaults.core[pluginGroup]._fn;
			for (var fnName in coreFns) {
				 var fn = coreFns[fnName];
				 expect(testObject[fnName]).toBeDefined();
				 expect(typeof testObject[fnName]).toBe("function");
			}
		});


		describe("when several plugins that we attach to the object, define the same function ", function() {
			beforeEach(function() {
			  			// define 2 plugins with same function
				Vtree.plugins.plugin_1 = {
					tree:{
						defaults:{
							res:""
						},
						_fn:{
							a_function: function(){
								return "plugin_1"
							}
						}
					}
				}
				Vtree.plugins.plugin_2 = {
					tree:{
						defaults:{},
						_fn:{
							a_function: function(){
								return this._call_prev()+ "plugin_2"
							}
						}
					}
				}
				TestObject = function() {
					this.pluginFns = {};
					Vtree.addPlugin.apply(this, ["plugin_1", "tree"])
					Vtree.addPlugin.apply(this, ["plugin_2", "tree"])
				}

			});
			it("they should be both called when calling the function and in the order they have been added to the object", function() {
				testObject = new TestObject();
				var res = testObject.a_function()
				expect(res).toBe("plugin_1plugin_2");
			});

		});

	});
	describe("initializing an object", function() {
		var TestObject, testObject, pluginGroup, settingsPlugins;
		beforeEach(function() {
			pluginGroup = "tree";
			settingsPlugins = ["checkbox","cookie"];
		 	TestObject = function(settings) {
				Vtree.init.apply(this, [settings, pluginGroup])
			}
			spyOn(Vtree.addPlugin, "apply");
			testObject = new TestObject({
				plugins: settingsPlugins
			});
		});
		it("for each default plugins, it should call addPlugins", function() {
			for (var plugin in Vtree.plugins.defaults) {
				expect(Vtree.addPlugin.apply).toHaveBeenCalledWith(testObject, [plugin , pluginGroup]);
			}
		});
		it("should add all plugins passed in parameters", function() {
			$.each(settingsPlugins, function(index, pluginName) {
				expect(Vtree.addPlugin.apply).toHaveBeenCalledWith(testObject, [pluginName , pluginGroup]);
			});
		});


	});
	describe("creating a tree", function() {
		it("should destroy a tree which exists in the same container", function() {
			expect(function(){Vtree.getTree("tree")}).not.toThrow()
			expect(Vtree.getTree("tree").id).toBe("tree");
			var data2 = $.extend({}, data)
		  	data2.tree.id = "tree2"
			tree2 = Vtree.create({
				container:container,
				dataSource: data2
			})
			expect(function(){Vtree.getTree("tree")}).toThrow()
			expect(function(){Vtree.getTree("tree2")}).not.toThrow()
			expect(Vtree.getTree("tree2").id).toBe("tree2");
		});
	});
	describe("destroying a tree", function() {
		var param;
		beforeEach(function() {
			param = "tree";
		});
		it("should call getTree", function() {
			spyOn(Vtree, "getTree").andReturn(tree);
			Vtree.destroy(param);

			expect(Vtree.getTree).toHaveBeenCalledWith(param);
		});
		it("should call tree.destroy", function() {
			spyOn(tree, "destroy");
			Vtree.destroy(param);
			expect(tree.destroy).toHaveBeenCalled();
		});
		it("the deleted tree should not appear in the trees list ", function() {
			data.tree.id = "tree2"
			var other_tree = Vtree.create({
				container:container2,
				dataSource: data
			})
			expect(Vtree.getTrees().length).toBe(2);
			expect(Vtree.getTrees()[0].id).toBe("tree");
			expect(Vtree.getTrees()[1].id).toBe("tree2");
			Vtree.destroy(param);
			expect(Vtree.getTrees().length).toBe(1);
			expect(Vtree.getTrees()[0].id).toBe("tree2");
		});




	});
	describe("getting a tree", function() {
		var other_tree;
		beforeEach(function() {
			var data2 = $.extend({}, data)
		  	data2.tree.id = "tree2"
			other_tree = Vtree.create({
				container:container2,
				dataSource: data2
			})
		});
		it("when passing a tree instance", function() {
			var res = Vtree.getTree(tree)
			expect(res instanceof Vtree.Tree).toBeTruthy();
			expect(res.id).toBe(tree.id);

			res = Vtree.getTree(other_tree)
			expect(res instanceof Vtree.Tree).toBeTruthy();
			expect(res.id).toBe(other_tree.id);
		});

		it("when passing a tree id", function() {
			var res = Vtree.getTree(tree.id)
			expect(res instanceof Vtree.Tree).toBeTruthy();
			expect(res.id).toBe(tree.id);

			res = Vtree.getTree(other_tree.id)
			expect(res instanceof Vtree.Tree).toBeTruthy();
			expect(res.id).toBe(other_tree.id);
		});

		it("when passing a container jquery element", function() {
			var res = Vtree.getTree(container)
			expect(res instanceof Vtree.Tree).toBeTruthy();
			expect(res.id).toBe(tree.id);

			res = Vtree.getTree(container2)
			expect(res instanceof Vtree.Tree).toBeTruthy();
			expect(res.id).toBe(other_tree.id);
		});

		it("when passing a container selector", function() {
			var res = Vtree.getTree("#sandbox")
			expect(res instanceof Vtree.Tree).toBeTruthy();
			expect(res.id).toBe(tree.id);

			res = Vtree.getTree("#sandbox2")
			expect(res instanceof Vtree.Tree).toBeTruthy();
			expect(res.id).toBe(other_tree.id);
		});



	});
	describe("getting all trees", function() {
		it("should return all trees", function() {
			var trees = Vtree.getTrees();
			expect(trees.length).toBe(1);
			expect(trees[0] instanceof Vtree.Tree).toBeTruthy();
			expect(trees[0].id).toBe("tree");

			data.tree.id = "tree2"
			var other_tree = Vtree.create({
				container:container2,
				dataSource: data
			})

			trees = Vtree.getTrees();
			expect(trees.length).toBe(2);
			expect(trees[0] instanceof Vtree.Tree).toBeTruthy();
			expect(trees[1] instanceof Vtree.Tree).toBeTruthy();
			expect(trees[0].id).toBe("tree");
			expect(trees[1].id).toBe("tree2");
		});

	});
	describe("generating an identificator for a tree", function() {
		it("should generate an id with 12 caracteres composed of numbers and letters ", function() {
			expect(/([a-z0-9]){12}/.test(Vtree._generateTreeId())).toBeTruthy();
		});

	});
});describe("Node core functions", function() {
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
		it("should load settings pass in parameter", function() {
			expect(tree.id).toBe("tree");
			expect(tree.container.attr("id")).toBe(container.attr("id"));
			expect(tree.dataSource).toBeObject(data);
		});
		it("should return the tree", function() {
			expect(tree instanceof Vtree.Tree).toBeTruthy();
			expect(tree.id).toBe(data.tree.id);
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
		it("should call nodeStore.getNode and return its result", function() {
			spyOn(tree.nodeStore, "getNode").andReturn("sdnfsldfasd")
			var res = tree.getNode("test_1")
			expect(tree.nodeStore.getNode).toHaveBeenCalled();
			expect(res).toBe("sdnfsldfasd");
		});
	});
	describe("destroying the node", function() {
		it("should empty the container", function() {
			spyOn(tree.container, "empty");
			tree.destroy()
			expect(tree.container.empty).toHaveBeenCalled();
		});
		it("should unbind the events with namespace .node", function() {
			spyOn(tree.container, "unbind").andReturn(tree.container);
			tree.destroy()
			expect(tree.container.unbind).toHaveBeenCalledWith(".node");
		});
		it("should undelegate the container", function() {
			spyOn(tree.container, "undelegate").andReturn(tree.container);			
			tree.destroy()
			expect(tree.container.undelegate).toHaveBeenCalled();
		});
	});

	describe("the toJson function", function() {
		it("should call the nodeStore.toJson function and return its result", function() {
				spyOn(tree.nodeStore, "toJson").andReturn("1234567890");
				var res = tree.toJson()
				expect(tree.nodeStore.toJson).toHaveBeenCalled();
				expect(res).toBe("1234567890");
		});
	});
	
	describe("the getSiblings function", function() {
		it("should call the nodeStore.getSiblings function, pass it the node and return the result", function() {
			spyOn(tree.nodeStore, "getSiblings").andReturn("dfgsdfsf")
			var res = tree.getSiblings("test_1")
			expect(tree.nodeStore.getSiblings).toHaveBeenCalledWith("test_1");
			expect(res).toBe("dfgsdfsf");
		});
	});
	
	describe("the getParent function", function() {
		it("should call the nodeStore.getParent function, pass it the node and return the result", function() {
			spyOn(tree.nodeStore, "getParent").andReturn("wfwmfldf")
			var res = tree.getParent("test_1")
			expect(tree.nodeStore.getParent).toHaveBeenCalledWith("test_1");
			expect(res).toBe("wfwmfldf");
		});

	});
	describe("the getParents function", function() {
		it("should call the nodeStore.getParents function, pass it the node and return the result", function() {
			spyOn(tree.nodeStore, "getParents").andReturn("wfwmfldf")
			var res = tree.getParents("test_1")
			expect(tree.nodeStore.getParents).toHaveBeenCalledWith("test_1");
			expect(res).toBe("wfwmfldf");
		});
	});
	describe("the getChildren function", function() {
		it("should call the nodeStore.getChildren function, pass it the node and return the result", function() {
			spyOn(tree.nodeStore, "getChildren").andReturn("wfwmfldf")
			var res = tree.getChildren("test_1")
			expect(tree.nodeStore.getChildren).toHaveBeenCalledWith("test_1");
			expect(res).toBe("wfwmfldf");
		});

	});
});describe("ajax_loading plugin", function() {
	var pluginName = "ajax_loading";
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
				ajaxUrl: "",
				ajaxParameters:{},
				asynchronous: true,
				forceAjaxReload: false
			});
		});
		describe("functions", function() {

		});

	});
	describe("node plugin", function() {
		var className = "node";
		describe("functions", function() {

		});

	});

});describe("bolding plugin", function() {
	var pluginName = "bolding",
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
				initially_bold: [],
				cascading_bold: false
			});
		});
		describe("functions", function() {
			it("should get currently bold nodes", function() {
				spyOn(tree.nodeStore, "getBoldNodes");
				expect(tree.getBoldNodes).toBeDefined();
				expect(typeof tree.getBoldNodes).toBe("function");
				tree.getBoldNodes()
				expect(tree.nodeStore.getBoldNodes).toHaveBeenCalled();
			});
			describe("attaching new event", function() {
				it("on click event it should get the node and toggle his bolding state", function() {
					tree._attachEvents();
					var node = tree.getNode("test_1");
					spyOn(node, "toggleBold");
					tree.getNode("test_1").getEl().click();
					expect(node.toggleBold).toHaveBeenCalled();
				});
				it("should call all functions _attachEvens, the core and the plugin one", function() {
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
				isBold:false
			});
		});
		describe("functions", function() {
			describe("toggling bolding state", function() {
				beforeEach(function() {
				  	spyOn(node, 'bold');
					spyOn(node, 'unbold');
				});
				it("should call bold if it is unbold", function() {
					node.toggleBold();
					expect(node.bold).toHaveBeenCalled();
					expect(node.unbold).not.toHaveBeenCalled();
				});

				it("should call unbold if it is bold", function() {
					node.isBold = true
					node.toggleBold();
					expect(node.unbold).toHaveBeenCalled();
					expect(node.bold).not.toHaveBeenCalled();

				});
			});
			describe("bolding a node", function() {
				var eventSpy;
				beforeEach(function() {
					eventSpy = spyOnEvent('#sandbox', 'bold.node');
					node.bold();
				});
				it("should set a class 'bold' to the li element", function() {
					expect(node.getEl()[0]).toHaveClass("bold")
				});
				it("should set the variable isBold to true", function() {
					expect(node.isBold).toBeTruthy();
				});
				it("should trigger a bold.node event", function() {
					expect(eventSpy).toHaveBeenTriggered();
				});
				it("should bold parents when cascading_bold is set to true", function() {
					node.tree.cascading_bold = true;
					node.bold();
					for (var i=0, parents = node.parents, len = node.parents.length; i < len; i++) {
						var parent = parents[i];
						expect(parent.isBold).toBeTruthy();
						if (parent.id !== "root") {
							expect(parent.getEl()[0]).toHaveClass("bold");
						}
					}
				});
				it("should not bold parents when cascading_bold is false", function() {
					node.tree.cascading_bold = false;
					for (var i=0, parents = node.parents, len = node.parents.length; i < len; i++) {
						var parent = parents[i];
						expect(parent.isBold).toBeFalsy();
						if (parent.id !== "root") {
							expect(parent.getEl()[0]).not.toHaveClass("bold");
						}
					}
				});
			});
			describe("unbolding a node", function() {
				var eventSpy;
				beforeEach(function() {
					node.bold();
					eventSpy = spyOnEvent('#sandbox', 'unbold.node');
					node.open();
					for (var i=0, children = node.children, len = node.children.length; i < len; i++) {
						var child = children[i];
						child.bold();
					}
					node.unbold();
				});
				it("should remove the class 'bold' to the li element", function() {
					expect(node.getEl()[0]).not.toHaveClass("bold")
				});
				it("should set the variable isBold to false", function() {
					expect(node.isBold).toBeFalsy();
				});
				it("should trigger a unbold.node event", function() {
					expect(eventSpy).toHaveBeenTriggered();
				});
				it("should unbold children when cascading_bold is set to true", function() {
					node.tree.cascading_bold = true;

					node.unbold();
					for (var i=0, children = node.children, len = node.children.length; i < len; i++) {
						var child = children[i];
						expect(child.isBold).toBeFalsy();
						expect(child.getEl()[0]).not.toHaveClass("bold");
					}
				});
				it("should not unbold children when cascading_bold is false", function() {
					node.tree.cascading_bold = false;
					for (var i=0, children = node.children, len = node.children.length; i < len; i++) {
						var child = children[i];
						expect(child.isBold).toBeTruthy();
						expect(child.getEl()[0]).toHaveClass("bold");
					}
				});

			});
			describe("getting the node html", function() {
				it("should add a class bold if is_bold is set to true", function() {
					node.bold();
					var li = node.getHTML();
					expect(li[0]).toHaveClass("bold");
				});
				it("should not add a class bold if is_bold is set to false", function() {
					node.unbold();
					var li = node.getHTML();
					expect(li[0]).not.toHaveClass("bold");
				});
				it("should call all the functions getHTML of the node", function() {
					spyOn(node.pluginFns.getHTML[0], "apply").andCallThrough();
					spyOn(node.pluginFns.getHTML[1], "apply").andCallThrough();
					node.getHTML()
					expect(node.pluginFns.getHTML[0].apply).toHaveBeenCalled();
					expect(node.pluginFns.getHTML[1].apply).toHaveBeenCalled();
				});



			});
		});

	});
	describe("nodeStore plugin", function() {
		var className = "nodeStore";
		it("should set default variables", function() {
			expect(Vtree.plugins[pluginName][className].defaults).toBeObject({});
		});
		describe("functions", function() {
			var nodeStore,node;
			beforeEach(function() {
				nodeStore = tree.nodeStore;
				node = "test_2"
				nodeStore.tree.initially_bold = [node]
			});
			describe("initalizing the structure", function() {
				it("should call all the functions initStructure", function() {
					spyOn(nodeStore.pluginFns.initStructure[0], "apply").andCallThrough();
					spyOn(nodeStore.pluginFns.initStructure[1], "apply").andCallThrough();
					nodeStore.initStructure();
					expect(nodeStore.pluginFns.initStructure[0].apply).toHaveBeenCalled();
					expect(nodeStore.pluginFns.initStructure[1].apply).toHaveBeenCalled();
				});
				it("should bold the nodes that are in the initially_bold list", function() {
					expect(tree.getNode(node).isBold).toBeFalsy();
					nodeStore.initStructure();
					expect(tree.getNode(node).isBold).toBeTruthy();
				});
				it("should also bold the parents of the nodes in the initially_bold list if cascading_bold is set to true", function() {
					node = nodeStore.getNode("test_2");
					for (var i=0, parents = node.parents, len = node.parents.length; i < len; i++) {
						var parent = parents[i];
						expect(parent.isBold).toBeFalsy();
					}
					nodeStore.tree.cascading_bold = true;

					nodeStore.initStructure();
					node = nodeStore.getNode("test_2");
					for (var i=0, parents = node.parents, len = node.parents.length; i < len; i++) {
						var parent = parents[i];
						expect(parent.isBold).toBeTruthy();
					}
				});



			});

			describe("getting the list of bold nodes", function() {
				var list;
				beforeEach(function() {
					nodeStore.initStructure();
					list = nodeStore.getBoldNodes();
				});
				it("should return a list of bold nodes in the tree", function() {
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
});describe("checkbox plugin", function() {
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
});describe("cookie plugin", function() {
	var pluginName = "cookie";
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

		describe("functions", function() {

		});

	});
});describe("xml source plugin", function() {
	var pluginName = "xmlSource";
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


	describe("nodeStore plugin", function() {
		var className = "nodeStore";
		describe("functions", function() {

		});

	});
});
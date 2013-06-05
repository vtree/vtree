jasmine.getFixtures().fixturesPath = 'test/spec/fixtures';
jasmine.getJSONFixtures().fixturesPath = 'test/spec/fixtures';

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


window.customMatchers = {
	toBeObject: function(obj) {
		return Object.identical(this.actual, obj);
	},
	toBeNode: function(node) {
		return Object.identical(this.actual.toJson(), node.toJson());
	},
	toBeArray: function(arr) {
		isSimilar = true;
		if (!this.actual) {
			isSimilar = false;
		}
		if (this.actual.constructor != Array) {
			isSimilar = false;
		}
		if (this.actual.length !== arr.length) {
			isSimilar = false;
		}
		for (var i = 0; i < this.actual.length; i++) {
			var el = this.actual[i];
			var expectedEl = arr[i];
			if (el !== expectedEl) {
				isSimilar = false;
			}
		}

      return isSimilar ;
    }

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
				 if (testObject[attr] && typeof testObject[attr].is != "function" ) {
				 	expect(testObject[attr]).toBe(attrVal);
				 }

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
});
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
			expect(ns._recBuildNodes).toHaveBeenCalledWith(null, [], ns.getDataSource().nodes);
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
				expect(parents.length).toBe(2);
				expect(parents[0].toJson()).toBeObject(ns.getNode("test_1").toJson())
				expect(parents[1].toJson()).toBeObject(ns.getNode("test_2").toJson())
			});

		});

		describe("getting children", function() {
			it("should return all children", function() {
				expect(ns.getChildren("test_1")[0].toJson()).toBeObject(ns.getNode("test_2").toJson())
			});

		});
	});
});
describe("core tree function", function() {
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
});
describe("ajax_loading plugin", function() {
	var pluginName = "ajax_loading",
	node1, node1Response
	ajaxUrl = "my/ajax/url";
	beforeEach(function() {
		this.addMatchers(customMatchers);
		appendSetFixtures(sandbox());
		data = getJSONFixture('sourceData_ajax.json');
		node1Response = getJSONFixture('ajaxData_children.json');
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
						var eventSpy, args, successSpy;
						beforeEach(function() {
							eventSpy = spyOn(jQuery, "ajax");
							successSpy = spyOn(node1, "onAjaxResponse");
							node1.open();
							args = jQuery.ajax.mostRecentCall.args[0];

						});
						it("should call node.onAjaxResponse on response", function() {
							args.success(node1Response)
							expect(successSpy).toHaveBeenCalled();
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
							initiallyOpen:["test_1"],
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
							}]
						},
						"test_5": {
							id: "test_5",
							nodes:[{
								id:"test_6",
								title: "title_6",
								description: "desc",
								iconClass: "customFolder",
								hasChildren: false,
								nodes:[	]
							}]
						}
					};
				beforeEach(function() {
					spy = spyOn(tree, "getAjaxData").andCallThrough();
					spy2 = spyOn(tree, "addDataToNodeSource");
					spy3 = spyOn(tree, "continueBuilding");
					// here this is like if we sent an ajax request to server
					// to get children for nodes 1 4 and 5
					// the response dt only contains response for
					// 1 and 5. Supposedly node 4 have been deleted on server
					tree.onAjaxResponse({nodes:"test_5,test_1,test_4"}, dt);
				});

				it("should call getAjaxData with the first argument", function() {
					expect(spy).toHaveBeenCalled();
					expect(spy.mostRecentCall.args[0]).toBeObject(dt)
				});

				it("should add responses to node source in the order they were requested", function() {
					// and not in the order they were responded!
					expect(spy2).toHaveBeenCalled();
					expect(spy2.calls[0].args[0]).toBeObject(dt["test_5"]);
					expect(spy2.calls[1].args[0]).toBeObject(dt["test_1"]);
				});

				it("should not try to add a node if the server didn't send back a response for this node", function() {
					expect(spy2).not.toHaveBeenCalledWith(dt["test_4"]);
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
					spyAfterChildrenLoaded = spyOnEvent('#sandbox6', "afterChildrenLoaded.node");
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
				it("should fire 'afterChildrenLoaded.node' event", function() {
					node1.onAjaxResponse(nodeData);
					expect(spyAfterChildrenLoaded).toHaveBeenTriggered()
				});
			});
		});
	});
});
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
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
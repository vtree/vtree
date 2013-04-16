(function ($) {
	Vtree.Tree = function(settings) {
		Vtree.init.apply(this, [settings, "tree"]);
		//load settings passed in param
		$.extend(this, settings);

		return this.build();
	};


	Vtree.plugins.defaults.core.tree = {
		defaults: {
			id: "",
			initiallyOpen: [],
			initiallyLoadedNodes: [],
			nodeStore: null,
			container: $("body"),
			dataSource: {},
			asynchronous: false
		},
		_fn: {
			build: function(){
				this.setId();
				if (!this.container.length) {
					throw "container is empty. Check that the element is on the page or that you run your code when the document is ready.";
				}
				// get a reference to the initially loaded nodes
				this.getInitiallyLoadedNodes();

				// fires a beforeInit event
				this.container.trigger("beforeInit.tree", [this]);

				if (!this.asynchronous) {
					this.continueBuilding();
				}

				return this;
			},

			continueBuilding: function(){
				//create the nodeStore attached to the tree
				this.nodeStore = new Vtree.NodeStore({
					tree: this,
					plugins: this.plugins

				});
				//build the html from the data of the node Store
				this.refresh();
				// attach events to html
				this._attachEvents();
				// fires an event for the end of the initialisation
				this.container.trigger("onReady.tree", [this]);
			},

			setId: function(){
				//give tree an id
				if (!this.id) {
					if (this.dataSource.tree && typeof this.dataSource.tree.id != "undefined") {
						this.id = this.dataSource.tree.id.replace(/\s+/g, "_");
					} else{
						this.id = Vtree._generateTreeId();
					}
				}
			},

			getInitiallyLoadedNodes: function(){
				var that = this;
				var fn = function (nodes){
					for (var i = 0; i < nodes.length; i++) {
						node = nodes[i];
						if (!node.hasChildren){
							that.initiallyLoadedNodes.push(node.id);
						}else if (node.hasChildren && node.nodes && node.nodes.length>0 ){
							that.initiallyLoadedNodes.push(node.id);
							fn(node.nodes);
						}
					}
				};
				if (this.dataSource && this.dataSource.tree && this.dataSource.tree.nodes) {
					fn(this.dataSource.tree.nodes);
				}
			},

			refresh: function(){
				this.container
					.empty() // clean the container
					.append(this._generateHTML())	// add html to container
					.trigger("rendered.tree", [this]); //fires the rendered event
			},

			_attachEvents: function(){
				var that = this;
				var fn = function(e){
					var target = $(e.target);
					var li = (target.is("li"))? target : target.parents("li").eq(0);
					var node = that.getNode(li.attr("data-nodeid"));
					that.container.trigger(e.type+".node", [that, node]);
					e.stopPropagation();
				};
				this.container
					.delegate("li","click", fn)
					.delegate("li","dblclick",fn)
					.delegate("li","hover",fn)
					.delegate("li","contextmenu",function(e){
						try{
							fn(e);
						}
						catch(event){
						}
						// prevent from opening the browser context menu
						e.preventDefault();
					})
					.delegate(".openClose","click",function(e){
						var node = that.getNode($(this).parent().attr("data-nodeid"));
						node.toggleOpen();
						e.stopPropagation();
					});
				return this.container;
			},

			_generateHTML: function(){
				var ul = $("<ul>").addClass("tree");
				// get the data from node store
				tree = this.nodeStore.getStructure();
				//for all children of root node we build the html
				for (var i=0, len = tree.children.length; i < len; i++) {
					ul.append(tree.children[i].getHTML());
				}
				// build html
				return ul;
			},

			getNode: function(mixedNode){
				//get node instance from the node store
				return this.nodeStore.getNode(mixedNode);
			},

			destroy: function(){
				this.container
					.unbind(".node") // remove the events attach to the container
					.undelegate() // remove the events attach to the container
					.empty();	// delete everything inside the container
			},

			toJson: function(){
				return this.nodeStore.toJson();
			},

			getSiblings: function(node){
				return this.nodeStore.getSiblings(node);
			},

			getParent: function(mixedNode){
				return this.nodeStore.getParent(mixedNode);
			},

			getParents: function(mixedNode){
				return this.nodeStore.getParents(mixedNode);
			},

			getChildren: function(mixedNode){
				return this.nodeStore.getChildren(mixedNode);
			}
		}
	};

})(jQuery);


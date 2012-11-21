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
			initially_open: [],
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

			refresh: function(){
				this.container
					.empty() // clean the container
					.append(this._generateHTML())	// add html to container
					.trigger("rendered.tree", [this]); //fires the rendered event
			},

			_attachEvents: function(){
				var that = this;
				var fn = function(e){
					var node = that.getNode($(this).attr("data-nodeid"));
					that.container.trigger(e.type+".node", [that, node]);
					e.stopPropagation();

				};
				this.container
					.delegate("li","click", fn)
					.delegate("li","dblclick",fn)
					.delegate("li","contextmenu",fn)
					.delegate("li","hover",fn)
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


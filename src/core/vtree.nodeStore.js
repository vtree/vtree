(function ($) {
	Vtree.NodeStore = function(settings){	
		Vtree.init.apply(this, [settings, "nodeStore"])
			
		this.rootNode = new Vtree.Node({
			id: "root",
			title: "root",
			description: "root",
			icon: "",
			hasChildren: true,
			parent: [],
			parents:[],
			children:[],
			isOpen:true,
			tree: settings.tree,
			plugins: settings.tree.plugins
		})
		
		this.structure = {
			id2NodeMap: {},
			tree:{}
		};
		
		//load settings passed in param
		$.extend(true, this, settings)
		
		if (!this.initStructure(settings)){
			throw "internal structure not initialised properly"
		}
	};

	Vtree.plugins.defaults.core.nodeStore = {
		defaults:{	
			tree: null
		},
		_fn: {
			initStructure: function(){
				var dataSource = this.getDataSource()
				//if the data source is a json object
				if (typeof dataSource != "undefined") {

					var struct = this.structure;
					var children = dataSource.nodes || dataSource.children;
					// recursively build the node structure
					this._recBuildNodes( this.rootNode, [this.rootNode], children);
					// keep the tree hierarchy in the internal structure
					this.structure.tree = this.rootNode

				}
				return true;
			},

			getDataSource: function(){
				return this.tree.dataSource.tree;
			},
			
			_recBuildNodes: function(parent, parents, nodes){			
				var siblings = []
				
				var parents_already_opened = false;
				for (var i=0, len = nodes.length; i < len; i++) {
					var sourceNode = nodes[i];
					var isOpen = (typeof sourceNode.isOpen != "undefined")? sourceNode.isOpen : false;
					var hasVisibleChildren = (typeof sourceNode.hasVisibleChildren != "undefined")? sourceNode.hasVisibleChildren : false;
					var hasRenderedChildren = (typeof sourceNode.hasRenderedChildren != "undefined")? sourceNode.hasRenderedChildren : false;
					var id = sourceNode.id.replace(" ", "_");
					// check if node should be initially opened
					if ($.inArray(sourceNode.id, this.tree.initially_open) !== -1) {
						isOpen = true;
						hasVisibleChildren = true;
						hasRenderedChildren = true;
						if (!parents_already_opened) {
							for (var j=0, lengh = parents.length; j < lengh; j++) {
								parents[j].isOpen = true;
								parents[j].hasVisibleChildren = true;
								parents[j].hasRenderedChildren = true;
							}
							parents_already_opened = true
						}
					}					
					// at this stage the tree doesn;t have the reference to the nodeStore, as we need it on the node
					// I pass it here before creating the node
					this.tree.nodeStore = this;
					// build the node instance					
					var settings = $.extend({}, sourceNode, {
						id: sourceNode.id.replace(" ", "_"),
						parent: parent,
						parents: parents,
						children: [],
						isOpen: isOpen,
						hasRenderedChildren: hasRenderedChildren,
						hasVisibleChildren: hasVisibleChildren,
						isOpen: isOpen,
						tree: this.tree,
						nodeStore: this,
						plugins: this.tree.plugins
					});
					if (settings.nodes) {
						delete settings.nodes
					}					
					var node = new Vtree.Node(settings)
					// keep it in the nodeStore structure
					this.structure.id2NodeMap[sourceNode.id] = node
					//keep all siblings in an array to add later all children to the parent
					siblings.push(node)
					// if it has children, build children nodes
					var children = sourceNode.nodes || sourceNode.children
					if (children && children.length){					
						this._recBuildNodes( node, parents.concat(node), children)
					}	
				}
				// now that we know all children, add them to the parents
				parent.children = siblings
			},


			getStructure: function(){
				return this.structure.tree;
			},

			toJson: function(){
				var cleanNode = function(node){
					var node = jQuery.extend(true, {}, node)
					delete node.tree;
					delete node.parents;
					delete node.el;
					delete node.parent;
					delete node.nodeStore;
					delete node.pluginFns;
					delete node.plugins;
					if (node.children.length){
						for (var i=0, len = node.children.length; i < len; i++) {
							node.children[i] = cleanNode(node.children[i])
						}
					}
					return node;
				}
				
				return cleanNode(this.structure.tree);
			},
			
			getNode: function(mixedNode){
				var node;
				//if  mixedNode is a node instance
				if( mixedNode instanceof Vtree.Node){
					node = mixedNode
				//if mixedNode is an id
				}else if (typeof this.structure.id2NodeMap[mixedNode] != "undefined") {
					node = this.structure.id2NodeMap[mixedNode];
				}else{
					throw "node not found: "+ mixedNode
				}
				return node
			},

			getSiblings: function(mixedNode){
				node = this.getNode(mixedNode)
				// get parent's children
				siblings = node.getParent().getChildren()
				// remove the current node
				for (var i = siblings.length - 1; i >= 0; i--){
					if (siblings[i].id == node.id){
						siblings.splice(i, 1);
					}
				}
				return siblings;
			},

			getParent: function(mixedNode){
				return this.getNode(mixedNode).parent
			},

			getParents: function(mixedNode){
				return this.getNode(mixedNode).parents
			},

			getChildren: function(mixedNode){
				return this.getNode(mixedNode).children
			}
		}
	}

})(jQuery);


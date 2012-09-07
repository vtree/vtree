(function ($) {
	Vtree.NodeStore = function(settings){	
		Vtree.init.apply(this, [settings, "nodeStore"])
			
		this.rootNode = new Vtree.Node({
			id: "root",
			path: "root",
			fullPath: "",
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
		
		//load settings passed in param
		$.extend(true, this, settings)
		
		if (!this.initStructure(settings)){
			throw "internal structure not initialised properly"
		}
	};

	Vtree.plugins.defaults.core.nodeStore = {
		defaults:{	
			structure: {
				id2NodeMap: {},
				path2NodeMap: {},
				tree:{}
			},
			tree: null
		},
		_fn: {
			initStructure: function(){
				var dataSource = this.getDataSource()
				//if the data source is a json object
				if (typeof dataSource != "undefined") {

					var struct = this.structure;
					// recursively build the node structure
					this._recBuildNodes( this.rootNode, [this.rootNode], dataSource.nodes);
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
					var sourceNode = nodes[i],
						isOpen = false,
						hasVisibleChildren = false,
						hasRenderedChildren = false;
					var id = sourceNode.id.replace(" ", "_");
					var path = sourceNode.path ||  id
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
					// build the node instance
					var settings = $.extend({}, sourceNode, {
						id: sourceNode.id.replace(" ", "_"),
						path: path,
						fullPath: parent.fullPath + "/" + path,
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
					this.structure.path2NodeMap[path] = node
					//keep all siblings in an array to add later all children to the parent
					siblings.push(node)
					// if it has children, build children nodes
					if (sourceNode.nodes && sourceNode.nodes.length){					
						this._recBuildNodes( node, parents.concat(node), sourceNode.nodes)
					}	
				}
				// now that we know all children, add them to the parents
				parent.children = siblings
			},


			getStructure: function(){
				return this.structure.tree;
			},

			getNode: function(mixedNode){
				var node;
				//if  mixedNode is a node instance
				if( mixedNode instanceof Vtree.Node){
					node = mixedNode
				//if mixedNode is an id
				}else if (typeof this.structure.id2NodeMap[mixedNode] != "undefined") {
					node = this.structure.id2NodeMap[mixedNode]
				//if mixedNode is a path
				}else if(typeof this.structure.path2NodeMap[mixedNode] != "undefined"){
					node = this.structure.path2NodeMap[mixedNode]
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


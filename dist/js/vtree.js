if (typeof Vtree === "undefined") {
	Vtree = {};
}


if(typeof console === "undefined") {
	console = {
		log:function(){}
	}
}



Vtree.utils = {

};// a singleton for managing trees on the page

(function ($) {
	
	Vtree = (function(){
		var trees = [];
			
		return{
			plugins: {
				defaults:{core:{}}
			},
			addPlugin: function(pluginName, className){				
				var that = this;

				var plg = Vtree.plugins[pluginName] || Vtree.plugins.defaults[pluginName]
				if (!plg) {
					throw "plugin not existing: "+ pluginName
				}
				var plugin = plg[className];
				if (!plugin) {return}
				var that = this;
				$.extend(this, plugin.defaults);

				$.each(plugin._fn, function (fnName, fn) {

					if (that.pluginFns[fnName]) {
						var oldFunc = that.pluginFns[fnName][that.pluginFns[fnName].length -1]
						var func = function(){
							var args = Array.prototype.slice.call(arguments),
								res;
							res = fn.apply(
								$.extend({}, this, { 
									_call_prev : function () {
										return oldFunc.apply(this, args);
									}
								}), args);
							return res;
						}
						that.pluginFns[fnName].push(func);
						that[fnName] = function(){

							var args = Array.prototype.slice.call(arguments),
								res,
								functions = that.pluginFns[fnName];
							res = functions[functions.length -1].apply(
								this,
								args
							);
							return res			

						}
					} else{
						that.pluginFns[fnName] = [fn];
						that[fnName] = fn;
					}	
				})
			},
			init: function(settings, className){
				var that = this;
				this.pluginFns = {};
				//default plugins
				for (var plugin in Vtree.plugins.defaults) {				
					Vtree.addPlugin.apply(this, [plugin, className])
				}

				// add plugins
				if (settings.plugins) {				
					$.each(settings.plugins, function(index, pluginName) {
						Vtree.addPlugin.apply(that, [pluginName, className])
					});
				}
			},
			create: function (settings) {
				//build tree
	        	var tree = new Vtree.Tree(settings);
				// keep it internally and remove the previous one if it is using the same container
				sameContainer = false;
				for (var i=0, len = trees.length; i < len; i++) {
					var internalTree = trees[i];
					if (tree.container.is(internalTree)) {
						sameContainer = true;
						internalTree.destroy();
						trees[i] = tree;
					}
				}
				if (!sameContainer) {
					trees.push(tree)
				}
				return tree;
	        },
			destroy: function(mixed_tree){
				var tree = this.getTree(mixed_tree)
				for (var i=0, len = trees.length; i < len; i++) {
					var internalTree = trees[i];
					if (tree.id === internalTree.id) {
						break;
					}
				}
				trees.splice(i,1)
				tree.destroy();
			},
			getTree: function(mixed_tree){
				var tree,
					found = false;
				//check what's the type of the tree
				// if it's a tree instance
				if( mixed_tree instanceof Vtree.Tree){
					tree = mixed_tree;
					found = true;
				// if it's a tree id	
				}else{
					for (var i=0, len = trees.length; i < len; i++) {
						tree = trees[i];
						if (tree.id == mixed_tree || tree.container.is(mixed_tree) || tree.container.is($(mixed_tree))) {
							found = true;
							break;

						}
					}
				}

				if (!found){
					throw "tree not found: "+ mixed_tree
				}
				return tree;
			},
			getTrees: function(){
				return trees;
			},
			_generateTreeId: function(){
				var S4 = function() {
				       return (((1+Math.random())*0x10000)|0).toString(16).substring(1);
				};
				return S4()+S4()+S4()
			}
			
		}
	})();	
})(jQuery);

(function ($) {
	Vtree.Tree = function(settings) {
		Vtree.init.apply(this, [settings, "tree"])
		//load settings passed in param
		$.extend(this, settings);
		
		return this.build();
	}
	
	
	Vtree.plugins.defaults.core.tree = {
		defaults:{	
			id: "",
			initially_open: [],
			nodeStore: null,
			container: "body",
			dataSource: {},
			asynchronous: false
		},
		_fn: {	
			build: function(){
				this.setId();				
				if (!this.container.length) {
					throw "container is empty. Check that the element is on the page or that you run your code when the document is ready."
				}
				// fires a beforeInit event			
				this.container.trigger("beforeInit.tree", [this])
				
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
				this.container.trigger("onReady.tree", [this])
			},
			
			setId: function(){
				//give tree an id
				if (!this.id) {
					if (this.dataSource.tree && typeof this.dataSource.tree.id != "undefined") {
						this.id = this.dataSource.tree.id.replace(" ", "_")
					} else{
						this.id = Vtree._generateTreeId();
					}	
				}
			},

			refresh: function(){
				this.container
					.empty() // clean the container
					.append(this._generateHTML())	// add html to container
					.trigger("rendered.tree", [this]) //fires the rendered event
			},

			_attachEvents: function(){
				var that = this;
				var fn = function(e){
					var node = that.getNode($(this).attr("data-nodeid"))
					that.container.trigger(e.type+".node", [that, node])
					e.stopPropagation();
					
				}
				this.container
					.delegate("li","click", fn)
					.delegate("li","dblclick",fn)
					.delegate("li","contextmenu",fn)
					.delegate("li","hover",fn)
					.delegate(".openClose","click",function(e){
						var node = that.getNode($(this).parent().attr("data-nodeid"));
						node.toggleOpen();
						e.stopPropagation();
					})
				return this.container
			},

			_generateHTML: function(){
				var ul = $("<ul>").addClass("tree")
				// get the data from node store
				tree = this.nodeStore.getStructure();
				//for all children of root node we build the html
				for (var i=0, len = tree.children.length; i < len; i++) {
					ul.append(tree.children[i].getHTML())
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
	}
		
})(jQuery);

(function ($) {	
	Vtree.Node = function(settings){
		Vtree.init.apply(this, [settings, "node"])
		
		//load settings passed in param
		$.extend(this, settings)
	};
	
	
Vtree.plugins.defaults.core.node = {
		defaults:{
			id                  : 0,
			el                  : null,
			tree                : null,
			isOpen              : false,
			title               : "",
			description         : "",
			customClass			: "",
			hasVisibleChildren  : false,
			hasRenderedChildren : false,
			hasChildren         : false,
			parent              : null,
			parents             : [],
			children            : [],
			iconClass           : "",
			iconPath            : {open:"", close:""},
			customHTML			: ""
		},
		_fn:{
			open: function (){
				// if it has children and there are not visible on the page
				if (this.hasChildren && !this.hasVisibleChildren) {
					// fires a "beforeOpen" event
					this.tree.container.trigger("beforeOpen.node", [this.tree, this])
					// toggle loading icon
					this.toggleLoading();
					
					var el = this.getEl().addClass("open");
					if (this.iconPath.open) {
						el.find("img")[0].src = this.iconPath.open;
					}
					if (!this.tree.asynchronous){
						this.continueOpening()
					}
				
				}	
				return this;		
			},
			
			continueOpening: function(){
				// change open state variable
				this.isOpen = true;				
				// if it has children but there are not rendered
				if(this.hasChildren && !this.hasRenderedChildren){
					// we build the children
					this.getEl().append(this._getChildrenHTML())
					this.hasRenderedChildren = true;
				}
				this.hasVisibleChildren = true;	
				// toggle loading icon
				this.toggleLoading()
				// fires a "afterOpen" event
				this.tree.container.trigger("afterOpen.node", [this.tree, this])	
			},
			
			close: function (){
				// if there is any children and there are visible
				if (this.hasChildren && this.hasVisibleChildren) {
					// fires a "beforeClose" event
					this.tree.container.trigger("beforeClose.node", [this.tree, this])
					// it sets the isOpen to false
					this.isOpen = false;
					// change the hasVisibleChildren to false 
					this.hasVisibleChildren = false;
					// refresh the node
					var el = this.getEl().removeClass("open")
					if (this.iconPath.close) {
						el.find("img")[0].src = this.iconPath.close;
					}

					// fires a "afterClose" event
					this.tree.container.trigger("afterClose.node", [this.tree, this])
				}
				return this;		
			},

			toggleOpen: function (){
				return (this.isOpen)?this.close(): this.open();
			},

			_getChildrenHTML: function(){
				var ul = $("<ul>").addClass("children")
				var nodes = this.children;
				for (var i=0, len = nodes.length; i < len; i++) {
					ul.append(nodes[i].getHTML())
				}
				return ul;
			},

			getHTML: function (){
				var className = (this.isOpen)?" open ":"";
				className+= (this.hasChildren)? " folder": "";
				className+= " "+this.customClass;
				
				var titleTag = (this.customClass.indexOf("title") !== -1)? "h3" : "em";
				
				var li = $("<li><a></a></li>")
					.attr("data-nodeid", this.id)
					.attr("data-treeid", this.tree.id)
					.addClass(className)
				
				var a = li.children("a")
						.addClass("title")
						.attr("title", this.description);
				if (this.iconClass) {
					a.append("<i></i><"+titleTag+"></"+titleTag+">")
						.find("i").addClass(this.iconClass)
						.end()
						.find(titleTag).html(this.title)
				}else if (typeof this.iconPath != "undefined") {
					var icon;
					if (this.hasChildren && typeof this.iconPath.close != "undefined" && typeof this.iconPath.open != "undefined") {
						icon = (this.isOpen)?this.iconPath.open: this.iconPath.close;
					}else{
						icon = this.iconPath;
					}
					a.append("<i><img/></i><"+titleTag+"></"+titleTag+">")
						.find("img").attr("src", icon)
						.end()
						.find(titleTag).html(this.title)
				}else if (this.customClass.indexOf("title") !== -1){
					a.append("<"+titleTag+"></"+titleTag+">")
						.children()
						.html(this.title);
				}else {
					a.html(this.title);
				}	
								
				if (this.customHTML) {
					li.append("<div class='custom'>")
						.children(".custom")
						.append(this.customHTML)
				}	
				if (this.hasChildren) {
					li.prepend("<a class='openClose'/>")
					if (this.isOpen) {
						li.append(this._getChildrenHTML())
					}
				}else{
					li.prepend("<a href='#' class='align'></a>");
				}	
			
				return li;
			},

			toggleLoading: function (){
				var titleTag = (this.customClass.indexOf("title") !== -1)? "h3" : "em";
				var el = this.getEl();
				var text = (el.hasClass("loading"))?this.title:"Loading...";
				el.toggleClass("loading")
					.children("a.title, label")
						.children(titleTag)
							.text(text)
				
			},

			getEl: function(){
				this.el = $('li[data-nodeid='+this.id+'][data-treeid='+this.tree.id+']')
				return this.el;

			},
			toJson: function(){
				var node = jQuery.extend(true, {}, this)
				for(var i in node){
					if (typeof node[i] == "function"){
						delete node[i]
					}
				}
				delete node.tree;
				delete node.parents;
				delete node.el;
				delete node.parent;
				delete node.nodeStore;
				delete node.pluginFns;
				delete node.plugins;
				if (node.children.length){
					for (var i=0, len = node.children.length; i < len; i++) {
						node.children[i] = node.children[i].toJson
					}
				}
				return node;
			}
		}
	}
		
		
})(jQuery);





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
				return this.structure.tree.toJson();
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
				siblings = node.parent.children
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

(function ($) {

	Vtree.plugins.ajax_loading = {
		tree:{
			defaults:{
				ajaxUrl: "",
				ajaxParameters:{},
				asynchronous: true,
				forceAjaxReload: false
			},
			_fn:{
				build: function(){
					var that = this;
					// when we open a node we need to get his children from the server unless they are already on the page.
					// we can specify a forceAjaxReload setting to true, if we always want to realod the children even if they are already loaded from a previous opening
					this.container.on("beforeOpen.node", function(e, tree, node){
						if (node.hasChildren && !node.children.length && (!node.hasRenderedChildren || (node.hasRenderedChildren && that.forceAjaxReload))) {
							var data = $.extend(true, {
								action:"getChildren",
								nodes: node.id
							}, this.ajaxParameters );
							$.ajax({
								type: "GET",
								url: that.ajaxUrl,
								dataType: 'json',
								data: data,	
								success: $.proxy(node.onAjaxResponse, node)
							})
						}else{
							node.continueOpening();
						}
						
					})
					
					// when we close a node and in case we force ajax relaod at each reopening, we clear the children nodes
					.on("afterClose.node", function(e, tree, node){
						if (that.forceAjaxReload) {
							node.getEl().children("ul.children").remove()
						}
					})
					
					// when we use the ajax plugin with the cookie plugin, we need to be careful to this special case
					// if in the cookie some nodes are saved as opened, we need to ask for their children using ajax
					// in order to display also the children and keep the state saved by the cookie					
					.on("OpenNodesFromCookie.tree", function(e, tree){
						var opened = tree.initially_open;
						
						if (opened.length) {
							var data = $.extend(true, {
								action:"getChildren",
								nodes: opened
							}, this.ajaxParameters );
							$.ajax({
								type: "GET",
								url: that.ajaxUrl,
								dataType: 'json',
								data: data,	
								success: $.proxy(tree.onAjaxResponse, tree)
							})
						}else{
							tree.continueBuilding();
						}
					})
					
					// in the case we use ajax without the cookie plugin, we don't need to wait for the ajax response to 
					// continue the tree building
					.on("beforeInit.tree", function(e, tree){
						if ($.inArray("cookie", tree.plugins) == -1) {
							tree.continueBuilding();
						}
					})
					
					
					return this._call_prev();
				},
				
				getAjaxData:function(data){
					return data
				},
				
				onAjaxResponse: function(data, response, jqXHR){
					nodesData = this.getAjaxData(data);
					for (var nodeId in nodesData) {
						 var nodeData = nodesData[nodeId];
						this.addDataToNodeSource(nodeData)
					}
					this.continueBuilding()
				},
				
				addDataToNodeSource: function(nodeData){
					findNode = function(nodes, id){
						var node = false;
						for (var i=0, len = nodes.length; i < len; i++) {
							var node = nodes[i];
							if (node.id == id) {
								return node;
							}else if (node.nodes && node.nodes.length) {
								var rec = findNode(nodes[i].nodes, nodeData.id);
								if (rec) {return rec}
							}
						}
					}
					var nodeSource = findNode(this.dataSource.tree.nodes, nodeData.id);
					nodeSource = $.extend(true, nodeSource, nodeData)
				},
			}
		},
		node:{
			defaults:{
							
			},
			_fn:{
				onAjaxResponse: function(data, response, jqXHR){					
					var nodeData = this.tree.getAjaxData(data);	
					if (typeof nodeData[this.id] == "undefined") {
						throw "ajax response didn't send back node with id:"+ this.id
					}
					this.nodeStore._recBuildNodes( this, this.parents, nodeData[this.id].nodes);
					this.continueOpening();
					
				}
			}
		}
	}
	

})(jQuery);(function ($) {

	Vtree.plugins.bolding = {
		tree:{
			defaults:{
				initially_bold: []
			},
			_fn:{
				_attachEvents: function(){
					var that  = this;
					return this._call_prev()
						.delegate("li","click.node",function(e){
							var node = that.getNode($(this).attr("data-nodeid"));
							node.toggleBold();
							e.stopPropagation();
						});
				},
				getBoldNodes: function(){
					return this.nodeStore.getBoldNodes()
				}
			}
		},
		node:{
			defaults:{
				isBold:false
			},
			_fn:{
				toggleBold: function() {
					return (this.isBold)? this.unbold(): this.bold();
			    },
				bold: function() {
					// bolding behaviour: 
					// bolding a node bolds all his parents until root node but doesn't affect children state
					this.isBold = true;
					this.getEl().addClass('bold');
					// bold parents
					for (var i=0, parents = this.parents, len = this.parents.length; i < len; i++) {
						var parent = parents[i];
						parent.isBold = true;
						parent.getEl().addClass("bold");
					}	
					// fire bold event                                          
					this.tree.container.trigger("bold.node", [this.tree, this]);
			    },
				unbold: function() {
					// bolding behaviour: 
					// unbolding a node unbolds all his children but doesn't affect parents state

					this.isBold = false;
					this.getEl().removeClass('bold');
					// unbold children
					_rec_unbold = function(node){
						if (node.hasChildren) {
							for (var i=0, children = node.children, len = node.children.length; i < len; i++) {
								var child = children[i];
								if (child.isBold) {
									child.isBold = false;
									child.getEl().removeClass("bold");
									_rec_unbold(child);
								}
							}
						}
					};
					_rec_unbold(this);
					
					// fire bold event
					this.tree.container.trigger("unbold.node", [this.tree, this]);
					
			    },
				getHTML: function(){	
					
					var li = this._call_prev()
					if (this.isBold) {
						li.addClass('bold')
					}
					
					return li;
				}
			}
		},
		nodeStore:{
			_fn:{
				initStructure: function(){
					this._call_prev();
					var initially_bold = this.tree.initially_bold;					
					for (var i=0, len = initially_bold.length; i < len; i++) {
						var id = initially_bold[i];
						var node = this.structure.id2NodeMap[id] 
						var parents = node.parents;
						if (typeof node != "undefined"){
							node.isBold = true;
						}
						for (var j=0, lengh = parents.length; j < lengh; j++) {							
							parents[j].isBold = true;
						}
					}
					
					return true;
				},
				getBoldNodes: function(){
					var _rec_getBoldNodes = function(nodes){
						var boldNodes = [];
						for (var i=0, len = nodes.length; i < len; i++) {
							node = nodes[i];
							if (node.isBold) {
								boldNodes.push(node);
								if (node.hasChildren) {
									boldNodes = boldNodes.concat(_rec_getBoldNodes(node.children));
								}
							}
						}
						return boldNodes;
					}
					return _rec_getBoldNodes(this.structure.tree.children)
				}
			}
		}
	}
	

})(jQuery);(function ($) {

	Vtree.plugins.checkbox = {
		tree:{
			defaults:{
				initially_checked: [],
				disabled_checkboxes: []
			},
			_fn:{
				_attachEvents: function(){
					var that  = this;
					return this._call_prev()
						.delegate("input[type=checkbox]","click",function(e){
							var node = that.getNode($(this).parents("li").attr("data-nodeid"));
							node.toggleCheck();
							e.stopPropagation();
						});
				},
				getCheckedNodes: function(){
					return this.nodeStore.getCheckedNodes()
				}
			}
		},
		node:{
			defaults:{
				isChecked:false,
				isDisabled: false
			},
			_fn:{
				toggleCheck: function() {
					return (this.isChecked)? this.uncheck(): this.check();
			    },
				check: function() {
					// checking behaviour: 
					// checking a node checks all his parents until root node but doesn't affect children checkbox state

					this.isChecked = true;

					// check parents
					for (var i=0, parents = this.parents, len = this.parents.length; i < len; i++) {
						var parent = parents[i];
						parent.isChecked = true;
						parent.getEl().find("input[type=checkbox]").eq(0).prop("checked", true);
					}	
					// fire check event                                          
					this.tree.container.trigger("check.node", [this.tree, this]);
			    },
				uncheck: function() {
					// checking behaviour: 
					// unchecking a node unchecks all his children but doesn't affect parents state

					this.isChecked = false;

					// uncheck children
					_rec_uncheck = function(node){
						if (node.hasChildren) {
							for (var i=0, children = node.children, len = node.children.length; i < len; i++) {
								var child = children[i];
								if (child.isChecked) {
									child.isChecked = false;
									child.getEl().find("input[type=checkbox]").eq(0).prop("checked", false);
									_rec_uncheck(child);
								}
							}
						}
					};
					_rec_uncheck(this);
					
					// fire check event
					this.tree.container.trigger("uncheck.node", [this.tree, this]);
					
			    },
				getHTML: function(){	
					
					var li = this._call_prev()
					li.children("a.title")
						.replaceWith(function(){
					    	return $("<label />").append($(this).contents());
						});
											
					li.children("label")
						.prepend('<input type="checkbox">')
						.find("input")
							.attr("checked", this.isChecked)
							.attr("disabled", this.isDisabled)
					
					return li;
				}
			}
		},
		nodeStore:{
			_fn:{
				initStructure: function(){
					this._call_prev();
					var initially_checked = this.tree.initially_checked,
						disabled_checkboxes = this.tree.disabled_checkboxes;
					
					for (var i=0, len = initially_checked.length; i < len; i++) {
						var id = initially_checked[i];
						var node = this.structure.id2NodeMap[id] 
						var parents = node.parents;
						if (typeof node != "undefined"){
							node.isChecked = true;
						}
						for (var j=0, lengh = parents.length; j < lengh; j++) {							
							parents[j].isChecked = true
						}
					}
					
					for (var i=0, len = disabled_checkboxes.length; i < len; i++) {
						var id = disabled_checkboxes[i];	
						var node = this.structure.id2NodeMap[id];
						var children = node.children;
						
						if (typeof node != "undefined"){
							node.isDisabled = true;
						}
						for (var j=0, lengh = children.length; j < lengh; j++) {							
							children[j].isDisabled = true
						}
					}
					return true	
				},
				getCheckedNodes: function(){
					var _rec_getCheckedNodes = function(nodes){
						var checkedNodes = []
						for (var i=0, len = nodes.length; i < len; i++) {
							node = nodes[i];
							if (node.isChecked) {
								checkedNodes.push(node)
								if (node.hasChildren) {
									checkedNodes = checkedNodes.concat(_rec_getCheckedNodes(node.children))
								}
							}
						}
						return checkedNodes;
					}
					return _rec_getCheckedNodes(this.structure.tree.children)
				}
			}
		}
	}
	

})(jQuery);var setCookie = function(cookieName,cookieValue,nDays) {
	var today = new Date();
	var expire = new Date();
	if (nDays==null || nDays==0) nDays=1;
	expire.setTime(today.getTime() + 3600000*24*nDays);
	document.cookie = cookieName+"="+escape(cookieValue)
	+ ";expires="+expire.toGMTString();
};
var readCookie = function(cookieName) {
	var theCookie=" "+document.cookie;
	var ind=theCookie.indexOf(" "+cookieName+"=");
	if (ind==-1) ind=theCookie.indexOf(";"+cookieName+"=");
	if (ind==-1 || cookieName=="") return "";
	var ind1=theCookie.indexOf(";",ind+1);
	if (ind1==-1) ind1=theCookie.length; 
	return unescape(theCookie.substring(ind+cookieName.length+2,ind1));
};

(function ($) {
	var setCookie = function(cookieName,cookieValue,nDays) {
		var today = new Date();
		var expire = new Date();
		if (nDays==null || nDays==0) nDays=1;
		expire.setTime(today.getTime() + 3600000*24*nDays);
		document.cookie = cookieName+"="+escape(cookieValue)
		+ ";expires="+expire.toGMTString();
	};
	var readCookie = function(cookieName) {
		var theCookie=" "+document.cookie;
		var ind=theCookie.indexOf(" "+cookieName+"=");
		if (ind==-1) ind=theCookie.indexOf(";"+cookieName+"=");
		if (ind==-1 || cookieName=="") return "";
		var ind1=theCookie.indexOf(";",ind+1);
		if (ind1==-1) ind1=theCookie.length; 
		return unescape(theCookie.substring(ind+cookieName.length+2,ind1));
	};
	Vtree.plugins.cookie = {
		tree:{
			_fn:{

				build: function(){					
					this.container.on("beforeInit.tree", function(e, tree){
						cookie = readCookie("Vtree")
						if (cookie) {
							var VtreeCookie = JSON.parse(cookie);
							var treeCookie = VtreeCookie.trees[tree.id];
							if (treeCookie){
								// we get the cookie 
								tree.initially_open = treeCookie.opened;
								tree.initially_checked = treeCookie.checked;
								tree.initially_bold = treeCookie.bold;
								console.log("tree:",tree)
								
								tree.container.trigger("OpenNodesFromCookie.tree", [tree])
								
							}else{
								// we create the initial cookie
								VtreeCookie.trees[tree.id] = {
									opened: tree.initially_open,
									checked: tree.initially_checked,
									bold: tree.initially_bold
								}
								setCookie("Vtree", JSON.stringify(VtreeCookie), 7) // stored for a week	
							}
						}else{
							// we create the initial cookie
							VtreeCookie = {trees:{}}
							// we create the initial cookie
							VtreeCookie.trees[tree.id] = {
								opened: tree.initially_open,
								checked: tree.initially_checked,
								bold: tree.initially_bold
							}
							setCookie("Vtree", JSON.stringify(VtreeCookie), 7) // stored for a week
						}

					})
					
					.bind("afterOpen.node", function(e, tree, node){
						var VtreeCookie = JSON.parse(readCookie("Vtree"));
						var treeCookie = VtreeCookie.trees[tree.id]
						if ($.inArray(node.id, treeCookie.opened) == -1){
							treeCookie.opened.push(node.id)
						}
						setCookie("Vtree", JSON.stringify(VtreeCookie), 7) // stored for a week
						
					})
					
					.bind("beforeClose.node", function(e, tree, node){
						var VtreeCookie = JSON.parse(readCookie("Vtree"));
						var treeCookie = VtreeCookie.trees[tree.id]
						treeCookie.opened = jQuery.grep(treeCookie.opened, function(value) {
							var getOpenedChildrenIds = function(node){
								var childrenIds = [];
								if (node.hasChildren && node.hasVisibleChildren){
									//check that a child wasn't opened
									for (var i=0, len = node.children.length; i < len; i++) {
										var child = node.children[i];
										if (child.isOpen) {
											childrenIds.push(child.id)
											childrenIds = childrenIds.concat(getOpenedChildrenIds(child))
										}
										
									}
								}
								return childrenIds
							};
							
							return (value != node.id && $.inArray(value, getOpenedChildrenIds(node)) == -1) 
						});
						setCookie("Vtree",  JSON.stringify(VtreeCookie), 7) // stored for a week
					})
					
					.bind("check.node", function(e, tree, node){
						var VtreeCookie = JSON.parse(readCookie("Vtree"));
						var treeCookie = VtreeCookie.trees[tree.id]
						
						if ($.inArray(node.id, treeCookie.checked) == -1){
							treeCookie.checked.push(node.id)
						}
						for (var i=0, len = node.parents.length; i < len; i++) {
							var parent = node.parents[i];
							if ($.inArray(parent.id, treeCookie.checked) == -1 && parent.id != "root"){
								treeCookie.checked.push(parent.id)
							}
						}
						setCookie("Vtree", JSON.stringify(VtreeCookie), 7) // stored for a week
					})
					
					.bind("uncheck.node", function(e, tree, node){
						var VtreeCookie = JSON.parse(readCookie("Vtree"));
						var treeCookie = VtreeCookie.trees[tree.id]
						treeCookie.checked = jQuery.grep(treeCookie.checked, function(value) {
							var getCheckedChildrenIds = function(node){
								var childrenIds = [];
								if (node.hasChildren && node.hasVisibleChildren){
									//check that a child wasn't opened
									for (var i=0, len = node.children.length; i < len; i++) {
										var child = node.children[i];
										if (child.isChecked) {
											childrenIds.push(child.id)
											childrenIds = childrenIds.concat(getCheckedChildrenIds(child))
										}

									}
								}
								return childrenIds
							};

							return (value != node.id && $.inArray(value, getCheckedChildrenIds(node)) == -1)
						});
						setCookie("Vtree", JSON.stringify(VtreeCookie), 7) // stored for a week
					})
					
					.bind("bold.node", function(e, tree, node){
						var VtreeCookie = JSON.parse(readCookie("Vtree"));
						var treeCookie = VtreeCookie.trees[tree.id]
						
						if ($.inArray(node.id, treeCookie.bold) == -1){
							treeCookie.bold.push(node.id)
						}
						for (var i=0, len = node.parents.length; i < len; i++) {
							var parent = node.parents[i];
							if ($.inArray(parent.id, treeCookie.bold) == -1 && parent.id != "root"){
								treeCookie.bold.push(parent.id)
							}
						}
						setCookie("Vtree", JSON.stringify(VtreeCookie), 7) // stored for a week
					})
					
					.bind("unbold.node", function(e, tree, node){
						var VtreeCookie = JSON.parse(readCookie("Vtree"));
						var treeCookie = VtreeCookie.trees[tree.id];
						treeCookie.bold = jQuery.grep(treeCookie.bold, function(value) {
							var getBoldChildrenIds = function(node){
								var childrenIds = [];
								if (node.hasChildren && node.hasVisibleChildren){
									//check that a child wasn't opened
									for (var i=0, len = node.children.length; i < len; i++) {
										var child = node.children[i];
										if (child.isBold) {
											childrenIds.push(child.id)
											childrenIds = childrenIds.concat(getBoldChildrenIds(child))
										}

									}
								}
								return childrenIds
							};

							return (value != node.id && $.inArray(value, getCheckedChildrenIds(node)) == -1)
						});
						setCookie("Vtree", JSON.stringify(VtreeCookie), 7) // stored for a week
					})					
					return this._call_prev();
				},
				
				getOpenedNodes: function(){
					var VtreeCookie = JSON.parse(readCookie("Vtree"));
					var treeCookie = VtreeCookie.trees[this.id];
					return treeCookie.opened
				}
			}
		}
	}
	

})(jQuery);(function ($) {
	

	/**
	 * jQuery client-side XSLT plugins.
	 * 
	 * @author <a href="mailto:jb@eaio.com">Johann Burkard</a>
	 * @version $Id: jquery.xslt.js,v 1.10 2008/08/29 21:34:24 Johann Exp $
	 */
	/*
	 * xslt.js
	 *
	 * Copyright (c) 2005-2008 Johann Burkard (<mailto:jb@eaio.com>)
	 * <http://eaio.com>
	 * 
	 * Permission is hereby granted, free of charge, to any person obtaining a
	 * copy of this software and associated documentation files (the "Software"),
	 * to deal in the Software without restriction, including without limitation
	 * the rights to use, copy, modify, merge, publish, distribute, sublicense,
	 * and/or sell copies of the Software, and to permit persons to whom the
	 * Software is furnished to do so, subject to the following conditions:
	 * 
	 * The above copyright notice and this permission notice shall be included
	 * in all copies or substantial portions of the Software.
	 * 
	 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS
	 * OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
	 * MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN
	 * NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM,
	 * DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR
	 * OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE
	 * USE OR OTHER DEALINGS IN THE SOFTWARE.
	 * 
	 */

	/**
	 * Constructor for client-side XSLT transformations.
	 * 
	 * @author <a href="mailto:jb@eaio.com">Johann Burkard</a>
	 * @version $Id: xslt.js,v 1.7 2008/08/29 21:22:55 Johann Exp $
	 * @constructor
	 */
	var Transformation = function () {

	    var xml;

	    var xmlDoc;

	    var xslt;

	    var xsltDoc;

	    var callback = function() {};

	    /**
	     * Sort of like a fix for Opera who doesn't always get readyStates right.
	     */
	    var transformed = false;

	    /**
	     * Returns the URL of the XML document.
	     * 
	     * @return the URL of the XML document
	     * @type String
	     */
	    this.getXml = function() {
	        return xml;
	    }

	    /**
	     * Returns the XML document.
	     * 
	     * @return the XML document
	     */
	    this.getXmlDocument = function() {
	        return xmlDoc
	    }

	    /**
	     * Sets the URL of the XML document.
	     * 
	     * @param x the URL of the XML document
	     * @return this
	     * @type Transformation
	     */
	    this.setXml = function(x) {
	        xml = x;
	        return this;
	    }

	    /**
	     * Returns the URL of the XSLT document.
	     * 
	     * @return the URL of the XSLT document
	     * @type String
	     */
	    this.getXslt = function() {
	        return xslt;
	    }

	    /**
	     * Returns the XSLT document.
	     * 
	     * @return the XSLT document
	     */
	    this.getXsltDocument = function() {
	        return xsltDoc;
	    }

	    /**
	     * Sets the URL of the XSLT document.
	     * 
	     * @param x the URL of the XML document
	     * @return this
	     * @type Transformation
	     */
	    this.setXslt = function(x) {
	        xslt = x;
	        return this;
	    }

	    /**
	     * Returns the callback function.
	     * 
	     * @return the callback function
	     */
	    this.getCallback = function() {
	        return callback;
	    }

	    /**
	     * Sets the callback function
	     * 
	     * @param c the callback function
	     * @return this
	     * @type Transformation
	     */
	    this.setCallback = function(c) {
	        callback = c;
	        return this;
	    }

	    /**
	     *
	     * This method may only be called after {@link #setXml} and {@link #setXslt} have
	     * been called.
	     * <p>
	     * 
	     * @return the result of the transformation
	     */
	    this.transform = function() {
	        if (!browserSupportsXSLT()) {
	           return;
	        }
	        var str = /^\s*</;
	        var t = this,
				res;
	        if (document.recalc) {
	            var change = function() {
	                var c = 'complete';
	                if (xm.readyState == c && xs.readyState == c) {
	                    window.setTimeout(function() {
	                        xmlDoc = xm.XMLDocument;
	                        xsltDoc = xs.XMLDocument;
	                        callback(t);
	                        res = xm.transformNode(xs.XMLDocument);
	                    }, 50);
	                }
	            };

	            var xm = document.createElement('xml');
	            xm.onreadystatechange = change;
	            xm[str.test(xml) ? "innerHTML" : "src"] = xml;

	            var xs = document.createElement('xml');
	            xs.onreadystatechange = change;
	            xs[str.test(xslt) ? "innerHTML" : "src"] = xslt;

	            with (document.body) {
	                insertBefore(xm);
	                insertBefore(xs);
	            };
	        }
	        else {
	            var transformed = false;

	            var xm = {
	                readyState: 4
	            };
	            var xs = {
	                readyState: 4
	            };
	            var change = function() {
	                if (xm.readyState == 4 && xs.readyState == 4 && !transformed) {
	                    xmlDoc = xm.responseXML;
	                    xsltDoc = xs.responseXML;
	                    var resultDoc;
	                    var processor = new XSLTProcessor();

	                    if (typeof processor.transformDocument == 'function') {
	                        // obsolete Mozilla interface
	                        resultDoc = document.implementation.createDocument("", "", null);
	                        processor.transformDocument(xm.responseXML, xs.responseXML, resultDoc, null);
	                        var out = new XMLSerializer().serializeToString(resultDoc);
	                        callback(t);
							res = out;
	                    }
	                    else {
	                        processor.importStylesheet(xs.responseXML);
	                        resultDoc = processor.transformToFragment(xm.responseXML, document);
	                        callback(t);
							res = resultDoc;
	                    }

	                    transformed = true;
	                }
	            };

	            if (str.test(xml)) {
	                xm.responseXML = new DOMParser().parseFromString(xml, "text/xml");
	            }
	            else {
	                xm = new XMLHttpRequest();
	                xm.onreadystatechange = change;
	                xm.open("GET", xml);
	                xm.send(null);
	            }

	            if (str.test(xslt)) {
	                xs.responseXML = new DOMParser().parseFromString(xslt, "text/xml");
	                change();
	            }
	            else {
	                xs = new XMLHttpRequest();
	                xs.onreadystatechange = change;
	                xs.open("GET", xslt);
	                xs.send(null);
	            }
	        }
			return res;
	    }

	}

	/**
	 * Returns whether the browser supports XSLT.
	 * 
	 * @return the browser supports XSLT
	 * @type boolean
	 */
	var browserSupportsXSLT = function () {
	    var support = false;
	    if (document.recalc) { // IE 5+
	        support = true;
	    }
	    else if (window.XMLHttpRequest != undefined && window.XSLTProcessor != undefined) { // Mozilla 0.9.4+, Opera 9+
	       var processor = new XSLTProcessor();
	       if (typeof processor.transformDocument == 'function') {
	           support = window.XMLSerializer != undefined;
	       }
	       else {
	           support = true;
	       }
	    }
	    return support;
	}
	
	
	Vtree.plugins.xmlSource = {
		nodeStore:{
			defaults:{
				xslt:''+
					'<' + '?xml version="1.0" encoding="utf-8" ?>' + 
					'<xsl:stylesheet version="1.0" xmlns:xsl="http://www.w3.org/1999/XSL/Transform" >' + 
					'<xsl:output encoding="utf-8"  indent="no" omit-xml-declaration="yes" method="text" />' + 
					''+
					'<xsl:strip-space elements="*" />'+
					'<xsl:template match="/">' + 
					'	<xsl:apply-templates select="tree"/>' + 
					'</xsl:template>'+
					''+
					'<xsl:template match="tree">' + 
					'	{"tree":{'+
					'		"id": "<xsl:value-of select="@id"/>",'+
					' 		"nodes": <xsl:apply-templates select="nodes"/> }'+
					'	}'+
					'</xsl:template>' +
					''+
					'<xsl:template match="nodes">' + 
					' [<xsl:apply-templates select="node"/>]'+
					'</xsl:template>' +
					''+
					'<xsl:template match="node">' + 
					'	{"id": "<xsl:value-of select="id"/>",'+
					'	"title": "<xsl:value-of select="label|title"/>",'+
					'	"description": "<xsl:value-of select="description"/>",'+
					'	"hasChildren": <xsl:value-of select="hasChildren"/>,'+
					'	"iconPath": "<xsl:value-of select="icon"/>",'+
					'	"nodes":[<xsl:apply-templates select="node"/>]'+
					'	}<xsl:if test="position()!=last()">,</xsl:if>'+
					'</xsl:template>' + 
					'</xsl:stylesheet>'
			},
			_fn:{
				getDataSource: function(attribute){
					var res = new Transformation().setXml(this.tree.dataSource)
					        .setXslt(this.xslt).transform();

					this.tree.dataSource = JSON.parse(res.textContent);
					return this._call_prev();
				},
			}
		}		
	}
	
})(jQuery);
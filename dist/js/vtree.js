if (typeof Vtree === "undefined") {
	Vtree = {};
}


if(typeof console === "undefined") {
	console = {
		log:function(){}
	};
}/*
 * Vtree 1.0.0
 *
 * Copyright (c) 2012-2013 Loic Ginoux (loicginoux.com)
 * Copyright (c) 2012-2013 Vyre ltd. (vyre.com)
 *
 * Licensed under the terms of the MIT License
 *   http://www.opensource.org/licenses/mit-license.php
 *
 */


(function ($) {

	Vtree = (function(){
		var trees = [];

		return{
			plugins: {
				defaults:{core:{}}
			},
			addPlugin: function(pluginName, className){
				var that = this;
				var plg = Vtree.plugins[pluginName] || Vtree.plugins.defaults[pluginName];
				if (!plg) {
					throw "plugin not existing: "+ pluginName;
				}
				var plugin = plg[className];
				if (!plugin) {return;}
				$.extend(this, plugin.defaults);

				$.each(plugin._fn, function (fnName, fn) {

					if (that.pluginFns[fnName]) {
						var oldFunc = that.pluginFns[fnName][that.pluginFns[fnName].length -1];
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
						};
						that.pluginFns[fnName].push(func);
						that[fnName] = function(){

							var args = Array.prototype.slice.call(arguments),
								res,
								functions = that.pluginFns[fnName];
							res = functions[functions.length -1].apply(
								this,
								args
							);
							return res;

						};
					} else{
						that.pluginFns[fnName] = [fn];
						that[fnName] = fn;
					}
				});
			},
			init: function(settings, className){
				var that = this;
				this.pluginFns = {};
				//default plugins
				for (var plugin in Vtree.plugins.defaults) {
					Vtree.addPlugin.apply(this, [plugin, className]);
				}

				// add plugins
				if (settings.plugins) {
					$.each(settings.plugins, function(index, pluginName) {
						Vtree.addPlugin.apply(that, [pluginName, className]);
					});
				}
			},
			create: function (settings) {
				// remove the previous one if it is using the same container
				sameContainer = false;
				for (var i=0, len = trees.length; i < len; i++) {
					var internalTree = trees[i];
					if (settings.container.is(internalTree.container)) {
						sameContainer = true;
						this.destroy(internalTree);
					}
				}
				//build tree
				var tree = new Vtree.Tree(settings);
				//add it to the list
				trees.push(tree);
				return tree;
			},
			destroy: function(mixed_tree){
				var tree = this.getTree(mixed_tree);
				for (var i=0, len = trees.length; i < len; i++) {
					var internalTree = trees[i];
					if (tree.id === internalTree.id) {
						break;
					}
				}
				trees.splice(i,1);
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
					throw "tree not found: "+ mixed_tree;
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
				return S4()+S4()+S4();
			}

		};
	})();
})(jQuery);

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

(function ($) {
	Vtree.Node = function(settings){
		Vtree.init.apply(this, [settings, "node"]);

		//load settings passed in param
		$.extend(this, settings);
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
					this.tree.container.trigger("beforeOpen.node", [this.tree, this]);
					// toggle loading icon
					this.toggleLoading();

					var el = this.getEl().addClass("open");
					if (this.iconPath.open) {
						el.find("img")[0].src = this.iconPath.open;
					}
					if (!this.tree.asynchronous){
						this.continueOpening();
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
					this.getEl().append(this._getChildrenHTML());
					this.hasRenderedChildren = true;
				}
				this.hasVisibleChildren = true;
				// toggle loading icon
				this.toggleLoading();
				// fires a "afterOpen" event
				this.tree.container.trigger("afterOpen.node", [this.tree, this]);
			},

			close: function (){
				// if there is any children and there are visible
				if (this.hasChildren && this.hasVisibleChildren) {
					// fires a "beforeClose" event
					this.tree.container.trigger("beforeClose.node", [this.tree, this]);
					// it sets the isOpen to false
					this.isOpen = false;
					// change the hasVisibleChildren to false
					this.hasVisibleChildren = false;
					// refresh the node
					var el = this.getEl().removeClass("open");
					if (this.iconPath.close) {
						el.find("img")[0].src = this.iconPath.close;
					}

					// fires a "afterClose" event
					this.tree.container.trigger("afterClose.node", [this.tree, this]);
				}
				return this;
			},

			toggleOpen: function (){
				return (this.isOpen)?this.close(): this.open();
			},

			_getChildrenHTML: function(){
				var ul = $("<ul>").addClass("children");
				var nodes = this.children;
				for (var i=0, len = nodes.length; i < len; i++) {
					ul.append(nodes[i].getHTML());
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
					.addClass(className);

				var a = li.children("a")
						.addClass("title")
						.attr("title", this.description);

				var isIconPathString = !!(typeof this.iconPath === "string" && this.iconPath !== '');
				var isIconPathObject = !!(typeof this.iconPath !== "undefined" && this.iconPath.close && this.iconPath.open);
				var hasIconPath = (isIconPathObject || isIconPathString);
				if (this.iconClass) {
					a.append("<i></i><"+titleTag+"></"+titleTag+">")
						.find("i").addClass(this.iconClass)
						.end()
						.find(titleTag).html(this.title);
				}else if (hasIconPath) {
					var icon;
					if (this.hasChildren && typeof this.iconPath.close != "undefined" && typeof this.iconPath.open != "undefined") {
						icon = (this.isOpen)?this.iconPath.open: this.iconPath.close;
					}else{
						icon = this.iconPath;
					}
					a.append("<i><img/></i><"+titleTag+"></"+titleTag+">")
						.find("img").attr("src", icon)
						.end()
						.find(titleTag).html(this.title);
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
						.append(this.customHTML);
				}
				if (this.hasChildren) {
					li.prepend("<a class='openClose'/>");
					if (this.isOpen) {
						li.append(this._getChildrenHTML());
					}
				}else{
					li.prepend("<a href='#' class='align'></a>");
				}

				return li;
			},

			toggleLoading: function (){
				// var titleTag = (this.customClass.indexOf("title") !== -1)? "h3" : "em";
				var el = this.getEl();
				var text = (el.hasClass("loading"))?this.title:"Loading...";
				var title = el.toggleClass("loading").children("a.title, label");
				var child = title.children("h3, em, span");
				if (child.length) {
					child.text(text);
				}else{
					title.text(text);
				}


			},

			getEl: function(){
				this.el = $('li[data-nodeid='+this.id+'][data-treeid='+this.tree.id+']');
				return this.el;

			},
			toJson: function(){
				var node = jQuery.extend(true, {}, this);
				for(var i in node){
					if (typeof node[i] == "function"){
						delete node[i];
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
					for (var j=0, len = node.children.length; j < len; j++) {
						node.children[j] = node.children[j].toJson;
					}
				}
				return node;
			}
		}
	};
})(jQuery);





(function ($) {
	Vtree.NodeStore = function(settings){
		Vtree.init.apply(this, [settings, "nodeStore"]);
			
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
		});
		
		this.structure = {
			id2NodeMap: {},
			tree:{}
		};
		
		//load settings passed in param
		$.extend(true, this, settings);
		
		if (!this.initStructure(settings)){
			throw "internal structure not initialised properly";
		}
	};

	Vtree.plugins.defaults.core.nodeStore = {
		defaults:{
			tree: null
		},
		_fn: {
			initStructure: function(){
				var dataSource = this.getDataSource();
				//if the data source is a json object
				if (typeof dataSource != "undefined") {

					var struct = this.structure;
					var children = dataSource.nodes || dataSource.children;
					// recursively build the node structure
					this._recBuildNodes( this.rootNode, [this.rootNode], children);
					// keep the tree hierarchy in the internal structure
					this.structure.tree = this.rootNode;

				}
				return true;
			},

			getDataSource: function(){
				return this.tree.dataSource.tree;
			},
			
			_recBuildNodes: function(parent, parents, nodes){
				var siblings = [];
				
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
							parents_already_opened = true;
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
						delete settings.nodes;
					}
					var node = new Vtree.Node(settings);
					// keep it in the nodeStore structure
					this.structure.id2NodeMap[sourceNode.id] = node;
					//keep all siblings in an array to add later all children to the parent
					siblings.push(node);
					// if it has children, build children nodes
					var children = sourceNode.nodes || sourceNode.children;
					if (children && children.length){
						this._recBuildNodes( node, parents.concat(node), children);
					}
				}
				// now that we know all children, add them to the parents
				parent.children = siblings;
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
					node = mixedNode;
				//if mixedNode is an id
				}else if (typeof this.structure.id2NodeMap[mixedNode] != "undefined") {
					node = this.structure.id2NodeMap[mixedNode];
				}else{
					throw "node not found: "+ mixedNode;
				}
				return node;
			},

			getSiblings: function(mixedNode){
				node = this.getNode(mixedNode);
				// get parent's children
				siblings = node.parent.children;
				// remove the current node
				for (var i = siblings.length - 1; i >= 0; i--){
					if (siblings[i].id == node.id){
						siblings.splice(i, 1);
					}
				}
				return siblings;
			},

			getParent: function(mixedNode){
				return this.getNode(mixedNode).parent;
			},

			getParents: function(mixedNode){
				return this.getNode(mixedNode).parents;
			},

			getChildren: function(mixedNode){
				return this.getNode(mixedNode).children;
			}
		}
	};

})(jQuery);

(function ($) {

	Vtree.plugins.ajax_loading = {
		tree:{
			defaults:{
				ajaxUrl: "",
				ajaxParameters:{},
				asynchronous: true, //can't be overwritten
				forceAjaxReload: false
			},
			_fn:{
				build: function(){
					var that = this;
					this.container.on("beforeOpen.node", function(e, tree, node){
						// when opening a node we get his children from the server
						// in the case that we force the ajax relaod
					// or that the list of children is empty
						if (node.hasChildren && (!node.children.length || that.forceAjaxReload)) {
							var data = $.extend(true, {
								action:"getChildren",
								nodes: node.id
							}, tree.ajaxParameters );

							$.ajax({
								type: "GET",
								url: that.ajaxUrl,
								dataType: 'json',
								data: data,
								success: $.proxy(node.onAjaxResponse, node)
							});
						}else{
							node.continueOpening();
						}

					})

					// when we close a node and in case we force ajax relaod at each reopening, we clear the children nodes
					.on("afterClose.node", function(e, tree, node){
						if (that.forceAjaxReload) {
							node.getEl().children("ul.children").remove();
						}
					})

					// when we use the ajax plugin with the cookie plugin, we need to be careful to this special case
					// if some nodes are saved as opened in the cookie, we need to ask for their children using ajax
					// in order to display also the children and keep the state saved by the cookie
					.on("OpenNodesFromCookie.tree", function(e, tree){
						tree.fetchChildren(tree.initially_open);
					})

					// in the case we use ajax without the cookie plugin, we don't need to wait for the ajax response to
					// continue the tree building
					.on("beforeInit.tree", function(e, tree){
						if ($.inArray("cookie", tree.plugins) == -1) { // the cookie plugin is not in tree
							tree.fetchChildren(tree.initially_open);

						}
					});


					return this._call_prev();
				},

				fetchChildren:function(nodes){
					var that = this;
					// we filter nodes that already have their children loaded
					nodes = jQuery.grep(nodes, function(id) {
						var pass = true;
						try{
							var node = that.getNode(id);
							if (node && node.children.length) {
								pass = false;
							}
						}catch(e){}
						return pass;
					});

					if (!nodes.length) {
						this.continueBuilding();
					}else{

						var data = $.extend(true, {
							action:"getChildren",
							nodes: nodes.join(",")
						}, this.ajaxParameters );

						$.ajax({
							type: "GET",
							url: this.ajaxUrl,
							dataType: 'json',
							data: data,
							success: $.proxy(this.onAjaxResponse, this)
						});
					}
				},

				getAjaxData:function(data){
					return data;
				},

				onAjaxResponse: function(data, response, jqXHR){
					var nodesData = this.getAjaxData(data);
					for (var nodeId in nodesData) {
						var nodeData = nodesData[nodeId];
						this.addDataToNodeSource(nodeData);
					}
					this.continueBuilding();
				},

				addDataToNodeSource: function(nodeData){
					// if a child of the nodeData have the attribute 'nodes' empty (means without children),
					// we need to remove the attribute nodes from the child
					// if not removed, it could overwrite the dataSource child tha might have the nodes not empty...
					// is that clear enough?! :/
					if (nodeData.nodes && nodeData.nodes.length) {
						for (var i = 0; i < nodeData.nodes.length; i++) {
							var child = nodeData.nodes[i];
							var greatChildren = child.nodes;
							if(greatChildren && greatChildren.constructor==Array && greatChildren.length===0){
								delete child.nodes;
							}
						}
					}
					if (nodeData.id) {
						nodeSource = this.getNode(nodeData.id);
						this.nodeStore._recBuildNodes( nodeSource, nodeSource.parents.concat(nodeSource), nodeData.nodes);
					}
				}
			}
		},
		node:{
			_fn:{
				onAjaxResponse: function(data, response, jqXHR){
					var nodeData = this.tree.getAjaxData(data);
					if (typeof nodeData[this.id] == "undefined") {
						throw "ajax response didn't send back node with id:"+ this.id;
					}
					this.nodeStore._recBuildNodes( this, this.parents.concat(this), nodeData[this.id].nodes);
					this.continueOpening();

				}
			}
		}
	};


})(jQuery);(function ($) {

	Vtree.plugins.bolding = {
		tree:{
			defaults:{
				initially_bold: [],
				cascading_bold: false
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
					return this.nodeStore.getBoldNodes();
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
					if (this.tree.cascading_bold) {
						// bold parents
						for (var i=0, parents = this.parents, len = this.parents.length; i < len; i++) {
							var parent = parents[i];
							parent.isBold = true;
							parent.getEl().addClass("bold");
						}
					}
					// fire bold event
					this.tree.container.trigger("bold.node", [this.tree, this]);
				},
				unbold: function() {

					// bolding behaviour:
					// in case cascading_bold is true
					// unbolding a node unbolds all his children but doesn't affect parents state

					this.isBold = false;
					this.getEl().removeClass('bold');

					// unbold children
					_rec_unbold = function(node){
						if (node.hasChildren) {
							for (var i=0, children = node.children, len = node.children.length; i < len; i++) {
								var child = children[i];
								if (child.isBold) {
									// child.isBold = false;
									// child.getEl().removeClass("bold");
									// _rec_unbold(child);
									child.unbold();
								}
							}
						}
					};

					if (this.tree.cascading_bold) {
						_rec_unbold(this);
					}

					// fire bold event
					this.tree.container.trigger("unbold.node", [this.tree, this]);


				},
				getHTML: function(){

					var li = this._call_prev();
					if (this.isBold) {
						li.addClass('bold');
					}

					return li;
				},
				isOneDescendantBold:function(){
					var res = false;
					if (!this.children) return res;
					for (var i = 0; i < this.children.length; i++) {
						var child = this.children[i];
						if (child.isBold) {
							res = true;
							break;
						}
						// if cascading_bold is set to true
						// we don't need to look deeper as a bold node must have his parents bold
						// in the contrary, a node can be bold without having his parents bold
						if (!this.tree.cascading_bold) {
							res = child.isOneDescendantBold();
							if (res) {
								break;
							}
						}

					}
					return res;
				}
			}
		},
		nodeStore:{
			defaults:{},
			_fn:{
				initStructure: function(){
					this._call_prev();
					var initially_bold = this.tree.initially_bold;
					for (var i=0, len = initially_bold.length; i < len; i++) {
						var id = initially_bold[i];
						var node = this.structure.id2NodeMap[id];
						if (typeof node != "undefined"){
							var parents = node.parents;
							node.isBold = true;
							if (this.tree.cascading_bold) {
								for (var j=0, lengh = parents.length; j < lengh; j++) {
									parents[j].isBold = true;
								}
							}
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
							}
							if (node.hasChildren) {
								boldNodes = boldNodes.concat(_rec_getBoldNodes(node.children));
							}
						}
						return boldNodes;
					};
					return _rec_getBoldNodes(this.structure.tree.children);
				}
			}
		}
	};


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
					return this.nodeStore.getCheckedNodes();
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
					// fire check event
					this.tree.container.trigger("uncheck.node", [this.tree, this]);

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



				},
				getHTML: function(){

					var li = this._call_prev();
					li.children("a.title")
						.replaceWith(function(){
							return $("<label />").append($(this).contents());
						});

					li.children("label")
						.wrapInner("<span>")
						.prepend('<input type="checkbox">')
						.find("input")
							.attr("checked", this.isChecked)
							.attr("disabled", this.isDisabled);

					return li;
				},
				isOneDescendantChecked:function(){
					var res = false;
					if (!this.children) return res;
					for (var i = 0; i < this.children.length; i++) {
						var child = this.children[i];
						if (child.isChecked) {
							res = true;
							break;
						}
						// we don't need to look deeper as a checked node must have his parents checked
					}
					return res;
				}

			}
		},
		nodeStore:{
			_fn:{
				initStructure: function(){
					this._call_prev();
					var initially_checked = this.tree.initially_checked,
						disabled_checkboxes = this.tree.disabled_checkboxes,
						i,j,id, node, children, parent;

					for (i=0, len = initially_checked.length; i < len; i++) {
						id = initially_checked[i];
						node = this.structure.id2NodeMap[id];
						parents = node.parents;
						if (typeof node != "undefined"){
							node.isChecked = true;
						}
						for (j=0, lengh = parents.length; j < lengh; j++) {
							parents[j].isChecked = true;
						}
					}

					for (i=0, len = disabled_checkboxes.length; i < len; i++) {
						id = disabled_checkboxes[i];
						node = this.structure.id2NodeMap[id];
						children = node.children;

						if (typeof node != "undefined"){
							node.isDisabled = true;
						}
						for (j=0, lengh = children.length; j < lengh; j++) {
							children[j].isDisabled = true;
						}
					}
					return true;
				},
				getCheckedNodes: function(){
					var _rec_getCheckedNodes = function(nodes){
						var checkedNodes = [];
						for (var i=0, len = nodes.length; i < len; i++) {
							node = nodes[i];
							if (node.isChecked) {
								checkedNodes.push(node);
								if (node.hasChildren) {
									checkedNodes = checkedNodes.concat(_rec_getCheckedNodes(node.children));
								}
							}
						}
						return checkedNodes;
					};
					return _rec_getCheckedNodes(this.structure.tree.children);
				}
			}
		}
	};


})(jQuery);(function ($) {
	Vtree.setCookie = function(cookieName,cookieValue,nDays) {
		var today = new Date();
		var expire = new Date();
		if (nDays===null || nDays===0) nDays=1;
		expire.setTime(today.getTime() + 3600000*24*nDays);
		document.cookie = cookieName+"="+escape(cookieValue)+ ";expires="+expire.toGMTString();
	};
	Vtree.readCookie = function(cookieName) {
		var theCookie=" "+document.cookie;
		var ind=theCookie.indexOf(" "+cookieName+"=");
		if (ind==-1) ind=theCookie.indexOf(";"+cookieName+"=");
		if (ind===-1 || cookieName==="") return "";
		var ind1=theCookie.indexOf(";",ind+1);
		if (ind1==-1) ind1=theCookie.length;
		return unescape(theCookie.substring(ind+cookieName.length+2,ind1));
	};
	Vtree.plugins.cookie = {
		tree:{
			_fn:{

				build: function(){
					this.container.on("beforeInit.tree", function(e, tree){
						var VtreeCookie;
						var cookie = Vtree.readCookie("Vtree");
						if (cookie) {
							VtreeCookie = JSON.parse(cookie);
							var treeCookie = VtreeCookie.trees[tree.id];
							if (treeCookie){
								// we get the cookie
								tree.initially_open = treeCookie.opened || [];
								tree.initially_checked = treeCookie.checked || [];
								tree.initially_bold = treeCookie.bold || [];
								tree.container.trigger("OpenNodesFromCookie.tree", [tree]);

							}else{
								// we create the initial cookie
								VtreeCookie.trees[tree.id] = {
									opened: tree.initially_open || [],
									checked: tree.initially_checked || [],
									bold: tree.initially_bold || []
								};
								Vtree.setCookie("Vtree", JSON.stringify(VtreeCookie), 7); // stored for a week
							}
						}else{
							// we create the initial cookie
							VtreeCookie = {trees:{}};
							// we create the initial cookie
							VtreeCookie.trees[tree.id] = {
								opened: tree.initially_open || [],
								checked: tree.initially_checked || [],
								bold: tree.initially_bold || []
							};
							Vtree.setCookie("Vtree", JSON.stringify(VtreeCookie), 7); // stored for a week
							// this is for the tree to continue building when used in conjonction with the ajax plugin
							tree.container.trigger("OpenNodesFromCookie.tree", [tree]);

						}

					})

					.bind("afterOpen.node", function(e, tree, node){
						var VtreeCookie = JSON.parse(Vtree.readCookie("Vtree"));
						var treeCookie = VtreeCookie.trees[tree.id];
						if ($.inArray(node.id, treeCookie.opened) == -1){
							treeCookie.opened.push(node.id);
						}
						Vtree.setCookie("Vtree", JSON.stringify(VtreeCookie), 7); // stored for a week

					})

					.bind("beforeClose.node", function(e, tree, node){
						var VtreeCookie = JSON.parse(Vtree.readCookie("Vtree"));
						var treeCookie = VtreeCookie.trees[tree.id];
						if (typeof node.isOneDescendantBold === "function" && node.isOneDescendantBold()) {
							return; // when one of his children is bold, they should remain open when reloading
						}
						if (typeof node.isOneDescendantChecked === "function" && node.isOneDescendantChecked()) {
							return; // when one of his children is checked, they should remain open when reloading
						}
						treeCookie.opened = jQuery.grep(treeCookie.opened, function(value) {
							var getOpenedChildrenIds = function(node){
								var childrenIds = [];
								if (node.hasChildren && node.hasVisibleChildren){
									//check that a child wasn't opened
									for (var i=0, len = node.children.length; i < len; i++) {
										var child = node.children[i];
										if (child.isOpen) {
											childrenIds.push(child.id);
											childrenIds = childrenIds.concat(getOpenedChildrenIds(child));
										}

									}
								}
								return childrenIds;
							};
							return (value != node.id && $.inArray(value, getOpenedChildrenIds(node)) == -1);
						});
						Vtree.setCookie("Vtree",  JSON.stringify(VtreeCookie), 7); // stored for a week
					})

					.bind("check.node", function(e, tree, node){
						var VtreeCookie = JSON.parse(Vtree.readCookie("Vtree"));
						var treeCookie = VtreeCookie.trees[tree.id];

						if ($.inArray(node.id, treeCookie.checked) == -1){
							treeCookie.checked.push(node.id);
						}
						for (var i=0, len = node.parents.length; i < len; i++) {
							var parent = node.parents[i];
							if ($.inArray(parent.id, treeCookie.checked) == -1 && parent.id != "root"){
								treeCookie.checked.push(parent.id);
							}
						}
						Vtree.setCookie("Vtree", JSON.stringify(VtreeCookie), 7); // stored for a week
					})

					.bind("uncheck.node", function(e, tree, node){
						var VtreeCookie = JSON.parse(Vtree.readCookie("Vtree"));
						var treeCookie = VtreeCookie.trees[tree.id];
						var getCheckedChildrenIds = function(node){
							var childrenIds = [];
							if (node.hasChildren && node.hasVisibleChildren){
								//check that a child wasn't opened
								for (var i=0, len = node.children.length; i < len; i++) {
									var child = node.children[i];
									if (child.isChecked) {
										childrenIds.push(child.id);
										childrenIds = childrenIds.concat(getCheckedChildrenIds(child));
									}

								}
							}
							return childrenIds;
						};
						treeCookie.checked = jQuery.grep(treeCookie.checked, function(value) {
							return (value != node.id && $.inArray(value, getCheckedChildrenIds(node)) == -1);
						});
						Vtree.setCookie("Vtree", JSON.stringify(VtreeCookie), 7); // stored for a week
					})

					.bind("bold.node", function(e, tree, node){
						var VtreeCookie = JSON.parse(Vtree.readCookie("Vtree"));
						var treeCookie = VtreeCookie.trees[tree.id];

						if ($.inArray(node.id, treeCookie.bold) == -1){
							treeCookie.bold.push(node.id);
						}
						if (tree.cascading_bold) {
							for (var i=0, len = node.parents.length; i < len; i++) {
								var parent = node.parents[i];
								if ($.inArray(parent.id, treeCookie.bold) == -1 && parent.id != "root"){
									treeCookie.bold.push(parent.id);
								}
							}
						}
						Vtree.setCookie("Vtree", JSON.stringify(VtreeCookie), 7); // stored for a week
					})

					.bind("unbold.node", function(e, tree, node){
						var VtreeCookie = JSON.parse(Vtree.readCookie("Vtree"));
						var treeCookie = VtreeCookie.trees[tree.id];
						treeCookie.bold = jQuery.grep(treeCookie.bold, function(value) {
							var getBoldChildrenIds = function(node){
								var childrenIds = [];
								if (node.hasChildren && node.hasVisibleChildren){
									//check that a child wasn't bold
									for (var i=0, len = node.children.length; i < len; i++) {
										var child = node.children[i];
										if (child.isBold) {
											childrenIds.push(child.id);
											childrenIds = childrenIds.concat(getBoldChildrenIds(child));
										}

									}
								}
								return childrenIds;
							};
							if (!tree.cascading_bold) {
								return (value != node.id);
							} else{
								return (value != node.id && $.inArray(value, getBoldChildrenIds(node)) == -1);
							}
						});
						Vtree.setCookie("Vtree", JSON.stringify(VtreeCookie), 7); // stored for a week
					});
					return this._call_prev();
				}
			}
		}
	};


})(jQuery);
// Vtree (javascript tree component)
// ----------------------------------
// v1.1.3
//
// Copyright (c)2013 Loic Ginoux, Vyre ltd.
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
// http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.
//

if (typeof Vtree === "undefined") {
	Vtree = {};
}


if(typeof console === "undefined") {
	console = {
		log:function(){}
	};
}



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
				// we first clone the defaults
				var pluginDefaults = $.extend(true, {}, plugin.defaults);
				// and then extends the object with these default
				$.extend(this, pluginDefaults);

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
				var sameContainer = false;
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

			// set tree in its initial state
			reset: function(){
				this.destroy();
				this.build();
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
					that.container.trigger(e.type+".node", [that, node, e]);
					e.stopPropagation();
				};
				this.container
				.delegate("li","click", fn)
				.delegate("li","dblclick",fn)
				.delegate("li","hover",fn)
				.delegate("li","contextmenu",function(event){
					try{
						fn(event);
					}
					catch(event){
					}
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
				.unbind(".tree")
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
	Vtree.NodeStore = function(settings){
		Vtree.init.apply(this, [settings, "nodeStore"]);

		this.rootNode = new Vtree.Node({
			isRoot: true,
			id: "root",
			title: "root",
			description: "root",
			icon: "",
			hasChildren: true,
			parent: null,
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
					this._recBuildNodes( null, [], children);
					// keep the tree hierarchy in the internal structure
					this.structure.tree = this.rootNode;

				}
				return true;
			},

			getDataSource: function(){
				if (!this.dataSource){
					this.dataSource = this.tree.dataSource.tree;
				}
				return this.dataSource;
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
					if ($.inArray(sourceNode.id, this.tree.initiallyOpen) !== -1) {
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
				if (parent) {
					parent.children = siblings;
				}else{
					this.rootNode.children = siblings;
				}
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
				var node = this.getNode(mixedNode);
				// get parent's children
				var siblings = (node.parent) ? node.parent.children : this.rootNode.children;
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
				return this;
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
				.attr("id", this.tree.id+"_"+this.id)
				.addClass(className);

				var a = li.children("a")
				.addClass("title")
				.attr("title", this.description);

				if (this.href) { a.attr("href", this.href); }

				var isIconPathString = !!(typeof this.iconPath === "string" && this.iconPath !== '');
				var isIconPathObject = !!(typeof this.iconPath !== "undefined" && this.iconPath.close && this.iconPath.open);
				var hasIconPath = (isIconPathObject || isIconPathString);
				if (this.iconClass) {
					a.append("<i></i><"+titleTag+"></"+titleTag+">")
					.find("i").addClass(this.iconClass)
					.end()
					.find(titleTag).text(this.title);
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
					.find(titleTag).text(this.title);
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
				var child = (title.find("h3, em").length)? title.find("h3, em"): title.children("span");
				if (child.length) {
					child.text(text);
				}else{
					title.text(text);
				}


			},

			getEl: function(){
				this.el = $('li#'+this.tree.id+'_'+this.id);
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
			},

			recursivityOnChildren: function(fn){
				if (this.hasChildren) {
					for (var i=0, children = this.children, len = this.children.length; i < len; i++) {
						var child = children[i];
						if (typeof fn == "function") {
							fn(child);
							if (child.hasChildren) {
								child.recursivityOnChildren(fn);
							}
						}

					}
				}
			},

			recursivityOnParents: function(fn){
				for (var i=0, parents = this.parents, len = this.parents.length; i < len; i++) {
					var parent = parents[i];
					if (typeof fn == "function" && parent) {
						fn(parent);
					}
				}
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
						tree.fetchChildren(tree.initiallyOpen);
					})

					// in the case we use ajax without the cookie plugin, we don't need to wait for the ajax response to
					// continue the tree building
					.on("beforeInit.tree", function(e, tree){
						if ($.inArray("cookie", tree.plugins) == -1) { // the cookie plugin is not in tree
							tree.fetchChildren(tree.initiallyOpen);
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
						}catch(e){
							if ($.inArray(id, that.initiallyLoadedNodes) !== -1){
								pass = false;
							}
						}
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
							success: $.proxy(this.onAjaxResponse, this, data)
						});
					}
				},

				getAjaxData:function(data){
					return data;
				},

				onAjaxResponse: function(request, data, response, jqXHR){
					var nodesData,
							requestedNodes,
							i,
							nodeId,
							nodeData;
					// we need to add nodes in the order they were requested
					// in case a child of child is treated first, adding it to nodeSource will produce a bug
					// requested nodes should be in the order of hierarchy
					nodesData = this.getAjaxData(data);
					requestedNodes = request.nodes.split(",");
					for (i = 0; i < requestedNodes.length; i++) {
						nodeId = requestedNodes[i];
						nodeData = nodesData[nodeId];
						if (nodeData){
							this.addDataToNodeSource(nodeData);
						}
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
						try{
							var nodeSource = this.getNode(nodeData.id);
							this.nodeStore._recBuildNodes( nodeSource, nodeSource.parents.concat(nodeSource), nodeData.nodes);
						}catch(e){
							// this is the case where we can't find the node in the nodeStore
							// this happens if we run the ajax request before having building the node store.
							// For example when the ajax call comes from the fetchChildren function
							// which happens on the beforeInit.tree event
							// in this case we don't add the node requested to the nodeStore but directly
							// to the dataSource object

							// so what we do here is just finding the node and adding his children
							var that = this;
							var fn = function (nodes, nodeId, children){
								for (var i = 0; i < nodes.length; i++) {
									var node = nodes[i];
									if (node.id === nodeId){
										node.nodes = children;
									}else if (node.hasChildren && node.nodes && node.nodes.length > 0 ){
										fn(node.nodes, nodeId, children);
									}
								}
							};
							if (this.dataSource && this.dataSource.tree && this.dataSource.tree.nodes) {
								fn(this.dataSource.tree.nodes, nodeData.id, nodeData.nodes);
							}

						}
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
					this.tree.container.trigger("afterChildrenLoaded.node", [this.tree, this]);
				}
			}
		}
	};
})(jQuery);

(function ($) {

	Vtree.plugins.checkbox = {
		tree:{
			defaults:{
				// list of checked node set initially
				initiallyChecked: [],
				// list of disabled checkbox set initially
				disabledCheckboxes: [],

				// if set to 'checkParents', checking a node will automatically checking his parents
				// if set to 'checkChildren', checking a node will automatically checking his children
				// if set to false, checking a node will not do anything else
				checkBehaviour: "checkParents",

				// if set to 'uncheckParents', unchecking a node will automatically unchecking his parents
				// if set to 'uncheckChildren', unchecking a node will automatically unchecking his children
				// if set to false, unchecking a node will not do anything else
				uncheckBehaviour: "uncheckChildren",

				// display or not the checkbox
				// if the checkbox is not displayed, it will put the node in a checked state
				// by adding a class described by 'checkedClass' on the li element
				// when clicking the li element
				displayCheckbox: true,

				// the class added to the node when it is checked
				checkedClass: "checked",

				// if set to 'disableParents', disabling a node will automatically disable his parents
				// if set to 'disableChildren', disabling a node will automatically disable his children
				disableBehaviour: "disableChildren",

				// the name of the class added to the element which has his checkbox disabled
				disabledClass: "disabled"
			},
			_fn:{
				build: function(){
					var that = this;
					// triggered by the ajax plugin when we load children from the server after opening a folder
					this.container.on("afterChildrenLoaded.node", function(e, tree, node){
						for (var i = 0; i < node.children.length; i++) {
							var child = node.children[i];
							// if the child was in the list "initiallyChecked", it needs to be checked now
							if ($.inArray(child.id, tree.initiallyChecked) !== -1){
								child.check(true);
							}
							if (that.checkBehaviour === "checkChildren" && node.isChecked){
								child.check(true);
							}
							if (that.uncheckBehaviour === "uncheckChildren" && !node.isChecked){
								child.uncheck(true);
							}
							if (that.disableBehaviour === "disableChildren" && node.isDisabled){
								child.disable();
							}
						}

					// after initialization, we set the initial checked nodes and initial disabled nodes
				}).on("onReady.tree", function(e, tree){
					tree.initiateCheckedNodes();
					tree.initiateDisabledNodes();
				});
				return this._call_prev();
			},

				// check the nodes that are in the list initiallyChecked
				initiateCheckedNodes:function(){
					var initiallyChecked = this.initiallyChecked,
					i,id, node;
					for (i=0, len = initiallyChecked.length; i < len; i++) {
						id = initiallyChecked[i];
						// don't throw an error if the node is not found
						try{ node = this.getNode(id); } catch(event){}
						if (typeof node != "undefined"){ node.check(true); }
					}
				},
				// disable nodes that are in the list disabledCheckboxes
				initiateDisabledNodes:function(){
					var disabledCheckboxes = this.disabledCheckboxes,
					i,id, node;
					for (i=0, len = disabledCheckboxes.length; i < len; i++) {
						id = disabledCheckboxes[i];
						try{ node = this.getNode(id); }catch(event){}
						if (typeof node != "undefined"){ node.disable(true); }

					}
				},
				_attachEvents: function(){
					var that  = this;
					if (this.displayCheckbox) {
						// when clicking a checkbox, we toggle his check state
						this.container.delegate("input[type=checkbox]","click",function(e){
							var node = that.getNode($(this).parents("li").attr("data-nodeid"));
							node.toggleCheck();
							e.stopPropagation();
						});
					}
					if (!this.displayCheckbox) {
						// if the checkboxes are not displayed
						// when clicking a node, we need to get the similar behaviour as if they were checkbox
						// so we toggle his check state
						this.container.delegate("li","click.node",function(e){
							var node = that.getNode($(this).attr("data-nodeid"));
							node.toggleCheck();
							e.stopPropagation();
						});
					}
					return this._call_prev();

				},
				// get list of checked nodes
				// i.e. the ones checked on the tree + the ones in the initiallyChecked list that are not yet loaded
				getCheckedNodes: function(){
					return this.nodeStore.getCheckedNodes();
				},

				_generateHTML: function(){
					var ul = this._call_prev();
					// this is to style the tree when the checkbox is not here
					if (!this.displayCheckbox){
						ul.addClass("noCheckbox");
					}
					return ul;
				}
			}
		},
		node:{
			defaults:{
				// check state of a node
				isChecked:false,
				// disable state of a node
				isDisabled: false
			},
			_fn:{
				// toggle his check state
				toggleCheck: function() {
					return (this.isChecked)? this.uncheck(): this.check();
				},
				// disable a node
				disable: function(){
					this.isDisabled = true;
					this.getEl().addClass(this.tree.disabledClass);
					if (this.tree.displayCheckbox) {
						this.getEl().find("input[type=checkbox]").eq(0).prop("disabled", "disabled");
					}
					if (this.tree.disableBehaviour === "disableParents" && this.parent) {
						// the parents as well
						this.parent.disable();
					}
					if (this.tree.disableBehaviour === "disableChildren") {
						// the children as well
						for (var i = 0; i < this.children.length; i++) {
							var child = this.children[i];
							child.disable();
						}
					}
				},

				// check a node
				// params: - triggeredAutomaticly.
				// 						type: boolean
				// 						desc: if true or not defined, this function is directly called from a user's action
				// 									if set to false, this is called by another action in the tree
				// 									(usually from a checked parent or child)
				// 									it will be passed to the event triggered "check.node"
				check: function(triggeredAutomaticly) {
					var auto = (typeof triggeredAutomaticly !== "undefined")? triggeredAutomaticly : false;
					this.isChecked = true;
					this.getEl().addClass(this.tree.checkedClass);
					// if the checkbox is displayed and this is triggered automatically
					// we also check the checkbox input
					// if it's triggered manually, the user will already have checked the checkbox
					if (this.tree.displayCheckbox && auto) {
						this.getEl().find("input[type=checkbox]").eq(0).prop("checked", true);
					}
					// parent can be undefined for the first level of the tree
					if (this.tree.checkBehaviour === "checkParents" && this.parent) {
						// we check recursively the parents
						this.parent.check(true);
					}

					if (this.tree.checkBehaviour === "checkChildren") {
						// we check recursively the children
						for (var i = 0; i < this.children.length; i++) {
							this.children[i].check(true);
						}
					}
					// fire check event
					this.tree.container.trigger("check.node", [this.tree, this, auto]);
				},

				// uncheck a node
				// params: - triggeredAutomaticly.
				// 						type: boolean
				// 						desc: if true or not defined, this function is directly called from a user's action
				// 									if set to false, this is called by another action in the tree
				// 									(usually from unchecking a parent or a child)
				// 									it will be passed to the event triggered "uncheck.node"
				uncheck: function(triggeredAutomaticly) {
					var auto = (typeof triggeredAutomaticly !== "undefined")? triggeredAutomaticly : false;
					this.isChecked = false;
					this.getEl().removeClass(this.tree.checkedClass);
					// if the checkbox is displayed and this is triggered automatically
					// we also uncheck the checkbox input
					// if it's triggered manually, the user will already have unchecked the checkbox
					if (this.tree.displayCheckbox && auto) {
						this.getEl().find("input[type=checkbox]").eq(0).prop("checked", false);
					}
					// parent can be undefined for the first level of the tree
					if (this.tree.uncheckBehaviour == "uncheckParents" && this.parent) {
						// we uncheck recursively the parents
						this.parent.uncheck(true);
					}

					// uncheck all children
					if (this.tree.uncheckBehaviour == "uncheckChildren") {
						for (var i = 0; i < this.children.length; i++) {
							// we uncheck recursively the children
							this.children[i].uncheck(true);
						}
					}
					// fire uncheck event
					this.tree.container.trigger("uncheck.node", [this.tree, this, triggeredAutomaticly]);

				},

				// basically add the checkbox state of the node
				getHTML: function(){
					var li = this._call_prev();
					// add the checked class
					if (this.isChecked) {
						li.addClass(this.tree.checkedClass);
					}
					// add the disabled class
					if (this.isDisabled) {
						li.addClass(this.tree.disabledClass);
					}
					//display the checkbox
					if(this.tree.displayCheckbox){
						li.children("a.title")
						.replaceWith(function(){
							return $("<label />").append($(this).contents());
						});

						li.children("label")
						.wrapInner("<span>")
						.prepend('<input type="checkbox"></input>')
						.find("input")
						.attr("checked", this.isChecked)
						.attr("disabled", this.isDisabled);
					}
					return li;
				},
				// check if one of his children or great children, etc... is checked
				// return true if it finds one descendant checked
				isOneDescendantChecked:function(){
					var res = false;
					if (!this.children) return res;
					for (var i = 0; i < this.children.length; i++) {
						var child = this.children[i];
						if (child.isChecked) {
							res = true;
							break;
						}
						res = child.isOneDescendantChecked();
						if (res) {
							break;
						}
					}
					return res;
				}

			}
		},
		nodeStore:{
			_fn:{
				// returned all checked nodes
				// desc: it returns nodes checked in the tree and also
				// the nodes that are in the list "initiallyChecked" that have not yet been loaded (when used with ajax plugin)
				getCheckedNodes: function(){
					var that = this,
					_rec_getCheckedNodes,
					loadedCheckedNodes,
					intiallyCheckedAndNotLoadedNodes;
					// find all nodes in the tree with a checked state
					_rec_getCheckedNodes = function(nodes){
						var checkedNodes = [];
						for (var i=0, len = nodes.length; i < len; i++) {
							node = nodes[i];
							if (node.isChecked) {
								checkedNodes.push(node);
							}
							if (node.hasChildren) {
								checkedNodes = checkedNodes.concat(_rec_getCheckedNodes(node.children));
							}
						}
						return checkedNodes;
					};
					// list of all checked nodes in the tree
					loadedCheckedNodes = _rec_getCheckedNodes(this.structure.tree.children);

					// list of all pseudo nodes in the list initiallyChecked
					// not yet loaded
					// for each node we should return an instance of a Node
					// as this is not possible we return for each of them
					// something like:
					// {
					// 	id: "nodeId",
					// 	loaded: false,
					//	initiallyChecked: true
					// }
					intiallyCheckedAndNotLoadedNodes = jQuery.map(jQuery.grep(this.tree.initiallyChecked, function(nodeId) {
						var pass = false;
						try{ 
							var node = that.getNode(nodeId); 
						}catch(e){
							// we can't find the node in the tree
							pass = true;
								}
								return pass;
						}), function(id){
							return {
								id:id,
								loaded: false,
								initiallyChecked: true
							};
						}
					);

					//concatenate the two lists
					return loadedCheckedNodes.concat(intiallyCheckedAndNotLoadedNodes);
				}
			}
		}
	};
})(jQuery);

(function ($) {
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
								tree.initiallyOpen = treeCookie.opened || [];
								tree.initiallyChecked = treeCookie.checked || [];
							}else{
								// we create the initial cookie
								VtreeCookie.trees[tree.id] = {
									opened: tree.initiallyOpen || [],
									checked: tree.initiallyChecked || []
								};
								Vtree.setCookie("Vtree", JSON.stringify(VtreeCookie), 7); // stored for a week
							}
						}else{
							// we create the initial cookie
							VtreeCookie = {trees:{}};
							// we create the initial cookie
							VtreeCookie.trees[tree.id] = {
								opened: tree.initiallyOpen || [],
								checked: tree.initiallyChecked || []
							};
							Vtree.setCookie("Vtree", JSON.stringify(VtreeCookie), 7); // stored for a week
						}
						// we trigger an event to tell that cookie values have been added
						tree.container.trigger("OpenNodesFromCookie.tree", [tree]);

					}).bind("afterOpen.node", function(e, tree, node){

						var VtreeCookie = JSON.parse(Vtree.readCookie("Vtree"));
						var treeCookie = VtreeCookie.trees[tree.id];
						if ($.inArray(node.id, treeCookie.opened) == -1){
							treeCookie.opened.push(node.id);
						}
						Vtree.setCookie("Vtree", JSON.stringify(VtreeCookie), 7); // stored for a week

					}).bind("beforeClose.node", function(e, tree, node){

						var VtreeCookie = JSON.parse(Vtree.readCookie("Vtree"));
						var treeCookie = VtreeCookie.trees[tree.id];
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

					}).bind("check.node", function(e, tree, node){

						var VtreeCookie = JSON.parse(Vtree.readCookie("Vtree"));
						var treeCookie = VtreeCookie.trees[tree.id];

						if ($.inArray(node.id, treeCookie.checked) == -1){
							treeCookie.checked.push(node.id);
						}

						Vtree.setCookie("Vtree", JSON.stringify(VtreeCookie), 7); // stored for a week

					}).bind("uncheck.node", function(e, tree, node){

						var VtreeCookie = JSON.parse(Vtree.readCookie("Vtree"));
						var treeCookie = VtreeCookie.trees[tree.id];
						treeCookie.checked = jQuery.grep(treeCookie.checked, function(value) {
							return (value != node.id);
						});
						Vtree.setCookie("Vtree", JSON.stringify(VtreeCookie), 7); // stored for a week
					});

					return this._call_prev();
				},

				reset: function(){
					var cookie = Vtree.readCookie("Vtree");
					if (cookie) {
						VtreeCookie = JSON.parse(cookie);
						var treeCookie = VtreeCookie.trees[this.id];
						if (treeCookie){
							VtreeCookie.trees[this.id] = {
								opened: tree.initiallyOpen || [],
								checked: tree.initiallyChecked || []
							};
							console.log("cookie reset!")
							Vtree.setCookie("Vtree", JSON.stringify(VtreeCookie), 7); // stored for a week
						}
					}
					return this._call_prev();

				}
			}
		}
	};
})(jQuery);

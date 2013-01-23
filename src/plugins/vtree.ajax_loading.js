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
						try{
							nodeSource = this.getNode(nodeData.id);
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
									node = nodes[i];
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

				}
			}
		}
	};


})(jQuery);
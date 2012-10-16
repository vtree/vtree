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
						var opened = tree.initially_open;

						if (opened.length === 0) {
							tree.continueBuilding();
						}else{
							tree.getChildrenNodes(opened);
						}
					})

					// in the case we use ajax without the cookie plugin, we don't need to wait for the ajax response to
					// continue the tree building
					.on("beforeInit.tree", function(e, tree){
						if ($.inArray("cookie", tree.plugins) == -1) { // the cookie plugin is not in tree
							var opened = tree.initially_open;
							if (opened.length) {
								tree.getChildrenNodes(opened);
							}else{
								tree.continueBuilding();
							}
						}
					});


					return this._call_prev();
				},

				getChildrenNodes:function(nodes){
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
				},

				getAjaxData:function(data){
					return data;
				},

				onAjaxResponse: function(data, response, jqXHR){
					nodesData = this.getAjaxData(data);
					for (var nodeId in nodesData) {
						var nodeData = nodesData[nodeId];
						this.addDataToNodeSource(nodeData);
					}
					this.continueBuilding();
				},

				addDataToNodeSource: function(nodeData){
					findNode = function(nodes, id){
						for (var i=0, len = nodes.length; i < len; i++) {
							var node = nodes[i];
							if (node.id == id) {
								return node;
							}else if (node.nodes && node.nodes.length) {
								var rec = findNode(nodes[i].nodes, nodeData.id);
								if (rec) {return rec;}
							}
						}
					};
					// if a child of the nodeData have the attribute 'nodes' empty (means without children),
					// we need to remove it from the object
					// if not removed, it could overwrite the children of the child... is that clear enough?! :/
					for (var i = 0; i < nodeData.nodes.length; i++) {
						var child = nodeData.nodes[i];
						var greatChildren = child.nodes;
						if(greatChildren && greatChildren.constructor==Array && greatChildren.length===0){
							delete child.nodes;
						}
					}

					var nodeSource = findNode(this.dataSource.tree.nodes, nodeData.id);
					nodeSource = $.extend(true, nodeSource, nodeData);
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
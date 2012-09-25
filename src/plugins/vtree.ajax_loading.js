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
					this.container.on("beforeInit.tree", function(e, tree){
						
						if (!that.ajaxUrl) {
							throw "you need to specify the ajaxUrl setting."
						}
						
						if (that.dataSource.tree){
							that.continueBuilding();
						}else{
							var openedNodes = (typeof tree.getOpenedNodes == "function")? tree.getOpenedNodes():tree.initially_open;
							console.log("openedNodes:",openedNodes.join(","))
							
							that.container.append("<p class='loading'>Loading tree...</p>")
							var data = $.extend(true, tree.ajaxParameters , {
								action:"getTree",
								tree: tree.id,
								initially_open: openedNodes.join(",")
							});
							$.ajax({
								type: "GET",
								url: that.ajaxUrl,
								dataType: 'json',
								data: data,	
								success: $.proxy(that.onAjaxResponse, that)
							})
						}
					})
					
					.on("beforeOpen.node", function(e, tree, node){
						if (node.hasChildren && !node.children.length && (!node.hasRenderedChildren || (node.hasRenderedChildren && that.forceAjaxReload))) {
							var data = $.extend(true, this.ajaxParameters , {
								action:"getChildren",
								nodes: node.id
							});
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
					
					.on("afterClose.node", function(e, tree, node){
						if (that.forceAjaxReload) {
							node.getEl().children("ul.children").remove()
						}
					})
					
					return this._call_prev();
				},
				
				getAjaxData:function(data){
					return data
				},
				onAjaxResponse: function(data, response, jqXHR){
					this.dataSource = this.getAjaxData(data);
					this.continueBuilding();
				}
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
	

})(jQuery);
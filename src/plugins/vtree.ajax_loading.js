(function ($) {

	Vtree.plugins.ajax_loading = {
		tree:{
			defaults:{
				ajaxUrl: "",
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
						$.ajax({
							type: "GET",
							url: that.ajaxUrl,
							dataType: 'json',
							data: {
								action:"getTree",
								tree: tree.id
							},	
							success: $.proxy(that.onAjaxResponse, that)
						})

					})
					
					.on("beforeOpen.node", function(e, tree, node){
						if (!node.hasRenderedChildren || (node.hasRenderedChildren && that.forceAjaxReload)) {
							$.ajax({
								type: "GET",
								url: that.ajaxUrl,
								dataType: 'json',
								data: {
									action:"getChildren",
									nodes: [node.id]
								},	
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
				onAjaxResponse: function(data, response, jqXHR){
					var that = this;
					var fn = function(){
						that.dataSource = data;
						that.continueBuilding();
					}
					setTimeout(fn, 0);
					
				}
			}
		},
		node:{
			defaults:{
							
			},
			_fn:{
				onAjaxResponse: function(data, response, jqXHR){					
					var that = this;
					var fn = function(){
						if (typeof data[that.id] == "undefined") {
							throw "ajax response didn;t send back node with id:"+ that.id
						}
						that.nodeStore._recBuildNodes( that, that.parents, data[that.id].nodes);
						that.continueOpening();
					}
					setTimeout(fn, 0);
					
				}
			}
		}
	}
	

})(jQuery);
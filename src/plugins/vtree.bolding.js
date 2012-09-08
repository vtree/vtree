(function ($) {

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
					// fire bold event                                          
					this.tree.container.trigger("bold.node", [this.tree, this]);
					debugger
					this.isBold = true;
					this.getEl().addClass('bold');
					// bold parents
					for (var i=0, parents = this.parents, len = this.parents.length; i < len; i++) {
						var parent = parents[i];
						parent.isBold = true;
						parent.getEl().addClass("bold");
					}	
			    },
				unbold: function() {
					// bolding behaviour: 
					// unbolding a node unbolds all his children but doesn't affect parents state
					// fire bold event
					this.tree.container.trigger("unbold.node", [this.tree, this]);
					
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
	

})(jQuery);
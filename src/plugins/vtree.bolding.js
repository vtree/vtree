(function ($) {

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


})(jQuery);
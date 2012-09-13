(function ($) {

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
	

})(jQuery);
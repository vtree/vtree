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
							if (that.checkBehaviour === "checkChildren" && node.isChecked){
								child.check(true);
							}
							if (that.uncheckBehaviour === "uncheckChildren" && !node.isChecked){
								child.uncheck(true);
							}
							// if the child was in the list "initiallyChecked", it needs to be checked now
							if ($.inArray(child.id, tree.initiallyChecked) !== -1){
								child.check(true);
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
					intiallyCheckedAndNotLoadedNodes = jQuery.grep(this.tree.initiallyChecked, function(nodeId) {
						var pass = false;
						try{ var node = that.getNode(nodeId); }catch(e){
							// we can't find the node in the tree
							pass = true;
						}
						return pass;
					}).map(function(id){
						return {
							id:id,
							loaded: false,
							initiallyChecked: true
						};
					});

					//concatenate the two lists
					return loadedCheckedNodes.concat(intiallyCheckedAndNotLoadedNodes);
				}
			}
		}
	};
})(jQuery);

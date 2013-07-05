
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


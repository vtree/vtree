(function ($) {

	Vtree.plugins.YOU_PLUGIN_NAME = {
		tree:{
			defaults:{
				// your default variables for the tree class
			},
			_fn:{
				// your defautl functions for the tree class
				
				// remember: if you overwrite an existing function
				// you must keep the same interface of the function
				//  (same arguments and returning the same object)
				// if several plugins have the same function name,
				// a function "this._call_prev()" can be called in order
				// to call the other functions with the same name.
				// for an example check the function getHTML from the "core" plugin 
				// and the getHTML from the "checkbox" plugin. 
			}
		},
		node:{
			defaults:{
				// your default variables for the node class
			
			},
			_fn:{
				// your default functions for the node class
			
			}
		},
		nodeStore:{
			defaults:{
				// your default variables for the nodeStore class
			
			},
			_fn:{
				// your default functions for the nodeStore class
				
			}
		}
	}
	

})(jQuery);
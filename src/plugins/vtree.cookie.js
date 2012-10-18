(function ($) {
	Vtree.setCookie = function(cookieName,cookieValue,nDays) {
		var today = new Date();
		var expire = new Date();
		if (nDays===null || nDays===0) nDays=1;
		expire.setTime(today.getTime() + 3600000*24*nDays);
		document.cookie = cookieName+"="+escape(cookieValue)+ ";expires="+expire.toGMTString();
	};
	Vtree.readCookie = function(cookieName) {
		var theCookie=" "+document.cookie;
		var ind=theCookie.indexOf(" "+cookieName+"=");
		if (ind==-1) ind=theCookie.indexOf(";"+cookieName+"=");
		if (ind===-1 || cookieName==="") return "";
		var ind1=theCookie.indexOf(";",ind+1);
		if (ind1==-1) ind1=theCookie.length;
		return unescape(theCookie.substring(ind+cookieName.length+2,ind1));
	};
	Vtree.plugins.cookie = {
		tree:{
			_fn:{

				build: function(){
					this.container.on("beforeInit.tree", function(e, tree){
						var VtreeCookie;
						var cookie = Vtree.readCookie("Vtree");
						if (cookie) {
							VtreeCookie = JSON.parse(cookie);
							var treeCookie = VtreeCookie.trees[tree.id];
							if (treeCookie){
								// we get the cookie
								tree.initially_open = treeCookie.opened || [];
								tree.initially_checked = treeCookie.checked || [];
								tree.initially_bold = treeCookie.bold || [];
								tree.container.trigger("OpenNodesFromCookie.tree", [tree]);

							}else{
								// we create the initial cookie
								VtreeCookie.trees[tree.id] = {
									opened: tree.initially_open || [],
									checked: tree.initially_checked || [],
									bold: tree.initially_bold || []
								};
								Vtree.setCookie("Vtree", JSON.stringify(VtreeCookie), 7); // stored for a week
							}
						}else{
							// we create the initial cookie
							VtreeCookie = {trees:{}};
							// we create the initial cookie
							VtreeCookie.trees[tree.id] = {
								opened: tree.initially_open || [],
								checked: tree.initially_checked || [],
								bold: tree.initially_bold || []
							};
							Vtree.setCookie("Vtree", JSON.stringify(VtreeCookie), 7); // stored for a week
							// this is for the tree to continue building when used in conjonction with the ajax plugin
							tree.container.trigger("OpenNodesFromCookie.tree", [tree]);

						}

					})

					.bind("afterOpen.node", function(e, tree, node){
						var VtreeCookie = JSON.parse(Vtree.readCookie("Vtree"));
						var treeCookie = VtreeCookie.trees[tree.id];
						if ($.inArray(node.id, treeCookie.opened) == -1){
							treeCookie.opened.push(node.id);
						}
						Vtree.setCookie("Vtree", JSON.stringify(VtreeCookie), 7); // stored for a week

					})

					.bind("beforeClose.node", function(e, tree, node){
						var VtreeCookie = JSON.parse(Vtree.readCookie("Vtree"));
						var treeCookie = VtreeCookie.trees[tree.id];
						if (typeof node.isOneDescendantBold === "function" && node.isOneDescendantBold()) {
							return; // when one of his children is bold, they should remain open when reloading
						}
						if (typeof node.isOneDescendantChecked === "function" && node.isOneDescendantChecked()) {
							return; // when one of his children is checked, they should remain open when reloading
						}
						treeCookie.opened = jQuery.grep(treeCookie.opened, function(value) {
							var getOpenedChildrenIds = function(node){
								var childrenIds = [];
								if (node.hasChildren && node.hasVisibleChildren){
									//check that a child wasn't opened
									for (var i=0, len = node.children.length; i < len; i++) {
										var child = node.children[i];
										if (child.isOpen) {
											childrenIds.push(child.id);
											childrenIds = childrenIds.concat(getOpenedChildrenIds(child));
										}

									}
								}
								return childrenIds;
							};
							return (value != node.id && $.inArray(value, getOpenedChildrenIds(node)) == -1);
						});
						Vtree.setCookie("Vtree",  JSON.stringify(VtreeCookie), 7); // stored for a week
					})

					.bind("check.node", function(e, tree, node){
						var VtreeCookie = JSON.parse(Vtree.readCookie("Vtree"));
						var treeCookie = VtreeCookie.trees[tree.id];

						if ($.inArray(node.id, treeCookie.checked) == -1){
							treeCookie.checked.push(node.id);
						}
						for (var i=0, len = node.parents.length; i < len; i++) {
							var parent = node.parents[i];
							if ($.inArray(parent.id, treeCookie.checked) == -1 && parent.id != "root"){
								treeCookie.checked.push(parent.id);
							}
						}
						Vtree.setCookie("Vtree", JSON.stringify(VtreeCookie), 7); // stored for a week
					})

					.bind("uncheck.node", function(e, tree, node){
						var VtreeCookie = JSON.parse(Vtree.readCookie("Vtree"));
						var treeCookie = VtreeCookie.trees[tree.id];
						var getCheckedChildrenIds = function(node){
							var childrenIds = [];
							if (node.hasChildren && node.hasVisibleChildren){
								//check that a child wasn't opened
								for (var i=0, len = node.children.length; i < len; i++) {
									var child = node.children[i];
									if (child.isChecked) {
										childrenIds.push(child.id);
										childrenIds = childrenIds.concat(getCheckedChildrenIds(child));
									}

								}
							}
							return childrenIds;
						};
						treeCookie.checked = jQuery.grep(treeCookie.checked, function(value) {
							return (value != node.id && $.inArray(value, getCheckedChildrenIds(node)) == -1);
						});
						Vtree.setCookie("Vtree", JSON.stringify(VtreeCookie), 7); // stored for a week
					})

					.bind("bold.node", function(e, tree, node){
						var VtreeCookie = JSON.parse(Vtree.readCookie("Vtree"));
						var treeCookie = VtreeCookie.trees[tree.id];

						if ($.inArray(node.id, treeCookie.bold) == -1){
							treeCookie.bold.push(node.id);
						}
						if (tree.cascading_bold) {
							for (var i=0, len = node.parents.length; i < len; i++) {
								var parent = node.parents[i];
								if ($.inArray(parent.id, treeCookie.bold) == -1 && parent.id != "root"){
									treeCookie.bold.push(parent.id);
								}
							}
						}
						Vtree.setCookie("Vtree", JSON.stringify(VtreeCookie), 7); // stored for a week
					})

					.bind("unbold.node", function(e, tree, node){
						var VtreeCookie = JSON.parse(Vtree.readCookie("Vtree"));
						var treeCookie = VtreeCookie.trees[tree.id];
						treeCookie.bold = jQuery.grep(treeCookie.bold, function(value) {
							var getBoldChildrenIds = function(node){
								var childrenIds = [];
								if (node.hasChildren && node.hasVisibleChildren){
									//check that a child wasn't bold
									for (var i=0, len = node.children.length; i < len; i++) {
										var child = node.children[i];
										if (child.isBold) {
											childrenIds.push(child.id);
											childrenIds = childrenIds.concat(getBoldChildrenIds(child));
										}

									}
								}
								return childrenIds;
							};
							if (!tree.cascading_bold) {
								return (value != node.id);
							} else{
								return (value != node.id && $.inArray(value, getBoldChildrenIds(node)) == -1);
							}
						});
						Vtree.setCookie("Vtree", JSON.stringify(VtreeCookie), 7); // stored for a week
					});
					return this._call_prev();
				}
			}
		}
	};


})(jQuery);
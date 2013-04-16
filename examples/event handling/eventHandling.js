var jsonSource = {
	tree:{
		id: "my Desktop",
		nodes:[{
			id:"mydesktop_root",
			title: "my desktop",
			description: "",
			icon: "/icon.png",
			hasChildren: true,
			nodes:[{
				id:"edit_profile",
				title: "Edit profile",
				description: "edit your profile",
				icon: "/icon.png",
				hasChildren: false
			}]
		},{
			id:"inbox",
			title: "inbox",
			description: "",
			icon: "/icon.png",
			hasChildren: false
		}
		]
	}
};

var container = jQuery("#treeContainer")
var settings = {
	container: container,
	dataSource: jsonSource
}

var fn = function(event, tree, node){
	if (tree && node) {
		console.log(event.type, tree.id, node.id);
	} else if (tree){
		console.log(event.type, tree.id);
	}else{
		console.log(event.type);
	}

}


container.bind("click.node", fn)
	.bind("contextmenu.node", fn)
	.bind("dblclick.node", fn)
	// .bind("beforeClose.node", fn)
	// .bind("beforeOpen.node", fn)
	// .bind("afterOpen.node", fn)
	// .bind("afterClose.node", fn)
	// .bind("beforeInit.tree", fn)
	// .bind("onReady.tree", fn)
	// .bind("onLoaded.tree", fn)
	// .bind("focus.tree", fn)
	// .bind("unfocus.tree", fn)
	// .bind("rendered.tree", fn)
	// .bind("hover.node", fn)

var tree = Vtree.create(settings)

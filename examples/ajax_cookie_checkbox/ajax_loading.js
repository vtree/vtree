var dataSource = {
	tree:{
		id:"ajax_cookie_checkbox_tree",
		nodes:[{
			id:"xtest_1",
			title: "xtitle_1",
			description: "desc",
			iconClass: "customFolder",
			customClass: "title",
			hasChildren: true,
			children:[]
		},
		{
			id:"test_4",
			title: "title_4",
			description: "desc",
			iconClass: "customFolder",
			hasChildren: false
		}
		]
	}
};
var childrenJsonSource = {
		"atest_3":{
			id:"atest_3",
			nodes:[{
				id:"test_4",
				title: "title_4",
				description: "desc",
				iconClass: "customFolder",
				hasChildren: false
			}]
		},
		"xtest_1": {
			id: "xtest_1",
			nodes:[{
				id:"ptest_2",
				title: "ptitle_2",
				description: "desc",
				iconClass: "customFolder",
				hasChildren: true,
				nodes:[	]
			}]
		},
		"ptest_2":{
			id:"ptest_2",
			nodes:[{
				id:"atest_3",
				title: "atitle_3",
				description: "desc",
				iconClass: "customFolder",
				hasChildren: true
			}]
		}
};





//Mock ajax function
jQuery.ajax = function (param) {
	console.log("mock ajax:",param);
	mockAjaxOptions = param;
	if (param.data.action == "getChildren") {
		data = {};
		nodesRequested = param.data.nodes.split(",");
		for (var i = 0; i < nodesRequested.length; i++) {
			nodeId = nodesRequested[i];
			nodeChildren = childrenJsonSource[nodeId];
			data[nodeId] = nodeChildren;
		}
	}
    //call success handler
	setTimeout(function() {
		param.success(data, "textStatus", "jqXHR");
	}, 1000);
};

var container = jQuery("#treeContainer");

var settings = {
	container: container,
	ajaxUrl: "/ajaxUrl",
	plugins: ["ajax_loading", "checkbox", "cookie"],
	dataSource: dataSource,
	// initiallyChecked: ["xtest_1", "ptest_2", "atest_3"],
	checkBehaviour: "checkChildren",
	uncheckBehaviour: "uncheckChildren"
};


container.bind("check.node", function(e,tree,node, automaticlyTriggered){
	console.log("node checked", node.id, "automaticlyTriggered:",automaticlyTriggered );
	console.log("all checked nodes:",tree.getCheckedNodes().map(function(i,e){return i.id}));

});

container.bind("uncheck.node", function(e,tree,node, automaticlyTriggered){
	console.log("node unchecked", node.id, "automaticlyTriggered:",automaticlyTriggered);
	console.log("all checked nodes:",tree.getCheckedNodes().map(function(i,e){return i.id}));

});

var tree = Vtree.create(settings);



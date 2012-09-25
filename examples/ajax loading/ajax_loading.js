parents = {
	response:{
		tree:{
			id:"root",
			nodes:[{
				id:"test_1",
				title: "title_1",
				description: "desc",
				iconClass: "customFolder",
				customClass: "title",
				hasChildren: true,
				nodes:[
				]
			},
			{
				id:"test_4",
				title: "title_4",
				description: "desc",
				iconClass: "customFolder",
				hasChildren: true,
				nodes:[
				]
			}
			]
		}
	}
}


childrenJsonSource = {
	response:{
		"test_1": {
			id: "test_1",
			nodes:[{
				id:"test_2",
				title: "title_2",
				description: "desc",
				iconClass: "customFolder",
				hasChildren: false,
				nodes:[	]
			},
			{
				id:"test_3",
				title: "title_3",
				description: "desc",
				iconClass: "customFolder",
				hasChildren: false
			}]
		},
		"test_4":{
			id:"test_4",
			nodes:[{
				id:"test_5",
				title: "title_5",
				description: "desc",
				iconClass: "customFolder",
				hasChildren: false
			}]
		}
	}
}




//Mock ajax function
// jQuery.ajax = function (param) {
// 	console.log("mock ajax:",param)
//     _mockAjaxOptions = param;
// 	if (param.data.action == "getTree") {
// 		data = parents
// 	}else if (param.data.action == "getChildren") {
// 		data = childrenJsonSource
// 	}
//     //call success handler
// 	setTimeout(function() {
//     	param.success(data, "textStatus", "jqXHR");
// 	}, 1000);
// };


var settings = {
	container: jQuery("#treeContainer"),
	ajaxUrl: "/ajaxUrl",
	ajaxParameters: {
		defaultParam: "testing",
		awesomeness: true
	},
	getAjaxData:function(data){
		return data.response;
	},
	plugins: ["ajax_loading"],
	id:"root",
	initially_open: ["test_1", "test_4"]
}



var tree = Vtree.create(settings);



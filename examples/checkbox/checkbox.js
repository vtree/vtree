

jsonSource = {
	tree:{
		id:"checkboxTree",
		nodes:[{
			id:"test_1",
			title: "title_1",
			description: "desc",
			customClass: "title",
			hasChildren: true,
			nodes:[{
				id:"test_2",
				title: "title_2",
				description: "desc",
				iconClass: "customFolder",
				hasChildren: true,
				nodes:[{
					id:"test_3",
					title: "title_3",
					description: "desc",
					iconClass: "customFolder",
					hasChildren: false,
					nodes:[]
				}]
			}]
		},
		{
			id:"test_4",
			title: "title_4",
			description: "desc",
			hasChildren: true,
			nodes:[{
				id:"test_5",
				title: "title_5",
				description: "desc",
				iconClass: "customFolder",
				hasChildren: false
			}]
		}
		]
	}
};

var container = jQuery("#treeContainer");
var settings = {
	container: container,
	disabledCheckboxes: ["test_3"],
	// initiallyChecked: ["test_4", "test_5"],
	initiallyOpen: ["test_1", "test_2"],
	dataSource:jsonSource,
	plugins:["checkbox"],
	disableBehaviour:"disableParents",
	uncheckBehaviour: "uncheckChildren",
};

container.bind("check.node", function(e,tree,node, automaticlyTriggered){
	console.log("node checked", node.id, "automaticlyTriggered:",automaticlyTriggered );
	console.log("all checked nodes:",tree.getCheckedNodes().map(function(i,e){return i.id}));

});

container.bind("uncheck.node", function(e,tree,node, automaticlyTriggered){
	console.log("node unchecked", node.id, "automaticlyTriggered:",automaticlyTriggered);
	console.log("all checked nodes:",tree.getCheckedNodes().map(function(i,e){return i.id}));

})

// var start = (new Date).getTime();

var tree = Vtree.create(settings );

// var diff = (new Date).getTime() - start;

// console.log("diff:",diff);

// var a = Vtree.getTree(container).nodeStore.structure.id2NodeMap;
// var b = 0 ; for (var i in a){b++;}
// console.log("nb nodes:",b);



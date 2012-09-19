jsonSource = {
	tree:{
		id:"root",
		nodes:[{
			id:"test_1",
			title: "title_1",
			description: "desc",
			data:{
				href: "test"
			},
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
				hasChildren: false,
			}]
		}
		]
	}
}

var container = jQuery("#treeContainer")
var settings = {
	container: container,
	initially_bold: ["test_5"],
	dataSource:jsonSource, 
	plugins:["bolding"]
}

container.bind("bold.node", function(e,tree,node){
	console.log("node bold", node.id)
	console.log("get all bolded nodes:",tree.getBoldNodes())
	
})

container.bind("unbold.node", function(e,tree,node){
	console.log("node unbold", node.id)
	console.log("get all bolded nodes:",tree.getBoldNodes())
})


var tree = Vtree.create(settings );




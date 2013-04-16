

//jsonSource = generateJson(3, 4)
jsonSource = {
	tree:{
		id:"root",
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
				hasChildren: false,
			}]
		}
		]
	}
}
var container = jQuery("#treeContainer")
var settings = {
	container: container,
	//disabledCheckboxes: ["test_2"],
	//initiallyChecked: ["test_5"],
	dataSource:jsonSource,
	plugins:["checkbox", "cookie"],
	id:"cookieTree"
}

var start = (new Date).getTime();

var tree = Vtree.create(settings );

var diff = (new Date).getTime() - start;

console.log("diff:",diff)

var a = tree.nodeStore.structure.id2NodeMap
var b = 0 ; for (var i in a){b++}
console.log("nb nodes:",b)



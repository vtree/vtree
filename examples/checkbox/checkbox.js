function getRandomInt (min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}
 
var parentOrLeaf = function(){
	return (getRandomParentNode(0,1))? "parentNode": "leafNode";
}


var generateNode = function(isLeaf, nodes, id){
	var node;
	if (isLeaf) {
		node = {
			id:"leaf_"+id,
			path:"leaf_"+id,
			title: "leaf_"+id,
			description: "desc",
			iconClass: "customFolder",
			hasChildren: false
		}
	}else{
		node = {
			id:"test_"+id,
			path: "path"+id,
			title: "title_"+id,
			description: "desc",
			iconClass: "customFolder",
			hasChildren: true,
			nodes:nodes
		}	
	}
	
	return node;
}

generateSiblings = function(siblingsMaxNb, depth, level){
	var nbSiblings = getRandomInt(siblingsMaxNb, siblingsMaxNb)
	var nodes = []
	for (var i=0, nbSiblings; i < nbSiblings; i++) {		
		if (depth == level) {
			nodes.push(generateNode(true, [], getRandomInt(0,100000) ))
		}else{
			nodes.push(generateNode(false,generateSiblings(siblingsMaxNb, depth, level+1), getRandomInt(0,100000) ))
		}
	}	
	return nodes
}

generateJson = function(siblingsMaxNb, depth ){
	var nodes = generateSiblings(siblingsMaxNb, depth, 0)
	return json = {
		tree:{
			id:"root"+getRandomInt(0,100).toString(),
			nodes:nodes
		}
	}
	
}

//jsonSource = generateJson(3, 4)
jsonSource = {
	tree:{
		id:"root",
		nodes:[{
			id:"test_1",
			path: "path1",
			title: "title_1",
			description: "desc",
			iconClass: "customFolder",
			hasChildren: true,
			nodes:[{
				id:"test_2",
				path: "path2",
				title: "title_2",
				description: "desc",
				iconClass: "customFolder",
				hasChildren: true,
				nodes:[{
					id:"test_3",
					path: "path3",
					title: "title_3",
					description: "desc",
					iconClass: "customFolder",
					hasChildren: false,
				}]
			}]
		},
		{
			id:"test_4",
			path: "path4",
			title: "title_4",
			description: "desc",
			iconClass: "customFolder",
			hasChildren: true,
			nodes:[{
				id:"test_5",
				path: "path5",
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
	disabled_checkboxes: ["test_2"],
	initially_checked: ["test_5"],
	dataSource:jsonSource, 
	plugins:["checkbox"]
}

container.bind("check.node", function(e,tree,node){
	console.log("node checked", node.id)
})

container.bind("uncheck.node", function(e,tree,node){
	console.log("node unchecked", node.id)
})

var start = (new Date).getTime();

var tree = Vtree.create(settings );

var diff = (new Date).getTime() - start;

console.log("diff:",diff)

var a = Vtree.getTree(container).nodeStore.structure.id2NodeMap
var b = 0 ; for (var i in a){b++}
console.log("nb nodes:",b)



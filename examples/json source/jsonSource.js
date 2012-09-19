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
			title: "leaf_"+id,
			description: "desc",
			iconClass: "customFolder",
			hasChildren: false
		}
	}else{
		node = {
			id:"test_"+id,
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

// generate a random json object with 5 nodes per level and 2 level deep
// jsonSource = generateJson(5, 2)

// or directly
jsonSource = {
	tree:{
		id:"root",
		nodes:[{
			id:"test_1",
			title: "title_1",
			description: "title_1",
			customClass: "title",
			data:{
				href: "test"
			},
			hasChildren: true,
			nodes:[{
				id:"test_2",
				title: "title_2",
				description: "title_2",
				iconClass: "default",
				hasChildren: true,
				nodes:[{
					id:"test_3",
					title: "title_3",
					description: "title_3",
					iconClass: "default",
					hasChildren: true,
					nodes:[{
						id:"test_9",
						title: "title_9",
						description: "title_9",
						iconClass: "customFolder",
						hasChildren: false,
						nodes:[]
						}
					]},
					{
					id:"test_6",
					title: "title_6",
					description: "title_6",
					hasChildren: true,
					nodes:[{
						id:"test_7",
						title: "title_7",
						description: "title_7",
						hasChildren: false,
						nodes:[]
						}
					]},
					{
						id:"test_8",
						title: "title_8",
						description: "title_8",
						iconClass: "customFolder",
						hasChildren: false,
						nodes:[]
					},
					{
						id:"test_9",
						title: "title_9",
						description: "title_9",
						hasChildren: false,
						nodes:[]
					}]
			}]
			}
	
			,{
						id:"test_4",
						title: "title_4",
						description: "title_4",
						hasChildren: true,
						iconPath:{
							open:"../images/icon_folder_open_16.png",
							close:"../images/icon_folder_closed_16.png"
						},
						nodes:[{
							id:"test_5",
							title: "title_5",
							description: "title_5",
							iconClass: "customFolder",
							hasChildren: false,
						}]
					}
	]}
}



//jsonSource = generateJson(10, 3)


var container = jQuery("#treeContainer")
//var container2 = jQuery("#treeContainer2")


var settings = {
	container: container,
	initially_open:["test_1", "test_4"],
	dataSource: jsonSource
}

// var settings2 = {
// 	container: container2,
// 	dataSource: jsonSourc2
// }


//starting timer
//var start = (new Date).getTime();
	var tree = Vtree.create(settings);

//stop timer
// var diff = (new Date).getTime() - start;
// 
// console.log("timer:",diff)
// 
// var a = Vtree.getTree(container).nodeStore.structure.id2NodeMap
// var b = 0 ; for (var i in a){b++}
// console.log("nb nodes rendered:",b)


// //starting timer
// var start = (new Date).getTime();
// 
// 	var tree2 = Vtree.create(settings2);
// 
// //stop timer
// var diff = (new Date).getTime() - start;
// 
// console.log("timer:",diff)
// 
// var a = Vtree.getTree(container2).nodeStore.structure.id2NodeMap
// var b = 0 ; for (var i in a){b++}
// console.log("nb nodes rendered:",b)
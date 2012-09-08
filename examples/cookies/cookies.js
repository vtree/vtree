

//jsonSource = generateJson(3, 4)
jsonSource = {
	tree:{
		id:"root",
		nodes:[{
			id:"test_1",
			title: "title_1",
			description: "desc",
			customClass: "title",
			customHTML: "<span>23 children</span>",
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
	//disabled_checkboxes: ["test_2"],
	//initially_checked: ["test_5"],
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


function readCookie(cookieName) {
 var theCookie=" "+document.cookie;
 var ind=theCookie.indexOf(" "+cookieName+"=");
 if (ind==-1) ind=theCookie.indexOf(";"+cookieName+"=");
 if (ind==-1 || cookieName=="") return "";
 var ind1=theCookie.indexOf(";",ind+1);
 if (ind1==-1) ind1=theCookie.length; 
 return unescape(theCookie.substring(ind+cookieName.length+2,ind1));
}

function setCookie(cookieName,cookieValue,nDays) {
	var today = new Date();
	var expire = new Date();
	if (nDays==null || nDays==0) nDays=1;
	expire.setTime(today.getTime() + 3600000*24*nDays);
	document.cookie = cookieName+"="+escape(cookieValue)
	+ ";expires="+expire.toGMTString();
};

(function ($) {	
	Vtree.Node = function(settings){
		Vtree.init.apply(this, [settings, "node"])
		
		//load settings passed in param
		$.extend(this, settings)
	};
	
	
Vtree.plugins.defaults.core.node = {
		defaults:{
			id                  : 0,
			el                  : null,
			tree                : null,
			isOpen              : false,
			title               : "",
			description         : "",
			customClass			: "",
			hasVisibleChildren  : false,
			hasRenderedChildren : false,
			hasChildren         : false,
			parent              : null,
			parents             : [],
			children            : [],
			iconClass           : "",
			iconPath            : {open:"", close:""},
			isSynchro           : false,
			customHTML			: ""
		},
		_fn:{
			open: function (){
				// if it has children and there are not visible on the page
				if (this.hasChildren && !this.hasVisibleChildren) {
					// fires a "beforeOpen" event
					this.tree.container.trigger("beforeOpen.node", [this.tree, this])
					// toggle loading icon
					this.toggleLoading();
					
					var el = this.getEl().addClass("open");
					if (this.iconPath.open) {
						el.find("img")[0].src = this.iconPath.open;
					}
					if (!this.tree.asynchronous){
						this.continueOpening()
					}
				
				}	
				return this;		
			},
			
			continueOpening: function(){
				// change open state variable
				this.isOpen = true;				
				// node is not anymore synchronised with html
				this.isSynchro = false;
				// if it has children but there are not rendered
				if(this.hasChildren && !this.hasRenderedChildren){
					// we build the children
					this.getEl().append(this._getChildrenHTML())
					this.hasRenderedChildren = true;
				}
				this.hasVisibleChildren = true;	
				// toggle loading icon
				this.toggleLoading()
				// fires a "afterOpen" event
				this.tree.container.trigger("afterOpen.node", [this.tree, this])	
			},
			
			close: function (){
				// if there is any children and there are visible
				if (this.hasChildren && this.hasVisibleChildren) {
					// fires a "beforeClose" event
					this.tree.container.trigger("beforeClose.node", [this.tree, this])
					// it sets the isOpen to false
					this.isOpen = false;
					// change the isSynchro to false
					this.isSynchro = false;
					// change the hasVisibleChildren to false 
					this.hasVisibleChildren = false;
					// refresh the node
					var el = this.getEl().removeClass("open")
					if (this.iconPath.close) {
						el.find("img")[0].src = this.iconPath.close;
					}
					this.isSynchro = true;

					// fires a "afterClose" event
					this.tree.container.trigger("afterClose.node", [this.tree, this])
				}
				return this;		
			},

			toggleOpen: function (){
				return (this.isOpen)?this.close(): this.open();
			},

			_getChildrenHTML: function(){
				var ul = $("<ul>").addClass("children")
				nodes = this.children;
				for (var i=0, len = nodes.length; i < len; i++) {
					ul.append(nodes[i].getHTML())
				}
				return ul;
			},

			getHTML: function (){
				var className = (this.isOpen)?" open ":"";
				className+= (this.hasChildren)? " folder": "";
				className+= " "+this.customClass;
				
				var titleTag = (this.customClass.indexOf("title") !== -1)? "h3" : "em";
				
				var li = $("<li><a></a></li>")
					.attr("data-nodeid", this.id)
					.attr("data-treeid", this.tree.id)
					.addClass(className)
				
				var a = li.children("a")
						.addClass("title")
						.attr("title", this.description);
				if (this.iconClass) {
					a.append("<i></i><"+titleTag+"></"+titleTag+">")
						.find("i").addClass(this.iconClass)
						.end()
						.find(titleTag).html(this.title)
				}else if (this.iconPath.close) {
					var icon = (this.isOpen)?this.iconPath.open: this.iconPath.close;
					a.append("<i><img/></i><"+titleTag+"></"+titleTag+">")
						.find("img").attr("src", icon)
						.end()
						.find(titleTag).html(this.title)
				}else if (this.customClass.indexOf("title") !== -1){
					a.append("<"+titleTag+"></"+titleTag+">")
						.children()
						.html(this.title)
				}else {
					a.html(this.title)
				}	
								
				if (this.customHTML) {
					li.append("<div class='custom'>")
						.children(".custom")
						.append(this.customHTML)
				}	
				if (this.hasChildren) {
					li.prepend("<a class='openClose'/>")
					if (this.isOpen) {
						li.append(this._getChildrenHTML())
					}
				}	
			
				return li;
			},

			toggleLoading: function (){
				var titleTag = (this.customClass.indexOf("title") !== -1)? "h3" : "em";
				var el = this.getEl();
				var text = (el.hasClass("loading"))?this.title:"Loading...";
				el.toggleClass("loading")
					.children("a.title, label")
						.children(titleTag)
							.text(text)
				
			},

			getEl: function(){
				this.el = $('li[data-nodeid='+this.id+'][data-treeid='+this.tree.id+']')
				return this.el;

			}
		}
	}
		
		
})(jQuery);





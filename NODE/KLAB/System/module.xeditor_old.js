InitXEWindows = function(){
    var xes = W.findAll(".x-editor");
    for (var i = 0; i < xes.length; i++){
	for (var prop in XE){
	    xes[i][prop] = XE[prop];
	}
	xes[i].Init();
    }
}

XEditor = XmlEditor = M.GetModuleByUrl("module.xeditor.htm");

XE = {};

XE.Init = function(){  
    this.objectReceived = XE.ObjectDropped;
    //this.Menu.Init();
    //this.Navigator.Init();
};

XE.Load = function(url){
    this.Source = W.div('source');
};

XE.LoadFileComplete = function(){
    var text = this.responseText;
    
    text = text.replace(/<!DOCTYPE ([^>]+)>/ig, "<doctype-tag>$1</doctype-tag>");
    
    text = text.replace(/<html/ig, "<html-tag");
    text = text.replace(/<\/html>/ig, "</html-tag>");
    
    text = text.replace(/<head>/ig, "<head-tag>");
    text = text.replace(/<\/head>/ig, "<\/head-tag>");
    
    text = text.replace(/<body/ig, "<body-tag");
    text = text.replace(/<\/body>/ig, "<\/body-tag>");
    
    text = text.replace(/<meta/ig, "<meta-tag");
    text = text.replace(/<\/meta>/ig, "<\/meta-tag>");  
    
    this.Source.html(text);
    this.WrapContent();
};

XE.Edit = function(elem){
    this.Source = elem;
    
};

XE.ObjectDropped = function(elem){
    this.Edit(elem);
};

XE.Save = function() {
    
};

XE.WrapContent = function() {
    for (var i = 0; i < this.Source.childNodes.length; i++){
        this.add(XE.WrapNode(this.Source.childNodes[i]));
    }
};

XE.WrapNode = function(element, parent) {
    switch (element.nodeType){
	case 3:
            var value = element.nodeValue;
	    var elem = W.tag("div", "value", value);
	    elem.onclick = XE.ValueClick;
	    elem.linkedNode = element;
	    var linefeed = elem.innerHTML.replace(/ /g, "");
	    if (linefeed == "\n" || linefeed == "\r" || linefeed == "\r\n" || linefeed == "\n\r") {
		elem.cls("linebreak");
	    }
	    if (element.parentNode != null) {
		if (element.parentNode.tagName == "SCRIPT") {
		    elem.innerHTML = value;
		}
		return elem;
	    }
	    return element;
	case 7:
	    element = element.nodeValue;
	    return element;
	case 9:
	    element = element.documentElement;
	default:
	    var welem = this.GetNewElem(element);
	    welem.Synchronize(element);
	    if (element.sname == "style") {
		XE.WrapStyles(welem, element);
		return welem;
	    }
	    if (element.sname == "code") {
		XE.WrapCode(welem, element);
		return welem;
	    }
	    for (var i = 0; i < element.childNodes.length; i++){
		welem.innerNodes.add(XE.WrapNode(element.childNodes[i]));
	    }
	    return welem;
    }
    return element;
};

XE.WrapStyles = function(syselem, elem) {
    var txt = elem.html();
    var val = syselem.innerNodes;
    var styles = txt.match(/[^{]+\{[^}]+\}/g);
    for (var i = 0; i < styles.length; i++) {
	var st = styles[i];
	var css = val.adv("css");
	var iBod = st.indexOf('{');
	var bod = st.substr(iBod);
	var sl = st.substring(0, iBod);
	sl = sl.match(/[.#:\s]?[A-Za-z\-_0-9]+,?/g);
	if (sl == null) {
	    continue;
		}
	for (var j = 0; j < sl.length; j++) {
	    var sel = css.adv('selector',sl[j]);
	    if (sl[j].start("#")){
		sel.cls("id"); 
	    }
	    if (sl[j].start(".")){
		sel.cls("class"); 
	    }
	    if (sl[j].start(":")){
		sel.cls("meta"); 
	    }
	}
	//css.adv("clear");
	css.add("{");
	var body = css.adv('body');
	var maket = body.adv("maket");
	maket.adv("inner", "TEXT");
	sl = bod.match(/([A-Za-z\-_]+)\s*:\s*([^;]+)/g);
	if (sl == null) {
	    continue;
		}
	for (var j = 0; j < sl.length; j++) {
	    var it = sl[j].split(':');
	    var prop = body.adv('prop');
	    prop.adv('name', it[0]);
	    prop.add(':');
	    prop.adv('val',it[1]);
	    prop.add(';');
	    if (it[0] == "color"){
		maket.style.color = it[1];
	    }
	    if (it[0] == "background-color"){
		maket.style.backgroundColor = it[1];
	    }
	    if (it[0] == "border-color"){
		maket.style.borderColor = it[1];
	    }
	    if (it[0] == "border"){
		maket.style.border = it[1];
	    }
	    if (it[0] == "background"){
		maket.style.background = it[1];
	    }
	    if (it[0] == "font-weight"){
		maket.style.fontWeight = it[1];
	    }                  
	    if (it[0] == "font-size"){
		maket.style.fontSize = it[1];
	    }
	    if (it[0] == "padding"){
		maket.style.padding = it[1];
	    }                  
	    if (it[0] == "padding-top"){
		maket.style.paddingTop = it[1];
	    }                                    
	    if (it[0] == "padding-left"){
		maket.style.paddingLeft = it[1];
	    }
	    if (it[0] == "padding-right"){
		maket.style.paddingRight = it[1];
	    }
	    if (it[0] == "padding-bottom"){
		maket.style.paddingBottom = it[1];
	    }
	}
	css.add("}");
    }
};

XE.WrapCode = function(syselem, elem) {
    var txt = elem.text();
    var val = syselem.innerNodes;
    var styles = txt.match(/[^{]+\{[^}]+\}/g);
    for (var i = 0; i < styles.length; i++) {
	var st = styles[i];
	var css = val.adv("css");
	var iBod = st.indexOf('{');
	var bod = st.substr(iBod);
	var sl = st.substring(0, iBod);
	sl = sl.match(/[.#:\s]?[A-Za-z\-_0-9]+,?/g);
	if (sl == null) {
	    continue;
		}
	for (var j = 0; j < sl.length; j++) {
	    var sel = css.adv('selector',sl[j]);
	    if (sl[j].start("#")){
		sel.cls("id"); 
	    }
	    if (sl[j].start(".")){
		sel.cls("class"); 
	    }
	    if (sl[j].start(":")){
		sel.cls("meta"); 
	    }
	}
	//css.adv("clear");
	css.add("{");
	var body = css.adv('body');
	var maket = body.adv("maket");
	maket.adv("inner", "TEXT");
	sl = bod.match(/([A-Za-z\-_]+)\s*:\s*([^;]+)/g);
	if (sl == null) {
	    continue;
		}
	for (var j = 0; j < sl.length; j++) {
	    var it = sl[j].split(':');
	    var prop = body.adv('prop');
	    prop.adv('name', it[0]);
	    prop.add(':');
	    prop.adv('val',it[1]);
	    prop.add(';');
	    if (it[0] == "color"){
		maket.style.color = it[1];
	    }
	    if (it[0] == "background-color"){
		maket.style.backgroundColor = it[1];
	    }
	    if (it[0] == "border-color"){
		maket.style.borderColor = it[1];
	    }
	    if (it[0] == "border"){
		maket.style.border = it[1];
	    }
	    if (it[0] == "background"){
		maket.style.background = it[1];
	    }
	    if (it[0] == "font-weight"){
		maket.style.fontWeight = it[1];
	    }                  
	    if (it[0] == "font-size"){
		maket.style.fontSize = it[1];
	    }
	    if (it[0] == "padding"){
		maket.style.padding = it[1];
	    }                  
	    if (it[0] == "padding-top"){
		maket.style.paddingTop = it[1];
	    }                                    
	    if (it[0] == "padding-left"){
		maket.style.paddingLeft = it[1];
	    }
	    if (it[0] == "padding-right"){
		maket.style.paddingRight = it[1];
	    }
	    if (it[0] == "padding-bottom"){
		maket.style.paddingBottom = it[1];
	    }
	}
	css.add("}");
    }
};


XE.GetNewElem = function(elem){
    var tag = W.div("element " + elem.sname);
    tag.linked = elem;
    elem.Synchronize = XE.Synchronize;
    elem.SynchronizeAttr = XE.SynchronizeAttr;
    tag.Synchronize = XE.Synchronize;
    tag.SynchronizeAttr = XE.SynchronizeAttr;
    tag.SynchronizeClasses = XE.SynchronizeClasses;
    tag.BindEvents = XE.BindEvents;
    tag.AddClass = XE.AddClass;
    tag.AddAttribute = XE.AddAttribute;
    tag.attr("drag-type", "self");
    return tag;
};
    
    
    
	  HTMLElement.prototype.CheckChild = function(tag, classes, value){
	      var item = this.child(tag);
	      if (item == null){
		  item  = W.div(classes, value, this);
	      }
	      else
	      {
		  if (classes != undefined && classes != null){
		      this.cls(classes);
		  }
		  if (value != undefined && value != null){
		      this.html(value);
		  }
	      }
	      return item;
	  };
	      
	      XE.Synchronize = function(element) {
		  var name = element.sname;
		  this.attr("name", name);
		  var id = element.attr("id");
		  if (id != null && id != undefined) {
		      this.attr("identifier", id);
		  }
		  XE.TagContainer.uadd(name);
		  XE.IdContainer.uadd(id);
		  this.indicator = this.adv("indicator");
		  this.nameElem = this.adv("name", name);
		  if (id == null) id = "";
		  else id = '#' + id;
		  this.identifierElem = this.adv("id", id);
		  this.identifierElem.onclick = XE.IdClick;
		  this.classesElem = this.adv("line classes");
		  this.SynchronizeClasses(element);
		  this.attrElem = this.adv("line rollup attributes");
		  this.SynchronizeAttr(element);
		  this.adv("clear");
		  this.innerNodes = this.adv("line rollup childs");
		  this.BindEvents();
	      },
		  
		  XE.SynchronizeClasses = function(element) {
		      var classes = element.classList;
		      this.classesElem.clear();
		      for (var i = 0; i < classes.length; i++) {
			  
			  var classItem = classes[i];
			  XE.ClassContainer.uadd(classItem);
			  this.AddClass(classItem);
		      }
		  }
		      
		      XE.AddClass = function(cls) {
			  var tag = W.tag("div", "class-item", "." + cls);
			  tag.attr("name", cls);
			  this.classesElem.add(tag);
			  tag.eadd("click", XE.ClassClick);
		      }
			  
			  XE.ClassClick = function(){
			      var name = this.attr("name");
			      var elem = this.findParent(".element");
			      elem.linked.rcs(name);
			      this.del();
			  }
			      
			      XE.IdClick = function(){
				  var elem = this.findParent(".element");
				  elem.linked.id = null;
				  elem.linked.ratt("id");
				  this.attr("name", "");
				  this.clear();
			      }
				  
				  XE.SynchronizeAttr = function(element) {
				      this.attrElem.clear();
				      for (var index = 0; index < element.attributes.length; index++) {
					  var val = element.attributes[index];
					  
					  if (val.name != "class" && val.name != "id" ){
					      this.AddAttribute(val.name, val.value);
					  }
				      }
				  }
				      
				      XE.AddAttribute = function(name, value) {
					  var attr = this.attrElem.adv("attribute");
					  attr.aname = name;
					  attr.linked = this.linked;
					  attr.attr("name", name);
					  attr.nameElem = attr.adv("aname", name);
					  attr.add(" = ");
					  attr.valElem = attr.adv("avalue");
					  if (attr.valElem.innerText != undefined){
					      attr.valElem.innerText = value;
					  }
					  else
					  {
					      attr.valElem.textContent = value;
					  }
					  attr.nameElem.onclick = XE.AttrNameClick;
					  attr.onclick = XE.AttrValClick;
				      }
					  
					  
					  XE.AttrNameClick = function(){
					      var elem = this.findParent(".element");
					      var attr = this.findParent(".attribute");
					      elem.linked.removeAttribute(attr.aname);
					      attr.del();
					  }
					      
					      XE.AttrValClick = function(){
						  var elem = this.findParent(".element");
						  this.cls("editing");   
						  if (this.valElem.innerHTML.length <= 0){
						      this.valElem.innerHTML = "_";
						  }
						  this.valElem.contentEditable = true;
						  this.valElem.focus();  
						  this.valElem.onblur = XE.EndElementEditing;
					      } 
						  
						  XE.EditPart = function(part){
						      //this.cls("editing");   
						      part.cls("editing");
						  };


XE.EditEnd = function(part){
    var part = this.get(".editing");
    if (part == null) return;
	part.rcs("editing");   
	if (part.has("id")){
	    this.linked.id = part.Text().substring(1);
	}
	if (part.has("name")){
	    
	}
    };

XE.ValueClick = function(){
    var elem = this.findParent(".element");
    this.cls("editing");  
    this.attr("contenteditable","true");
    this.onblur = XE.EndElementEditing;
}
  
XE.EndElementEditing = function(){
    var elem = this.findParent(".element");
   var evalues = elem.findAll(".value.editing");
            for (var i = 0; i < evalues.length; i++) {
              var val = evalues[i];
              val.rcs("editing");  
              val.linkedNode.value = this.html();
              val.ratt("contenteditable");
            }
  var avalues = elem.findAll(".attribute.editing");
            for (var i = 0; i < avalues.length; i++) {
              var att = avalues[i];
              att.rcs("editing");  
              att.linked.attr(att.aname, att.valElem.html());
              att.valElem.ratt("contenteditable");
            }
}
      


XE.ShowCss = function(event) {
            var item = XmlEditor.Content.get(".current");
            CssInfo.Show(item.linked);
            event.preventDefault();
      },      
      
XE.ShowMenu = function(event){
        var item = this.findParent("element");
        var wm = XmlEditor.Content.get(".withmenu");
        if (wm != null) wm.rcs("withmenu");
        item.cls("withmenu");
        XmlEditor.Menu.Show(item);
      },
        
XE.BindEvents = function(elem)
      {        
        Drag.MakeDraggable(this, "self");
        Drag.MakeReceiver(this, ".element, .element-prototype");
        this.cls("no-body-drop");
        this.objectReceived = XE.ElementDropped;
        this.onclick = XE.SelectElement;
        this.nameElem.ondblclick = XE.ShowEditor;
        this.onmouseover = XE.ElementHover;
        this.onmouseout = XE.ElementOut;
	this.setCurrent = XE.ElementHover;
	this.resetCurrent = XE.ElementOut;
	this.editElemPart = XE.EditPart;
        this.endEdit = XE.EditEnd;
        this.indicator.onclick = XE.ShowHideElement;
	  this.Toggle = XE.ToggleElement;
        //this.nameElem.onclick = XE.SelectElementByName;
      },
        
XE.ElementDropped = function(elem){
  if (elem.has("element")){
    if (this == elem || this.isChildOf(elem)){
      return false;
    }
    this.innerNodes.add(elem);
    this.linked.add(elem.linked);
    return;
  }
  if (elem.has("element-prototype")){
    elem.rcs("element-prototype");
    this.linked.add(elem);
    var welem = XE.GetNewElem(elem);
    welem.Synchronize(elem);
    this.innerNodes.add(welem);
  }
}
      
XE.GetSelection = function() {
            var selected = XmlEditor.Content.findAll(".selected");
            return selected;
        },
      
XE.RemoveSelection = function() {
            XE.Content.findAll(".selected").rcs("selected");
        },
          
 XE.SelectElement = function(event) {
  	    this.findAll(".selected").rcs("selected");
            this.findParents(".selected").rcs("selected");
            this.toggle("selected");
            event.stopPropagation();
        },

XE.SelectElementByName = function(event) {
            var item = this.findParent(".element");
            /*if (item != null){
              item.findParent(".selected").removeClass("selected");
              item.addClass("selected");
              event.preventDefault();
              return;
            }*/
  	    item.findAll(".selected").rcs("selected");
            item.findParents(".selected").rcs("selected");
            item.toggle("selected");
            event.preventDefault();
        },

XE.ShowHideElement = function(event) {
            var element = this.findParent(".element");
    element.Toggle();
            event.stopPropagation();
},
    
XE.ToggleElement = function() {
    if (this.has("hided")){
	this.indicator.html("");
	this.rcs("hided");              
    }  
    else{
	this.indicator.html("+");
	this.cls("hided");
    }      
}

XE.ShowAttributes= function() {
            XmlEditor.Content.findAll(".attributes").toggle();
            return false;
        },

XE.ShowEditor= function() {
            XE.ElementEditor.Show(this.findParent(".element"));
        },

	    XmlEditor.ElementHover= function(event) {
		var wm = XE.Content.get(".withmenu");
		if (wm != null) {
		    wm.rcs("withmenu")
		};
		
		this.cls("withmenu");
		
		XmlEditor.Menu.Show(this);
		var over = XE.Content.findAll(".over");
		for (var i = 0; i < over.length; i++){
		    over[i].rcs("over"); 
		}	  
		this.cls("over");
		var parent = this.findParent(".element");
		while (parent != null){
		    parent.cls("over");
		    parent = parent.findParent(".element");
		}
		var current = XE.Content.get(".current");
		if (current != null){
		    current.rcs("current"); 
		    current.endEdit();
		    var part = current.get(".cpart");
		    if (part != null) part.rcs("cpart");
		    
		}
		this.cls("current");  
		this.first(".name").cls("cpart");
		if (check(event))
		    event.cancelBubble = true;
	    },


XE.ElementOut= function() {
  
	},


XE.FilterByClass= function(event) {
            var sel = XE.GetSelection();
            var cls = this.attr("name");
            for (var i = 0; i < sel.length; i++) {
              if (!sel[i].linked.has(cls)){
              	sel[i].linked.cls(cls);
                sel[i].AddClass(cls);
              }
            } 
        },

XE.FilterByTag= function(event) {
            var sel = XE.GetSelection();
            
        },

XE.FilterById= function(event) {
            var sel = XE.GetSelection();
            var сls = this.attr("name");
            for (var i = 0; i < sel.length; i++) {
	      sel[i].linked.id = сls;
              sel[i].identifierElem.html("#" + сls);
              sel[i].identifierElem.attr("name", сls);
            } 
        },


XE.SetEditable= function(isEditable) {
            this.Editable = isEditable;
            if (isEditable) {
                $(this.Editor).addClass("editable");
                $(".current", this.Content).removeClass("current");
                $("element:first", this.Content).addClass("current");
            }
            else {
                $(this.Editor).removeClass("editable");
            }
        },

XE.NextTag= function() {
            var current = $(".current:first", this.Content);
            if (current.length > 0) {
                var next = current.nextAll("element");
                if (next.length > 0) {
                    current.removeClass("current");
                    $(next[0]).addClass("current");
                }
            }
        },

XE.PrevTag= function() {
            var current = $(".current:first", this.Content);
            if (current.length > 0) {
                var prev = current.prevAll("element");
                if (prev.length > 0) {
                    current.removeClass("current");
                    $(prev[0]).addClass("current");
                }
            }
        },
          
XE.InnerTag= function() {
            var current = $(".current:first", this.Content);
            if (current.length > 0) {
                var inner = $(">element:first", current);
                if (inner.length > 0) {
                    current.removeClass("current");
                    inner.addClass("current");
                }
            }
        },

XE.OuterTag= function(fileName) {
            var current = $(".current:first", this.Content);
            if (current.length > 0) {
                var parent = current.parent();
                if (parent.length > 0) {
                    current.removeClass("current");
                    if (parent[0].tagName == "ELEMENT") {
                        parent.addClass("current");
                    }
                }
            }
        };

InitXEWindows(); 
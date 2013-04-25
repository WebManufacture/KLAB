XE = XEditor = XmlEditor = M.GetModuleByUrl("Module.XEditor.htm");
 
XE.InitXEWindow = function(){
  XE.Editor = W.get(".window.xml_editor");
  if (Request.File == "XEditor.htm"){
    XE.Editor = W.get(".xml_editor");
    XE.Editor.rcs("ui_standart_window");
    XE.Editor.cls("fullscreen");
  }
  XE.Init();
  if (Request.Params.file != null && XE.Content.childNodes.length == 0){      
      X.GetText(Request.Params.file, XE.LoadFileComplete);
  } 
}
  
  
XE.Init = function(){
  XmlEditor.Content = XmlEditor.Editor.get(".xml-content");
  XmlEditor.TagContainer = AArray();
  XmlEditor.ClassContainer = AArray();
  XmlEditor.IdContainer = AArray();
  XmlEditor.Source = W.div("source");
  XmlEditor.Mode = null;
  L.LogInfo("System.XEditor.js reinit");
  XE.Menu.Init();
  XE.Navigator.Init();
  XmlEditor.Content.focus();
  Drag.NoBodyDrop = true;
}

XmlEditor.LoadFileComplete = function(){
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
  
  
   XE.WrapContent(text);
}

XmlEditor.CreateWindow = function() {
          var editor = new XmlEditor(W.div());
          editor = Windows.CreateWindow(editor, "ui_standart_window");
          editor.Show();
}
     
XmlEditor.Show = function(element) {
            this.Content.empty();
            this.WrapElement(this.Source, this.Content)
            this.BindEvents();
            this.Editor.RefreshTagsList();
            this.Menu.Bind();
            this.TagsMenu.Init();
    
}
  
XmlEditor.Save = function() {
  var evalues = XE.Content.findAll(".value.editing");
            for (var i = 0; i < evalues.length; i++) {
              var val = evalues[i];
              val.rcs("editing");  
              val.linkedNode.value = this.html();
              val.ratt("contenteditable");
            }
  var avalues = XE.Content.findAll(".attribute.editing");
            for (var i = 0; i < avalues.length; i++) {
              var att = avalues[i];
              att.rcs("editing");  
              att.linked.attr(att.aname, att.valElem.html());
              att.valElem.ratt("contenteditable");
            }
  if (Request.Params.file != null){
     var btn = W.get(".menuitem.save");
     btn.hide();
     var text = XE.Source.html();
     text = text.replace(/<doctype-tag>([^<]+)<\/doctype-tag>/ig, "<!DOCTYPE $1>");
    
     text = text.replace(/<html-tag/ig, "<html");
     text = text.replace(/<\/html-tag>/ig, "</html>");
  
     text = text.replace(/<head-tag>/ig, "<head>");
     text = text.replace(/<\/head-tag>/ig, "<\/head>");
  
     text = text.replace(/<body-tag/ig, "<body");
     text = text.replace(/<\/body-tag>/ig, "<\/body>");
    
     text = text.replace(/<meta-tag/ig, "<meta");
     text = text.replace(/<\/meta-tag>/ig, "<\/meta>");  
    
     var request = X.ContentSave(Request.Params.file, text, XE.SaveComplete);
  }
}
  
XmlEditor.SaveComplete = function(){
   var name = W.Wrap(this.responseText).get(".name");
   Notify.Show("Сохранено - " + name.html());
   var btn = W.get(".menuitem.save");
   btn.show();
}
  
       
          


XmlEditor.GetNewElem = function(elem){
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
      },
        
     
    
HTMLElement.CheckChild = function(tag, classes, value){
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
  },
      
XmlEditor.Synchronize = function(element) {
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
  
XmlEditor.SynchronizeClasses = function(element) {
        var classes = element.classList;
        this.classesElem.clear();
        for (var i = 0; i < classes.length; i++) {
          
          var classItem = classes[i];
          XE.ClassContainer.uadd(classItem);
          this.AddClass(classItem);
        }
}
  
XmlEditor.AddClass = function(cls) {
   var tag = W.tag("div", "class-item", "." + cls);
   tag.attr("name", cls);
   this.classesElem.add(tag);
   tag.eadd("click", XE.ClassClick);
}

XmlEditor.ClassClick = function(){
    var name = this.attr("name");
    var elem = this.findParent(".element");
    elem.linked.rcs(name);
    this.del();
  }
    
XmlEditor.IdClick = function(){
    var elem = this.findParent(".element");
    elem.linked.id = null;
    elem.linked.ratt("id");
    this.attr("name", "");
    this.clear();
  }

XmlEditor.SynchronizeAttr = function(element) {
   this.attrElem.clear();
   for (var index = 0; index < element.attributes.length; index++) {
      var val = element.attributes[index];
      
     if (val.name != "class" && val.name != "id" ){
        this.AddAttribute(val.name, val.value);
     }
   }
}
  
XmlEditor.AddAttribute = function(name, value) {
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
  
  
XmlEditor.AttrNameClick = function(){
    var elem = this.findParent(".element");
    var attr = this.findParent(".attribute");
    elem.linked.removeAttribute(attr.aname);
    attr.del();
  }
  
XmlEditor.AttrValClick = function(){
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

XmlEditor.ValueClick = function(){
    var elem = this.findParent(".element");
    this.cls("editing");  
    this.attr("contenteditable","true");
    this.onblur = XE.EndElementEditing;
}
  
XmlEditor.EndElementEditing = function(){
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
      
XmlEditor.WrapContent = function(content) {
     XE.Source.html(content);
     for (var i = 0; i < XE.Source.childNodes.length; i++){
        XE.Content.add(XE.WrapNode(XE.Source.childNodes[i]));
     }
     //XE.RefreshTags();
},
        
XmlEditor.WrapNode = function(element, parent) {
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
      },
         
XmlEditor.WrapStyles = function(syselem, elem) {
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
        }
    
    XmlEditor.WrapCode = function(syselem, elem) {
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
    }
      

XmlEditor.ShowCss = function(event) {
            var item = XmlEditor.Content.get(".current");
            CssInfo.Show(item.linked);
            event.preventDefault();
      },      
      
XmlEditor.ShowMenu = function(event){
        var item = this.findParent("element");
        var wm = XmlEditor.Content.get(".withmenu");
        if (wm != null) wm.rcs("withmenu");
        item.cls("withmenu");
        XmlEditor.Menu.Show(item);
      },
        
XmlEditor.BindEvents = function(elem)
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
        
XmlEditor.ElementDropped = function(elem){
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
      
XmlEditor.GetSelection = function() {
            var selected = XmlEditor.Content.findAll(".selected");
            return selected;
        },
      
XmlEditor.RemoveSelection = function() {
            XE.Content.findAll(".selected").rcs("selected");
        },
          
 XmlEditor.SelectElement = function(event) {
  	    this.findAll(".selected").rcs("selected");
            this.findParents(".selected").rcs("selected");
            this.toggle("selected");
            event.stopPropagation();
        },

XmlEditor.SelectElementByName = function(event) {
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

XmlEditor.ShowHideElement = function(event) {
            var element = this.findParent(".element");
    element.Toggle();
            event.stopPropagation();
},
    
XmlEditor.ToggleElement = function() {
    if (this.has("hided")){
	this.indicator.html("");
	this.rcs("hided");              
    }  
    else{
	this.indicator.html("+");
	this.cls("hided");
    }      
}

XmlEditor.ShowAttributes= function() {
            XmlEditor.Content.findAll(".attributes").toggle();
            return false;
        },

XmlEditor.ShowEditor= function() {
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


XmlEditor.ElementOut= function() {
  
	},


XmlEditor.FilterByClass= function(event) {
            var sel = XE.GetSelection();
            var cls = this.attr("name");
            for (var i = 0; i < sel.length; i++) {
              if (!sel[i].linked.has(cls)){
              	sel[i].linked.cls(cls);
                sel[i].AddClass(cls);
              }
            } 
        },

XmlEditor.FilterByTag= function(event) {
            var sel = XE.GetSelection();
            
        },

XmlEditor.FilterById= function(event) {
            var sel = XE.GetSelection();
            var сls = this.attr("name");
            for (var i = 0; i < sel.length; i++) {
	      sel[i].linked.id = сls;
              sel[i].identifierElem.html("#" + сls);
              sel[i].identifierElem.attr("name", сls);
            } 
        },


XmlEditor.SetEditable= function(isEditable) {
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

XmlEditor.NextTag= function() {
            var current = $(".current:first", this.Content);
            if (current.length > 0) {
                var next = current.nextAll("element");
                if (next.length > 0) {
                    current.removeClass("current");
                    $(next[0]).addClass("current");
                }
            }
        },

XmlEditor.PrevTag= function() {
            var current = $(".current:first", this.Content);
            if (current.length > 0) {
                var prev = current.prevAll("element");
                if (prev.length > 0) {
                    current.removeClass("current");
                    $(prev[0]).addClass("current");
                }
            }
        },
          
XmlEditor.InnerTag= function() {
            var current = $(".current:first", this.Content);
            if (current.length > 0) {
                var inner = $(">element:first", current);
                if (inner.length > 0) {
                    current.removeClass("current");
                    inner.addClass("current");
                }
            }
        },

XmlEditor.OuterTag= function(fileName) {
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
        },

XmlEditor.Menu= {
            Element : null,

            Init: function() {
		XE.Menu.Element = XE.get(".element-menu");     
		if (XE.Menu.Element == null){
		    XE.Menu.Element = XE.Editor.get(".element-menu");
		}
		XE.Menu.Park();
            },
          
          
            Park: function() {
		XE.Editor.insert(XE.Menu.Element);
                XmlEditor.Menu.Element.style.top = "80px";
                XmlEditor.Menu.Element.style.left = "0px";
            },

            GetSelection: function() {
                this.LastElement = $(".current:first", XmlEditor.Content);
                this.SelectedElements = $(".current", XmlEditor.Content);
            },

            Show: function(elem){
                XmlEditor.Menu.Element.style.top = (elem.offsetTop + XmlEditor.Content.offsetTop) + "px";
                XmlEditor.Menu.Element.style.left = (elem.offsetLeft - XmlEditor.Menu.Element.offsetWidth) + "px";
            },

            Wrap: function() {
                var newTag = document.createElement("tag");
                $(this.SelectedElements).removeClass("current");
                $(this.SelectedElements).wrapAll(newTag);
                var parent = $(this.LastElement).parent();
                XmlEditor.WrapElement(parent[0]);
                parent.addClass("current");
                this.Close();
            },

            Insert: function() {
                var elem = XmlEditor.Content.get(".current");
		if (elem != null){
                    if (elem.linked != null) {
                        var parent = elem.linked.parentNode;
			var ntag = W.tag("unknown");
			parent.insertBefore(ntag, elem.linked);
			var nelem = XE.GetNewElem(ntag);
			parent = elem.parentNode;
			parent.insertBefore(nelem, elem);
			nelem.Synchronize(ntag);
			nelem.setCurrent();
			nelem.nameElem.Text("");
                    }
                }
   		XE.Menu.Park();
            },
    
    InsertInto: function() {
	var elem = XmlEditor.Content.get(".current");
	if (elem != null){
	    if (elem.linked != null) {
		var ntag = W.tag("unknown");
		elem.linked.insert(ntag);
		var nelem = XE.GetNewElem(ntag);
		elem.innerNodes.insert(nelem);
		nelem.Synchronize(ntag);
		nelem.setCurrent();
		nelem.nameElem.Text("");
	    }
	}
	XE.Menu.Park();
    },
    
            Edit: function() {
                this.Close();
                XmlEditor.ElementEditor.Show();
            },

            Delete: function() {
                var elem = XmlEditor.Content.get(".current");
		if (elem != null){
                    var parent = elem.findParent(".element");
		    if (elem.linked != null) {
                        elem.linked.del();
                    }
              	    elem.del();
		  if (parent != null)
		    parent.setCurrent();
		  else{		   
		      XE.Menu.Park();   
		  }
                }
            },
    
    DeleteSelected: function() {
	var elements = XmlEditor.Content.findAll(".selected");
	for (var i = 0; i < elements.length; i++) {
	    if (elements[i].linked != null) {
		elements[i].linked.del();
	    }
	    elements[i].del();
	}
    },
    
    Close: function() {
	this.Active = false;
	this.MenuItem.hide();
    },
    
    ClickEventHandler: function() {
	var name = this.id;
	XmlEditor.Menu[name]();
    },
    
    KeyHandler: function(event, current) {
	switch (event.keyCode) {
	    case 27: XE.Menu.Close(); break;
		case 87: XE.Menu.Wrap(); break;
		    case 46: 
		if (event.shiftKey){
		    XE.Menu.DeleteSelected();
		}
		else{
		    XE.Menu.Delete(); 
		}
		break;
                    case 90: XE.Menu.Edit(); break;
			case 45: XE.Menu.Insert(); break;
			    case 13: XE.Menu.InsertInto(); break;
				default: return true;
                }
                return false;
            }
};

XmlEditor.Navigator = XE.Nav =  {
    
    Init: function() {
	window.onkeypress = XE.Nav.KeyHandler;
    },
    
    KeyHandler: function(event) {
	var current = XE.Content.get(".withmenu");
	if (current != null){
	    var cpart = current.get(".cpart");
	    switch (event.keyCode) {
		case 40:{//Вниз			
		    if (!event.shiftKey){
			var next = current.get(".element");
			if (next == null || current.has('hided')){
			    var next = current.next(".element");
			    if (next == null){
				var parent = current.findParent(".element");
				while (parent != null){
				    next = parent.next('.element');
				    if (next != null) break;
					parent = parent.findParent(".element");
				}
			    }
			}
		    }
		    else{
			var next = current.next(".element");
		    }	
		    
		    break;
			};
		    
		case 38:{//вверх
		    var next = current.prev(".element");
		    if (next == null){
			next = current.findParent(".element");
		    }			    
		    else{
			if (!event.shiftKey){
			    var elem = next.get(".childs").last(".element");
			    while (elem != null && !next.has('hided')){
				next = elem;
				elem = elem.get(".childs").last(".element");
			    };
			};
		    }
		    break;
			};
		    
		case 39:{ //Вправо
		    if (event.shiftKey && current.has('hided')){
			current.Toggle();
			break;
			    };
		    if (XE.Nav.GotoNextPart(current, cpart, event)) break;
		    if (current.has('hided')){
			break;
			    };
		    var next = current.get(".element");
		    break;
			};
		case 37:{//Влево 			    
		    if (event.shiftKey && !current.has('hided')){
			current.Toggle();
			break;
			    };
		    var next = current.findParent(".element");
		    break;
			};
		    
		case 8:{//Backspace
		    if (cpart != null && cpart.has("editing")){//#
			var text = cpart.Text();
			cpart.Text(text.substring(0, text.length-1));
		    }		    
		    break;
		};
		    
		case 46:{//Backspace
		    if (cpart != null && cpart.has("editing")){//#
			cpart.empty();
			current.endEditing();
			break;
		    }		    
		    return XE.Menu.KeyHandler(event, current);
		};
		    
		case 0:{//Символы
		    if (cpart.has("attribute") && cpart.has("editing")){
			
			break;
			    }
		    if (event.charCode == 35){//#
			if (current.identifierElem.isEmpty()){
			    current.endEdit();
    			    cpart.rcs("cpart");
			}
			current.identifierElem.Text("#");
			current.identifierElem.cls("cpart");
			current.editElemPart(current.identifierElem);
			break;
			    }
		    if (event.charCode == 32){//#
			if (XE.Nav.GotoNextPart(current, cpart, event)) break;
		    }
		    if (cpart.has("editing")){//#
			var text = cpart.Text();
			cpart.Text(text + String.fromCharCode(event.charCode));
		    }
		    else{
			if (cpart.has("name")){
			    current.editElemPart(current.nameElem);
			    cpart.Text(String.fromCharCode(event.charCode));
			}
		    }
		    break;
		    return XE.Menu.KeyHandler(event, current);
		};   
		    
		    
		default: 
		    return XE.Menu.KeyHandler(event, current);
		    break;  
	    };
	}
	else{
	    var next = XE.Content.get(".element");
	};
	if (next != null) {
	    next.setCurrent();
	};
	return false; 
	
	
    },
    
    GotoNextPart : function (current, cpart, event){
	if (cpart == null){
	    current.nameElem.cls("cpart");
	    return true;
	};
	cpart.rcs("cpart");
	current.endEdit();
	if (cpart.has("name")){
	    if (current.identifierElem != null && !current.identifierElem.isEmpty()){
		current.identifierElem.cls("cpart");
		return true;
	    }
	    if (current.classesElem != null && !current.classesElem.isEmpty()){
		current.classesElem.get(".class-item").cls("cpart");
		return true;
	    }
	    if (current.attrElem != null && !current.attrElem.isEmpty()){
		current.attrElem.get(".attribute").cls("cpart");
		return true;
	    }
	}
	if (cpart.has("id")){
	    if (current.classesElem != null && !current.classesElem.isEmpty()){
		current.classesElem.get(".class-item").cls("cpart");
		return true;
	    }
	    if (current.attrElem != null && !current.attrElem.isEmpty()){
		current.attrElem.get(".attribute").cls("cpart");
		return true;
	    }
	}
	if (cpart.has("class-item")){
	    var nextClass = cpart.next(".class-item");
	    if (nextClass != null && !nextClass.isEmpty()){
		nextClass.cls("cpart");
		return true;
	    }
	    if (current.attrElem != null && !current.attrElem.isEmpty()){
		current.attrElem.get(".attribute").cls("cpart");
		return true;
	    }
	}
	if (cpart.has("attribute")){
	    var nextAttr = cpart.next(".attribute");
	    if (nextAttr != null && !nextAttr.isEmpty()){
		nextAttr.cls("cpart");
		return true;
	    }
	}
	return false;
    },
};

W.Onload(XE.InitXEWindow); 
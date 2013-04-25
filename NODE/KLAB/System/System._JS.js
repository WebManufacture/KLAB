if (window.Node && window.XMLSerializer) {
   Element.prototype.__defineGetter__('outerHTML', function() { return new XMLSerializer().serializeToString(this); });
}
    
 
function AssociatedArray(){
   this.objects = {};
   this.count = 0;
}

AssociatedArray.prototype = {
  add : function(name, elem){
    if (this.objects == undefined || this.objects == null)
    {
      this.objects = {};
    }
    var obj = this.objects[name];
    if (obj == undefined || obj == null)
    {
       this.count++;
    }
    if (elem == undefined || elem == null){
      this.count--;
    }
    this.objects[name] = elem;
    return this.count;
  }, 
  
  get : function(name){
    var obj = this.objects[name];
     if (obj != undefined && obj != null)
     {
       return obj;
     }
     return null;
  }, 
  
  remove : function(name){
    var obj = this.objects[name];
    if (obj != undefined && obj != null)
     {
       this.objects[name] = null;
       this.objects[name] = undefined;
       this.count--;
     }
     return this.count;
  }
}
  
if (window.W == undefined) {
  
W = {
  Body : null,
  
  Header : null,
  
  Temp : null,
  
  Init : function(){
    if (W.initialized) return;
    var head = document.getElementsByTagName("head");
    document.head = head[0];
    W.WrapPrototype(Element.prototype);
    Element.prototype.wrapped = true;
    W.Body = document.body;
    W.Header = document.body.parentNode.firstChild;
    W.Temp = W.tag("context");   
    W.OnNodeInserted = E.Create(W, "OnNodeInserted");
    W.OnNodeDeleting = E.Create(W, "OnNodeDeleting");
    W.OnNodeMoving = E.Create(W, "OnNodeMoving");
    L.LogInfo(W);
    W.initialized = true;
  },
  
  onload : function(func){
    if (document.addEventListener){
      document.addEventListener("DOMContentLoaded", func, false);
    }
    else{
      window.addEventListener("load", func, false);
    }
  },
  
  Onload : function(func){
    return W.onload(func);
   },
  
   OnLoad : function(func){
    return W.onload(func);
   },

  ElemOrBody : function(element){
    if (element != undefined && element != null && element.wrapped) return element;
    return W.Body;
  },
  
  IsFirefox : function(){
  return navigator.userAgent.contains("Firefox");
  },
  
  
  IsOpera : function(){
  return navigator.appCodeName.toLowerCase() == "opera";
  },
  
  
  IsChrome : function(){
  return navigator.userAgent.contains("Chrome");  
  },
  
  WrapPrototype: function(elem){
    elem.tag = this.tag;
    elem.cls = this.cls;
    elem.rcs = this.rcs;
    elem.get = this.get;
    elem.getText = this.getText;
    elem.setText = this.setText;
    elem.getValue = this.getValue;
	elem.getJSValue = this.getJSValue;
    elem.afind = this.afind;
    elem.aget = this.aget;
    elem.add = this.add;	
    elem.adv = this.adv;	
    elem.del = this.del;
    elem.has = this.has;
    elem.is = this.is;
    elem.attr = this.attr;
    elem.ratt = this.ratt;
    elem.html = this.html;
    elem.clear = this.empty;
    elem.empty = this.empty;
    elem.Text = this.text;
    elem.child = this.child;
    elem.prop = this.prop;
    elem.childs = this.childs;
    elem.remove = this.remove;
    elem.find = this.findInternal;
    elem.findParent = this.findParent;
    elem.findAll = this.findAllInternal;
    elem.count = this.count;
    elem.forEach = this.forEach;
    elem.clone = this.clone;
    elem.insert = this.insert;
    elem.insertBefore = this.insertBefore;
    elem.show = this.show;
    elem.hide = this.hide;
    elem.eadd = this.eadd;
    elem.edel = this.edel;
    elem.identifier = this.identifier;
    elem.CheckElem = this.CheckElem;
    elem.CheckChild = this.CheckChild;
    elem.CheckAttr = this.CheckAttr;
    elem.CheckHtml = this.CheckHtml;
  //elem.type = this.type;
    elem.__defineGetter__('sname', W.smallName);
    elem.__defineGetter__('jver', W.getVersion);
    return elem;
  },
  
  smallName : function(){
  return this.tagName.toLowerCase();
  },
  
  getVersion : function(){
  return "1.1";
  },
  
  type : function(){
  return typeof(this);
  },

  Wrap : function(html, parent){
    if (typeof(html) == "string"){
      var elem = W.div("", html);
      if (parent == undefined){
        //elem = document.importNode(elem);
      }
      return elem;
    }
  },
  
  WrapArray : function(elem){
    elem.cls = function(cls){
      for (var i = 0; i < this.length; i++){
        this[i].cls(cls);
      }
    };
    elem.prop = function(prop, value){
      for (var i = 0; i < this.length; i++){
        this[i].prop(prop, value);
      }
    };
    elem.eadd = function(event, handler){
      for (var i = 0; i < this.length; i++){
        this[i].eadd(event, handler);
      }
    };
    elem.edel= function(event, handler){
      for (var i = 0; i < this.length; i++){
        this[i].edel(event, handler);
      }
    };
    elem.attr = function(attr, value){
      for (var i = 0; i < this.length; i++){
        this[i].attr(attr, value);
      }
    };
    elem.html = function(html){
      for (var i = 0; i < this.length; i++){
        this[i].html(html);
      }
    };
    elem.text = function(text){
      for (var i = 0; i < this.length; i++){
        this[i].text(text);
      }
    };
    elem.find = function(path){
      var result = [];
      for (var i = 0; i < this.length; i++){
        result.push(this[i].findAll(path));
      }
      return W.WrapArray(result);
    };
    elem.count = function(){return this.length;};
    elem.each = function(func){
      for (var i = 0; i < this.length; i++){
        func(this[i]);
      }
    };
    elem.appendChild = function(elem){
        this.push(elem);
        return elem;
    };
    elem.wrapped = true;
    elem.isElemsArray = true;
    return elem;
  },
  
  adv : function(classes, value){
    return W.div(classes, value, this);    
  },
  
  div : function(classes, value, parent){
    var tag = document.createElement('div');
    if (classes != undefined && classes != null){
      tag.attr("class", classes);
    }
    if (value != undefined && value != null){
      tag.html(value);
    }
    if (parent!= undefined && parent != null){
      parent.add(tag);
    }
    return tag;    
  },
  
  tag : function(tag, classes, value, parent){
    if (tag == undefined){
      tag = "div";
    }
    var tag = document.createElement(tag);
    if (classes != undefined && classes != null){
      tag.attr("class", classes);
    }
    if (value != undefined && value != null){
      tag.html(value);
    }
    if (parent!= undefined && parent != null){
      parent.add(tag);
    }
    return tag;    
  },
    
  cls : function(cls){
    if (this.has(cls)) return;
    if(this.classList == undefined)
    {
       this.className += " " + cls + " ";
       return;
    }
    this.classList.add(cls);
  },
  
  rcs : function(cls){
    if(this.classList == undefined && this.has(cls)) {
       this.className = this.className.replace((new RegExp("\\b"+cls+"\\b","g"))," ");
      return;
     }    
    this.classList.remove(cls);
  },
  
  has : function(cls){
    if(this.classList == undefined){
       return (new RegExp("\\b"+cls+"\\b","")).test(this.className);
    }
    return this.classList.contains(cls);
  },
  
  attr : function(attr, value){
    if (value == undefined) return this.getAttribute(attr);
    if (value == null) return this.removeAttribute(attr);
    this.setAttribute(attr, value);
  },
  
  ratt : function(attr){
    this.removeAttribute(attr);
  },
  
  html : function(value){
    if (typeof(value) == "string"){
      this.innerHTML = value;
    }
    if (typeof(value) == "Element"){
      this.innerHTML = value.outerHTML;
    }
    return this.innerHTML;
  },
  
  empty : function(){
    this.innerHTML = "";
  },
  
  text : function(value){
    if (typeof(value) == "string"){
      this.innerText = value;
      return this;
    }
    if (typeof(value) == "Element"){
      this.appendChild(value);
    }
  },
  
  child : function(tag){
    if (tag == undefined){
      return this.firstChild;
    }
    for (var i = 0; i < this.childNodes.length; i++){
      var node = this.childNodes[i];
      if (node.nodeType == 1) {
        if (node.is(tag))
          return(node);
      }
    }
    return null;
  },
    
  childs : function(path){
    if (path == undefined){
	  var result = W.WrapArray(new Array());
      for (var i = 0; i < this.childNodes.length; i++){
        if (this.childNodes[i].nodeType == 1) result.push(this.childNodes[i]);
      }
      return result;
    }
    return this.querySelectorAll(path);   
  },
  
  count : function(){
    return childNodes.length;
  },
  
    
  remove : function(){
     return this.parentNode.removeChild(this);
  }, 
  
  findInternal : function(path){
    return this.querySelector(path);
  },
  
  findAllInternal : function(path){
    var elems = this.querySelectorAll(path);
    return W.WrapArray(elems);
  },
  
  querySelector : function(path){
    return document.querySelector(path);
  },
  
  get : function(path){
    return this.querySelector(path);
  },
  
  getText : function(path){
    var elem = this.querySelector(path);
    if (elem != null){
        return elem.html();
    }
    return null;
  },
  
  getValue : function(path){
    var elem = this.querySelector(path);
    if (elem != null){
        return elem.value;
    }
    return null;
  },
  
  setText : function(path, text){
    var elem = this.querySelector(path);
    if (elem != null){
        return elem.html(text);
    }
    return null;
  },
  
  getJSValue : function(value){
	var val = this[value];
	if (val == undefined){
		val = this.attr(value);
		if (val == undefined || val == null) return null;
		this[value] = val;		
	}
	return val;
  },
    
  find : function(path){
    return W.querySelector(path);
  },
  
  findParent : function(path){
    var parent = this.parentNode;
    while(parent != null && parent.is != undefined){
        if (parent.is(path)){
            return parent;
        }
        parent = parent.parentNode;
    }
    return null;
  },
    
  findAll : function(path){
     var elems = document.querySelectorAll(path);
    return W.WrapArray(elems);
  },
  
   aget: function(attr, value, path){
    if (path == undefined){
      path = "";
    }
    path += "[" + attr;
    if (value != undefined){
      path += "='" + value + "'";
    }
    path += "]";
     return this.querySelector(path);
   },
  
  afind: function(attr, value, path){
    if (path == undefined){
      path = "";
    }
    path += "[" + attr;
    if (value != undefined){
      path += "='" + value + "'";
    }
    path += "]";
     return this.querySelectorAll(path);
   },
   
  add : function(tag){
    if (typeof(tag) == "string"){
        tag = W.Wrap(tag);
        var child = tag.firstChild;
        while (child != null)
        {
            var next = child.nextSibling;
            this.add(child);
            child = next;
	}		
	return child;
    }
    if (tag.sname != undefined && tag.sname == "script"){
        /*if (tag.attr("src") != null){
            var script = document.createElement("script");
            script.attr("key", tag.attr("key"));
            script.attr("type", tag.attr("type"));
            script.attr("url", tag.attr("url"));
            script.innerHTML = tag.innerHTML;
            script.async = false;
            script.attr("async", "false");
            script.attr("src", tag.attr("src"));
            this.appendChild(script);
            return script;
        }
        else{
            this.appendChild(tag);
            window.eval(tag.innerHTML);
            return tag;
        }            */               
    }		        
    this.appendChild(tag);
    W.OnNodeInserted(tag);
    return tag;
  },
  
  del : function(){
	this.remove();
  },
    
  each : function(){
    if (!this.wrapped){
       W.WrapArray(this);
    }   
    return this;
  },
  
  forEach : function(func){
    var result = [];
    for (var i = 0; i < this.count(); i++){
      result.push(func(this.childNodes[i]));
    }
    return result;
  },
  
  is : function(selector) {
    var matches = document.mozMatchesSelector || document.webkitMatchesSelector;
    if (matches){
      return matches(this, selector);
    }
    return W.MatchesSelector(this, selector);
  },
  
  identifier : function(id) {
    if (id != undefined){
      this.attr("id", id);      
      this.id = id;
    }
    return this.id;
  },
  
  clone : function(){
    if (this.tagName == "TR" || this.tagName == "TH" || this.tagName == "THEAD")
    {
        var clone = W.tag("tbody");
    }
    else
    {
        if (this.tagName == "TD")
            var clone = W.tag("tr");
        else
            var clone = W.tag("clone");
    }
    clone.html(this.outerHTML);
    clone = clone.child();
    clone.ratt("xmlns");
    clone = document.importNode(clone, true);
    return clone;
  },
  
  insert : function(elem){
    if (typeof(elem) == "String")
        elem = document.querySelector(elem);
    elem = this.parentNode.insertBefore(elem, this);
    return elem;
  },
  
  insertBefore : function(elem){
    if (typeof(elem) == "String")
        elem = document.querySelector(elem);
    document.insertBefore(this, elem);
  },
   
  show : function(){
    this.rcs("invisible");
    this.cls("visible");
  },
  
  prop: function(prop, value){
    this[prop] = value;
  },
   
  unshow : function(){
    this.rcs("visible");
  },
  
  hide : function(){
    this.rcs("visible");
    this.cls("invisible");
  },
  
  eadd : function(eventType, handler){
    this.addEventListener(eventType, handler, false);
  },

  edel : function(eventType, handler){
    this.removeEventListener(eventType, handler, false);
  },
 
  MatchesSelector : function(node, selector) {
    var nodeList = node.parentNode.querySelectorAll(selector);
    for (var i = 0; i < nodeList.length; i++){
      if (nodeList[i] == node) return true;
    }
    return false;
  },
        
  CheckElem : function(tag){
    if (this.tagName != tag){
      this.tagName = tag;
    }
  },
      
  CheckChild : function(tag, classes, value){
    var item = this.child(tag);
    if (item == null){
        item  = W.div(classes, value, tag);
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
}

W.OnLoad(function(){ L.LogWarn("DOMContentLoaded"); });
W.Onload(W.Init);
}
else{
    L.LogError("reinitializing W!"); 
}
   
 if (window.E == undefined) {
   
   E = {
     Init : function(){
        L.LogInfo(E);
        E.initialized = true; 
     },
     
     Events : {},
     
     Log : [],
     
     Create : function(parent, name){
       var event = 
       function(argument1, argument2){
         event.fire(argument1, argument2);
       }        
       event.__proto__ = Event;
       event.init(parent, name);
           if (parent != undefined && parent != null){
                  parent[name] = event;
           }
       if (name != undefined){
         E.Events[name] = event; 
       }
       else{
         E.Events["unknown"] = event; 
       }
       return event;
     },
     
     IsFired: function(name, condition){
       return E.Log.indexOf(name + ":" + condition) >= 0;
     },
     
     AddHandler : function(name, handler, condition){
           var event = E.Events[name];
       event.add(handler, condition);
           var fired = event.fired(condition);
       if (fired > 0){
                  for (var i=0; i < fired; i++)
                  {
                          E.Events[name].handle(handler, condition);
                  }
       }
     }
   }
     
   W.Onload(E.Init);  
     
   Event = {
   
      init : function(parent, name){
        this.parent = parent;
        if (name != undefined){
          this.eventName = name;
        }
        else{
          this.eventName = null;
        }
        this.handlers = [];
     },
     
      fire : function(argument1, argument2){
       this.result = null;
       for (var i=0; i < this.handlers.length; i++){
         if (this.handlers[i] == null) continue;
         this.handler = this.handlers[i]; 
         if (this.handler.condition != undefined && this.handler.condition != null){
           if (this.handler.condition == argument1){
                          this.result = this.handle(this.handler, argument1, argument2);
                          E.Log.push("Result " + this.eventName + " " + argument1 + " :result " + this.result);
           }
         }
         else{
           this.result = this.handle(this.handler, argument1, argument2);
                   E.Log.push("Result " + this.eventName + " " + argument1 + " :result " + this.result);
         }
         if (this.result == "stop"){
           return; 
         }
       }
       E.Log.push(this.eventName + ":" + argument1);
     },
     
     fired : function(condition){
       return E.Log.indexOf(this.eventName + ":" + condition);
     },
     
     isFired : function(condition){
       return fired(condition) > 0;
     },
     
     handle : function(handler, argument1, argument2) {
         if (typeof(handler) != "function"){
                          return handler[this.eventName]();
                  }
          return this.handler(argument1, argument2);	   
     },
     
     add : function(handler, condition) {
       this.handlers.push(handler);
       if (condition != undefined){
         handler.conditon = condition;
       }   
     },
     
     del: function(handler) {
       for (var i=0; i < this.handlers.length; i++){
         if (this.handlers[i] == handler){
           this.handlers[i] = null; 
         }
       }
     },
        
     clear : function() {
        this.handlers = [];   
     }
   }
     
}
else{
    L.LogError("reinitializing E!"); 
}
   
if (window.L == undefined) {    
   L = {    
    
    LogInfo: function(str){
      if (window.console == undefined || window.console == null) return;
      console.info(str);
    },
    
    
    LogWarn: function(str){
      if (window.console == undefined || window.console == null) return;
        console.warn(str);
    },
    
    LogError: function(e, m){
      if (window.console == undefined || window.console == null) return;
      L.OnError(e, m);
      console.error(e, m);
    },
  }
  L.LogInfo(L);   
  E.Create(L, "OnError");
  
}
else{
    L.LogError("reinitializing L!"); 
}
   



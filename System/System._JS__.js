if (window.Node && window.XMLSerializer) {
    Element.prototype.__defineGetter__('outerHTML', function() { return new XMLSerializer().serializeToString(this); });
}

function Check(arg){
    return arg != undefined && arg != null; 
}

function check(arg){
    return arg != undefined && arg != null; 
}

function AssociatedArray(){
    this.objects = {};
    this.count = 0;
}



String.prototype.endsWith = function(str) 
    {
	return (this.match(str+"$")==str)
	    }
    
    
    String.prototype.contains = function(substr){
	return this.indexOf(substr) > -1;
    }  
	
	String.prototype.start = function(str){
	    return (this.match("^" + str)==str)
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
		
		if (window.console != undefined && window.console != null) {
		    console.info("W start");  
		}

if (window.W == undefined || window.W == null || !window.W.IsOlmObject) {
    
    W = {
	OnLoadEvents : [],
	
	Body : null,
	
	Header : null,
	
	Temp : null,
	
	IsOlmObject : true,
	
	Init : function(){
	    if (W.initialized) return;
		W.WrapPrototype(Element.prototype);
	    Element.prototype.wrapped = true;
	    W.Temp = W.tag("context");   
	    W.OnNodeInserted = E.Create(W, "OnNodeInserted");
	    W.OnNodeDeleting = E.Create(W, "OnNodeDeleting");
	    W.OnNodeMoving = E.Create(W, "OnNodeMoving");
	    E.Init();
	    L.Init();
	    L.LogInfo("W initialized!");
	    W.DOMload(W.InitBody);
	},
	
	
	InitBody : function(){
	    if (W.initialized) return;
		var head = document.getElementsByTagName("head");
	    document.head = head[0];
	    W.Body = document.body;
	    W.Header = document.body.parentNode.firstChild;
	    W.initialized = true;
	    W.CheckOnLoad();
	},
	
	DOMload : function(func){
	    if (document.body){
		func();
		return;
		    }
	    if (document.addEventListener){
		document.addEventListener("DOMContentLoaded", func, false);
	    }
	    else{
		window.addEventListener("load", func, false);
	    }
	},
	
	onload : function(func){
	    if (W.initialized) {
		func();
		return;
		    }
	    W.OnLoadEvents.push(func);
	},
	
	Onload : function(func){
	    W.onload(func);
	},
	
	OnLoad : function(func){
	    W.onload(func);
	},
	
	CheckOnLoad : function(){
	    for (var i = 0; i < W.OnLoadEvents.length; i++){
		W.OnLoadEvents[i]();
	    }
	    W.OnLoadEvents = [];
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
	    elem.aget = this.aget;
	    elem.add = this.add;
	    elem.adf = this.adf;	
	    elem.ada = this.ada;
	    elem.adv = this.adv;    
	    elem.adg = this.append;     
	    elem.append = this.append;
	    elem.move = this.move;
	    elem.del = this.del;
	    elem.afind = this.afind;
	    elem.has = this.has;
	    elem.is = this.is;
	    elem.isChildOf = this.isChildOf;
	    elem.isParentOf = this.isParentOf;
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
	    elem.findParents = this.findParents;
	    elem.findAll = this.findAllInternal;
	    elem.count = this.count;
	    elem.forEach = this.forEach;
	    elem.clone = this.clone;
	    elem.insert = this.insert;
	    elem.insertTo = this.insertTo;
	    elem.show = this.show;
	    elem.hide = this.hide;
	    elem.toggle = this.toggle;
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
	
	Wrap : function(html, filter){
	    if (typeof(html) == "string"){
		var elem = W.div("", html);
		if (filter != undefined){
		    return elem.findAll(filter);
		}
		if (elem.childNodes.length == 1){
		    return elem.firstChild;
		}
		return W.WrapArray(elem.childNodes);
	    }
	},
	
	WrapArray : function(elem){
	    elem.cls = function(cls){
		for (var i = 0; i < this.length; i++){
		    this[i].cls(cls);
		}
	    };
	    elem.hide = function(cls){
		for (var i = 0; i < this.length; i++){
		    this[i].hide(cls);
		}
	    };
	    elem.show = function(cls){
		for (var i = 0; i < this.length; i++){
		    this[i].show(cls);
		}
	    };
	    elem.toggle = function(cls){
		for (var i = 0; i < this.length; i++){
		    this[i].toggle(cls);
		}
	    };
	    elem.rcs = function(cls){
		for (var i = 0; i < this.length; i++){
		    this[i].rcs(cls);
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
	    elem.find = elem.get = function(path){
		for (var i = 0; i < this.length; i++){
		    var item = this[i].get(path);
		    if (item != null)
			return item;
		}
		return null;
	    };
	    elem.findAll = function(path){
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
	    if (!check(cls) || typeof(cls) != "string") {
		return this.attr("class");
	    }
	    if (cls.contains(" ")){
		cls = cls.split(" ");    
		for (var i = 0; i < cls.length; i++){
		    this.cls(cls[i]);
		}
		return this.attr("class");
	    }
	    if (this.has(cls)) return;
		if(this.classList == undefined)
		{
		    this.className += " " + cls + " ";
		    return this.attr("class");
		}
	    this.classList.add(cls);
	    return this.attr("class");
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
	
	append : function(from){
	    return this.add(W.findAll(from));
	},
	
	move : function(to){
	    if (typeof(to) == "string"){
		to = W.get(to);
	    }
	    to.add(this);
	    return to;
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
	
	childs : function(path, nofilter){
	    var result = W.WrapArray(new Array());
	    if (!Check(path)){
		for (var i = 0; i < this.childNodes.length; i++){
		    if (this.childNodes[i].nodeType == 1 || nofilter)
			result.push(this.childNodes[i]);
		}
	    }
	    else{
		for (var i = 0; i < this.childNodes.length; i++){
		    var node = this.childNodes[i];
		    if (node.nodeType == 1){
			if (node.is(path)){
			    result.push(node);
			}
		    }
		}
		
	    }
	    return result;
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
	    try{
		return this.querySelector(path);
	    }
	    catch(e){
		L.LogError(e, "InvalidSelector: " + path); 
	    }
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
	    if (val == undefined)
	    {
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
	
	findParents : function(path){
	    var parent = this.parentNode;
	    var arr = W.WrapArray([]);
	    while(parent != null && parent.is != undefined){
		if (parent.is(path)){
		    arr.push(parent);
		}
		parent = parent.parentNode;
	    }
	    return arr;
	},
	
	findAll : function(path,wrap){
	    var elems = document.querySelectorAll(path);
	    if (wrap == false){
		return elems; 
	    }
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
	
	ada : function(tag){
	    for (var i = 0; i < tag.length; i++){
		this.appendChild(tag[i]);
	    } 
	    return tag;
	},
	
	add : function(tag){
	    if (!Check(tag)) return null;
	    var type = typeof(tag);
	    if (type == "string"){
		tag = W.div("", tag);
		var child = tag.firstChild;
		while (child != null)
		{
		    var next = child.nextSibling;
		    this.add(child);
                                          if (next == null) break;  
                            child = next;
		}		
		return child;
	    }
	    if (tag.isElemsArray){
		for (var i = 0; i < tag.length; i++){
		    this.appendChild(tag[i]);
		}  
		if (tag.length == 1){
		    return tag[0];
		}
		return tag;
	    }		        
	    this.appendChild(tag);
	    //W.OnNodeInserted(tag);
	    return tag;
	},
	
	adf : function(tag)
	{
	    if (!Check(tag)) return null;
	    var type = typeof(tag);
	    if (type == "string"){
		tag = W.div("", tag);
		return this.adf(WrapArray(tag.childNodes));
	    }
	    if (tag.isElemsArray){
		for (var i = tag.length-1; i >= 0; i--){
		    this.adf(tag[i]);
		}  
		if (tag.length == 1){
		    return tag[0];
		}
		return tag;
	    }		        
	    this.insert(tag);
	    //W.OnNodeInserted(tag);
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
	    if (this.mozMatchesSelector){
		return this.mozMatchesSelector(selector);
	    }
	    if (this.webkitMatchesSelector){
		return this.webkitMatchesSelector(selector);
	    }
	    return W.MatchesSelector(this, selector);
	},
	
	isChildOf : function(element){
	    var parent = this.parentNode;
	    while(parent != null){
		if (parent == element){
		    return true;
		}
		parent = parent.parentNode;
	    }
	    return false;
	},
	
	isParentOf : function(element){
	    return element.isChildOf(this);
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
	    return this.insertBefore(elem, this.firstChild);
	},
	
	insertTo : function(elem){
	    if (typeof(elem) == "String")
		elem = document.querySelector(elem);
	    return elem.insert(this);
	}, 
	
	show : function(){
	    this.rcs("invisible");
	    this.cls("visible");
	},
	
	toggle : function(cls){
	    if (Check(cls)){
		if (this.has(cls))
		    this.rcs(cls);
		else
		    this.cls(cls);
	    }
	    else{
		if (this.has("invisible"))
		    this.show();
		else
		    this.hide();
	    }
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
    }	
}
else{
    L.LogError("reinitializing W!"); 
}

if (window.E == undefined || window.E == null || !window.E.IsOlmObject) {
    
    E = {
	Init : function(){
	    if (E.initialized) return;
		L.LogInfo("E initialized!");
	    E.initialized = true; 
	},
	
	Debug : false,
	
	Events : {},
	
	IsOlmObject : true,
	
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
	    if (!Check(handler)){
		L.LogError("Handler is undefiend: " + name + ":" + condition);
		return;
		    }
	    var event = E.Events[name];
	    if (event == undefined) {
		L.LogError("EVENT: Not found! " + name, null, "events", "System.JS.js"); 
		return;
		    }
	    event.add(handler, condition);
	    var fired = event.fired(condition);
	    if (fired > 0){
		
		E.Events[name].handle(handler, condition, E.Log[fired].argument);
		
	    }
	}
    }
	
	
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
		var str = this.eventName + ":" + argument1;
		str.argument = argument2;
		E.Log.push(str);
		if (E.Debug)
		    L.LogInfo("EVENT: " + this.eventName + " : " + argument1 + " : " + argument2, "System.JS.js", "events");
		for (var i=0; i < this.handlers.length; i++){
		    if (this.handlers[i] == null) continue;
			this.handler = this.handlers[i]; 
		    if (this.handler.condition != undefined && this.handler.condition != null){
			if (this.handler.condition == argument1){
			    this.result = this.handle(this.handler, argument1, argument2);
			    if (E.Debug)
				L.LogInfo("HANDLER: " + this.eventName + " : " + argument1 + " : " + this.handler.condition, "System.JS.js", "events");
			}
		    }
		    else{
			this.result = this.handle(this.handler, argument1, argument2);
			if (E.Debug)
			    L.LogInfo("HANDLER: " + this.eventName + " : " + argument1, "System.JS.js", "events");
		    }
		    if (this.result == "stop"){
			return; 
			    }
		}
	    },
	    
	    isFired : function(condition){
		return E.Log.indexOf(this.eventName + ":" + condition);
	    },
	    
	    fired : function(condition){
		return E.Log.indexOf(this.eventName + ":" + condition);
	    },
	    
	    handle : function(handler, argument1, argument2) {
		if (!Check(handler))
		{
		    if (E.Debug)
			L.LogError("HANDLER: " + this.eventName + " : " + argument1 + " : Undefined", null, "events", "System.JS.js");
		    return;
			}
		try{
		    
		    if (typeof(handler) != "function"){
			return handler[this.eventName]();
		    }
		    return this.handler(argument1, argument2);	
		}
		catch (e){
		    L.LogError(e, this.eventName, "events", "System.JS.js");
		}
	    },
	    
	    add : function(handler, condition) {
		if (condition != undefined){
		    handler.condition = condition;
		} 
		this.handlers.push(handler);  
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


if (window.L == undefined || window.L == null || !window.L.IsOlmObject) { 
    
    L = {    
	IsOlmObject : true,
	
	
	Init : function(){
	    if (L.initialized) return;
		E.Create(L, "OnError");
	    L.Log = W.div("log");
	    L.LogInfo("L initialized!");   
	    L.initialized = true;
	},
	
	LogInfo: function(str, module, type){
	    L.LogItem(module, str, "info", type);
	    if (window.console == undefined || window.console == null) return;
		if (module != undefined && module != null)
		{
		    console.info(str); 
		}
	    else
		console.info(str);
	},
	
	LogObject: function(obj, module, type){
	    if (window.console == undefined || window.console == null) return;
		console.info(obj);
	},
	
	LogWarn: function(str, module, type){
	    
	    L.LogItem(module, str, "warn", type);
	    if (window.console == undefined || window.console == null) return;
		if (module != undefined && module != null)
		{
		    console.warn(str); 
		}
	    else
		console.warn(str);
	},
	
	LogError: function(e, m, module, type){
	    L.LogItem(module, e + " : " + module, "err", type);
	    if (window.console == undefined || window.console == null) return;
		L.OnError(e, m);
	    if (Check(module)){
		m = module + ": " + m; 
	    }
	    console.error(e, m);
	},
	
	LogItem : function(module, message, type, itemType){
	    if (L.Log == undefined) return;
		var item = W.div("item");
	    item.cls(type);
	    if (Check(itemType)){
		item.cls(itemType);
	    }
	    item.attr("module", module);
	    item.attr("itemType", itemType);
	    item.html(message + "");
	    item.module = module;
	    item.message = message;
	    item.logtype = type;
	    item.itemtype = itemType;
	    L.Log.add(item);
	},
    }
	}
else{
    L.LogError("reinitializing L!"); 
}

L.LogInfo("W, E, L created");

W.Init();
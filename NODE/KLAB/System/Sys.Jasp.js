 Parser = {};

Parser.Init = function(){
    Parser.Start(WS.Body);
    if (Parser.oninit){
	Parser.oninit();
    }
};



Parser.Start =  function(elem){
    var nodes = [];
    nodes.maxLevel = -1;
    for (var op in Parser.operators){
	if (elem.is(op)){
	    Parser.operators[op](elem);
	    elem.jaspElem = true;
	    elem.parsed = true;
	    nodes.push(elem);
	    nodes.maxLevel = 0;
	}	
	var elems = elem.all(op);
	for (var i = 0; i < elems.length; i++){
	    Parser.operators[op](elems[i]);
	    elems[i].jaspElem = true;
	    elems[i].parsed = true;
	    nodes.push(elems[i]);
	}
    }
    return nodes;
};

Parser.ParseLink = function(domLink){
    var link = { };
    link.path = domLink;
    if (domLink.start("/")){
	link.type = 'xpath';
	link.get = Parser.XPathGetter;
	return link;
    };
    if (domLink.start("$")){
	link.type = 'js';
	link.get = Parser.JsGetter;
	return link;
    };
    if (domLink.start("http://")){
	link.type = 'url';
	link.get = Parser.UrlGetter;
	return link;
    };
    if (domLink.start("%")){
	link.type = 'file';
	link.get = Parser.FileGetter;
	return link;
    };
    link.type = 'css';
    link.get = Parser.CssGetter;
    return link;
};

Parser.XPathGetter = function(){
    
};

Parser.JsGetter = function(){
    
};

Parser.UrlGetter = function(){
    
};

Parser.FileGetter = function(){
    
};

Parser.CssGetter = function(){
    return document.querySelectorAll(this.path);
};

Parser.operators = {};

Parser.operators[".dom-forward"] = function(elem){
    elem.domTarget = Parser.ParseLink(elem.get("@dom-link"));
    elem.onSetContent = Parser.ProcessContent;
    elem.onAddElement = Parser.Forward;
    elem.binded = true;
};

Parser.Forward = function(elem){
    var obj = this.domTarget.get();
    switch(this.domTarget.type){
	case 'css': 
	    if (obj.length > 0){
		obj[0].add(elem);
		return false;
	    }
	    break;
    }
    return true;
}
    
Parser.operators[".dom-getter"] = function(elem){
    elem.domTarget = Parser.ParseLink(elem.get("@dom-link"));
    elem.onAddElement = Parser.Terminator;
    elem.onSetContent = Parser.Terminator;
    elem.binded = true;
};

Parser.Getter = function(elem){
    var obj = this.domTarget.get();
    switch(this.domTarget.type){
	case 'css': 
	    if (obj.length > 0){
		obj[0].add(elem);
		return false;
	    }
	    break;
    }
    return true;
}
    
Parser.Terminator = function(elem){
   return false;
}
    
Parser.ProcessContent = function(elem){
   var elems = Parser.Start(elem);
   //for (var i = 0; i < elems)
   return true;
}
    
    
WS.DOMload(Parser.Init); 
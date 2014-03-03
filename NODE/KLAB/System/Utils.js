function Check(arg){
    return arg != undefined && arg != null; 
}

function check(arg){
    return arg != undefined && arg != null; 
}

Array.prototype.Contains = Array.prototype.contains = function(value){
    return this.indexOf(value) >= 0;
}

String.prototype.Contains = function(str) {
    var type = typeof(str);
    if (type == "string"){
        return this.indexOf(str) >= 0;
    }
    if (str.length != undefined){
	for (var i = 0; i < str.length; i++) {
	    if (this.indexOf(str[i]) >= 0) return true;
	}
    }    
    return false;
};


String.prototype.endsWith = String.prototype.end = String.prototype.ends = function(str) 
{
    return this.indexOf(str) == this.length - str.length - 1;
};

function StringSelector(){
    return DOM(this);
};

String.prototype.__defineGetter__("sel", StringSelector);

String.prototype.contains = String.prototype.has = function(substr){
    return this.indexOf(substr) > -1;
};  

String.prototype.start = function(str){
    return this.indexOf(str) == 0;
};


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
};
    
function AArray(){
    var arr = [];  
    
    arr.uadd = function(name){
	if (this.contains(name)) return null;
	this.push(name);
	return this.length;
    };
    
    arr.contains = function(name){
	return this.indexOf(name) >= 0;
    };
    
    arr.add = function(name, elem){
	
	if (this.objects == undefined || this.objects == null)
	{
	    this.objects = {};
	}
	var obj = this.objects[name];
	if (obj == undefined || obj == null)
	{
	    this.push(name);
	    this.objects[name] = elem;
	}
	if (elem == undefined || elem == null){
	    this.del(name);
	}    
	return this.length;
    };
    
    arr.get = function(name){
	if (this.objects == undefined || this.objects == null)
	{
	    this.objects = {};
	}
	var obj = this.objects[name];
	if (obj != undefined && obj != null)
	{
	    return obj;
	}
	return null;
    };
    
    arr.del = function(name){
	if (this.objects == undefined || this.objects == null)
	{
	    return this.length;
	}
	var obj = this.objects[name];
	if (obj != undefined && obj != null)
	{
	    this.objects[name] = undefined;
	    this.remove(name);
	}
	return this.length;
    };
    
    arr.insert = function(index, name, elem){
	if (this.objects == undefined || this.objects == null)
	{
	    return this.length;
	}
	if (index == 0 && this.length == 0){
	    this.add(name, elem); 
	}
	if (index >= 0 && index < this.length)
	{
	    this.objects[name] = elem;
	    var other = this.slice(index);
	    this[index] = name;
	    index++;
	    for (var i = 0; i < other.length; i++){
		this[index + i] = other[i];
	    }
	}
	return this.length;
    };
    
    return arr;
}


Using = using = function(name){
    var obj = window[name.toLowerCase()];
    if (obj){
	if (window.debug && window.L) L.Warn("Reinitializing " + name + "!");
	return true;    
    }
    else{
	SetAllCaseProperty(window, {}, name);
	return false;
    }
};

UsingDOM = usingDOM = function(name, sname){
    var lname = name.toLowerCase();
    var obj = DOM.get("." + lname + ".provider");
    if (obj){
	if (check(sname)){
	    SetAllCaseProperty(window, obj, sname);
	}
	else{
	    SetAllCaseProperty(window, obj, name);
	}
	if (window.debug && window.L){
	    if (L) L.Warn("Reinitializing " + name + "!");
	}
	return true;    
    }
    else{
	obj = DOM.div("." + lname + ".provider.system-object");	
	Body._add(obj);
	if (check(sname)){
	    SetAllCaseProperty(window, obj, sname);
	}
	else{
	    SetAllCaseProperty(window, obj, name);
	}
	return false;
    }
};

SetAllCaseProperty = function(obj, value, name){
    var lname = name.toLowerCase();
    var hname = name.toUpperCase();
    obj[lname] = value;
    obj[hname] = value;
    obj[name] = value;
}
    
Exists = exists = function(name){
    var lname = name.toLowerCase();
    var obj = DOM.get("." + lname + ".provider");
    if (obj){
	if (window[lname] != obj){
	    SetAllCaseProperty(window, obj, name);
	}
	return true;    
    }
    throw name + " not exists in modules!";
    return false;
};
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    

    
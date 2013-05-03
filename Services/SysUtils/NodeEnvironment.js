require = function(){
	return { resolve : function(){} };
}

log = function(){
	var m = "";
	for (var i = 0; i < arguments.length; i++){
		m += arguments[i] + " ";
	}
	DOM.add(DOM.div(".log", m));
}

logJSON = function(){
	var m = "";
	for (var i = 0; i < arguments.length; i++){
		var item = arguments[i];
		if (typeof(item) == "object") item = JSON.stringify(item);
		m += item + " ";
	}
	DOM.add(DOM.div(".log", m));
}

global = window;

module = {};

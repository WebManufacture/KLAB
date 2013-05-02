var paths = require('path');
require(paths.resolve("./Modules/Node/utils.js"));

global.ChannelMessage = function(descriptor){
	/*var matches = ChannelMessage.RegExp.exec(path);
	if (!matches) throw "Path " + path + " is not correct for message";
	this.path = matches[1];
	this.id = matches[2];
	this.tags = matches[3].split(".").splice(1);
	if (this.path == undefined || this.path == ""){
		this.path = "?";	
	}*/
	this.descriptor = descriptor;
	this.type = "?";
	this.tags = [];	
	if (descriptor){
		descriptor = descriptor.split(".");
		if (descriptor.length > 0){
			if (descriptor[0] != ""){
				this.type = descriptor[0];
			}
			descriptor.shift();
			this.tags = descriptor;
		}
	}
}

//ChannelMessage.RegExp = /^((?:(?:[a-z\d\-_])*\/?)*)?(#[a-z\d\-_]+)?((?:\.[a-z\d\-_]+)*$)/;
//ChannelMessage.RegExp = /^((?:(?:[a-z\d\-_])*(?:\.[a-z\d\-_]+)*\/?)*)?$)/;
//ChannelMessage.RegExp.compile();
	
global.Channel = function(name){
	this.routes = { "*" : {}, "." : [] };
}

//Channel.RegExp = /^((?:(?:[a-z\d\-_*])*\/?)*)?([<>])?(#[a-z\d\-_]+)?((?:\.[a-z\d\-_]+)*$)/;
//Channel.RegExp.compile();

Channel.prototype.on = Channel.prototype.for = Channel.prototype.subscribe = Channel.prototype.add = Channel.prototype.addListener = function(route, callback){
	if (!route) route = "*";
	route = route.split(".");
	if (route.length > 0){
		if (route[0] == ""){
			route[0] = "*";
		}
		for (var i = 0; i < route.length; i++){
			if (route[i] == "."){
				route[i] = "";
			}
		}
		var type = route.shift();
		if (!this.routes[type]){
			this.routes[type] = { };
		}
		return this._addRouteHandler(this.routes[type], route, callback);
	}
	return null;
};

Channel.prototype.clear = Channel.prototype.removeListeners = function(route){
	
};

		
Channel.prototype._addRouteHandler = function(root, route, callback){
	if (!root) return null;
	if (!route) return null;
	if (!callback) return null;
	if (route.length == 0) {
		if (!root["."]){
			root["."] = [];
		}
		root["."].push(callback);
		return callback;
	}
	var tag = "." + route.shift();
	if (tag == ".") return this._addRouteHandler(root, route, callback);
	var inner = root[tag];
	if (!inner){
		inner = root[tag] = { };
	}
	return this._addRouteHandler(inner, route, callback);
};


Channel.prototype.once = Channel.prototype.single = function(path, callback){
	callback = this.on(path, callback);
	if (callback){
		callback.callMode = "single";
	}
	return callback;
}

Channel.prototype.emit = Channel.prototype.send = function(message){
	if (!message || typeof(message) != "string") return;
	var type = "?";
	var tags = [];	
	message = message.split(".");
	if (message.length > 0){
		if (message[0] != ""){
			type = message[0];
		}
		message.shift();
		tags = message;
	}
	var arr = this.routes[type];
	if (arr){
		this._sendInternal(arr, tags, arguments);
	}
	arr = this.routes["*"];
	if (arr){
		this._sendInternal(arr, tags, arguments);
	}	
	return;
};

Channel.prototype._sendInternal = function(root, tags, args){
	if (!root) return;
	if (!tags) return;
	this._callHandlers(root["."], args);
	for (var i = 0; i < tags.length; i++){
		if (tags[i] == "") continue;
		var inner = root["." + tags[i]];
		if (inner) {
			this._sendInternal(inner, tags.slice(0, i).concat(tags.slice(i+1)), args);
		}
	}
}

Channel.prototype._callHandlers = function(handlers, args){
	if (handlers){
		var i = 0;
		while (i < handlers.length){
			if (handlers[i] != null){
				this._callHandlerAsync(handlers[i], args);
				if (handlers[i].callMode && handlers[i].callMode == "single"){
					handlers[i] = null;
					handlers.splice(i, 1);
				}
				else{
					i++;	
				}
			}
		}
	}
}

Channel.prototype._callHandlerAsync = function(callback, args){
	setTimeout(function(){
		callback.apply(this, args);
	}, 10);
}


global.Channels = new Channel();


module.exports = global.Channels;

		
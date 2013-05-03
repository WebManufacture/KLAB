var paths = require('path');
require(paths.resolve("./Modules/Node/utils.js"));


global.Channel = function(route){
	this.name = route;
	this.routes = { "*" : {}, "." : [] };
}

//Channel.RegExp = /^((?:(?:[a-z\d\-_*])*\/?)*)?([<>])?(#[a-z\d\-_]+)?((?:\.[a-z\d\-_]+)*$)/;
//Channel.RegExp.compile();

Channel.RouteNode = function(route){
	this.source = route;
	this.type = "*";
	this.tags = [];
	this.components = [];
	if (route){
		route = route.split(".");
		if (route.length > 0){
			if (route[0] != ""){
				this.type = route[0].toLowerCase();
			}
			route.shift();
			this.components.push(this.type);
			var i = 0;
			while (i < route.length){
				if (route[i] == ""){
					route.splice(i, 1);
				}
				else{
					route[i] = route[i].toLowerCase();
					this.components.push("." + route[i]);
					i++;	
				}
			}
			this.tags = route;
		}
	}
};

Channel.RouteNode.prototype.toString = function(){
	var str = this.type;
	if (this.tags.length > 0){
		str += "." + this.tags.join(".");
	}
	return str;
};

Channel.Route = function(route){
	if (!route || route == "") return null;
	if (typeof route == "object" && route instanceof Channel.RouteNode){
		this.source = route.source;
		this.push(route);	
		return;
	}
	if (route.indexOf("/") != 0){
		route = "/" + route;	
	}
	this.source = route;
	this.nodes = route.split("/");
	this.nodes.shift();
	for (var i = 0; i < this.nodes.length; i++){
		if (this.nodes[i] == "") this.nodes[i] = "*";
		this.nodes[i] = new Channel.RouteNode(this.nodes[i]);
	}
};


Channel.Route.prototype.toString = function(){
	var str = "";
	for (var i = 0; i < this.nodes.length; i++){
		str += "/" + this.nodes[i].toString();
	}
	return str;
};

Channel.Route.prototype.toString = function(){
	
};
		

//ChannelMessage.RegExp = /^((?:(?:[a-z\d\-_])*\/?)*)?(#[a-z\d\-_]+)?((?:\.[a-z\d\-_]+)*$)/;
//ChannelMessage.RegExp = /^((?:(?:[a-z\d\-_])*(?:\.[a-z\d\-_]+)*\/?)*)?$)/;
//ChannelMessage.RegExp.compile();
	
Channel.prototype.parsePath = function(route){
	if (!route) return null;
	if (typeof route == "string") return new Channel.Route(route);
	if (typeof route == "object"){
		if (route instanceof Channel.RouteNode){
			return new Channel.Route(route);
		}		
		if (route instanceof Channel.Route){
			return route;
		}
	}
	return null;
}
		
Channel.prototype.on = Channel.prototype.for = Channel.prototype.subscribe = Channel.prototype.add = Channel.prototype._addListener = function(route, callback){
	route = this.parsePath(route);
	if (!route) return null;
	if (route.nodes.length == 0) return null;
	var node = route.nodes.shift();
	if (route.nodes.length > 0){
		if (typeof(callback) == "object"){
			return this._addTunnel(this.routes, node, callback);
		}
		if (typeof(callback) == "function"){
			var channel = this._addTunnel(this.routes, node, new Channel());
			return channel.on(route, callback);
		}		
		return null;
	}
	else{
		return this._addRouteHandler(this.routes, node.components, callback);
	}
};
		
Channel.prototype._addRouteHandler = function(root, components, callback){
	if (!root) return null;
	if (!components) return null;
	if (!callback) return null;
	if (components.length == 0) {
		if (!root["."]){
			root["."] = [];
		}
		root["."].push(callback);
		return callback;
	}
	var component = components.shift();
	var inner = root[component];
	if (!inner){
		inner = root[component] = { };
	}
	return this._addRouteHandler(inner, components, callback);
};
		
Channel.prototype._addTunnel = function(root, node, channel){
	if (!root) return null;
	if (!node) return null;
	var components = node.components;
	if (components.length == 0) {
		if (!root[">"]){
			root[">"] = [];
		}
		root[">"].push(channel);
		return channel;
	}
	var component = components.shift();
	var inner = root[component];
	if (!inner){
		inner = root[component] = { };
	}
	return this._addTunnel(inner, node, channel);
};

Channel.prototype.clear = Channel.prototype._removeListeners = function(route){
	route = this.parsePath(route);
	if (!route) return null;
	if (route.nodes.length == 0) return null;
	var node = route.nodes.shift();
	if (route.nodes.length > 0){
		return this._removeTunnel(this.routes, route);
	}
	else{
		return this._removeRouteHandler(this.routes, node.components);
	}	
	return false;
};

Channel.prototype._removeTunnel = function(root, route){
	if (!root) return null;
	if (!route) return null;
	var components = route[0].components;
	if (components.length == 0) {
		var channels = root[">"];
		if (channels){
			for (var i = 0; i < channels.length; i++){
				channels[i].clear(route);
			}
		}
	}
	var component = components.shift();
	var inner = root[component];
	if (!inner){
		inner = root[component] = { };
	}
	return this._removeTunnel(inner, route);
};

Channel.prototype._removeRouteHandler = function(root, nodes){
	if (!root) return null;
	if (!nodes) return null;
	if (nodes.length == 0) {
		if (!root["."]) return false;
		root["."] = [];
		return true;
	}
	var tag = "." + nodes.shift();
	if (tag == ".") return this._removeRouteHandler(root, nodes);
	var inner = root[tag];
	if (!inner) return false;
	return this._removeRouteHandler(inner, nodes);
};


Channel.prototype.once = Channel.prototype._single = function(path, callback){
	callback.callMode = "single";
	callback = this.on(path, callback);
	return callback;
}

Channel.prototype.emit = Channel.prototype._send = function(message){
	var route = this.parsePath(message);
	if (!route) return;
	if (route.nodes.length == 0) return null;
	var node = route.nodes.shift();
	if (route.nodes.length > 0){
		return this._sendToTunnel(this.routes, node, route, arguments);
	}
	else{
		route.node = new Channel.RouteNode(node.source);
		arguments[0] = route;
		var type = node.components.shift();
		var arr = this.routes[type];		
		if (arr){
			this._sendInternal(arr, node.tags, arguments);
		}
		arr = this.routes["*"];
		if (arr){
			this._sendInternal(arr, node.tags, arguments);
		}	
	}
	return node;
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
};

Channel.prototype._sendToTunnel = function(root, node, route, args){
	if (!root) return null;
	if (!node) return null;
	if (!route) return null;
	var components = node.components;
	if (components.length == 0) {
		var channels = root[">"];
		if (channels){
			var params = [];
			params.push(route);
			for (var i = 1; i < args.length; i++){
				params.push(args[i]);
			}
			for (var i = 0; i < channels.length; i++){
				channels[i].emit.apply(channels[i], params);
			}
		}
	}
	var component = components.shift();
	var inner = root[component];
	if (!inner){
		return null;
	}
	return this._sendToTunnel(inner, node, route, args);
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
		callback.apply(Channels, args);
	}, 10);
}


global.Channels = new Channel("/");


module.exports = global.Channels;
		
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
	if (!callback) return null;
	callback.id = (Math.random() + "").replace("0.", "handler");
	if (route.nodes.length == 0) return null;
	var node = route.nodes.shift();
	if (typeof(callback) == "object"){
		return this._addTunnel(this.routes, node, route, callback);
	}
	if (typeof(callback) == "function"){
		if (route.nodes.length > 0){		
			return this._addTunnel(this.routes, node, route, callback);
		}
		else{
			return this._addRouteHandler(this.routes, node.components, callback);
		}
	}
	return null
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
		
Channel.prototype._addTunnel = function(root, node, route, channel){
	if (!root) return null;
	if (!node) return null;
	var components = node.components;
	if (components.length == 0) {
		if (!root[">"]){
			root[">"] = [];
		}
		var channels = root[">"];
		if (typeof(channel) == "object"){
			channels.push(channel);
		}
		if (typeof(channel) == "function"){
			if (channels.length == 0) {
				channels.push(new Channel());
			}
			for (var i = 0; i < channels.length; i++){
				channels[i].on(route, channel);
			}
		}
		return channel;
	}
	var component = components.shift();
	var inner = root[component];
	if (!inner){
		inner = root[component] = { };
	}
	return this._addTunnel(inner, node, route, channel);
};


Channel.prototype.removeRoute = function(route){
	route = this.parsePath(route);
	if (!route) return null;
	if (route.nodes.length == 0) return null;
	var node = route.nodes.shift();
	if (route.nodes.length > 0){
		
	}
	else{
		return this._removeRoute(this.routes, node.components);
	}	
	return false;
};


Channel.prototype._removeRoute = function(root, nodes){
	if (!root) return null;
	if (!nodes) return null;
	if (nodes.length == 0){
		return true;	
	}
	for (var i = 0; i < nodes.length; i++){
		var inner = root[nodes[i]];
		if (inner) {
			if (this._removeRoute(inner, nodes.slice(0, i).concat(nodes.slice(i+1)), args)){
				delete root[nodes[i]];
			}			
		}
	}
	return false;
};

Channel.prototype.clear = Channel.prototype._removeListeners = function(route, handler){
	route = this.parsePath(route);
	if (!route) return null;
	if (route.nodes.length == 0) return null;
	var node = route.nodes.shift();
	if (route.nodes.length > 0){
		return this._removeTunnel(this.routes, node.components, route, handler);
	}
	else{
		return this._removeHandler(this.routes, node.components, handler);
	}	
	return false;
};


Channel.prototype._removeTunnel = function(root, nodes, route, handler){
	if (!root) return null;
	if (!route) return null;
	if (!nodes) return null;
	if (nodes.length == 0) {
		var channels = root[">"];
		if (channels){
			for (var i = 0; i < channels.length; i++){
				channels[i].clear(route, handler);
			}
			return true;
		}
	}
	var component = nodes.shift();
	var inner = root[component];
	if (!inner) return false;
	return this._removeTunnel(inner, nodes, route);
};


Channel.prototype._removeHandler = function(root, nodes, handler){
	if (!root) return null;
	if (!nodes) return null;
	if (nodes.length == 0) {
		if (!root["."]) return false;
		var i = 0;
		if (handler){
			var handlers = root["."];
			while (i < handlers.length){
				if (typeof handler == "function"){
					if (handlers[i] == handler){
						handlers.splice(i, 1);
						continue;
					}		
				}
				if (typeof handler == "string"){
					if (handlers[i].id == handler){
						handlers.splice(i, 1);
						continue;
					}	
				}
				i++;	
			}		
		}
		else{
			root["."] = [];
		}
		return true;
	}
	var tag = nodes.shift();
	var inner = root[tag];
	if (!inner) return false;
	return this._removeHandler(inner, nodes, handler);
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
			this._sendInternal(route, arr, node.tags, arguments);
		}
		arr = this.routes["*"];
		if (arr){
			this._sendInternal(route, arr, node.tags, arguments);
		}	
	}
	return node;
};

Channel.prototype._sendInternal = function(route, root, tags, args){
	if (!root) return;
	if (!tags) return;	
	this._callHandlers(route, root["."], args);
	for (var i = 0; i < tags.length; i++){
		if (tags[i] == "") continue;
		var inner = root["." + tags[i]];
		if (inner) {
			this._sendInternal(route, inner, tags.slice(0, i).concat(tags.slice(i+1)), args);
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

Channel.prototype._callHandlers = function(route, handlers, args){
	if (handlers){
		var i = 0;
		while (i < handlers.length){
			if (handlers[i] != null){
				this._callHandlerAsync(route, handlers[i], args);
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

Channel.prototype._callHandlerAsync = function(route, callback, args){
	var channel = this;
	setTimeout(function(){
		callback.apply(channel, args);
	}, 10);
}


global.Channels = new Channel("/");


module.exports = global.Channels;
		
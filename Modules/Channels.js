global.Channel = function(route){
	this.name = route;
	this.routes = { "*" : {}, "." : [] };
}

//Channel.RegExp = /^((?:(?:[a-z\d\-_*])*\/?)*)?([<>])?(#[a-z\d\-_]+)?((?:\.[a-z\d\-_]+)*$)/;
//Channel.RegExp.compile();

Channel.RouteNode = function(route){
	route = route.replace(/\$/ig, ""); //Чтобы предотвратить перезапись внутренних функций в узлах
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
	this.is = function(other){
		other = Channel.ParsePath(other);
		if (other.type != "*" && other.type != this.type) return false;
		for (var i = 0; i < other.tags.length; i++){
			if (this.source.indexOf("." + other.tag[i]) < 0) return false;
		}
	};
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
	this.clone = function(){
		return new Channel.Route(this.source);
	}
	this.is = function(other){
		other = Channel.ParsePath(other);
		if (this.nodes.length < other.nodes.length) return false;
		for (var i = 0; i < other.nodes.length; i++){
			if (!this.nodes[i].is(other.nodes[i])) return false;
		}
		return true;
	};
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
	
Channel.ParsePath = function(route){
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
	route = Channel.ParsePath(route);
	if (!route) return null;
	if (!callback) return null;
	callback.id = (Math.random() + "").replace("0.", "handler");
	var path = [];
	var root = this._getRoute(this.routes, route.clone(), path);
	var result = true;
	for (var i = 0; i < path.length; i++){
		var tunnels = path["$tunnels"];
		if (tunnels){
			var j = 0;
			while (j < tunnels.length){
				var res = tunnels[j].call(this, route, path[i]);
				if (res == null){
					tunnels.splice(j, 1);
				}
				else
				{
					if (res == false){
						result = false;
						break;
					}
				}
				j++;
			}
			if (result == false) break;
		}
	}
	if (root && result){
		return this._addRouteHandler(root, callback);
	}
	return null;
};
		
Channel.prototype._addRouteHandler = function(root, callback){
	if (!root) return null;
	if (!callback) return null;
	if (root) {
		if (!root["."]){
			root["."] = [];
		}
		root["."].push(callback);
		return callback;
	}
	return null;
};

Channel.prototype._getRoute = function(root, route, path){
	if (!root) return null;
	if (!route) return null;
	var node = route.nodes.shift();
	if (!node){
		return null;
	}
	root = this._createRoute(root, node, path);
	if (root){
		if (route.nodes.length > 0){
			if (!root[">"]){
				root[">"] = { };
			}
			return this._getRoute(root[">"], route, path);
		}
		else{
			return root;
		}
	}
	return null;
};		

Channel.prototype._createRoute = function(root, node, path){
	if (!root) return null;
	if (!node) return null;
	if (node.components.length == 0) {
		return root;
	}
	var component = node.components.shift();
	var inner = root[component];
	if (!inner){
		inner = root[component] = { };
	}
	if (path) path.push(inner);
	return this._createRoute(inner, node);
};


Channel.prototype.tunnelTo = function(route, callback){
	route = Channel.ParsePath(route);
	if (!route) return null;
	if (!callback) return null;
	var root = this._getRoute(this.routes, route)
	if (root){
		var tunnels = root['$tunnels'];
		if (tunnels){
			tunnels = root['$tunnels'] = [];
		}
		tunnels.push(callback);
		return root;
	}
	return null;
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
	route = Channel.ParsePath(route);
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

Channel.prototype.emit = Channel.prototype._send = function(route){
	var route = Channel.ParsePath(route);
	if (!route) return;
	if (route.nodes.length == 0) return null;
	var node = route.nodes[0];
	return this._sendInternal(this.routes, route.clone(), route.nodes, node.components, arguments);
};

Channel.prototype._sendInternal = function(root, route, nodes, tags, args){
	if (!root) return null;
	var component = tags.shift();
	if (root["*"]){
		this._sendInternal(root["*"], route, nodes, tags.slice(1), args);
	}
	if (root[">"] && nodes.length > 0){
		var nodes = nodes.slice(1);
		if (nodes && nodes.length > 0){
			this._sendIternal(root[">"], route, nodes, nodes[0], args);
		}
	}
	for (var i = 0; i < tags.length; i++){
		if (tags[i] == "") continue;
		var inner = root[tags[i]];
		if (inner) {
			this._callHandlers(inner["."], route, args);
			this._sendInternal(inner, route, nodes, tags[i].slice(0, i).concat(tags[i].slice(i+1)), args);
		}
	}
	return null;
};

Channel.prototype._callHandlers = function(handlers, route, args){
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
		
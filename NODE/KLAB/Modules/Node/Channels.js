require("utils.js");

global.Channels = new Channel();

module.exports = global.Channels;

global.Message = function(path){
	var matches = Message.RegExp.exec(path);
	if (!matches) throw "Path " + path + " is not correct for message";
	this.path = matches[1];
	this.modifier = matches[2];
	this.id = matches[3];
	this.tags = matches[4].split(".").splice(0, 1);
	if (this.path == undefined || this.path == ""){
		this.path = "?";	
	}
	this.nodes = this.path.split("/");
}

Message.RegExp = /^((?:(?:[a-z\d\-_])*\/?)*)?([<>])?(#[a-z\d\-_]+)?((?:\.[a-z\d\-_]+)*$)/;

Message.RegExp.compile();
	
global.Channel = function(name){
	this.routes = {};
	this.tags = {};
	this.ids = {};
}

Channel.prototype.on = Channel.prototype.for = Channel.prototype.subscribe = Channel.prototype.add = Channel.prototype.addListener = function(){
	
}


Channel.prototype.once = Channel.prototype.subscribe = Channel.prototype.add = Channel.prototype.addListener = function(){
	
}

Channel.prototype.emit = Channel.prototype.send = function(message){
	if (typeof(message) == "string"){
		message = new Message(message);
		for (var i = 1; i < arguments.length; i++){
			message.params.push(arguments[i]);
		}
	}
	if (typeof(message) == "Message"){
		
	}
}

require("./utils.js");

	
function MapNode(parentPath){
	this["/"] = [];
	this["<"] = [];
	this[">"] = [];
	this["//"] = parentPath;
};

Router = {
	HandlersIndex : [],	
	Handlers : {},
	
	"for" : function(path, handler){
		if (!this.Handlers[phase]){
			this.HandlersIndex.push(phase);
			this.Handlers[phase] = new MapNode("/");
		}
		this._addHandler(this.Handlers[phase], path, handler);
	},
	
	map : function(phase, map){
		if (!this.Handlers[phase]){
			this.HandlersIndex.push(phase);
			this.Handlers[phase] = new MapNode("/");
		}
		if (map){
			for (var path in map){
				this._addHandler(this.Handlers[phase], path, map[path]);
			}
		}
	},
	
	GetContext: function(req, res, rootPath){
		return  new Context(req, res, rootPath);
	},
	
	Process: function(context){
		for (var i = 0; i < this.HandlersIndex.length; i++){
			var phase = this.HandlersIndex[i];
			context.phases.push(phase);
			context.callPlans[phase] = [];
			context.getCallPlan(context.callPlans[phase], this.Handlers[phase], 0);
			context.log("callPlan[", phase, "] : ", context.callPlans[phase].length);
		}	
		context.callPhaseChain(0);
		return context;
	},
	
	_addHandler : function(root, path, handler){
		if (!handler){
			return null;
		}
		if (!path || path == '') path = '/';
		if (!path.start("/")) path = '/' + path;
		var parts = path.split('/');
		parts.shift();
		var lastPart = parts[parts.length - 1];
		if (lastPart == "<"){
			parts = parts.slice(0, parts.length - 1);
			return this._addHandlerInternal(root, parts, handler, '<');
		}
		if (lastPart == ">"){
			parts = parts.slice(0, parts.length - 1);
			return this._addHandlerInternal(root, parts, handler, '>');
		}
		return this._addHandlerInternal(root, parts, handler, '/');
	},
	
	_addHandlerInternal : function(root, parts, handler, endHandlerSymbol){
		//console.log("calling addhandler! " + JSON.stringify(parts) + " " + endHandlerSymbol);
		var parentPath = root["//"];
		var cg = root;
		var ch = null;
		for (var i = 0; i < parts.length; i++){
			var p = parts[i];
			if (p == ""){
				break;	
			}
			parentPath = parentPath + p + "/";
			if (!cg[p + "/"]){
				cg[p + "/"] = new MapNode(parentPath);
			}
			cg = cg[p + "/"];
		}
		if (!ch){
			ch = cg[endHandlerSymbol];	
		}
		if (typeof (handler) == "object" && handler instanceof Array){
			for (var i = 0; i < handler.length; i++){
				ch.push(handler[i]);
			}
		}
		else{
			ch.push(handler);
		}
		return cg;
	},
};	

function Context(req, res, rootPath){
	this.url = require('url').parse(req.url, true);
	this.urlString = "http://" + req.headers.host + req.url;
	this.req = req;
	this.res = res;
	this.query = this.url.query;
	this.debugMode = req.headers["debug-mode"];
	this.logs = [];
	if (!this.url.pathname.end("/")) this.url.pathname += "/";
	//console.log(this.url.pathname);
	this.pathName = this.url.pathname;
	if (rootPath){
		this.rootPath = rootPath.remove(0);
		this.pathName = this.pathName.replace(this.rootPath, "");
	}
	this.paths = this.pathName.split('/');
	this.paths.shift();
	for (var i = 0; i < this.paths.length; i++){
		var p = this.paths[i];
		if (p == ""){
			this.paths = this.paths.slice(0, i);
			break;
		}
		this.paths[i] = p + "/";
	}
	this.phases = [];
	this.phaseProcessed = true;//Вообще фаза еще не обработана, но этот флаг как бы указывает, что обработана фаза предыдущая
	this.startTime = new Date();
	this.log("start: ", this.startTime);
	this.callPlans = {};
}

Context.prototype = {	
	getCallPlan : function(callPlan, mapNode, pathNum){
		if (!mapNode) {
			//this.log("CallPlan: Node not found");
			return ;	
		}
		this.getHandlers(callPlan, mapNode, mapNode[">"], ">", pathNum);
		if (pathNum < this.paths.length){
			var path = this.paths[pathNum];
			this.getCallPlan(callPlan, mapNode[path], pathNum + 1);
		}
		else{
			this.getHandlers(callPlan, mapNode, mapNode['/'], "/", pathNum);	
		}
		this.getHandlers(callPlan, mapNode, mapNode["<"], "<", pathNum);
	},
	
	getHandlers : function(callPlan, mapNode, handlers, path, pathNum){
		var result = false;
		if (handlers && handlers.length > 0){
			for (var g = 0; g < handlers.length; g++){
				var handler = handlers[g];
				if (handler){
					if (typeof handler == 'function'){
						this.log("CallPlanF ",pathNum, ": ", mapNode["//"], path);//  :", "\n   ", handler.toString());
						var hobj = {};
						hobj.handler = handler;
						hobj.pathNum = pathNum;
						hobj.node = mapNode;
						hobj.path = mapNode["//"];
						callPlan.push(hobj);
						result = true;
					}
					if (typeof handler == 'object' && typeof handler[this.req.method] == 'function'){
						this.log("CallPlanO ",pathNum, ": ", mapNode["//"], path);// :\n   ", handler[this.req.method].toString());
						var hobj = {};
						hobj.handler = handler[this.req.method];
						hobj.pathNum = pathNum;
						hobj.node = mapNode;
						hobj.path = mapNode["//"];
						callPlan.push(hobj);
						result = true;
					}
				}
				else{
					this.log("CallPlan ",pathNum, ": ", mapNode["//"], path, " NULL handler!");
				}
			}	
		}
		return result;
	},
	
	getHandlerFunc : function(handler, mapNode, path){
		return function(context){
			context.path = mapNode["//"];
			context.pathTail = context.url.pathname.replace(context.path, "");
			context.log("Calling ", context.path + path, ' with ', context.pathTail);
			return handler(context);
		}
	},
	
	callPhaseChain : function(phaseNum, numSpaces){
		
		var context = this;
		if (!numSpaces) numSpaces = 0;
		if (numSpaces > 1000){
			//this.log("Phases EXEED 100 LIMIT!");
			this._finish(500, "Phases EXEED 1000 LIMIT!");
			throw new Error("Phases EXEED 1000 LIMIT!");
			return;
		}
		if (this.completed) {
			this.log("Context completed");
			this.finishHandler(this);
			return;
		}
		if (!phaseNum){
			phaseNum = 0;
		}
			if (phaseNum < this.phases.length){			
				var phaseName = this.phases[phaseNum];
				if (this.phaseProcessed){
					this.callPlan = this.callPlans[phaseName];
					this.phaseProcessed = false;
					this.handlerNum = -1;
					//Тут должно произойти собственно выполнение найденных ф-й согласно плану вызовов.
					this.log("Phase ", phaseNum, "[", phaseName, "] Starting");
					var result = this.continue(this);
					this.log("Phase ", phaseNum, "[", phaseName, "] Called " + result);
					if (phaseNum + 1 < this.phases.length ){
						if (result){
							this.callPhaseChain(phaseNum + 1, numSpaces + 1);
						}
						else{
							setTimeout(function(){					
								context.log("New Phase ", phaseNum, " [",  context.phases[phaseNum], "] WAITING!", numSpaces);
								context.callPhaseChain(phaseNum, numSpaces + 1);
							}, 10);
						}
					}
					else{
						if (result){
							this.finishHandler(this);
						}
						else{
							setTimeout(function(){					
								context.log("New Phase ", phaseNum, "[", context.phases[phaseNum], "] WAITING!", numSpaces);
								context.callPhaseChain(phaseNum, numSpaces + 1);
							}, 10);
						}	
						return;
					}
				}
				else{
					setTimeout(function(){					
						context.log("Phase ", phaseNum, " [",  context.phases[phaseNum], "] WAITING!", numSpaces);
						context.callPhaseChain(phaseNum, numSpaces + 1);
					}, 10);
					return;
				}
			}
			else{
				if (this.phaseProcessed){
					this.finishHandler(this);
				}
				else{
					setTimeout(function(){					
						context.log("Last Phase ", phaseNum, " [", context.phases[phaseNum], "] WAITING!", numSpaces);
						context.callPhaseChain(phaseNum, numSpaces + 1);
					}, 10);
				}
				return;
			}
		this.log("Phase ", phaseNum, " Exited");
	},
	
	"continue" : function(){
		var context = this;
		if (context.phaseProcessed || context.stop){return true;}
		context.handlerNum++;
		if (context.handlerNum < context.callPlan.length){
			var hobj = context.callPlan[context.handlerNum];
			context.path = "/" + context.paths.join('');
			context.nodePath = hobj.path;
			context.pathTail = "/" + context.paths.slice(hobj.pathNum).join('');
			context.log("Calling ", context.nodePath, ' with ', context.pathTail);
			try{
				if (hobj.handler(context, context.continue) == false)
				{
					context.waiting = true;
					return false;
				}
			}
			catch (error){
				context.phaseProcessed = true;
				context._finishWithError(error);
				return true;
			}
			return context.continue(context);
		}
		else{
			context.phaseProcessed = true;
			return true;
		}
	}
	
	getLogSpaces : function(num){
		var lgstr = "";
		if (num > 20) {
			num = 20;	
			lgstr = "+";
		}
		for (var i = 1; i <= num; i++){
			lgstr += " ";
		}
		return lgstr;
	}
}

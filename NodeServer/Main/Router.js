require("./utils.js");

module.exports.Route = function(server, logger){
	log = logger;
	server.Handlers = {};
	for (var item in Router){
		server[item] = Router[item];	
	}
	server.on('request', server._process);
	return server;
};

function MapNode(parentPath){
	this["/"] = [];
	this["<"] = [];
	this[">"] = [];
	this["//"] = parentPath;
};

Router = {
	"for" : function(phase, path, handler){
		if (!this.Handlers[phase]){
			this.Handlers[phase] = new MapNode("/");
		}
		this._addHandler(this.Handlers[phase], path, handler);
	},
	
	map : function(phase, map){
		if (!this.Handlers[phase]){
			this.Handlers[phase] = new MapNode("/");
		}
		for (var path in map){
			this._addHandler(this.Handlers[phase], path, map[path]);
		}
	},
	
	
	_process: function(req, res){
		//res.setHeader("Access-Control-Allow-Origin", "*");
		//res.setHeader("Access-Control-Request-Header", "X-Prototype-Version, x-requested-with");
		res.setHeader("Content-Type", "text/html; charset=utf-8");
		req.setEncoding("utf8");
		
		var context = new Context(req, res);
		try{
			context.Process(this);			
		}
		catch (e){
			if (context.complete){
				context.finishWithError(e);
			}
			else{
				console.log(e);
			}
		}
	},
	
	_addHandler : function(root, path, handler){
		if (!path || path == '') path = '/';
		if (!path.start("/")) path = '/' + path;		
		var parts = path.split('/');
		parts.shift();
		var parentPath = '';
		var cg = root;
		var ch = null;
		for (var i = 0; i < parts.length; i++){
			var p = parts[i];
			if (p == ""){
				break;	
			}
			if (p == "*" || p == ">" || p == "<"){
				ch = cg[p];
				break;
			}
			parentPath = parentPath + "/" + p;
			if (!cg["/" + p]){
				cg["/" + p] = new MapNode(parentPath);
			}
			cg = cg["/" + p];
		}
		if (!ch){
			ch = cg["/"];	
		}
		ch.push(handler);
		return cg;
	}
};

function Context(req, res){
	this.url = require('url').parse(req.url, true);
	this.urlString = "http://" + req.headers.host + req.url;
	this.req = req;
	this.res = res;
	this.logs = [];
	if (this.url.pathname == '/')
	{
		this.paths = [];	
	}
	else
	{
		this.paths = this.url.pathname.split('/');
		this.paths.shift();
	}
	this.phases = [];
	this.phaseProcessed = true;//Вообще фаза еще не обработана, но этот флаг как бы указывает, что обработана фаза предыдущая
	this.startTime = new Date();
	this.log("start: ", this.startTime);
	this.callPlans = {};
}

Context.prototype = {	
	Process : function(router){		
		for (var phase in router.Handlers){
			this.phases.push(phase);
			this.callPlans[phase] = [];
			this.getCallPlan(this.callPlans[phase], router.Handlers[phase], 0);
			this.log("callPlan[", phase, "] : ", this.callPlans[phase].length);
		}	
		this.callPhaseChain(0);
	},
	
	getCallPlan : function(callPlan, mapNode, pathNum){
		if (!mapNode) {
			this.log("Handler not found");
			return ;	
		}
		this.getHandlers(callPlan, mapNode, mapNode[">"], ">");
		if (pathNum < this.paths.length){
			var path = this.paths[pathNum];
			this.getCallPlan(callPlan, mapNode["/" + path], pathNum + 1);
		}
		else{
			this.getHandlers(callPlan, mapNode, mapNode['/'], "/");	
		}
		this.getHandlers(callPlan, mapNode, mapNode["<"], "<");
	},
	
	getHandlers : function(callPlan, mapNode, handlers, path){
		var result = false;
		if (handlers && handlers.length > 0){
			for (var g = 0; g < handlers.length; g++){
				var handler = handlers[g];
				if (typeof handler == 'function'){
					this.log(mapNode["//"], path, "  callPlan func");//  :", "\n   ", handler.toString());
					callPlan.push(this.getHandlerFunc(handler, mapNode, path));
					result = true;
				}
				if (typeof handler == 'object' && typeof handler[this.req.method] == 'function'){
					this.log(mapNode["//"], path, "  callPlan obj");// :\n   ", handler[this.req.method].toString());
					callPlan.push(this.getHandlerFunc(handler[this.req.method], mapNode, path));
					result = true;
				}
			}	
		}
		return result;
	},
	
	getHandlerFunc : function(handler, mapNode, path){
		return function(context){
			context.path = mapNode["//"];
			context.pathTail = context.url.pathname.replace(context.path, "");
			context.log("Calling ", context.path + path);
			return handler(context);
		}
	},
	
	callPhaseChain : function(phaseNum, numSpaces){
		
		var context = this;
		if (!numSpaces) numSpaces = 0;
		if (numSpaces > 100){
			//this.log("Phases EXEED 100 LIMIT!");
			throw new Error("Phases EXEED 100 LIMIT!");
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
							context.log("Phase ", phaseNum, "[",  context.phases[phaseNum], "] WAITING!");
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
							context.log("Phase ", phaseNum, "[", context.phases[phaseNum], "] WAITING!");
							context.callPhaseChain(phaseNum, numSpaces + 1);
						}, 10);
					}	
					return;
				}
			}
			else{
				setTimeout(function(){					
					context.log("Phase ", phaseNum, "[",  context.phases[phaseNum], "] WAITING!");
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
					context.log("Phase ", phaseNum, "[", context.phases[phaseNum], "] WAITING!");
					context.callPhaseChain(phaseNum, numSpaces + 1);
				}, 10);
			}
			return;
		}
		this.log("Phase ", phaseNum, " Exited");
	},
	
	"continue" : function(){
		var context = this;
		if (context.phaseProcessed){return true;}
		context.handlerNum++;
		if (context.handlerNum < context.callPlan.length){
			var handler = context.callPlan[context.handlerNum];
			try{
				if (handler(context, context.continue) == false) return false;
			}
			catch (error){
				context.phaseProcessed = true;
				context.finishWithError(error);
				return true;
			}
			return context.continue(context);
		}
		else{
			context.phaseProcessed = true;
			return true;
		}
	},
	
	finishHandler : function(context){
		context.log("end: ", new Date());
		if (context.completed){
			context._finish(context.endStatus, context.endResult);
		}
		else{
			context._finish(404, "No handlers found for path " + context.url.pathname);
		}
	},
	
	finish : function(status, result){
		if (this.completed) return;
		this.completed = true;
		this.endStatus = status;
		this.endResult = result;
	},
	
	_finish : function(status, result){
		if (this.req.method == 'HEAD' || this.req.method == "OPTIONS"){
			return this._finishHead(status, result);
		}
		return this._finishBody(status, result);
	},	
	
	_finishHead : function(status, result){			
		this.completed = true;
		this.res.writeHead(status, result + "");
		this.res.end();
	},
	
	_finishBody : function(status, result){
		this.completed = true;
		this.res.setHeader("Start", this.startTime);
		this.res.setHeader("Finish", new Date());
		var dm = this.req.headers["debug-mode"];
		if (status != 200){
			this.res.setHeader("Content-Type", "text/plain; charset=utf-8");
			this.res.writeHead(status);
		}
		else{			
			this.res.statusCode = 200;
		}
		if (dm && dm == "trace"){
			result += "\n\n" + this.formatLogs();		
		}		
		this.res.end(result + "");
	},
	
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
	},
	
	log : function(){
		var lgstr = "";
		for (var i = 0; i < arguments.length; i++){
			lgstr += this.formatLog(arguments[i]);
		}
		this.logs.push(lgstr);
		return lgstr;
	},
	
	formatLog : function(text){
		if (typeof text == 'string') return text;
		//if (text instanceof Date) return this.formatLog(text.date + 1, ".", text.month + 1, ".", text.fullYear,"  ", text.hours,":",text.minutes,":",text.seconds,".",text.milliseconds);
		if (typeof text == 'object') return JSON.stringify(text);		
		return text + "";
	},
	
	formatLogs : function(){
		var lgstr = "\n";
		for (var i = 0; i < this.logs.length; i++){
			lgstr += this.logs[i] + "\n";
		}
		return lgstr;
	},
	
	formatError : function(error){
		return error.message + "\n" + error.stack
	},
	
	finishWithError : function(error){
		if (!this.completed){
			this.res.setHeader("Access-Control-Allow-Origin", "*");
			this.res.setHeader("Access-Control-Allow-Methods", "GET, DELETE, PUT, POST, HEAD, OPTIONS, SEARCH");
			this.res.setHeader("Access-Control-Allow-Headers", "debug-mode");
			this.res.setHeader("Content-Type", "text/plain; charset=utf-8");
			this.log("end: ", new Date());
			this._finish(500, this.formatError(error));
		}
	},
}
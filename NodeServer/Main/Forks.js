var fs = require('fs');
var paths = require('path');
var ChildProcess = require('child_process');

module.exports = function(config, router, logger){
	log = logger;
	ForksRouter.Path = config.path;
	if (config.forks){
		for (var i = 0; i < config.forks.legth; i++){
			var fpath = config.forks[i];
			var cf = Forks[fpath];
			if (!cf){		
				cf = Forks[fpath] = new Fork(fpath);
			}	
			return cf;
		}
	}
	return ForksRouter;
};

Forks = { };

function Fork(path){
	this.path = path;
	this.code = 0;
	return this;
};

Fork.Statuses = ["new", "stoped", "exited", "reserved", "reserved", "reserved", "reserved", "working"];

Fork.STATUS_NEW = 0;
Fork.STATUS_STOPED = 1;
Fork.STATUS_EXITED = 2;
Fork.STATUS_WORKING = 7;

Fork.prototype = {
	toString : function(){
		return JSON.stringify(this.status());
	},
	
	reset : function(){
		this._log("server", "reset");
		if (this.code < Fork.STATUS_WORKING){
			return this.start();
		};	
		var fork = this;
		this.process.on("exit", function(){
			fork.start();
		});
		this.stop();
		return this.process;
	},
	
	start : function(){
		if (this.code >= Fork.STATUS_WORKING){
			return;	
		}		
		var cp = this.process = ChildProcess.fork(this.path, [], { silent: false });
		this._log("server", "started");
		this.code = Fork.STATUS_WORKING;		
		var fork = this;
		cp.on("exit", function(){
			fork._exitEvent.apply(fork, arguments);
		});
		cp.on("message", function(){
			fork._messageEvent.apply(fork, arguments);
		});
		return cp;
	},
	
	stop : function(){
		if (this.code < Fork.STATUS_WORKING){
			return;	
		}
		this.process.kill();
		this._log("server", "stoped");
		return this.process;
	},
	
	status : function(){
		var stat = {code : this.code, status : Fork.Statuses[this.code], log : this.logFile, path: this.path};
		if (this.process){
			stat.pid = this.process.pid;	
		}
		return stat;
	},
	
	_exitEvent : function(signal){
		this.code = Fork.STATUS_EXITED;
		this._log("server", "exited");
	},
	
	
	_messageEvent : function(message){
		if (typeof message == "string"){
			this._log("message", message);
		}
		else{
			if (message.type){
				this._log(message.type, message.text);	
				return;
			}
		}
	},
	
	_errEvent : function(message){
		this._log("error", "message");
	},
	
	_outEvent : function(signal){
		this._log("info", "message");
	},
	
	_log : function(type, message){
		log._log(type, message, this.path);
	},
	
	close : function(){
		if (this.process){
			this._log("server", "close");
			this.process.kill();
		}
	}
};

ForksRouter = {
	
};

ForksRouter.GET = ForksRouter.HEAD = function(context){	
	var fpath = context.pathTail.replace("/", "\\");
	var fork = Forks[fpath];
	if (fork){
		context.res.setHeader("Content-Type", "application/json; charset=utf-8");
		context.finish(200, fork.toString());	
	}
	else{
		context.finish(404, "Fork not found");
	}		
	return true;
};

ForksRouter.SEARCH = function(context){
	var forks = {};
	for (var fork in Forks){
		forks[fork] = Forks[fork].status();
	}
	context.res.setHeader("Content-Type", "application/json; charset=utf-8");
	context.finish(200, JSON.stringify(forks));
	return true;
};


ForksRouter.POST = function(context){
	var fpath = context.pathTail.replace("/", "\\");
	var ext = paths.extname(fpath);
	ext = ext.replace(".", "");
	if (ext != "js"){
		context.finish(500, "Can't fork not javascript files");
		return false;
	}
	var cf = Forks[fpath];
	if (!cf){		
		cf = Forks[fpath] = new Fork(fpath);
		cf.start();
	}	
	else{
		cf.reset();
	}
	context.res.setHeader("Content-Type", "application/json; charset=utf-8");
	context.finish(200, cf.toString());
};

ForksRouter.DELETE = function(context){
	var fpath = context.pathTail.replace("/", "\\");
	var ext = paths.extname(fpath);
	ext = ext.replace(".", "");
	if (ext != "js"){
		context.res.finish(500, "Can't fork not javascript files");
		return false;
	}
	var cf = Forks[fpath];
	if (!cf){		
		cf = Forks[fpath] = new Fork(fpath);
	}	
	else{
		cf.stop();
	}
	context.res.setHeader("Content-Type", "application/json; charset=utf-8");
	context.finish(200, cf.toString());
};


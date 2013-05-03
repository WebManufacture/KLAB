var fs = require('fs');
var paths = require('path');
var ChildProcess = require('child_process');
require(paths.resolve("./Modules/Node/Channels.js"));
require(paths.resolve("./Modules/Node/ChildProcess.js"));
var emitter = require('events').EventEmitter;

function Fork(path, args){
	this.path = path;
	if (!args) args = [];
	this.args = args;
	this.code = 0;
	this.id = (Math.random() + "").replace("0.", "");
	var channelID = "/fork" + this.id;
	if (global.Channels){
		this.channel = new ForkChannel(this, channelID);
		Channels.on(channelID, this.channel);
		var fork = this;
		this.channel._addListener("/process/control.start", function(message){
			fork.start();
		});
		this.channel._addListener("/process/control.stop", function(message){
			fork.stop();
		});
		this.channel._addListener("/process/control.reset", function(message){
			fork.reset();
		});
	}
	return this;
};

Fork.Statuses = ["new", "stoped", "exited", "reserved", "reserved", "reserved", "reserved", "working"];

Fork.STATUS_NEW = 0;
Fork.STATUS_STOPED = 1;
Fork.STATUS_EXITED = 2;
Fork.STATUS_WORKING = 7;

ForkChannel = function(fork, channelID){
	this.routes = { "*" : {}, "." : [] };
	
	this.on = this.for = this.subscribe = this.add = function(route, callback){
		route = this.parsePath(route);
		if (!route) return null;
		if (route.nodes.length == 0) return null;
		if (route.nodes[0].type != "process"){
			if (!fork.subscribeToChild(route.toString())) return null;
		}
		return this._addListener(route, callback);
	};
			
	this.emit = function(route){
		var route = this.parsePath(route);
		if (!route) return;
		if (route.nodes.length == 0) return null;
		if (route.nodes[0].type != "process"){
			fork.emitToChild.apply(this, arguments);
		}
		return this._send.apply(this, arguments);
	};			
}

ForkChannel.prototype = Channel.prototype;

Fork.prototype = {
	toString : function(){
		return JSON.stringify(this.status());
	},
	
	reset : function(args){		
		logger.debug("fork resetting " + this.path);
		if (this.code < Fork.STATUS_WORKING){
			return this.start();
		};	
		var fork = this;
		if (!args) args = this.args;
		this.process.on("exit", function(){
			fork.start(args);
		});
		this.stop();
		return this.process;
	},
	
	start : function(args){
		if (this.code >= Fork.STATUS_WORKING){
			return;	
		}		
		if (!args) args = this.args;
		if (typeof (args) == 'string'){
			args = JSON.parse(args);	
		}
		if (args) this.args = args;
		var cp = this.process = ChildProcess.fork(this.path, args, { silent: false, cwd: paths.dirname(this.path), env : { isChild : true } });
		logger.debug("fork started " + this.path);
		this.code = Fork.STATUS_WORKING;		
		this._emit("process.status", Fork.Statuses[this.code]);
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
		logger.debug("fork stoped " + this.path);
		return this.process;
	},
	
	status : function(){
		var stat = {id : this.id, code : this.code, status : Fork.Statuses[this.code], log : this.logFile, path: this.path, args: this.args};
		if (this.process){
			stat.pid = this.process.pid;	
		}
		return stat;
	},
	
	_exitEvent : function(signal){
		this.code = Fork.STATUS_EXITED;
		this._emit("process.status", Fork.Statuses[this.code]);
		this._emit("process.exit", signal);
		logger.debug("fork exited " + this.path);
	},
	
	_messageEvent : function(obj){
		if (global.Channels && typeof obj == "object"){
			/*if (obj.type == "channelControl"){
				var fork = this;
				Channels.on(obj.pattern, function(message){
					fork.emitToChild.apply(fork, arguments);
				});
			}*/
			if (obj.type == "channelMessage"){
				this._emit.apply(this, obj.args);
			}
		}
		if (typeof obj == "string"){
			logger.log(obj);
		}
		else{
			if (obj.type){
				switch(obj.type){
					case "info" : logger.info(obj.message); break;					
					case "warn" : logger.warn(obj.message); break;	
					case "error" : logger.error(obj.message); break;
					case "debug" : logger.debug(obj.message); break;						
					case "log" : logger.log(obj.message); break;
				};	
				return;
			}
		}
	},
	
	_errEvent : function(message){
		this._emit("process.error", message);
		logger.error(message);
	},
	
	_emit : function(message){
		if (this.channel){
			this.channel.emit.apply(this.channel, arguments);
		}		
	},
	
	on : function(){
		this.channel.on.apply(this.channel, arguments);
	},
	
	subscribeToChild : function(pattern){
		if (this.process && this.code == Fork.STATUS_WORKING){
			this.process.send({ type : "channelControl", pattern : pattern });
			return true;
		}	
		return false;
	},
	
	emitToChild : function(message){
		if (this.process && this.code == Fork.STATUS_WORKING){
			this.process.send({ type : "channelMessage", args : arguments });
			return true;
		}
		return false;
	},	
	
	close : function(){
		if (this.process){
			logger.debug("fork close - " + this.path);
			this.process.kill();
		}
	},
};

var logger = null;

var ForksRouter = {
	Forks : {},
	
	Init : function(loggerObj){
		if (loggerObj) {
			logger = loggerObj;
		}
		else{
			logger = {
				log : function(message){
					console.log(message);	
				},
				error:function(message){
					console.error(message);	
				},			
				warn:function(message){
					console.warn(message);	
				},
				debug : function(message){
					console.log(message);	
				},
				info : function(message){
					console.log(message);	
				}
			}
		}
	},
	
	Create: function(fpath, args){
		cf = new Fork(fpath, args);
		ForksRouter.Forks[cf.id] = cf;
		if (args){
			cf.start(args);
		}
		return cf;
	},
	
	Get : function(id){
		return ForksRouter.Forks[id];
	},
	
	Del : function(id){
		var cf = this.Forks[id];
		if (cf){		
			cf.close();
			if (global.Channels){
				global.Channels.removeListeners(".fork" + cf.id);
			}
			delete this.Forks[id];
			return true;
		}
		return false;
	}
};

module.exports = ForksRouter;

ForksRouter.Init();



var fs = require('fs');
var paths = require('path');
var ChildProcess = require('child_process');
require(paths.resolve("./Modules/Node/Utils.js"));
var logger = require(paths.resolve("./Modules/Node/Logger.js"))("/forks-log");
require(paths.resolve("./Modules/Channels.js"));
require(paths.resolve("./Modules/Node/ChildProcess.js"));
var emitter = require('events').EventEmitter;

global.Fork = function(path, args, id, channelTags){
	this.path = path;
	if (!args) args = [];
	this.args = args;
	this.code = 0;
	this.id = id;	
	if (!this.id) {
		this.id = (Math.random() + "").replace("0.", "");
	}	
	if (!channelTags) channelTags = "";
	this.channelID = "/fork" + this.id + channelTags;
	var fork = this;
	if (global.Channels){		
		Channels.on(this.channelID, function(route){
			if (!route) return true;
			route.forkId = fork.id;
			if (!route.clone().is("/*/process")){
				fork.emitToChild.apply(this, arguments);
			}		
			return true;
		});
		Channels.tonnelTo(this.channelID, function(route){
			if (!route) return true;
			if (!route.clone().is("/*/process")){
				if (!fork.subscribeToChild(route.toString())) return false;
			}		
			return true;
		});
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
		this.process.once("exit", function(){
			fork.start(args);
		});
		this.stop();
		return this.process;
	},
	
	start : function(args){
		if (this.code >= Fork.STATUS_WORKING){
			return;	
		}		
		if (typeof (args) == 'function'){
			var callback = args;
			args = this.args;
		}
		if (!args) args = this.args;
		if (typeof (args) == 'string'){
			args = JSON.parse(args);	
		}
		if (args) this.args = args;
		var cp = this.process = ChildProcess.fork(this.path, args, { silent: false, cwd: paths.dirname(this.path), env : { isChild : true } });
		logger.debug("fork started " + this.path);
		this.code = Fork.STATUS_WORKING;	
		if (callback){
			var fork = this;
			this.once("process.status", function(){
				callback.call(fork, Fork.Statuses[fork.code]);	
			});
		}
		this._emit("process.status." + Fork.Statuses[this.code], Fork.Statuses[this.code]);
		var fork = this;
		cp.on("exit", function(){
			fork._exitEvent.apply(fork, arguments);
		});
		cp.on("message", function(){
			fork._messageEvent.apply(fork, arguments);
		});
		
		return cp;
	},
	
	stop : function(callback){
		if (this.code < Fork.STATUS_WORKING){
			return;	
		}
		if (callback){
			var fork = this;
			this.once("process.status", function(){
				callback.call(fork, Fork.Statuses[fork.code]);	
			});
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
		this._emit("process.status." + Fork.Statuses[this.code], Fork.Statuses[this.code]);
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
	},
	
	_errEvent : function(message){
		this._emit("process.error", message);
		logger.error(message);
	},
	
	
	_emit : function(message){
		if (global.Channels){
			message = this.channelId + "/" + message;
			global.Channels.emit.apply(Channels, arguments);
		}		
	},
	
	on : function(message){
		message = this.channelId + "/" + message;
		Channels.on.apply(Channels, arguments);
	},
	
	once : function(message){
		if (global.Channels){
			message = this.channelId + "/" + message;
			global.Channels.once.apply(Channels, arguments);
		}		
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

var ForksRouter = {
	Forks : {},
	
	Init : function(){

	},
	
	Create: function(fpath, args, channelTags){
		cf = new Fork(fpath, args, channelTags);
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
				global.Channels.clear("/fork" + cf.id);
			}
			delete this.Forks[id];
			return true;
		}
		return false;
	}
};

module.exports = ForksRouter;

ForksRouter.Init();



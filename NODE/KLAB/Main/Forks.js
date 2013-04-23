var fs = require('fs');
var paths = require('path');
var ChildProcess = require('child_process');

function Fork(path, args){
	this.path = path;
	if (!args) args = [];
	this.args = args;
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
		var cp = this.process = ChildProcess.fork(this.path, args, { silent: false });
		logger.debug("fork started " + this.path);
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
		logger.debug("fork stoped " + this.path);
		return this.process;
	},
	
	status : function(){
		var stat = {code : this.code, status : Fork.Statuses[this.code], log : this.logFile, path: this.path, args: this.args};
		if (this.process){
			stat.pid = this.process.pid;	
		}
		return stat;
	},
	
	_exitEvent : function(signal){
		this.code = Fork.STATUS_EXITED;
		logger.debug("fork exited " + this.path);
	},
	
	
	_messageEvent : function(obj){
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
		logger.error(message);
	},
	
	_outEvent : function(signal){
		logger.debug(signal);
	},
		
	close : function(){
		if (this.process){
			logger.debug("fork close - " + this.path);
			this.process.kill();
		}
	}
};

var logger = null;

var ForksRouter = {
	idCounter : 1,

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
		var id = ForksRouter.idCounter++;
		var cf = ForksRouter.Forks[id];
		if (!cf){		
			cf = ForksRouter.Forks[id] = new Fork(fpath, args);
		}	
		if (args){
			cf.start(args);
		}
		cf.id = id;
		return cf;
	},
	
	Get : function(id){
		return ForksRouter.Forks[id];
	},
	
	Del : function(id){
		var cf = this.Forks[id];
		if (cf){		
			cf.close();
			delete this.Forks[id];
			return true;
		}
		return false;
	}
};

module.exports = ForksRouter;

ForksRouter.Init();


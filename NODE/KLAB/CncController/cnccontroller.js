var Url = require('url');
var fs = require('fs');
var Path = require('path');
ObjectID = require('mongodb').ObjectID;
var edge = require('edge');

require(Path.resolve("./Modules/Node/Utils.js"));
require(Path.resolve("./Modules/Channels.js"));
require(Path.resolve('./Modules/Node/Logger.js'));
var fileSystem = require(Path.resolve('./Modules/Node/Files.js'));
require(Path.resolve('./Modules/Node/Mongo.js'));
	
	Server = server = {};
	
	require(Path.resolve('CncController/cnc.js'));
	
	var uartFunc = edge.func({
		source: Path.resolve("CncController/Uart.cs"),
		references: [ ]
	});
	
	Uart = {};
		
	MotorCommand = function(command){
		this.address = 2;
    	this.command = command;
    	this.line = 0;
    	this.x = 0;
    	this.y = 0;
    	this.z = 0;
    	this.speed = 0;
	}
		
	Uart.Write = function(data, callback){
		if (!Uart.initialized) return;
		data.action = 'command';
		if (data.line){
			//console.log(data.line + ": " + Symbols[data.command]);
		}
		uartFunc(data, function(err, result){
			data.sended = true;	
		}); 
		//Uart.waitResponse(data.command);
	};
	
	Uart.Command = function(command, callback){
		if (!Uart.initialized) return;
		command = new MotorCommand(command);
		command.action = 'command';
		//console.log(command);
		uartFunc(command, function(err, result){
			command.sended = true;	
		}); 
		return command;
	};
	
	Uart.Read = function(){
		if (!Uart.initialized) return;
		log("reading started");
		var readFunc = function(){
			uartFunc({action: "read"}, function(err, result){
				if (err || (result && result.error)){
					//log(err);
					console.log(err);
					console.log(result);
					setTimeout(readFunc, 2000);
					return;
				}
				if (result && result.command){
					Channels.emit("uart.device", result);
					console.log(result);
				}
				setTimeout(readFunc, 100);
			});
		}	
		setTimeout(readFunc, 100);
	};
	
	Uart.Close = function(){
		if (!Uart.initialized) return;
		uartFunc({action: "close"}, null); 
	};
	
	Uart.GetState = function(callback){
		if (!Uart.initialized) {
			callback("not initialized");
			return;
		}
		uartFunc({action: "state"}, function(err, result){
			callback(result);	
		}); 
	};
	
	Uart.Init = function(){
		var initFunc = function(){
			var port = "COM1";
			if (Server.Config.ComPort){
				port = Server.Config.ComPort;
			}
			uartFunc({action: "init", port : port}, function(err, result){
				if (err){
					error(err);	
				}
				if (!result){
					setTimeout(initFunc, 1000);	
				}
				else{
					log("UART initialized!");
					Uart.initialized = true;
					Uart.Read();
					Uart.Command(Commands.State);
				}
			});
		}	
		setTimeout(initFunc, 1000);
	};
	
	process.on("exit", function(){
		Uart.Close();
	});
	
	Server.InitDB = function (){
		debug("connecting DB");
		if (Server.Config.DB){
			if (!Server.Config.DbHost) Server.Config.DbHost = "127.0.0.1";
			if (!Server.Config.DbPort) Server.Config.DbPort = 20000;
			replicaSet([{host: Server.Config.DbHost, port : Server.Config.DbPort}], Server.Config.DB, function(err, database){
				if (err){
					error(err);	
				}
				global.db = database;
			});
		}
	};
	
	
	Server.Init = function(config, router){
		Server.Config = config;
		//Server.InitDB();
		Uart.Init();
		Channels.on("uart.output", function(message, command){
			Uart.Write(command);
		});
		router.for("Main", "/storage/>", new fileSystem({basepath: "storage"}));
		router.for("Main", "/state/>", function(context){ 
			Uart.GetState(function(result){
				log("state ready");
				Uart.Command(Commands.State);
				context.finish(200, result);
				context.continue();
			});
			return false;
		});	
		router.for("Main", "/program/>", function(context){ 
			console.log(context.data);
			var data = JSON.parse(context.data);
			if (Server.program){
				Server.program.close();	
			}
			Server.program = new CncProgram(data, Uart);
			Server.program.Start();
			context.finish(200, data.length);
			return true;
		});		
		router.for("Main", "/command/>", function(context){ 
			var data = JSON.parse(context.data);
			console.log(data);
			if (data.command == Commands.Stop && Server.program){
				console.log(Stopping);
				Server.program.Stop();
			}
			Channels.emit("uart.output", data);
			context.finish(200, data);
			return true;
		});
		log("Uart channel ready");
	};

module.exports = Server;


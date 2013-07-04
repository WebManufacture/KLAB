var Url = require('url');
var fs = require('fs');
var Path = require('path');
ObjectID = require('mongodb').ObjectID;
var edge = require('edge');

require(Path.resolve("./Modules/Node/Utils.js"));
require(Path.resolve("./Modules/Channels.js"));
require(Path.resolve("./Modules/Node/ChildProcess.js"));
require(Path.resolve('./Modules/Node/Logger.js'));
try{
	require(Path.resolve('./Modules/Node/Mongo.js'));
	
	Server = server = {};
	
	Server.Path = process.env.workDir;
	
	require(Server.Path + '/cnc.js');
	
	var uartFunc = edge.func({
		source: Server.Path + "/Uart.cs",
		references: [ ]
	});
	
	Uart = {};
		
	Uart.Write = function(data, callback){
		if (!Uart.initialized) return;
		data.action = 'command';
		uartFunc(data, null); 
		//Uart.waitResponse(data.command);
	};
	
	Uart.Read = function(){
		if (!Uart.initialized) return;
		var readFunc = function(){
			uartFunc({action: "read"}, function(err, result){
				if (err || !result){
					setTimeout(readFunc, 200);	
				}
				else{
					if (typeof Uart.onMessage == 'function'){
						Uart.onMessage(result);
					}
				}
			});
		}	
		setTimeout(readFunc, 200);
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
			uartFunc({action: "init", port : 'COM2'}, function(err, result){
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
				}
			});
		}	
		setTimeout(initFunc, 1000);
	};
	
	process.on("exit", function(){
		Uart.Close();
	});
	
	Server.Config = JSON.parse(process.argv[2]);
	
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
	
	
	Server.Init = function(){
		if (!Server.Config){
			Server.Config = {};
		}
		var config = Server.Config;
		Server.InitDB();
		Uart.Init();
		Uart.onMessage = function(message){
			Channels.emit("message", message);
		}
		Channels.on("/http-request.get/storage", function(route, id, url, headers, data){ 
			fs.readFile(path + ".json", "utf8", function(err, result){   
				if (err){
					(id, 500, err);
					return;
				}		
				Server.SendResponse(id, 200, result, {"Content-Type": "text/plain; charset=utf-8"});
			});
			this.processsed = true;
			return true;
		});
		Channels.on("/http-request.post/storage", function(route, id, url, headers, data){ 
			var path = route.current.replace(/\//ig, "");
			fs.writeFile(path + ".json", data, 'utf8', function(err, result){
				if (err){
					Server.SendResponse(id, 500, err);
					return;
				}		
				Server.SendResponse(id, 200, "", {"Content-Type": "text/plain; charset=utf-8"});
			});
			this.processsed = true;
			return true;
		});
		Channels.on("/http-request.get/state", function(route, id, url, headers, data){ 
			if (this.processsed) return;
			Uart.GetState(function(result){
				Server.SendResponse(id, 200, result, null);
			});
			return false;
		});	
		Channels.on("/http-request.post/program", function(route, id, url, headers, data){ 
			if (this.processsed) return;
			Uart.Write(data);
			return false;
		});		
		Channels.on("/http-request.post/command", function(route, id, url, headers, data){ 
			if (this.processsed) return;
			Uart.Write(data);
			return false;
		});
	};
	
	Server.Finalize = function(context){		
		context.setHeader("Content-Type", "text/plain; charset=utf-8");
		context.finish(404, "URL not available");
		return true;
	};	
	
	Server.SendResponse = function(id, status, result, headers){
		//console.log("response: id" + id);
		Channels.emit("http-response.id" + id, id, status, result, headers);	
	};
	
	Server.SendPartial = function(id, status, result, headers){
		//console.log("response: id" + id);
		Channels.emit("http-response.partial.id" + id, id, status, result, headers);	
	};
	
	Server.Context = function(id, url, path, headers, data){
		if (typeof(url) == "string") url = Url.parse(url, true);
		context = { id : id, 
				   url : url,
				   path : path,
				   pathTail : path,
				   pathName: path,
				   data: data,
				   headers: headers, 
				   method : url.method };
		context.setHeader = function(name, value){
			this.headers[name] = value;
		}
		context.sendFile = function(fileName){
			if (fileName.indexOf("/") != 0){
				fileName = "/" + fileName;
			}
			if (fileName.lastIndexOf("/") == fileName.length - 1){
				fileName = fileName.substring(0, fileName.length - 1);
			}
			var adminApp = fs.readFileSync("." + fileName, 'utf8');
			this.setHeader("Content-Type", "text/html; charset=utf-8");
			this.finish(200, adminApp, 'utf8');
		};
		context.send = function(status, result){
			try{
				Server.SendPartial(this.id, status, result, this.headers);
			}
			catch(e){
				console.log(e);	
			}
		}
		context.finish = function(status, result, encoding){
			try{
				if (encoding){
					this.headers.encoding = encoding;
				}
				Server.SendResponse(this.id, status, result, this.headers);
			}
			catch(e){
				console.log(e);	
			}
		}
		return context;
	};
	
	Server.Init();
}
catch(e){
	if (this.error){
		error(e);	
		process.exit();
	}
	else{
		throw(e);
	}
}


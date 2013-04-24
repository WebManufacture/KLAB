var http = require('http');
var Url = require('url');
var fs = require('fs');
try{
	require("../Modules/Node/Utils.js");
	var RouterModule = require("../Modules/Node/Router.js");
	var Files = require("../Modules/Node/Files.js");
	log = require('../Modules/Node/Logger.js').log;
	error = require('../Modules/Node/Logger.js').error;
	info = require('../Modules/Node/Logger.js').info;
	debug = require('../Modules/Node/Logger.js').debug;

	process.on('SIGTERM', function() {
		for (var item in Server.Nodes){
			console.log("EXITING: " + item.info);
			Server.Nodes[item].Fork.stop();
		}
	});
	
	process.on('exit',function(){
		for (var item in Server.Nodes){
			console.log("EXITING: " + item.info);
			Server.Nodes[item].Fork.stop();
		}	
		Server.HTTPServer.close();
	});
	
	Server = server = {};
	
	Server.Config = JSON.parse(process.argv[2]);
		
	Server.Process = function(req, res){
		res.setHeader("Access-Control-Allow-Origin", "*");
		res.setHeader("Access-Control-Allow-Methods", "GET, DELETE, PUT, POST, HEAD, OPTIONS, SEARCH");
		res.setHeader("Access-Control-Allow-Headers", "debug-mode,origin,content-type");
		res.setHeader("Access-Control-Max-Age", "12000");
		res.setHeader("Access-Control-Expose-Headers", "content-type,debug-mode,Content-Type,ETag,Finish,Date,Start,Load");
		
		res.setHeader("Content-Type", "text/plain; charset=utf-8");
		if (req.method == 'OPTIONS'){
			res.statusCode = 200;
			res.end("OK");	
			return;
		}
		var url = Url.parse(req.url);
		try{
			var context = Server.Router.GetContext(req, res, "");
			Server.Router.Process(context);	
		}
		catch (e){
			error(e);
			if (context){
				context.error(e);
			}
		}
	};
	
	Server.Init = function(){
		var config = Server.Config;
		var router = Server.Router = RouterModule;
		router.map("mainMap", 
				   {
					   "/>": Files(config, Server),
					   "/map": {
						   GET : function(context){
							   context.res.setHeader("Content-Type", "application/json; charset=utf-8");
							   context.finish(200, JSON.stringify(Server.CreateMap(router.Handlers.mainMap)));
						   }
					   }
				   });
		
		console.log("KLab server v "  + Server.Config.ver);
		console.log("Listening " +  config.Host + ":" + config.Port + "");
		Server.HTTPServer = http.createServer(Server.Process);
		Server.HTTPServer.listen(config.Port);
	};
	
	Server.AddMonitoring = function(req, res, url){
		Server.Monitors.push({req : req, res : res});
		var index = Server.Monitors.length - 1;
		req.on("close", function(){
			if (Server.Monitors[index] && Server.Monitors[index].req){
				console.log("Request closed: " + Server.Monitors[index].req.url);
			}
			delete Server.Monitors[index];
			Server.Monitors.splice(index, 1);
		});
		res.setHeader("Content-Type", "application/json; charset=utf-8");
		console.log("Admin console entered ".warn + req.url);
		return false;
	};
	
	Server.Monitors = [];
	
	Server.SendMessage = function(message){
		for (var i = 0; i < Server.Monitors.length; i++){
			var c = Server.Monitors[i];
			if (c && c.req){
				console.log("send: " + c.req.url);
				c.res.write(message);
			}
		}	
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


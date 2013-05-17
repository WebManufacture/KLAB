var http = require('http');
var Url = require('url');
var fs = require('fs');
var Path = require('path');
try{
	require("./Modules/Node/Utils.js");
	require("./Modules/Channels.js");
	require("./Modules/Node/ChildProcess.js");
	var RouterModule = require("./Modules/Node/Router.js");
	var Files = require("./Modules/Node/Files.js");
	require('./Modules/Node/Logger.js');

	process.on('SIGTERM', function() {

	});
	
	process.on('exit',function(){	
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
		//console.log(config);
		var router = Server.Router = RouterModule;
		var filesRouter = Files(config, Server);
		router.map("mainMap", 
				   {
					   "/map": {
						   GET : function(context){
							   context.res.setHeader("Content-Type", "application/json; charset=utf-8");
							   context.finish(200, JSON.stringify(Server.CreateMap(router.Handlers.mainMap)));
						   }
					   },
					   "/>" : {
						   GET : function(context){
							   var path = context.pathName;
							   if (config.basepath){
									 path = config.basepath + context.pathName;
							   }
							   if (path.indexOf(".") != 0){
									path = "." + path;   
							   }
							   path = Path.resolve(path);
							   fs.stat(path, function(err, stat){
								   if (err){
									   context.continue();   
									   return;
								   }
								   if (stat.isDirectory()){
								   	   context.res.setHeader("Content-Type", "text/html; charset=utf-8");
									   fs.readFile("./files.htm", "utf8", function(err, result){   
										   if (err){
											   context.finish(500, "Not found files view page " + err);
											   return;
										   }		
										   context.finish(200, result);
									   });
									   return;
								   }
								   if (stat.isFile() && context.query["action"] == "edit"){
									   context.res.setHeader("Content-Type", "text/html; charset=utf-8");
									   fs.readFile("./TextEditor.htm", "utf8", function(err, result){   
										   if (err){
											   context.finish(500, "Not found files view page " + err);
											   return;
										   }		
										   context.finish(200, result);
									   });
									   return;
								   }
								   context.continue();
							   });
							   return false;
						   }
					   },					   
					   "/<": filesRouter
				   });
		
		console.log("KLab server v "  + 1.3);
		//console.log("Listening " +  config.Host + ":" + config.Port + "");
		Server.HTTPServer = http.createServer(Server.Process);
		Server.HTTPServer.listen(config.Port);
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


var http = require('http');
var Url = require('url');
var fs = require('fs');
var Path = require('path');
try{
	require(Path.resolve("./Modules/Node/Utils.js"));
	require(Path.resolve("./Modules/Channels.js"));
	require(Path.resolve("./Modules/Node/ChildProcess.js"));
	var RouterModule = require(Path.resolve("./Modules/Node/Router.js"));
	var Files = require(Path.resolve("./Modules/Node/Files.js"));
	require(Path.resolve('./Modules/Node/Logger.js'));

	process.on('SIGTERM', function() {

	});
	
	process.on('exit',function(){	
		Server.HTTPServer.close();
	});
	
	Server = server = {};
	var args = {};
	if (process.argv[2]){
		args = process.argv[2];
		args = JSON.parse(args);
	}
	Server.Config = args;
		
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
								if (context.query["action"] == "edit" || context.query["action"] == "create"){
								   context.res.setHeader("Content-Type", "text/html; charset=utf-8");
								   fs.readFile("./TextEditor.htm", "utf8", function(err, result){   
									   if (err){
										   context.finish(500, "Not found files view page " + err);
										   return;
									   }		
									   context.finish(200, result);
								   });
								   return false;
							   }
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
								   if (stat.isFile()){
										
								   }
								   context.continue();
							   });
							   return false;
						   }
					   },					   
					   "/<": filesRouter
				   });
		
		console.log("KLab server v "  + 1.3 + " on " + config.Host + ":" + config.Port);
		//console.log("Listening " +  config.Host + ":" + config.Port + "");
		Server.HTTPServer = http.createServer(Server.Process);
		Server.HTTPServer.listen(config.Port);
	};
	
		
	Server.CreateMap = function(routerMapNode){
		if (!routerMapNode) return;
		var mapObj = null;
		for (var item in routerMapNode){
			if (item != "//"){
				var node = routerMapNode[item];
				if (node instanceof Array){
					if (node.length > 0) {
						if (!mapObj) mapObj = {};
						if (node.length > 1) {
							mapObj[item] = [];
							for (var i = 0; i < node.length; i++)
							{
								var to = typeof(node[i]);
								if (to == "object"){
									to = (node[i]._ModuleName ? node[i]._ModuleName : "")  + "{" 
									+ (node[0].GET ? "GET," : "")
									+ (node[0].POST ? "POST," : "")
									+ (node[0].PUT ? "PUT," : "")
									+ (node[0].DELETE ? "DEL," : "")
									+ (node[0].SEARCH ? "SRCH," : "")   
									+ (node[0].HEAD ? "HEAD," : "")
									+ (node[0].OPTIONS ? "OPTS," : "");
									to = to.trim(",") + "}";
									
								}
								if (to == "function"){
									to += " " + node[i].name;
								}
								mapObj[item].push(to);
							}
						}
						else{
							var to = typeof(node[0]);
							if (to == "object"){
								to = (node[0]._ModuleName ? node[0]._ModuleName : "")  + "{" 
								+ (node[0].GET ? "GET," : "")
								+ (node[0].POST ? "POST," : "")
								+ (node[0].PUT ? "PUT," : "")
								+ (node[0].DELETE ? "DEL," : "")
								+ (node[0].SEARCH ? "SRCH," : "")   
								+ (node[0].HEAD ? "HEAD," : "")
								+ (node[0].OPTIONS ? "OPTS," : "");
								to = to.trim(",") + "}";
								
							}
							if (to == "function"){
								to += " " + node[0].name;
							}
							mapObj[item] = to;
						}
					}
				}
				else{
					var value = Server.CreateMap(node);
					if (value){
						if (!mapObj) mapObj = {};
						mapObj[item] = value;
					}
				}
			}
		}
		return mapObj;
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


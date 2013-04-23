var http = require('http');
var Url = require('url');
require("./Utils.js");
var RouterModule = require("./Router.js");
var Forks = require("./Forks.js");
var fs = require('fs');
var httpProxy = require('http-proxy');
var colors = require('colors');

var proxy = new httpProxy.RoutingProxy();

colors.setTheme({
	silly: 'rainbow',
	input: 'grey',
	verbose: 'cyan',
	prompt: 'grey',
	info: 'green',
	data: 'grey',
	help: 'cyan',
	warn: 'yellow',
	debug: 'blue',
	error: 'red'
});

Server = server = {};

Server.Init = function(){
	var cfg = { port: 80, ver:"0.1.2", adminHost: "config.web-manufacture.net", routingFile: "./Main/RoutingTable.json", adminAppFile : "./Main/Config.htm", portStart: 1000 };
	
	for (var i = 2; i < process.argv.length; i++){
		var arg = process.argv[i];
		var val = arg.split("=");
		if (val.length == 2){
			cfg[val[0]] = val[1];
		}
	}
	
	Server.RoutingTable = {};
	
	if (!fs.existsSync(cfg.routingFile)){
		fs.writeFile(cfg.routingFile, "", 'utf8');
	}
	var rtable = fs.readFileSync(cfg.routingFile, 'utf8');
	Server.ConfigTable = JSON.parse(rtable);
	if (rtable && rtable.length > 0){
		rtable = JSON.parse(rtable);
		var port = cfg.portStart;
		for (var i = 0; i < rtable.length; i++){
			Server.ConfigTable[i].id = i+1;
			var rr = rtable[i];
			rr.id = i+1;
			if (rr.Location == "localhost"){				
				rr.Args.Port = rr.Port = port;
				rr.Args.Host = rr.Host.toLowerCase();
				if (Server.RoutingTable[rr.Host] != null){
					console.log("duplicate host ".warn + rr.Host);
					Server.ConfigTable[i].State = "Error";
					continue;
				}
				port++;				
				rr.Fork = Forks.Create(rr.File, [ JSON.stringify(rr.Args)]);
				//rr.Fork.start();
				Server.ConfigTable[i].State = "Working";
				Server.RoutingTable[rr.Host] = rr;
				console.log(rr.NodeName.info + " '" + rr.File + "' - " + (rr.Host + ":" + rr.Port).info);
			}
			else{
				Server.ConfigTable[i].State = "Idle";	
			}
		}
	}
	setTimeout(function(){
		Server.Start(cfg);
	}, 100);
};

Server.Utilisation = function(context){
	if (!context.completed){
		if (context.codeProcessed){
			context.finish(200, context.codeResult);
		}
		else{
			context.finish(404, "No handlers found for: " + context.url.pathname);
		}
	}
};

Server.RouteProxy = function(req, res){
	var url = "http://" + req.headers.host  + req.url;
	console.log("URL: ".debug + url.toLowerCase())
	url = Url.parse(url.toLowerCase());
	if (url.hostname == Server.Config.adminHost){
		Server.Process(req, res);
		return;
	}
	var rr = Server.RoutingTable[url.hostname];
	if (rr){	
		var host = "127.0.0.1";
		if (rr.Location){
			host = rr.Location;	
		}
		console.log((url.hostname + " redirected to " + rr.Port).data);
		proxy.proxyRequest(req, res, { host: "127.0.0.1", port: rr.Port });
		return true;
	}	
	res.statusCode = 404;
	res.end(url.hostname + " not found");
	console.log(url.hostname + " not found".warn);
	return false;
};


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
	console.log("Admin console entered ".warn + req.url);
	var url = Url.parse(req.url);
	try{
		var context = Server.Router.GetContext(req, res, "");
		Server.Router.Process(context);	
	}
	catch (e){
		log.error(e);
		if (context){
			context.error(e);
		}
		console.error(e);
	}
};

Server.Start = function(config){
	var router = Server.Router = RouterModule;
	Server.Config = config;
	router.map("mainMap", 
			   {
				   "/": function(context){
					   var adminApp = fs.readFileSync(config.adminAppFile, 'utf8');
					   context.res.setHeader("Content-Type", "text/html; charset=utf-8");
					   context.finish(200, adminApp);
					   return true;
				   },
				   "/map": {
					   GET : function(context){
						   context.res.setHeader("Content-Type", "application/json; charset=utf-8");
						   context.finish(200, JSON.stringify(Server.CreateMap(router.Handlers.mainMap)));
					   }
				   },
				   "/nodes": Server.NodesRouter,				   
				   "/forks": Server.ForksRouter,				   
				   "<": Server.Utilisation
			   });
	//console.log(router.Handlers.processMap)
	if (!config.adminPort) config.adminPort = 80;
	console.log("KLab server v "  + Server.Config.ver);
	console.log("Listening " +  config.host + ":" + config.port + "");
	http.createServer(Server.RouteProxy).listen(config.port);
	if (config.adminPort != config.port){
		console.log("Admin " +  (config.adminHost + ":" + config.adminPort + "").verbose);
		var server = http.createServer(Server.Process);
		if (config.adminHost){
			server.listen(config.adminPort, config.adminHost);
		}
		else{
			server.listen(config.adminPort);	
		}
	}
	else{
		console.log("Admin " +  config.adminHost.verbose);
	}
	if (config.adminPort == 80){
		Server.AdminUrl = config.adminHost;
	}
	else{
		Server.AdminUrl = config.adminHost + ":" + config.adminPort + "";
	}
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

Server.NodesRouter = {
	GET : function(context){
		context.res.setHeader("Content-Type", "application/json; charset=utf-8");
		context.finish(200, JSON.stringify(Server.Config));
		return true;
	},
	SEARCH : function(context){
		context.res.setHeader("Content-Type", "application/json; charset=utf-8");
		context.finish(200, JSON.stringify(Server.ConfigTable));
		return true;
	},
	POST : function(context){
		var fullData = "";
		context.req.on("data", function(data){
			fullData += data;		
		});
		context.req.on("end", function(){
			try{
				var doc = JSON.parse(fullData);
				db.collection("configs").remove({path:doc.path}, function(){
					db.collection("configs").save(doc, {safe : false}, function(err, result){
						if (err){
							context.finish(500, "POST " + context.url.pathname + " error " + err);
							return;
						}					
						context.finish(200, JSON.stringify(doc));
						context.continue(context);
					});
				});
			}
			catch (err){
				context.finish(500, "JSON error: " + err);
			}
			context.continue(context);
		});
		return false;
	}
};

ForksRouter = {};


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
	var fullData = "";
	context.req.on("data", function(data){
		fullData += data;		
	});
	context.req.on("end", function(){
		try{
			var data = JSON.parse(fullData);
			if (!data){ data = {} };
			var ext = paths.extname(data.file);
			ext = ext.replace(".", "");
			if (ext != "js"){
				context.error("Can't fork not javascript files");
				return false;
			}
			var cf = Forks[fpath];
			if (!cf){
				if (!data.file){
					data.file = "server.js";
				}
				context.log("Starting ", data.file, " with ", data.args);
				cf = Forks[fpath] = new Fork(data.file, data.args);
				cf.start();
			}	
			else{
				if (data.file){
					cf.path = data.file;	
				}
				context.log("Resetting ", cf.path, " with ", data.args);
				cf.reset(data.args);
			}			
			context.res.setHeader("Content-Type", "application/json; charset=utf-8");
			context.finish(200, cf.toString());
			context.continue();
		}
		catch(e){
			context.error(e);
			return;
		}
	});
	return false;
};

ForksRouter.DELETE = function(context){
	var fpath = context.pathTail.replace("/", "\\");
	var cf = Forks[fpath];
	if (cf){		
		cf.stop();
	}
	context.res.setHeader("Content-Type", "application/json; charset=utf-8");
	context.finish(200, cf.toString());
	return true;
};


Server.Init();
//process.on('exit')

var http = require('http');
var Url = require('url');
var path = require('path');
require(path.resolve("./Modules/Node/Utils.js"));
var RouterModule = require(path.resolve("./Modules/Node/Router.js"));
var Forks = require(path.resolve("./Modules/Node/Forks.js"));
var Files = require(path.resolve("./Modules/Node/Files.js"));
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

Server.Logs = {};

NodeProto = {
	serialize : function(){
		return {
			key : this.id,
			id : this.id,
			fork : this.Fork.toString(),
			args : this.Args,
			state : this.State,
			file : this.cfg.File,
			host : this.Args.Host,
			port : this.Args.port,
			location : this.cfg.Location,
			name : this.cfg.NodeName
		}
	},	
	
	toString : function(){
		return JSON.stringify(this.serialize());
	},
}

Server.Init = function(){
	var cfg = { ver:"0.1.4", routingFile: "./NodeServer/RoutingTable.json", adminAppFile : "./NodeServer/Config.htm" };
	
	for (var i = 2; i < process.argv.length; i++){
		var arg = process.argv[i];
		var val = arg.split("=");
		if (val.length == 2){
			cfg[val[0]] = val[1];
		}
	}
	
	Server.Config = cfg;
	
	Server.RoutingTable = {};
	Server.Nodes = {};
	
	if (!fs.existsSync(cfg.routingFile)){
		fs.writeFile(cfg.routingFile, "", 'utf8');
	}
	var rtable = fs.readFileSync(cfg.routingFile, 'utf8');
	Server.ConfigTable = JSON.parse(rtable);
	if (rtable && rtable.length > 0){
		rtable = JSON.parse(rtable);
		if (rtable[0].Location = "server"){
			for (var item in rtable[0]){
				var val = rtable[0][item];
				if (cfg[item] == undefined){
					cfg[item] = val;
				}
			}
		}
		var port = cfg.portStart;
		for (var i = 0; i < rtable.length; i++){
			var item = Server.ConfigTable[i];
			if (item.Location == "server") continue;
			var rr = rtable[i];
			if (Server.InitFork(item, rr, i, port)){
				Server.RoutingTable[rr.Host] = rr;	
			}
			port++;				
			Server.Nodes[rr.id] = rr;
		}
	}
	setTimeout(function(){
		Server.Start(cfg);
	}, 100);
};

Server.SaveConfig = function(){
	fs.writeFileSync(Server.Config.routingFile, JSON.stringify(Server.ConfigTable), 'utf8');
};

Server.InitFork = function(item, rr, num, port){
	item.id = num + 1;
	rr.__proto__ = NodeProto;
	rr.cfg = item;
	rr.id = num + 1;
	rr.Args.Port = rr.Port = port;
	rr.Args.Host = rr.Host = rr.Host.toLowerCase();
	rr.Fork = Forks.Create(path.resolve(rr.File));		
	rr.Fork.args = [JSON.stringify(rr.Args)];
	rr.Fork.on("status", function(state){
		rr.State = state;
		item.State = state;
		Server.SendMessage(rr.toString());
	});
	rr.Fork.on("message", function(message){
		var log = Server.Logs[rr.id];
		if (!log){
			log = Server.Logs[rr.id] = [];
		}
		log.push(message);
		if (typeof message != "string"){
		    message.forkId = rr.id;
			message = JSON.stringify(message);	
		}		
		Server.SendMessage(message);
	});
	rr.Fork.on("exit", function(){
		rr.State = "exited";
		//rr.StatusChanged();
		console.log(" '" + rr.File + "' - " + (rr.Host + ":" + rr.Port) + " exited".warn);
	});
	rr.Fork.on("error", function(){
		rr.State = "error";
		//rr.StatusChanged();
		console.log(" '" + rr.File + "' - " + (rr.Host + ":" + rr.Port) + " error".error);
	});
	if (rr.Location == "localhost" && rr.State == "working"){	
		if (Server.RoutingTable[rr.Host] != null){
			console.log("duplicate host ".warn + rr.Host);
			rr.State = "idle";
			return false;
		}	
		rr.Fork.start();
		rr.State = "working";
		console.log(rr.NodeName.info + " '" + rr.File + "' - " + (rr.Host + ":" + rr.Port).info);
		return true;
	}
	else{
		rr.State = "idle";	
		return false;
	}
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
		//console.log((url.hostname + " redirected to " + rr.Port).data);
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
	res.setHeader("Access-Control-Expose-Headers", "content-type,debug-mode,Content-Type,ETag,Finish,ServerUrl,ManageUrl,Date,Start,Load");
	
	res.setHeader("Content-Type", "text/plain; charset=utf-8");
	res.setHeader("ManageUrl", Server.Config.adminHost);
	res.setHeader("ServerUrl", Server.Config.host + ":" + Server.Config.port);
	if (req.method == 'OPTIONS'){
		res.statusCode = 200;
		res.end("OK");	
		return;
	}
	var url = Url.parse(req.url);
	try{
		if (req.method == "POST" && url.pathname == "/"){
			Server.AddMonitoring(req, res, url);
		}
		else{
			var context = Server.Router.GetContext(req, res, "");
			Server.Router.Process(context);	
		}
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
	router.map("mainMap", 
			   {
				   "/": { GET: function(context){
					   var adminApp = fs.readFileSync(config.adminAppFile, 'utf8');
					   context.res.setHeader("Content-Type", "text/html; charset=utf-8");
					   context.finish(200, adminApp);
					   return true;
				   }
						},
				   "/map": {
					   GET : function(context){
						   context.res.setHeader("Content-Type", "application/json; charset=utf-8");
						   context.finish(200, JSON.stringify(Server.CreateMap(router.Handlers.mainMap)));
					   }
				   },				   
				   "/monitoring" : Server.ProcessMonitoring,
				   "/forks/>": Server.ForksRouter,
				   "/nodes/>": Server.NodesRouter,
				   "/>" : { GET: Files.GET, HEAD: Files.HEAD },
				   "<": Server.Utilisation
			   });
	Files(config, Server);
	//console.log(router.Handlers.processMap)
	if (!config.adminPort) config.adminPort = config.Port;
	console.log("ILAB server v "  + Server.Config.ver);
	console.log("Listening " +  config.Host + ":" + config.Port + "");
	http.createServer(Server.RouteProxy).listen(config.Port);
	if (config.adminPort &&  config.adminPort != config.Port){
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
		console.log("Admin: " +  ((config.adminHost ? config.adminHost : config.Host) + ":" + config.Port).verbose);
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


Server.NodesRouter = {
	GET : function(context){
		context.res.setHeader("Content-Type", "application/json; charset=utf-8");
		context.finish(200, JSON.stringify(Server.Config));
		return true;
	},
	SEARCH : function(context){
		context.res.setHeader("Content-Type", "application/json; charset=utf-8");
		var items = [];
		for (var item in Server.Nodes){
			items.push(Server.Nodes[item].serialize());
		}
		context.finish(200, JSON.stringify(items));
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

Server.ForksRouter = {};



Server.CheckHosts = function(item){
	console.log("checking ".info + item.Host);
	if (!item) return false;
	var rr = Server.RoutingTable[item.Host];	
	if (rr) {
		console.log("FOUND: " + rr.State);
		if (rr.State == "working") return false;
	}
	Server.RoutingTable[item.Host] = item;
	return true;
};

Server.ForksRouter.GET = Server.ForksRouter.HEAD = function(context){	
	var fpath = context.pathTail.replace("/", "\\");
	var cf = Server.RoutingTable[fpath];
	if (!cf && context.url.query["key"]){
		cf = Server.Nodes[context.url.query["key"]];	
	}
	if (cf){		
		context.res.setHeader("Content-Type", "application/json; charset=utf-8");
		context.finish(200, cf.toString());
		return true;
	}
	context.finish(404, "Fork not found");
	return true;
};

Server.ForksRouter.POST = function(context){
	var fpath = context.pathTail.replace("/", "\\");
	var cf = Server.RoutingTable[fpath];
	if (!cf && context.url.query["key"]){
		cf = Server.Nodes[context.url.query["key"]];	
	}
	if (cf){		
		if (cf.State != "broken" && cf.State != "working" && Server.CheckHosts(cf)) {
			cf.Fork.start();
			Server.SaveConfig();
		}
		context.res.setHeader("Content-Type", "application/json; charset=utf-8");
		context.finish(200);
	}
	return true;
};

Server.ForksRouter.PUT = function(context){
	var fpath = context.pathTail.replace("/", "\\");
	var cf = Server.RoutingTable[fpath];
	if (!cf && context.url.query["key"]){
		cf = Server.Nodes[context.url.query["key"]];	
	}
	if (cf){		
		if (cf.State != "broken" && cf.State != "working" && Server.CheckHosts(cf)) {
			cf.Fork.reset();
		}
		context.res.setHeader("Content-Type", "application/json; charset=utf-8");
		context.finish(200);
	}
	return true;
};

Server.ForksRouter.DELETE = function(context){
	var fpath = context.pathTail.replace("/", "\\");
	var cf = Server.RoutingTable[fpath];
	if (!cf && context.url.query["key"]){
		cf = Server.Nodes[context.url.query["key"]];	
	}
	if (cf){		
		if (cf.State == "working") {
			cf.Fork.stop();
			Server.SaveConfig();
		}
		context.res.setHeader("Content-Type", "application/json; charset=utf-8");
		context.finish(200);
	}
	return true;
};

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
});

Server.Init();
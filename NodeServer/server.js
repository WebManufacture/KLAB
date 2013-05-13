var http = require('http');
var Url = require('url');
var path = require('path');
require(path.resolve("./Modules/Node/Utils.js"));
require(path.resolve("./Modules/Node/Logger.js"));
var RouterModule = require(path.resolve("./Modules/Node/Router.js"));
var Forks = require(path.resolve("./Modules/Node/Forks.js"));
var Files = require(path.resolve("./Modules/Node/Files.js"));
require(path.resolve("./Modules/Channels.js"));
var channelsClient = require(path.resolve("./Modules/Node/ChannelsClient.js"));
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
			file : this.File,
			host : this.Host,
			port : this.Port,
			location : this.Location,
			name : this.NodeName
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
			if (item.Location != "server"){
				var rr = Server.InitFork(rtable[i], port);
				if (rr){
					if (item.Location == "localhost"){
						if (Server.RoutingTable[rr.Host] != null){
							console.log("duplicate host ".warn + rr.Host);
							rr.State = "idle";
						}	
						else{
							Server.RoutingTable[rr.Host] = rr;	
						}				
						port++;
					}					
					Server.Nodes[rr.id] = rr;
				}			
			}
		}
	}
	setTimeout(function(){
		Server.Start(cfg);
	}, 100);
};

Server.SaveConfig = function(){
	console.log('config rewrite');
	fs.writeFileSync(Server.Config.routingFile, JSON.stringify(Server.ConfigTable), 'utf8');
};

Server.InitFork = function(rr, port){
	rr.__proto__ = NodeProto;
	//console.log(rr);
	if (!rr.Args) rr.Args = {};
	if (rr.Host){
		rr.Args.Host = rr.Host = rr.Host.toLowerCase();
	}
	if (port){
		if (!rr.Port) rr.Port = port;
		rr.Args.Port = port;
	}
	rr.Fork = Forks.Create(path.resolve(rr.File), null, rr.id);
	if (!rr.id){
		rr.id = rr.Fork.id;
	}
	rr.id = (rr.id + "").toLowerCase();
	rr.Fork.args = [JSON.stringify(rr.Args)];
	rr.Fork.on(".status", function(message, state){
		rr.State = state;
	});
	rr.Fork.on(".exit", function(message){
		rr.State = "exited";
		//rr.StatusChanged();
		console.log(" '" + rr.File + "' - " + (rr.Host + ":" + rr.Port) + " exited".warn);
	});
	rr.Fork.on(".error", function(cmessage, error){
		rr.State = "error";
		//rr.StatusChanged();
		console.log(" '" + rr.File + "' - " + (rr.Host + ":" + rr.Port) + " error".error);
		//console.log(error);
	})	
	if (rr.State == "working"){	
		rr.Fork.start();
		rr.State = "working";
		console.log(rr.NodeName.info + " '" + rr.File + "' - " + (rr.Host + ":" + rr.Port).info);
	}
	else{
		rr.State = "idle";	
	}
	rr.Fork.on("/process/http-response", Server.ForkResponse);
	return rr;
};

Server.WaitingRequests = {};

Server.RouteChannel = function(fork, req, res, url){
	var id = (Math.random() + "").replace("0.", "");
	var path = url.pathname;
	if (path.indexOf("/") == path.length - 1){
			path = path.substring(0, path.length - 1);
		}
	//console.log((new Date).formatTime(true) + " " + req.url.info);
	var message = "/process/http-request";
	message += "." + req.method.toLowerCase();
	message += ".id" + id;
	message += path;
	res.startTime = new Date();
	Server.WaitingRequests[id] = res;
	if (Server.Config.ResponseTimeout){
		res.timeout = setTimeout(function(){
			console.log("Timeout: ".error + req.url);
			delete Server.WaitingRequests[id];
			res.finished == true;
			res.end(500, "Server timeout");			
		}, Server.Config.ResponseTimeout);
	};
	var fullData = "";
	req.on("data", function(data){
		fullData += data;		
	});
	req.on("end", function(){
		fork.emit(message, id, url, req.headers, fullData);
	});
};

Server.ForkResponse = function(message){	
	var id = arguments[1];
	//console.log(id);
	if (!id) return null;
	var res = Server.WaitingRequests[id];
	if (!res) return;
	if (res.timeout){
		clearTimeout(res.timeout);
	}
	Server.FinishResponse(res, arguments);
	delete Server.WaitingRequests[id];
};

Server.FinishResponse = function(res, args){
	if (!res || res.finished) return false;
	var message = args[0];
	var id = args[1];
	var status = args[2];
	var result = args[3];
	var headers = args[4];
	res.setHeader("Start", res.startTime.valueOf());
	res.setHeader("Finish", new Date().valueOf());
	var load = (new Date() - res.startTime);
	res.setHeader("Load", load + " ms");
	if (headers){
		for (var header in headers){
			res.setHeader(header, headers[header]);
		}
	}
	//console.log(result.length);
	if (status){
		res.statusCode = status;
	}
	else{
		if (result){
			status = 200;
		}
		else{
			res.statusCode = 404;
			result = "No processing code detected";
		}
	}
	if (headers && headers.encoding){
		res.end(result, headers.encoding);
	}
	else{
		res.end(result, 'utf8');
	}	
	console.log(">> ".verbose + (new Date).formatTime(true) + " load: " + load + " " + res.url);
	return true;
};

Server.RouteProxy = function(req, res){
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
	var url = "http://" + req.headers.host  + req.url;
	var urlStr = url;
	res.url = urlStr;
	url = Url.parse(url.toLowerCase(), true);
	if (url.hostname == Server.Config.adminHost){
		return Server.Process(req, res, url);
	}
	var route = Channel.ParsePath(url.pathname);
	if (route.nodes.length > 0){
		var nodeId = route.nodes[0].type;
		var rr = Server.Nodes[nodeId];
		console.log("node ".debug + nodeId);
	}
	if (!rr){
		rr = Server.RoutingTable[url.hostname];
	}
	if (rr){	
		if (rr.Location == "localhost"){
			proxy.proxyRequest(req, res, { host: "127.0.0.1", port: rr.Port });
			return true;
		}
		if (rr.Location == "managed"){
			return Server.RouteChannel(rr.Fork, req, res, url);
		}
	}
	res.statusCode = 404;
	res.end(urlStr + " not found");
	console.log("not found: ".warn + urlStr);
	return false;
};


Server.Process = function(req, res){
	var url = Url.parse(req.url);
	try{
		var context = Server.Router.GetContext(req, res, "");
		Server.Router.Process(context);	
	}
	catch (e){
		if (context){
			context.error(e);
		}
		throw e;
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
				   "/routes": {
					   GET : function(context){
						   context.res.setHeader("Content-Type", "application/json; charset=utf-8");
						   context.finish(200, JSON.stringify(Server.CreateChannelMap(Channels.routes)));
					   }
				   },
				   "/nodes/>": Server.NodesRouter,
				   "/<":  channelsClient
			   });
	Files(config, Server);
	//console.log(router.Handlers.processMap)
	if (!config.Port) config.Port = 80;
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


Server.CreateChannelMap = function(channel, count){
	if (!count) count = 1;
	//if (count > 10) return null;
	if (!channel) return;
	var mapObj = null;
	for (var item in channel){
		var node = channel[item];
		if (!mapObj) mapObj = {};
		if (Array.isArray(node)){
			mapObj[item] = "[" + node.length + "]";
		}
		else{
			if (typeof(node) == "object"){
				var value = Server.CreateChannelMap(node, count + 1);
				if (value){			
					mapObj[item] = value;
				}
			}
			else{
				mapObj[item] = node;
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

/*

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
	var cf = Server.Nodes[fpath];
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
	var cf = Server.Nodes[fpath];
	if (!cf && context.url.query["key"]){
		cf = Server.Nodes[context.url.query["key"]];	
	}
	if (cf){	
		if (cf.State != "broken" && cf.State != "working" && Server.CheckHosts(cf)) {
			cf.Fork.start(function(){
				Server.SaveConfig();
			});
		}
		context.res.setHeader("Content-Type", "application/json; charset=utf-8");
		context.finish(200);
	}
	return true;
};

Server.ForksRouter.PUT = function(context){
	var fpath = context.pathTail.replace("/", "\\");
	var cf = Server.Nodes[fpath];
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
	var cf = Server.Nodes[fpath];
	if (!cf && context.url.query["key"]){
		cf = Server.Nodes[context.url.query["key"]];	
	}
	if (cf){		
		if (cf.State == "working") {
			cf.Fork.stop(function(){
				Server.SaveConfig();
			});
		}
		context.res.setHeader("Content-Type", "application/json; charset=utf-8");
		context.finish(200);
	}
	return true;
};*/

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
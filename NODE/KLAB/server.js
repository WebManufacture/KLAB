var http = require('http');
var Url = require('url');
var path = require('path');
require(path.resolve("./Modules/Node/Utils.js"));
var logger = require(path.resolve("./Modules/Node/Logger.js"));
var Forks = require(path.resolve("./Modules/Node/Forks.js"));
var Files = require(path.resolve("./Modules/Node/Files.js"));
require(path.resolve("./Modules/Channels.js"));
var channelsClient = require(path.resolve("./Modules/Node/ChannelsClient.js"));
var DBProc = require(path.resolve("./Modules/Node/DBProc.js"));
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

NodeProto = {
	serialize : function(){
		return {
			key : this.config.id,
			id : this.config.id,
			fork : this.Fork.toString(),
			args : this.config.Args,
			state : this.config.State,
			file : this.config.File,
			host : this.config.Host,
			port : this.config.Port,
			localPort : this.config.localPort,
			nodeType : this.config.Type,
			name : this.config.NodeName
		}
	},	
	
	toString : function(){
		return JSON.stringify(this.serialize());
	},
}

InternalNode = function(item, config){
	this.id = (rr.id + "").toLowerCase();
	this.module = require(path.resolve(item.File));	
	this.logger = logger.create(item.id + "/log");
	if (this.module.Init){
		this.module.Init(item, config, logger);
	}
	var node = this;
	Channels.on(this.id + "/control.start", function(){
		node.Start();
	});
	Channels.on(this.id + "/control.stop", function(){
		node.Stop();
	});	
	Channels.on(this.id + "/control.reset", function(){
		node.Reset();
	});
	return rr;
}

InternalNode.prototype = {
	Init : function(){
		if (this.type == "proxied" && this.module.ProcessRequest){
			var module = this.module;
			var serv = ILabRouter.AddNode(this, function(req, res, context){
				module.ProcessRequest(req, res);
				return false;
			});
		}
		if (this.type == "managed" && this.module.ProcessContext){
			var module = this.module;
			var serv = ILabRouter.AddNode(this, function(req, res, context){
				return module.ProcessContext(context);
			});
		}
	},
	
	Start : function(){
		try{
			var node = this;
			this.module.Start(function(){
				node.State = "working";
				Channels.emit(node.id + "/state.working");			
			});
		}
		catch (e){
			this.logger.error(e);
		}
	},	
	
	Stop : function(){
		try{
			var node = this;
			this.module.Stop(function(){
				node.State = "stoped";
				Channels.emit(node.id + "/state.stoped");
			});			
		}
		catch (e){
			this.logger.error(e);
		}
	},
	
	Reset : function(){
		try{
			if (this.State == "working"){
				this.module.Stop();
			}
			this.module.Start();
		}
		catch (e){
			this.logger.error(e);
		}
	}, 
	
	Process : function(req, res, context){
		
	}
}

IsolatedNode = function(rr, config){
	var fork = this.Fork = Forks.Create(path.resolve(rr.File), rr.Args, rr.id);
	this.id = (rr.id + "").toLowerCase();
	var node = this;
	if (!rr.Args) rr.Args = {};
	fork.args = JSON.stringify(rr.Args);
	fork.args = JSON.parse(fork.args);
	fork.on(".status", function(message, state){
		node.State = state;
		if (state == "working"){
			console.log(rr.Type.yellow + " " + rr.NodeName.info + " '" + rr.File + "' - " + (rr.Host + ":" + rr.Port).info);
		}
	});
	fork.on(".exit", function(message){
		node.State = "exited";
		console.log(" '" + rr.File + "' - " + (rr.Host + ":" + rr.Port) + " exited".warn);
	});
	fork.on(".error", function(cmessage, error){
		node.State = "error";
		console.log(" '" + rr.File + "' - " + (rr.Host + ":" + rr.Port) + " error".error);
		//console.log(error);
	});
}

IsolatedNode.prototype = {
	Init : function(item){
		if (!item.Args) item.Args = {};
		var pp = this.ProxyPort = ILabRouter.ProxyPort;
		this.fork.args.ProxyPort = pp;
		var serv = ILabRouter.AddNode(this, function(req, res){
			proxy.proxyRequest(req, res, { host: "127.0.0.1", port: pp });
			return false;
		});
		ILabRouter.ProxyPort++;
	},

	Start : function(){
		this.Fork.start();
	},
	
	Stop : function(){
		this.Fork.stop();
	},
	
	Reset : function(){
		this.Fork.reset();
	},
	
	Process : function(req, res, context){
		
	}
}
	
ExternalNode = function(item, cfg){
	
}

ExternalNode.prototype = {
	Init : function(){
		
	},

	Start : function(){
		
	},
	
	Stop : function(){
		
	},
	
	Reset : function(){
		
	},
	
	Process : function(req, res, context){
		
	}
}

for (var item in NodeProto){
	ExternalNode.prototype[item] = NodeProto[item];
	IsolatedNode.prototype[item] = NodeProto[item];
	InternalNode.prototype[item] = NodeProto[item];
}

ILab = {};

ILab.Init = function(){
	console.log(process.cwd().prompt);
	var cfg = { ver: "0.1.4", cfgFile : "Config.json", routingFile: "RoutingTable.json" };
	
	for (var i = 2; i < process.argv.length; i++){
		var arg = process.argv[i];
		var val = arg.split("=");
		if (val.length == 2){
			cfg[val[0]] = val[1];
		}
	}
	
	ILab.Config = cfg;
	ILab.Nodes = {};
	if (!fs.existsSync(cfg.cfgFile)){
		var cfgFile = fs.readFileSync(cfg.cfgFile, "", 'utf8');
		if (cfgFile && cfgFile.length > 0){
			cfgFile = JSON.parse(cfgFile);
			for (var item in cfgFile){
				var val = cfgFile[item];
				cfg[item] = val;
			}
		}
	}
	if (!fs.existsSync(cfg.routingFile)){
		fs.writeFile(cfg.routingFile, "", 'utf8');
	}
	var rtable = fs.readFileSync(cfg.routingFile, 'utf8');
	ILab.ConfigSource = rtable = JSON.parse(rtable);
	if (rtable && rtable.length > 0){
		if (!cfg.Port) cfg.Port = 80;
		ILabRouter.ProxyPort = cfg.PortStart;
		for (var i = 0; i < rtable.length; i++){
			var item = rtable[i];
			if (!item.Process){item.Process = "internal"};
			if (!item.id || Server.Nodes[item.id]) item.id = "node" + i;
			if (item.Frame){
				if (!item.Args) item.Args = {} ;
				item.Args.File = item.File;
				item.File = item.Frame + ".js"
			}
			if (item.Process == "internal") var node = new InternalNode(item, cfg);
			if (item.Process == "isolated") var node = new IsolatedNode(item, cfg);
			if (item.Process == "external") var node = new ExternalNode(item, cfg);
			node.config = item;
			node.process = item.Process;
			node.type = item.Type;
			node.Init(item, cfg);
			ILab.Nodes[item.id] = node;
			if (item.State == "working"){
				node.Start();
			}
		}
	}
};

ILab.SaveConfig = function(){
	console.log('config rewrite'.warn);
	fs.writeFileSync(ILab.Config.cfgFile, JSON.stringify(ILab.Config), 'utf8');
	fs.writeFileSync(ILab.Config.routingFile, JSON.stringify(ILab.ConfigSource), 'utf8');
};

ILabRouter = {
	
};

ILabRouter.ManagedProcess = function(req, res, url){
	try{
		var context = this.router.GetContext(req, res, "");
		this.router.Process(context);	
	}
	catch (e){
		if (context){
			context.error(e);
		}
		throw e;
	}
	return true;
};

ILabRouter.CreateServer = function (Port){
	console.log("ILAB server v "  + config.ver + " Listening " + Port + "");
	http.createServer(function(req, res){
		var port = Port;
		var host = req.headers.host;
		var url = "http://" + host + ":" + port + req.url;
		url = Url.parse(url.toLowerCase(), true);
		if (!Servers[port]){
			res.end(404, "No Servers for this port");
			return false;
		}
		res.setHeader("Access-Control-Expose-Headers", "content-type,debug-mode,Content-Type,ETag,Finish,ServerUrl,ServiceUrl,ManageUrl,Date,Start,Load,NodeId, NodeType");
		if (global.ILab){
			res.setHeader("ServiceUrl", global.ILab.ServiceUrl);
		}
		if (!Servers[port][host]){
			if (!Servers[port]["default"]){
				res.end(404, "No hosts handler for this port");
				return false;
			}
			else{
				return Servers[port]["default"].Process(req, res, url, host, port);
			}
		}
		else{
			return Servers[port][host].Process(req, res, url, host, port);
		}
	}).listen(Port);
}


ILabRouter.CreateRouter = function(port, host, config){
	var router = require(Path.resolve("./Modules/Node/Router.js"));
	router.map("Security", {});
	router.map("Main", 
			   {
				   "/map": {
					   GET : function(context){
						   context.res.setHeader("Content-Type", "application/json; charset=utf-8");
						   context.finish(200, JSON.stringify(Server.CreateMap(router.Handlers.mainMap)));
					   }
				   }
				   "/<" channelsClient
			   });
	return router;
}

ILabRouter.CreateMap = function(routerMapNode){
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
				var value = CreateMap(node);
				if (value){
					if (!mapObj) mapObj = {};
					mapObj[item] = value;
				}
			}
		}
	}
	return mapObj;
};


ILabRouter.CreateChannelMap = function(channel, count){
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
				var value = CreateChannelMap(node, count + 1);
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


ILabRouter.AddManagedNode = function(node, host, port, path, callback){
	if (Servers[port] == null) {
		Servers[port] = CreateServer(port);
	}
	var hosts = Servers[port];
	if (!host) host = "default";
	if (!path) path = "/<";
	if (!hosts[host]){
		hosts[host] = {
			router : CreateRouter(port, host);
			host : host,
			port : port,
			Process : ILabRouter.ManagedProcess			
		}
	}
	var router = hosts[host].router;
	router.for("Main", path,  function(context){
		if (!callback.call(node, context.req, context.res)){
			context.abort();
		};
	});
	return hosts[host];
}

ILabRouter.AddProxiedNode = function(node, host, port, path, callback){
	if (Servers[port] == null) {
		Servers[port] = CreateServer(port);
	}
	var hosts = Servers[port];
	if (!host) host = "default";
	if (hosts[host]){
		console.log(("Proxied Node " + node.id + " on " + host + ":" + port + " OVERLAP other server!").warn);
		return;
	}
	hosts[host] = {
		node : node,
		host : host,
		port : port,
		Process : function(req, res){
			callback.call(node, req, res);
		}
	}
	return hosts[host];
}

ILabRouter.AddNode = function(node, callback){
	var host = "default";
	var port = ILab.Config.DefaultPort;
	if (node.config.Host){
		host = node.config.Host;
	}
	if (node.config.Port){
		port = node.config.Port;
	}
	path = node.config.Path;
	if (node.type == "managed"){
		return AddManagedNode(node, host, port, path, callback);
	}
	if (node.type == "proxied"){
		return AddProxiedNode(node, host, port, path, callback);
	}
	return null;
};

process.on('SIGTERM', function() {
	for (var item in ILab.Nodes){
		console.log("EXITING: " + item.id.info);
		ILab.Nodes[item].Stop();
	}
});

process.on('exit',function(){
	for (var item in ILab.Nodes){
		console.log("EXITING: " + item.id.info);
		ILab.Nodes[item].Stop();
	}
});

ILab.Init();
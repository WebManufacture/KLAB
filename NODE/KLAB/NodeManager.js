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
var ProxyManager = require("ProxyManager.js");
var NodesManager = require("NodesManager.js");
var fs = require('fs');

Nodes = {};

NodesRouter = {
	GET : function(context){
		var nodeId = context.pathTail.trim();
		if (nodeId.lastIndexOf("/") == nodeId.length - 1){
			nodeId = nodeId.substring(0, nodeId.length - 1);
		}
		if (nodeId.start("/")) nodeId = nodeId.substring(1);
		var node = Server.Nodes[nodeId];
		if (node){
			context.res.setHeader("Content-Type", "text/json; charset=utf-8");
			context.finish(200, JSON.stringify(node.serialize()));
		}
		else{
			context.finish(404, "node " + nodeId + " not found");
		}
		return true;
	},
	SEARCH : function(context){
		context.res.setHeader("Content-Type", "text/json; charset=utf-8");
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
	},
	DELETE : function(context){
	
	}
};

process.on('SIGTERM', function() {
	for (var item in Nodes){
		console.log("EXITING: " + item.info);
		Nodes[item].Fork.stop();
	}
});

process.on('exit',function(){
	for (var item in Nodes){
		console.log("EXITING: " + item.info);
		Nodes[item].Fork.stop();
	}
});

Server.Init();
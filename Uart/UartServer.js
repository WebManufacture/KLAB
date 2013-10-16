var http = require('http');
var Url = require('url');
var fs = require('fs');
var paths = require('path');
var edge = require('edge');

require(paths.resolve("./Modules/Node/Utils.js"));
require(paths.resolve("./Modules/Channels.js"));
require(paths.resolve('./Modules/Node/Logger.js'));
require(paths.resolve('Uart/Uart.js'));

UartServer = {};

UartPorts = {};
UartPortsConnections = {};

UartServer.Init = function(config, router, logger){
	if (config){
		UartServer.Config = config;
	}
};

UartServer.Process = {
	GET : function(req, res, url, data){
		var port = url.pathname.replace("/", ""); 
		if (port.length == "") 
		{
			res.finishText(404, "port " + port + " not found!");
			return;
		}
		if (port.indexOf("COM") != 0) 
		{
			res.finishText(500, "port " + port + " undefined!");
			return;
		}
		if (UartPorts[port] == null){
			port = UartPorts[port] = new Uart(port);
			port.connections = 0;
			port.Open(url.query.speed, url.query.timeout, url.query.parity);
		}
		else{
			port = UartPorts[port];
		}
		port.connections++;
		var handler = function(){
			try{
				var params = [];
				for (var i = 0; i < arguments.length; i++){
					//if (arguments[i].length && arguments[i].length > 100) params.push("Long param: " + arguments[i].length);
					params.push(arguments[i]);
				}
				res.write(JSON.stringify(params) + "\n");
			}
			catch(e){
				res.write(JSON.stringify(e) + "\n");
			}	
		}
		res.on("close", function(){			
			Channels.clear("/" + port.port + ".received", handler);
			Channels.clear("/" + port.port + ".opened", handler);
			Channels.clear("/" + port.port + ".closed", handler);
			port.connections--;
			if (port.connections <= 0){
				port.Close();	
				UartPorts[port.port] = null;
			}
		});
		res.write("[" + JSON.stringify(port) + "]");
		Channels.on("/" + port.port + ".received", handler);
		Channels.on("/" + port.port + ".opened", handler);
		Channels.on("/" + port.port + ".closed", handler);
		console.log(">> Subscribe to: "  + port.port);
	},
	
	POST : function(req, res, url, data){
		var port = url.pathname.replace("/", ""); 
		if (port.length == "") 
		{
			res.finishText(404, "port " + port + " not found!");
			return;
		}
		if (port.indexOf("COM") != 0) 
		{
			res.finishText(500, "port " + port + " undefined!");
			return;
		}
		if (UartPorts[port] == null){
			res.finishText(404, "port " + port + " closed!");
			return;
		}
		console.log("Emmiting: "  + data);
		Channels.emit("/" + port + ".send", data);		
		res.finish(200);
	},
	
	SEARCH : function(req, res, url, data){
		Uart.List(function(lst){
			var result = {};
			for (var i = 0; i < lst.length; i++){
				var port = UartPorts[lst[i]];
				var obj = result[lst[i]] = {
					opened : false				
				}
				if (port){
					obj.opened = true;
					obj.speed = port.speed;
					obj.parity = port.parity;
					obj.timeout = port.timeout;
				}
			}
			res.finish(200, result);
		});
	},
}

module.exports = UartServer;
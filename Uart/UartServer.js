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

UartServer.Init = function(config, globalConfig, logger){
	if (config){
		UartServer.Config = config;
	}
	if (UartServer.Config.ProxyPort) UartServer.Config.ProxyPort = UartServer.Config.Port;
	if (!module){
		setTimeout(UartServer.Start, 100);
	}
};
		
UartServer.ProcessContext = function(context){
	context.setHeader("Access-Control-Allow-Origin", "*");
	context.setHeader("Access-Control-Allow-Methods", "GET, DELETE, PUT, POST, HEAD, OPTIONS, SEARCH");
	context.setHeader("Access-Control-Allow-Headers", "debug-mode,origin,content-type");
	context.setHeader("Access-Control-Max-Age", "12000");
	context.setHeader("Access-Control-Expose-Headers", "content-type,debug-mode,Content-Type,ETag,Finish,Date,Start,Load");		
	context.setHeader("Content-Type", "text/plain; charset=utf-8");
	if (context.req.method == 'OPTIONS'){
		context.finish(200, "OK");	
		return true;
	}
	try{
		return true;
	}
	catch (e){
		error(e);
	}
	return true;
};

module.exports = UartServer;
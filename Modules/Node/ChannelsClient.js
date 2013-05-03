var paths = require('path');
require(paths.resolve('./Modules/Node/Channels.js'));
log = require(paths.resolve('./Modules/Node/Logger.js')).log;
error = require(paths.resolve('./Modules/Node/Logger.js')).error;
info = require(paths.resolve('./Modules/Node/Logger.js')).info;
debug = require(paths.resolve('./Modules/Node/Logger.js')).debug;

module.exports = {
	
	GET :  function(context){
		context.request.on("close", function(){
			Channels.(
		});
		res.setHeader("Content-Type", "application/json; charset=utf-8");
		
		context.break = true;
		return false;
	},

	POST : function(context){
		context.request.on("close", function(){
			//Channels.(
		});
		res.setHeader("Content-Type", "application/json; charset=utf-8");
		
		context.break = true;
		return false;
	},

Server.SendMessage = function(message){
	for (var i = 0; i < Server.Monitors.length; i++){
		var c = Server.Monitors[i];
		if (c && c.req){
			console.log("send: " + c.req.url);
			c.res.write(message);
		}
	}	
};

	},

	SEARCH :  function(context){
	
	},
}

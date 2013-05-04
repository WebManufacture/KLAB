var paths = require('path');
require(paths.resolve('./Modules/Channels.js'));
log = require(paths.resolve('./Modules/Node/Logger.js')).log;
error = require(paths.resolve('./Modules/Node/Logger.js')).error;
info = require(paths.resolve('./Modules/Node/Logger.js')).info;
debug = require(paths.resolve('./Modules/Node/Logger.js')).debug;

HttpChannelsClient = {	
	GET :  function(context){
		if (context.completed){
			return true;	
		}
		var path = context.pathname;
		var response = context.res;
		var request = context.req;
		var handler = function(){
			try{
				var params = [];
				for (var i = 0; i < arguments.length; i++){
					params.push(arguments[i]);
				}
				response.write(JSON.stringify(params));
			}
			catch(e){
				response.write(JSON.stringify(e));
			}
		}
		request.on("close", function(){
			Channels.clear(path, handler);
		});
		Channels.on(path, handler);
		response.setHeader("Content-Type", "application/json; charset=utf-8");		
		context.break = true;
		return false;
	},

	POST : function(context){
		if (context.completed){
			return true;	
		}
		var path = context.pathName;
		var response = context.res;
		var request = context.req;
		var fullData = "";		
		response.setHeader("Content-Type", "application/json; charset=utf-8");
		request.on("data", function(data){
			fullData += data;		
		});
		request.on("end", function(){
			Channels.emit(path, fullData);
			context.finish(200);
			context.continue();
		});		
		return false;
	},

	SEARCH :  function(context){
		if (context.completed){
			return true;	
		}
	},
}


module.exports = HttpChannelsClient;
	

require(require("path").resolve("./Modules/Node/Utils.js"));
if (global.Channels){
	process.on("message", function(pmessage){
		if (typeof pmessage == "object" && pmessage.type && pmessage.type == "channelControl" && pmessage.pattern){
			Channels.followToGlobal(pmessage.pattern);
		}
		if (typeof pmessage == "object" && pmessage.type && pmessage.type == "channelMessage"){
			var dateEnd = new Date();
			var dateStart = new Date(pmessage.date);
			//console.log(">> " + pmessage.args[0] + " Start: " + dateStart.formatTime(true) + " End: " + dateEnd.formatTime(true) + " Load: " + (dateEnd - dateStart) + "ms");
			Channels.emit.apply(Channels, pmessage.args);
		}
	});
	
	Channels.subscribeToGlobal = function(pattern){
		process.on("message", function(pmessage){
			if (typeof pmessage == "object" && pmessage.type && pmessage.type == "channelMessage" && pmessage.args){
				Channels.emit.apply(Channels, pmessage.args);		
			}
		});
		process.send({ type : "channelControl", pattern : pattern });
	};
	
	Channels.followToGlobal = function(pattern){
		Channels.on(pattern, function(message){
			var params = [];
			params.push(message.source);
			for (var i = 1; i < arguments.length; i++){
				params.push(arguments[i]);
			}
			process.send({ type : "channelMessage", args : params });
		});
	};
	
	Channels.emitToGlobal = function(message){
		process.send({ type : "channelMessage", args : arguments });
	};
}
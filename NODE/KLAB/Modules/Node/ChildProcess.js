if (global.Channels){
	Channels.bindToGlobal = function(pattern){
		Channels.on(pattern, function(message){
			process.send({ type : "channelMessage", args : arguments });
		});
		process.on("message", function(pmessage){
			if (typeof pmessage == "object" && pmessage.type && pmessage.type == "channelMessage" && pmessage.args){
				var message = pmessage.args[0];
				pmessage.args.shift();
				Channels.emit.apply(message, pmessage.args);		
			}
		});
		process.send({ type : "channelControl", pattern : pattern });
	};
	
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
			process.send({ type : "channelMessage", args : arguments });
		});
	};
	
	Channels.emitToGlobal = function(message){
		process.send({ type : "channelMessage", args : arguments });
	};
}
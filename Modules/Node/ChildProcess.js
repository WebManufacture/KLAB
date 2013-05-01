if (global.Channels){
	process.on("message", function(message){
		if (typeof message == "object" && message instanceof ChannelMessage){
			if (message.params){
				message.params.unshift(message);
				Channels.emit.apply(message.params);		
			}
			else{
				Channels.emit(message);
			}
		}
	});
	
	Channels.on("*", function(message){
		if (arguments.length > 1){
			message.params = [];
			for (var i = 1; i < arguments.length; i++){
				message.params.push(arguments[i]);
			}
		}
		process.send(message);	
	});
}
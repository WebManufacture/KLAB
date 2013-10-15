Uart = {
	Init : function(config){
		this.UartUrl = config.UartUrl;
		if (!this.UartUrl.ends("/")){
			this.UartUrl += "/";	
		}
	},
	
	Connect : function(port, callback){
		this.Channel = new HttpChannel(this.UartUrl + port, this.OnReceive, function(){
			//Uart.Send("1");
			callback(port);	
		}); 
	},
	
	OnReceive : function(data){
		console.log(data);
	},
	
	Send : function(data){
		this.Channel.write("", data);
	},
}
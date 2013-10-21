var edge = require('edge');
var path = require('path');
require(path.resolve("./Modules/Node/Utils.js"));
require(path.resolve("./Modules/Channels.js"));
require(path.resolve('./Modules/Node/Logger.js'));

var uartFunc = edge.func({
	source: "Uart/Uart.cs",
	references: [ ]
});
	
global.Uart = function(port){
	this.port = port;
	var uart = this;
	Channels.on(port + ".send", function(message, data){
		uart.Write(data);
	});
};

Uart.List = function(callback){
	uartFunc({action : 'list'}, function(err, result){
		callback(result);
	}); 
};
	

global.Uart.prototype = {	
	Open : function(speed, timeout, parity){
		var uart = this;
		var initAct = {action: "init"};
		if (this.port) initAct.port = this.port;
		if (speed) initAct.speed = speed;
		this.speed = speed;
		if (timeout) initAct.timeout = timeout;
		this.timeout = timeout;
		if (parity != null && parity != undefined){
			initAct.parity = parity;	
		}
		this.parity = parity;
		var uart = this;
		uartFunc(initAct, function(err, result){
			if (err){
				error(err);	
				uart.error = err;
			}
			if (result){
				console.log(uart.port + " Opened!");
				Channels.emit("/" + uart.port + ".opened");
				uart.opened = true;
				process.on("exit", function(){
					uart.Close();
				});
				uart.Read();
			}
			else{
				uart.opened = false;
			}
		});
		process.on("exit", function(){
			//uart.Close();
		});
	},
	
	Write : function(data, callback){
		if (!this.opened) return;
		if (!data.length) return;
		for (var i = 0; i < data.length; i++){
			if (typeof data[i] == 'number') continue;
			if (typeof data[i] == 'string'){
				data[i] = data[i].charCodeAt(0);
				continue;
			}			
			break;
		}
		console.log("Sending " + data);
		uartFunc({action : 'write-sized', data : data}, function(err, result){
			data.sended = true;	
		}); 
		//Uart.waitResponse(data.command);
	},
		
	Read : function(){
		if (!this.opened) return;
		var uart = this;
		var port = this.port;
		var readFunc = function(){
			if (!uart.opened) return;
			uartFunc({action: "read"}, function(err, result){
				if (err){
					//log(err);
					console.log(err);
					setTimeout(readFunc, 1000);
					return;
				}
				if (result && result.command){
					Channels.emit(port + ".received", result);
				}
				setTimeout(readFunc, 200);
			});
		}	
		this.readTimeout = setTimeout(readFunc, 200);
	},
	
	Close : function(){
		if (!this.opened) return;
		this.opened = false;
		var port = this.port;
		clearTimeout(this.readTimeout);
		uartFunc({action: "close"}, function(err, result){
			Channels.emit("/" + port + ".closed");
			console.log(port + " Closed!");	
		}); 		
	},
	
	GetState : function(callback){
		if (!Uart.opened) {
			callback("not opened");
			return;
		}
		uartFunc({action: "state"}, function(err, result){
			callback(result);	
		}); 
	}		
}



BIT_0 = 1;
BIT_1 = 2;
BIT_2 = 4;
BIT_3 = 8;
BIT_4 = 16;
BIT_5 = 32;
BIT_6 = 64;
BIT_7 = 128;


Uart = {
	Init : function(config){
		this.UartUrl = config.UartUrl;
		if (!this.UartUrl.ends("/")){
			this.UartUrl += "/";	
		}
	},
	
	Connect : function(port, callback){
		this.Channel = new HttpChannel(this.UartUrl + port, this.OnReceive, function(){
			callback(port);	
			Uart.SendTask({command : 0});
		}); 
	},
	
	OnReceive : function(data){
		console.log(data);
	},
	
	Send : function(data){
		this.Channel.write(data);
	},
	
	Commands : {
		"none" : 0,
	},
	
	SendTask : function(data){
		var dta = [];
		var command = parseInt(data.command);
		if (isNaN(command)){
			command = Uart.Commands[data.command];	
		}
		dta[0] = command;
		var address = data.address;
		if (typeof data.task != 'number'){
			address = 0;
		}
		dta[1] = parseByte(address, 2);
		dta[2] = parseByte(address, 1);
		var task = data.task;
		if (typeof data.task != 'number'){
			if (data.serialize){
				task = data.serialize();
			}
			else{
				task = 0;	
			}
		}
		dta[3] = parseByte(task,4);
		dta[4] = parseByte(task,3);
		dta[5] = parseByte(task,2);
		dta[6] = parseByte(task,1);
		this.Channel.write(dta);
	},			
}


function parseByte(value, index){
	if (index){
		value >> (8 * (index - 1));
	}
	return (value << 24) >> 24;
}

function parseWord(value, index){
	return (value << 16) >> 16;
}

function Task (command, address, flags, value, start){
	this.command = command;
	this.address = address;
	if (typeof flags == 'number'){
		this.isActive = flags & BIT_7 == BIT_7;
		this.type = (flags & (BIT_6 + BIT_5)) >> 5;
		this.port = flags & (BIT_4 + BIT_3 + BIT_2 + BIT_1 + BIT_0);
	}
	this.value = value;
	this.start = start;
}

Task.prototype.serizalize = function(){
    return Task.Serizalize(this.isActive, this.type, this.port, this.value, this.start);
}

Task.Serizalize = function(isActive, type, port, value, start){
	var value = 0;
	var flags = isActive ? BIT_7 : 0;
	flags += type ? type << 5 : 0;
	flags += port ? port : 0;
	value = (flags ? flags : 0) << 24 + (value ? value : 0) << 16 + parseWord((start ? start : 0));
    return value;
}



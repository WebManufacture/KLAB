var http = require('http');
var Url = require('url');
//logger = require('./logger.js');

process.on("message", function(context){
	var res = {};
	res.id = context.id;
	res.code = 200;
	res.result = "ascascacs";
	process.send(res);
});

Server = {};

Server.Config = JSON.parse(process.argv[2]);

Server.Process = function(req, res){
	res.end(Server.Config.value + "");
}

http.createServer(Server.Process).listen(Server.Config.Port);
var http = require('http');
var Url = require('url');
var fs = require('fs');
var Path = require('path');
Server = server = {};

Server.Init = function(){
	config = fs.readFileSync("config.json");
	console.log("Listening " + config);
	config = JSON.parse(config);
	Server.AuthServer = http.createServer(Server.OnAuth);
	Server.AuthServer.listen(config.AuthPort);
	Server.VideoServer = http.createServer(VideoServer.OnConnect);
	Server.VideoServer.listen(config.VideoPort);
};

Server.OnAuth = function(req, res){
	var url = Url.parse(req.url, true);
	var userid = url.query.userid;
	var hash = url.query.hash;
	if (userid && hash){
		console.log("auth: " + userid + " " + hash);
		VideoServer.Users[userid] = { hash : hash, time : new Date() };
		res.setHeader("Content-Type", "text/plain; charset=utf-8");
		res.writeHead(200);
		res.end();	
		return;
	}
	res.setHeader("Content-Type", "text/plain; charset=utf-8");
	res.writeHead(403);
	res.end();	
};

VideoServer = {};

VideoServer.Users = {};

VideoServer.OnConnect = function(req, res){
	var url = Url.parse(req.url, true);
	//console.log(url);
	var fpath = Path.resolve(config.VideoPath + '/' + url.pathname);
	fs.stat(fpath, function(err, stat){
		if (err || !stat){
			console.log(err);
			err = "video " + url.pathname + " not found " + err;
			res.setHeader("Content-Type", "text/plain; charset=utf-8");
			res.writeHead(404, { "Content-Length": err.length } );
			res.end();		
			return;
		}
		var total = stat.size;
		var range = req.headers.range;
		var chunksize = config.ChunkSize;
		if (range){
			var parts = range.replace(/bytes=/, "").split("-");
		}
		else{
			parts = [0, chunksize];	
		}
		var partialstart = parts[0];
		var partialend = parts[1];
		res.startRange = parseInt(partialstart, 0);
		res.finishRange = res.startRange + chunksize;
		if (res.startRange == 0){
			console.log("Send: " + url.pathname + " - " + total);
		}
		if (res.finishRange > total - 1){
			res.finishRange = total - 1;
		}
		res.on("close", function(){
			if (this.sendInterval){
				//console.log("request closed: " + sKey);
				//clearInterval(this.sendInterval);	
			}
			console.log("closing: " + uid);
		});				
		
		
		var rs = fs.createReadStream(fpath, {autoclose: true, start: res.startRange, end: res.finishRange});
		rs.on('open', function () {
			var headers = { "Accept-Ranges": "bytes", "Content-Type": "video/mp4", "pragma": "no-cache", "Cache-Control" : "no-cache", "Expires" : "01.01.2000" };
			headers["Content-Range"] = "bytes " + res.startRange + "-" + res.finishRange + "/" + total;
			headers["Content-Length"] = (res.finishRange - res.startRange);
			res.writeHead(206, headers);
			rs.pipe(res);
		});
		
		rs.on('error', function(err) {
			console.log(err);
			res.startRange = null;
			res.writeHead(500);
			res.end();
		});
	});		
}


Server.Init();


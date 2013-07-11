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
	var fpath = Path.resolve(config.VideoPath.replace("{fname}",url.pathname));
	var hash = url.query.key;
	var uid = url.query.userid;
	var referer = req.headers.referer;
	if (!uid || !hash || hash.length <= 1){
		console.log("errkey: " + hash);
		res.setHeader("Content-Type", "text/plain; charset=utf-8");
		res.writeHead(403);
		res.end();	
		return;
	}
	var user = VideoServer.Users[uid];
	if (!user){
		console.log("User not found: " + user);
		res.setHeader("Content-Type", "text/plain; charset=utf-8");
		res.writeHead(401);
		res.end();	
		return;
	}
	if (user.hash != hash){
		console.log("Incorrect hash: " + hash);
		res.setHeader("Content-Type", "text/plain; charset=utf-8");
		res.writeHead(403);
		res.end();	
		return;
	}
	if ((new Date() - user.time.valueOf()) > 20*(60000)){
		console.log("User expired: " + user);
		VideoServer.Users[uid] = null;
		res.setHeader("Content-Type", "text/plain; charset=utf-8");
		res.writeHead(403);
		res.end();	
		return;
	}
	if (new Date() > Date.parse("2013 july 20")){
		console.log("License expired: " + user);
		VideoServer.Users[uid] = null;
		res.setHeader("Content-Type", "text/plain; charset=utf-8");
		res.writeHead(403);
		res.end();	
		return;
	}
	var regex = new RegExp(config.RefererPage.replace("{uid}", uid.toLowerCase()).replace("{key}", user.hash.toLowerCase()));
	if (!referer || !regex.test(referer.toLowerCase())){
		console.log("UNAUTHORIZED ACCESS!!!: " + referer);
		VideoServer.Users[uid] = null;
		res.setHeader("Content-Type", "text/plain; charset=utf-8");
		res.writeHead(403);
		res.end();	
		return;
	}
	user.time = new Date();
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
		
		var headers = { "Accept-Ranges": "bytes", "pragma": "no-cache", "Cache-Control" : "no-cache", "Expires" : "01.01.2000" };
		headers["Content-Type"] =  "video/mp4";
		if (fpath.indexOf(".webm") == fpath.length - 5) headers["Content-Type"] =  "video/webm";
		headers["Content-Range"] = "bytes " + res.startRange + "-" + res.finishRange + "/" + total;
		headers["Content-Length"] = (res.finishRange - res.startRange) + 1;
		res.writeHead(206, headers);
		var rs = fs.createReadStream(fpath, {autoclose: true, start: res.startRange, end: res.finishRange});
		rs.on('open', function () {
			rs.pipe(res);
		});
		
		// This catches any errors that happen while creating the readable stream (usually invalid names)
		rs.on('error', function(err) {
			console.log(err);
			res.startRange = null;
			res.end();
		});
		/*
				res.sendInterval = setInterval(function(){
					if (res.startRange != null && res.startRange < total){
						var buf = new Buffer(chunksize);
						fs.read(file, buf, 0, chunksize, res.startRange, function(err, bytesRead, buffer){
							if (err){
								console.log(err);
								res.setHeader("Content-Type", "text/plain; charset=utf-8");
								res.writeHead(500);
								console.log(err);
								res.startRange = null;
								res.end("video " + url.pathname + " readerror " + err);		
								return;
							}
							console.log("Send: " + res.startRange);
							res.write(buffer, 'binary');								
							res.startRange = res.startRange + chunksize;
						});
					}
					else{							
						clearInterval(res.sendInterval);
						fs.close(file);
						console.log("request closing by finishing: " + res.startRange  + " " + total);
						res.end();
					}
				}, 400);
				
				res.writeContinue();
				*/
	});		
}


Server.Init();


var http = require('http');
var Url = require('url');
var fs = require('fs');
var Path = require('path');
try{
	require(Path.resolve("./Modules/Node/Utils.js"));
	var RouterModule = require(Path.resolve("./Modules/Node/Router.js"));
	var Files = require(Path.resolve("./Modules/Node/Files.js"));
	var Auth = require(Path.resolve("./Modules/Node/Auth.js")).Auth;
	log = require(Path.resolve('./Modules/Node/Logger.js'));
	error = require(Path.resolve('./Modules/Node/Logger.js')).error;
	info = require(Path.resolve('./Modules/Node/Logger.js')).info;
	debug = require(Path.resolve('./Modules/Node/Logger.js')).debug;

	process.on('SIGTERM', function() {
		for (var item in Server.Nodes){
			console.log("EXITING: " + item.info);
			Server.Nodes[item].Fork.stop();
		}
	});
	
	process.on('exit',function(){
		for (var item in Server.Nodes){
			console.log("EXITING: " + item.info);
			Server.Nodes[item].Fork.stop();
		}	
		Server.HTTPServer.close();
	});
	
	Server = server = {};
	
	Server.Config = JSON.parse(process.argv[2]);
		
	Server.Process = function(req, res){
		res.setHeader("Access-Control-Allow-Origin", "*");
		res.setHeader("Access-Control-Allow-Methods", "GET, DELETE, PUT, POST, HEAD, OPTIONS, SEARCH");
		res.setHeader("Access-Control-Allow-Headers", "debug-mode,origin,content-type");
		res.setHeader("Access-Control-Max-Age", "12000");
		res.setHeader("Access-Control-Expose-Headers", "content-type,debug-mode,Content-Type,ETag,Finish,Date,Start,Load");
		
		res.setHeader("Content-Type", "text/plain; charset=utf-8");
		
		if (req.method == 'OPTIONS'){
			res.statusCode = 200;
			res.end("OK");	
			return;
		}
		var url = Url.parse(req.url);
		try{
			var context = Server.Router.GetContext(req, res, "");
			Server.Router.Process(context);	
		}
		catch (e){
			error(e);
			if (context){
				context.error(e);
			}
		}
	};
	
	Server.Init = function(){
		var config = Server.Config;
		if (!Server.Config.basepath) Server.Config.basepath = "./";
		if (!(Server.Config.basepath.ends('/') || Server.Config.basepath.ends('\\'))) Server.Config.basepath += "/";
		var router = Server.Router = RouterModule;
		var filesRouter = Files(config, Server);
		var AuthRouter = require(Path.resolve("./Modules/Node/Auth.js"))(config, log);
		router.map("mainMap", 
				   {
					   "/map": {
						   GET : function(context){
							   context.res.setHeader("Content-Type", "application/json; charset=utf-8");
							   context.finish(200, JSON.stringify(Server.CreateMap(router.Handlers.mainMap)));
						   }
					   },
					   "/Auth" : AuthRouter,
					   "/>" : {
						   GET : function(context){
							   var path = Path.resolve("." + context.pathName);
							   fs.stat(path, function(err, stat){
								   if (err){
									   context.continue();   
									   return;
								   }
								   if (stat.isDirectory()){
								   	   context.res.setHeader("Content-Type", "text/html; charset=utf-8");
									   fs.readFile("./files.htm", "utf8", function(err, result){   
										   if (err){
											   context.finish(500, "Not found files view page " + err);
											   return;
										   }		
										   context.finish(200, result);
									   });
									   return;
								   }
								   if (stat.isFile() && context.query["action"] == "edit"){
									   context.res.setHeader("Content-Type", "text/html; charset=utf-8");
									   fs.readFile("./TextEditor.htm", "utf8", function(err, result){   
										   if (err){
											   context.finish(500, "Not found files view page " + err);
											   return;
										   }		
										   context.finish(200, result);
									   });
									   return;   
								   }
								   context.continue();
							   });
							   return false;
						   }
					   },					   
					   "/<": filesRouter
				   });
		
		console.log("Video Lab server v "  + Server.Config.ver);
		console.log("Listening " +  config.Host + ":" + config.Port + "");
		Server.HTTPServer = http.createServer(Server.Process);
		Server.HTTPServer.listen(config.Port);
		Server.VideoServer = http.createServer(VideoServer.OnConnect);
		Server.VideoServer.listen(9000);
	};
			
	
	VideoServer = {};
	
	VideoServer.Users = {};
	
	VideoServer.OnConnect = function(req, res){
		var url = Url.parse(req.url, true);
		//console.log(url);
		var fpath = Path.resolve(Server.Config.basepath + 'store/' + url.pathname);
		var cookie = req.headers.cookie;
		var vre = /VideoKey=([0-9a-f]+)/ig;
		var vCookie = vre.exec(cookie);
		var sKey = url.query.key;
		if (!sKey || sKey.length <= 1){
			console.log("errkey: " + sKey);
			res.setHeader("Content-Type", "text/plain; charset=utf-8");
			res.writeHead(403);
			res.end("error key");	
			return;
		}
		Auth.RetreiveUser(sKey, function(user){
			if (!user || !user.sessionKey){
				console.log("user: " + user);
				res.setHeader("set-cookie", "AuthKey=null;VideoKey=null;");
				res.setHeader("Content-Type", "text/plain; charset=utf-8");
				res.writeHead(401);
				res.end();	
				return;
			}
			fs.stat(fpath, function(err, stat){
				if (err || !stat){
					console.log(err);
					err = "video " + url.pathname + " not found " + err;
					res.setHeader("Content-Type", "text/plain; charset=utf-8");
					res.writeHead(404, { "Content-Length": err.length } );
					res.end(err, 'utf8');		
					return;
				}
				var total = stat.size;
				fs.open(fpath, 'r', function(err, file){
					if (err || !file){
						err = "video " + url.pathname + " not opening " + err;
						res.setHeader("Content-Type", "text/plain; charset=utf-8");
						res.writeHead(500, { "Content-Length": err.length } );
						res.end(err, 'utf8');		
						return;
					}				
					var range = req.headers.range;
					var chunksize = 100000;
					if (range){
						var parts = range.replace(/bytes=/, "").split("-");
					}
					else{
						parts = [0, chunksize];	
					}
					var partialstart = parts[0];
					var partialend = parts[1];
					var start = parseInt(partialstart, 0);
					var end = partialstart + chunksize;
					
					var uKey = VideoServer.Users[user.login];
					var newKey = "";
					for (var i = 0; i < 20; i++){
						newKey += Math.floor(Math.random(16)*16).toString(16);
					}
					if (!uKey || start == 0){
						uKey = VideoServer.Users[user.login] = newKey; 	
						res.setHeader("Set-Cookie", "VideoKey=" + newKey);
					}
					else{		
						if (!vCookie || vCookie.length <= 1 || vCookie[1] != uKey){
							console.log(uKey);
							console.log(vCookie);
							res.setHeader("Set-Cookie", "VideoKey=" + newKey);
							res.setHeader("Content-Type", "text/plain; charset=utf-8");
							res.writeHead(403);
							res.end();	
							return;
						}
						uKey = VideoServer.Users[user.login] = newKey; 	
						res.setHeader("Set-Cookie", "VideoKey=" + newKey);
					}								
					var buf = new Buffer(chunksize);
										
					fs.read(file, buf, 0, chunksize, start, function(err, bytesRead, buffer){
						if (err){
							console.log(err);
							res.setHeader("Content-Type", "text/plain; charset=utf-8");
							res.writeHead(500);
							res.end("video " + url.pathname + " readerror " + err);		
							return;
						}
						console.log("Send: " + start);
						res.writeHead(206, { "Content-Range": "bytes " + start + "-" + (start + bytesRead) + "/" + total, "Accept-Ranges": "bytes", "Content-Type": "video/mp4" });
						res.end(buffer, 'binary');		
					});
				});		
			});
		});
	}
	
	
	Server.Init();
}
catch(e){
	if (this.error){
		error(e);	
		process.exit();
	}
	else{
		throw(e);
	}
}


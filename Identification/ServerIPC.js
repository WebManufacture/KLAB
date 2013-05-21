var Url = require('url');
var fs = require('fs');
var Path = require('path');
ObjectID = require('mongodb').ObjectID;
try{
	require(Path.resolve("./Modules/Node/Utils.js"));
	require(Path.resolve("./Modules/Channels.js"));
	require(Path.resolve("./Modules/Node/ChildProcess.js"));
	require(Path.resolve('./Modules/Node/Logger.js'));
	require(Path.resolve('./Modules/Node/Mongo.js'));
	
	Server = server = {};
	
	Server.InitDB = function (){
		debug("connecting DB");
		replicaSet([{host: "127.0.0.1", port : 20000}], "Identificator", function(err, database){
			if (err){
				error(err);	
			}
			global.db = database;
		});
	};
	
	Server.Config = JSON.parse(process.argv[2]);

	Server.Init = function(){
		var config = Server.Config;
		Server.InitDB();
		Channels.on("/http-request.get/semantic", function(route, id, url, headers, data){ 
			fs.readFile("semantic.json", "utf8", function(err, result){   
				if (err){
					Server.SendResponse(id, 500, err);
					return;
				}		
				Server.SendResponse(id, 200, result, {"Content-Type": "text/json; charset=utf-8"});
			});
			this.processsed = true;
			return true;
		});
		Channels.on("/http-request.get/lexic", function(route, id, url, headers, data){ 
			fs.readFile("lexic.json", "utf8", function(err, result){   
				if (err){
					Server.SendResponse(id, 500, err);
					return;
				}		
				Server.SendResponse(id, 200, result, {"Content-Type": "text/json; charset=utf-8"});
			});
			this.processsed = true;
			return true;
		});
		Channels.on("/http-request.post/semantic", function(route, id, url, headers, data){ 
			fs.writeFile("semantic.json", data, 'utf8', function(err, result){
				if (err){
					Server.SendResponse(id, 500, err);
					return;
				}		
				Server.SendResponse(id, 200, "", {"Content-Type": "text/plain; charset=utf-8"});
			});
			this.processsed = true;
			return true;
		});
		Channels.on("/http-request.post/lexic", function(route, id, url, headers, data){ 
			fs.writeFile("lexic.json", data, 'utf8', function(err, result){
				if (err){
					Server.SendResponse(id, 500, err);
					return;
				}		
				Server.SendResponse(id, 200, "", {"Content-Type": "text/plain; charset=utf-8"});
			});
			this.processsed = true;
			return true;
		});
		Channels.on("/http-request.put", function(route, id, url, headers, data){ 
			if (this.processsed) return;
			var path = route.current;
			var context = Server.Context(id, url, path, headers, data);
			if (context.url.query.action == 'all'){
				return Server.All(context);
			}
			if (context.url.query.action == 'get'){
				return Server.Get(context);
			}
			if (context.url.query.action == 'set'){
				return Server.Update(context);
			}
			if (context.url.query.action == 'add'){
				return Server.Add(context);
			}
			if (context.url.query.action == 'del'){
				return Server.Delete(context);
			}
			return Server.Finalize(context);
		});		
	};
	
	Server.GetDataObj = function(context){
		if (!context.data || !context.data.length) return null;
		if (typeof context.data != 'string') return context.data;
		var data = JSON.parse(context.data);
		if (data._id){
			var id = data._id;
			try{
				id = ObjectID(data._id);
			}
			catch(e){
				id = data._id;
			}
			data._id = id;
		}
		else{
			if (data.id){
				data._id = data.id;
			}
		}
		return data;
	};
	
	Server.All = function(context){		
		context.setHeader("Content-Type", "text/plain; charset=utf-8");
		try{
			var collection = context.path;
			var searchObj = Server.GetDataObj(context);
			if (!searchObj){
				searchObj = {};
			}
			var cursor = null;
			cursor = db.collection(collection).find(searchObj);
			if (context.url.sort){			
				cursor.sort(context.url.sort);			
				context.log("Sorting ", context.url.sort);
			}
			if (context.url.skip) {
				cursor.skip(parseInt(context.url.skip));
			}
			if (context.url.limit) {
				cursor.limit(parseInt(context.url.limit));
			}
			cursor.toArray(function(err, result){	
				if (err){
					context.finish(500, "GET " + context.url.pathname + " error: " + err);
					return false;
				}
				if (!result){					
					context.finish(404, "Content " + context.url.pathname + " not found");
					return false;
				}
				context.setHeader("Content-Type", "text/json; charset=utf-8");
				context.finish(200, JSON.stringify(result));
			});
			return false;
		}
		catch(e){
			context.finish(500, e.message);
			error(e);
		}		
		return true;
	};
	
	Server.Get = function(context){		
		context.setHeader("Content-Type", "text/plain; charset=utf-8");
		try{
			var collection = context.path;
			var searchObj = Server.GetDataObj(context);
			if (!searchObj){
				searchObj = {};
			}
			var cursor = null;
			cursor = db.collection(collection).find(searchObj);
			if (context.url.sort){			
				cursor.sort(context.url.sort);			
				context.log("Sorting ", context.url.sort);
			}
			if (context.url.skip) {
				cursor.skip(parseInt(context.url.skip));
			}
			if (context.url.limit) {
				cursor.limit(parseInt(context.url.limit));
			}
			cursor.nextObject(function(err, result){	
				if (err){
					context.finish(500, "GET " + JSON.stringify(searchObj) + " error: " + err);
					return false;
				}
				if (!result){					
					context.finish(404, "Content " + JSON.stringify(searchObj) + " not found");
					return false;
				}
				context.setHeader("Content-Type", "text/json; charset=utf-8");
				context.finish(200, JSON.stringify(result));
			});
			return false;
		}
		catch(e){
			context.finish(500, e.message);
			error(e);
		}		
		return true;
	};
	
	Server.Update = Server.Add = function(context){		
		context.setHeader("Content-Type", "text/plain; charset=utf-8");
		try{
			var collection = context.path;
			var doc = Server.GetDataObj(context);
			if (doc){
				db.collection(collection).save(doc, {safe : false}, function(err, result){
					if (err){
						context.finish(500, "POST " + context.url + " error " + err);
						return;
					}	
					context.setHeader("Content-Type", "text/json; charset=utf-8");
					if (result){						
						context.finish(200, JSON.stringify(result));
					}
					else{
						context.finish(200, JSON.stringify(doc));
					}
					return false;
				});
			}
			else{
				context.finish(500, "No data obj");	
				return false;
			}
		}
		catch(e){
			context.finish(500, e.message);
			error(e);
		}		
		return true;
	};
	
	Server.Delete = function(context){		
		context.setHeader("Content-Type", "text/plain; charset=utf-8");
		try{
			var collection = context.path;
			var doc = Server.GetDataObj(context);
			debug("removing " + (doc ? JSON.stringify(doc) : "null"));
			db.collection(collection).remove(doc, {safe : false}, function(err, result){
					if (err){
						context.finish(500, "POST " + context.url + " error " + err);
						return;
					}					
					context.setHeader("Content-Type", "text/json; charset=utf-8");
					if (result){						
						context.finish(200, JSON.stringify(result));
					}
					else{
						context.finish(200, JSON.stringify(doc));
					}
					return false;
			});
		}
		catch(e){
			context.finish(500, e.message);
			error(e);
		}		
		return true;
	};	
	
	Server.Finalize = function(context){		
		context.setHeader("Content-Type", "text/plain; charset=utf-8");
		context.finish(404, "URL not available");
		return true;
	};	
	
	Server.SendResponse = function(id, status, result, headers){
		//console.log("response: id" + id);
		Channels.emit("http-response.id" + id, id, status, result, headers);	
	};
	
	Server.Context = function(id, url, path, headers, data){
		if (typeof(url) == "string") url = Url.parse(url, true);
		context = { id : id, 
				   url : url,
				   path : path,
				   pathTail : path,
				   pathName: path,
				   data: data,
				   headers: headers, 
				   method : url.method };
		context.setHeader = function(name, value){
			this.headers[name] = value;
		}
		context.sendFile = function(fileName){
			if (fileName.indexOf("/") != 0){
				fileName = "/" + fileName;
			}
			if (fileName.lastIndexOf("/") == fileName.length - 1){
				fileName = fileName.substring(0, fileName.length - 1);
			}
			var adminApp = fs.readFileSync("." + fileName, 'utf8');
			this.setHeader("Content-Type", "text/html; charset=utf-8");
			this.finish(200, adminApp, 'utf8');
		};
		context.finish = function(status, result, encoding){
			try{
				if (encoding){
					this.headers.encoding = encoding;
				}
				Server.SendResponse(this.id, status, result, this.headers);
			}
			catch(e){
				console.log(e);	
			}
		}
		return context;
	};
	
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


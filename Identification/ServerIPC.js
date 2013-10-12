var Url = require('url');
var fs = require('fs');
var Path = require('path');
ObjectID = require('mongodb').ObjectID;
var edge = require('edge');
var uuid = require('node-uuid');

require(Path.resolve("./Modules/Node/Utils.js"));
require(Path.resolve("./Modules/Channels.js"));
require(Path.resolve("./Modules/Node/ChildProcess.js"));
require(Path.resolve('./Modules/Node/Logger.js'));
require(Path.resolve('./Modules/Node/Mongo.js'));
var DBProc = require(Path.resolve('./Modules/Node/DBProc.js'));
var filesModule = require(Path.resolve('./Modules/Node/Files.js'));
	
IdentServer = {};
	
//process.env.OWIN_SQL_CONNECTION_STRING = "IdentServer=fias.web-manufacture.net;Database=fias;user id=fias;password=kladr98";
process.env.OWIN_SQL_CONNECTION_STRING = "IdentServer=localhost;Database=fias;user id=fias;password=kladr98";

sql = edge.func('./Sql/MSsql.csx');

QuerySQL = function(query, callback){
	sql(new Buffer(query, 'utf8'), function (err, results) {
		if (err) error(err);
		debug("SQL: " + query + " results " + JSON.stringify(results));
		if (!results) {
			callback([], err);
			return;
		}
		var objects = [];
		var fields = results[0];
		for (var i = 1; i < results.length; i++){
			var line = results[i];
			var obj = {};
			for (var col = 0; col < line.length; col++){
				var colName = fields[col];
				if (!colName) colName = "Column" + col;
				colName = colName.toLowerCase();
				obj[colName] = line[col];
			}
			objects.push(obj);
		}
		callback(objects, err);
	});
};
	
IdentServer.InitDB = function (){
	debug("connecting DB");
	replicaSet([{host: "127.0.0.1", port : 20000}], "Identificator", function(err, database){
		if (err){
			error(err);	
		}
		global.db = database;
	});
};
	
IdentServer.Init = function(config, router){
		IdentServer.Config = config;
		IdentServer.InitDB();
		config.DBName = "Identificator";
		//config.DBConf = {host: "127.0.0.1", port : 20000};
		router.map("Main",{
				"/fias/>" : {
					POST: 
						function(context){ 
							var fullData = "";
							context.req.on("data", function(data){
								fullData += data;		
							});
							context.req.on("end", function(){
								QuerySQL(fullData, function(result, err){
									if (err){
										context.setHeader("Content-Type", "text/plain; charset=utf-8");
										context.finish(500, err);
										context.continue();
										return;
									}	
									context.setHeader("Content-Type", "text/json; charset=utf-8");
									context.finish(200,  JSON.stringify(result));
									context.continue();
								});
							});						
							return false;
						}
				},
				"/storage/>" : filesModule({basepath:"./identification/Storage"}),
				"/<" : {
					POST : function(context){ 
						if (this.finished) return true;
						var fullData = "";
						context.req.on("data", function(data){
							fullData += data;		
						});
						context.req.on("end", function(){
							context.data = fullData;
							var path = context.pathThail;
							if (context.url.query.action == 'all'){
								IdentServer.All(context);
							}
							if (context.url.query.action == 'get'){
								IdentServer.Get(context);
							}
							if (context.url.query.action == 'set'){
								IdentServer.Update(context);
							}
							if (context.url.query.action == 'add'){
								IdentServer.Add(context);
							}
							if (context.url.query.action == 'del'){
								IdentServer.Delete(context);
							}
							context.continue();
						});
						return false;
					}
				},
			});		
	};
	
	IdentServer.GetDataObj = function(context){
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
	
	IdentServer.All = function(context){		
		context.setHeader("Content-Type", "text/plain; charset=utf-8");
		try{
			var collection = context.path;
			var searchObj = IdentServer.GetDataObj(context);
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
	
	IdentServer.Get = function(context){		
		context.setHeader("Content-Type", "text/plain; charset=utf-8");
		try{
			var collection = context.path;
			var searchObj = IdentServer.GetDataObj(context);
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
	
	IdentServer.Update = IdentServer.Add = function(context){		
		context.setHeader("Content-Type", "text/plain; charset=utf-8");
		try{
			var collection = context.path;
			var doc = IdentServer.GetDataObj(context);
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
	
	IdentServer.Delete = function(context){		
		context.setHeader("Content-Type", "text/plain; charset=utf-8");
		try{
			var collection = context.path;
			var doc = IdentServer.GetDataObj(context);
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
	
	IdentServer.Finalize = function(context){		
		context.setHeader("Content-Type", "text/plain; charset=utf-8");
		context.finish(404, "URL not available");
		return true;
	};	
	
	IdentServer.SendResponse = function(id, status, result, headers){
		//console.log("response: id" + id);
		Channels.emit("http-response.id" + id, id, status, result, headers);	
	};
	
	IdentServer.Context = function(id, url, path, headers, data){
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
				IdentServer.SendResponse(this.id, status, result, this.headers);
			}
			catch(e){
				console.log(e);	
			}
		}
		return context;
	};
	
	
module.exports = IdentServer;

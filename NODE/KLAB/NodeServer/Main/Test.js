var log = require("./log.js").info;
log.error = require("./log.js").error;
log.info = log;
require('./Mongo.js');
var http = require('http');
ObjectID = require('mongodb').ObjectID;


try{
	
	var server = require("./DBS.js");
	
	function InitDB(){
		replicaSet([{host: "127.0.0.1", port : 20000}], "jasp", function(error, database){
			err = error;
			db = database;
			server = new server(db);
			server.SEARCH = Sync.SearchSort;
			server.POST = Sync.POST;
		});
	};
	
	InitDB();
	
	Sync = {};
	
	Sync.POST = function(url, req, res){
		var fullData = "";
		req.on("data", function(data){
			fullData += data;		
		});
		req.on("end", function(){
			try{
				var doc = JSON.parse(fullData);
				doc.path = url.pathname;
				doc._lastmodified = (new Date).getTime();
				db.collection('spec').save(doc, {safe : true}, function(err, result){
					if (err){
						res.finish(500, "Collection " + url.pathname + " error " + err);
						return;
					}
					
				
					res.finish(200, result._id);
					
				});
			}
			catch (err){
				log.error(err);
				res.finish(500, "Unknown error: " + err);
			}
		});
		return;
	};
	
	Sync.SearchSort = function(url, req, res, server){
		//var lastSyncTime = ((new Date).getTime());
		var callback = function(err, result){
			updatedResult = [];
			if (err){
				res.finish(500, " " + url.pathname + " error " + err);
				return;
			}
			if (result){
				for (var i = 0; i < result.length; i++){
					if (result[i]['_lastmodified']> url.searchObj['_lastmodified']){
						log(result[i]['_lastmodified']);
						log(url.searchObj['_lastmodified']);
						updatedResult.push(result[i]);
						
					};
				};
				updatedResult = server.ProcessResult(updatedResult);
			}
			else{
				updatedResult = JSON.stringify("[]");
			}		
			res.setHeader("Content-Type", "application/json; charset=utf-8");
			res.finish(200, updatedResult);
		};
		
		var callback2 = function(err, result){
			if (err){
				res.finish(500, " " + url.pathname + " error " + err);
				return;
			}
			if (result){
				result = server.ProcessResult(result);
			}
			else{
				result = JSON.stringify("[]");
			}		
			res.setHeader("Content-Type", "application/json; charset=utf-8");
			res.finish(200, result);
		}
		
		
			if (url.hasParams){
				db.collection('spec').find().sort({name: 1}).toArray(callback);
			}
		else{
			db.collection('spec').find().sort({name: 1}).toArray(callback2);
		}
	};
	
	
	Tabs = {};
	Tabs.SearchSort = function(url, req, res, server){ 
		var callback = function(err, result){
			updatedResult = [];
			if (err){
				res.finish(500, " " + url.pathname + " error " + err);
				return;
			}
			if (result){
				for (var i = 0; i < result.length; i++){
					if ((result[i]['name'][0] >= url.searchObj['ftc']) && (result[i]['name'][0] <= url.searchObj['ltc'])){
						updatedResult.push(result[i]);
						
					};
				};
				updatedResult = server.ProcessResult(updatedResult);
			}
			else{
				updatedResult = JSON.stringify("[]");
			}		
			res.setHeader("Content-Type", "application/json; charset=utf-8");
			res.finish(200, updatedResult);
		};
		
		var callback2 = function(err, result){
			if (err){
				res.finish(500, " " + url.pathname + " error " + err);
				return;
			}
			if (result){
				result = server.ProcessResult(result);
			}
			else{
				result = JSON.stringify("[]");
			}		
			res.setHeader("Content-Type", "application/json; charset=utf-8");
			res.finish(200, result);
		}
		
		
			if (url.hasParams){
				db.collection('sync').find().sort({name: 1}).toArray(callback);
			}
		else{
			db.collection('spec').find().sort({name: 1}).toArray(callback2);
		}
	};	
	
	
	
	http.createServer(function(request, response){
		server.ProcessRequest(request, response);
	}).listen(12222);
	
	
	
	
} catch(err){
	log.error(err);
	process.exit();
}
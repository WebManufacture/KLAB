ObjectID = require('mongodb').ObjectID;

DBProc = {
	GetProcessor: function(db, collection, methods){
		if (methods){
			var obj = {};
			methods = methods.split(",");
			for (var i = 0; i < methods.length; i++){
				var method = methods[i];
				if (DBProc[method]){
					obj[method] = DBProc.WrapMethod(db, collection, DBProc[method]);
				}
			}
			return obj;
		}
		return {
			GET : DBProc.WrapMethod(db, collection, DBProc.GET),
			SEARCH : DBProc.WrapMethod(db, collection, DBProc.SEARCH),
			DELETE : DBProc.WrapMethod(db, collection, DBProc.DELETE),
			POST : DBProc.WrapMethod(db, collection, DBProc.POST),
			PUT : DBProc.WrapMethod(db, collection, DBProc.PUT),
		}
	},
	
	WrapMethod : function(db, collection, method){
		return function(context, nextCallback){
			var searchObj = DBProc.GetSearchObj(context.url, context.pathTail);
			context.log(searchObj);
			context.res.setHeader("Content-Type", "application/json; charset=utf-8");
			return method(db, collection, context, searchObj);
		}
	},
	
	GetSearchObj : function(url, path){
		var fObj = {};
		url.hasParams = false;
		if (path === undefined){
			path = url.pathname;
		}		
		if (path == ""){
			path = "/";
		}
		if (path != "/*"){
			fObj.path = path;		
		}
		for (var key in url.query){
			var value = url.query[key];
			if (key == "id" || key == "_id"){
				key = "_id";
				value = ObjectID(value);
			}
			if (key == "sort" || key == 'limit' || key == 'skip'){
				url[key] = value;
				continue;
			}
			fObj[key] = value;					
			url.hasParams = true;
		}
		return fObj
	},
	
	GET : function(db, collection, context, searchObj){
		if (!searchObj){
			searchObj = DBProc.GetSearchObj(context.url);
		}
		var cursor = null;
		cursor = db.collection(collection).find(searchObj);
		if (context.url.sort){			
			cursor.sort(context.url.sort);			
		}
		if (context.url.skip) {
			cursor.skip(context.url.skip);
		}
		if (context.url.limit) {
			cursor.limit(context.url.limit);
		}
		cursor.nextObject(function(err, result){	
			if (err){
				context.finish(500, "GET " + context.url.pathname + " error: " + err);
				return false;
			}
			if (!result){					
				context.log("Content ",searchObj, " not found");
				context.finish(404, "Content " + searchObj.path + " not found");
				return false;
			}
			context.finish(200, JSON.stringify(result));
			context.continue(context);
		});
		return false;
	},
	
	
	DELETE : function(db, collection, context, searchObj){
		if (!searchObj){
			searchObj = DBProc.GetSearchObj(context.url);
		}
		db.collection(collection).remove(searchObj, function(err, result){
			if (err){
				context.finish(500, "DELETE " + context.url.pathname + " error: " + err);
				return true;
			}
			context.finish(200, "");
			context.continue(context);
		});
		return false;
	},
	
	
	SEARCH : function(db, collection, context, searchObj){	
		if (!searchObj){
			searchObj = DBProc.GetSearchObj(context.url);
		}
		var cursor = null;
		context.log(searchObj);
		cursor = db.collection(collection).find(searchObj);
		if (context.url.sort){			
			cursor.sort(context.url.sort);			
		}
		if (context.url.skip) {
			cursor.skip(context.url.skip);
		}
		if (context.url.limit) {
			cursor.limit(context.url.limit);
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
			context.finish(200, JSON.stringify(result));
			context.continue(context);
		});
		return false;
	},
	
	POST : function(db, collection, context, searchObj){
		var fullData = "";
		context.req.on("data", function(data){
			fullData += data;		
		});
		context.req.on("end", function(){
			try{
				var doc = JSON.parse(fullData);
				doc.path = searchObj.path;	
				if (searchObj && searchObj._id){
					doc._id = searchObj._id;
				}
				db.collection(collection).save(doc, {safe : false}, function(err, result){
					if (err){
						context.finish(500, "POST " + context.url.pathname + " error " + err);
						return;
					}					
					context.finish(200, result);
					context.continue(context);
				});
			}
			catch (err){
				context.finish(500, "JSON error: " + err);
			}
			context.continue(context);
		});
		return false;
	},
	
	PUT : function(db, collection, context, searchObj){
		var fullData = "";
		context.req.on("data", function(data){
			fullData += data;		
		});
		context.req.on("end", function(){
			try{
				var doc = JSON.parse(fullData);
				doc.path = searchObj.pathname;				
				db.collection(collection).update(searchObj, {$set: doc}, function(err, result){
					if (err){
						context.finish(500, "PUT " + url.pathname + " error " + err);
						return;
					}					
					context.finish(200, result);
					context.continue(context);
				});
			}
			catch (err){
				context.finish(500, "JSON error: " + err);
			}
			context.continue(context);
		});
		return false;
	},
};

module.exports = DBProc;
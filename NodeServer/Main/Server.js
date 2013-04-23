var http = require('http');
var Url = require('url');
var logger = require("./DBLogs.js");
require("./Utils.js");
var RouterModule = require("./Router.js");
require('./Mongo.js');
var DBProc = require('./DBProc.js');

var log = new logger();

Server = server = {};

Server.Init = function(){
	var cfg = { path : "/", dbpath: "127.0.0.1:20000", dbname : "klab", port:808 };
	
	for (var i = 2; i < process.argv.length; i++){
		var arg = process.argv[i];
		var val = arg.split("=");
		if (val.length == 2){
			cfg[val[0]] = val[1];
		}
	}
	
	if (typeof(cfg.dbpath) == 'string'){
		var hp = cfg.dbpath.split(':');
		cfg.dbpath = [{host: hp[0], port:parseInt(hp[1])}];		
	}
	
	replicaSet(cfg.dbpath, cfg.dbname, function(error, database){
		if (error){
			throw error;	
		}
		log = new logger(database, cfg.path, "logs");
		db = database;
		database.collection("configs").findOne({path: cfg.path}, function(err, result){
			if (!err && result){
				for (var item in result){
					cfg[item] = result[item];	
				}
			}			
			Server.Start(cfg);
		});									  
	});
};


Server.SetHeaders = function(context){
	context.res.setHeader("Access-Control-Allow-Origin", "*");
	context.res.setHeader("Access-Control-Allow-Methods", "GET, DELETE, PUT, POST, HEAD, OPTIONS, SEARCH");
	context.res.setHeader("Access-Control-Allow-Headers", "debug-mode");
	context.res.setHeader("Content-Type", "text/plain; charset=utf-8");
	if (context.req.method == 'OPTIONS'){
		context.finish(200, "OK");	
	}
};

Server.Utilisation = function(context){
	if (!context.completed){
		//Здесь может быть код, вызываемый последним. (если обработчик не был найден, или не пожелал завершить запрос);
		//context.finish(404, "No HANDLERS!");
		//context.finish(200, JSON.stringify(router.Handlers));
	}
};

Server.MainRouter = function(context){
	context.finish(200, "Klab server v. 1.2.4");
};
	
	Server.Start = function(config){
		router = RouterModule.Route(http.createServer(), log);
		router.for("preprocess", ">", Server.SetHeaders);
		if (config.modules){
			for (var path in config.modules){
				var file = config.modules[path];
				if (typeof (file) == 'string'){
					if (!file.start("/")) file = "/" + file;
					router.for("modules", path, require("." + file)(config, router, log));
				}
				if (typeof (file) == 'array'){
					for (var i = 0; i < file.length; i++){
						if (!file[i].start("/")) file[i] = "/" + file[i];
						router.for("modules", path, require("." + file[i])(config, router, log));
					}
				}			
			}
		}
		router.map("processMap", 
				   {
					   "/": Server.MainRouter,
					   "/map": {
						   GET : function(context){
							   context.res.setHeader("Content-Type", "application/json; charset=utf-8");
							   context.finish(200, JSON.stringify(router.Handlers));
						   }
					   },
					   "/config": {
						   GET : function(context){
							   context.res.setHeader("Content-Type", "application/json; charset=utf-8");
							   context.finish(200, JSON.stringify(config));
							   return false;
						   },
						   SEARCH : {
							   
						   },
						   POST : function(context){
							   var fullData = "";
							   context.req.on("data", function(data){
								   fullData += data;		
							   });
							   context.req.on("end", function(){
								   try{
									   log.info("Root config rewriting!");
									   var doc = JSON.parse(fullData);
									   doc.path = "/";				
									   db.collection("configs").save(doc, {safe : true}, function(err, result){
										   if (err){
											   context.finish(500, "POST " + context.url.pathname + " error " + err);
											   return;
										   }				
										   context.res.setHeader("Content-Type", "application/json; charset=utf-8");
										   context.finish(200, result);
									   });
								   }
								   catch (err){
									   context.finishWithError(err);
								   }
							   });
							   return false;
						   }
					   },
					   "/configs/<": DBProc.GetProcessor(db, "configs"),
					   "/logs/>" : DBProc.GetProcessor(db, "logs", "GET,SEARCH,DELETE"),
					   "<": Server.Utilisation
				   });
		//console.log(router.Handlers.processMap)
		if (config.host){
			router.listen(config.port, config.host);
		}
		else{
			router.listen(config.port);	
		}
	};

Server.Init();

//process.on('exit')

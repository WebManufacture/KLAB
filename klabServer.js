var http = require('http');
var Url = require('url');
var fs = require('fs');
var Path = require('path');

require(Path.resolve("./ILAB/Modules/Utils.js"));
var Files = require(Path.resolve("./ILAB/Modules/Files.js"));

KLabServer = function(config, router){
	this.Config = config;
	this.noCollectData = true;
	var filesRouter = Files(config, this);
	router.for("Main","/>", {
		   GET : function(context){
				if (context.query["action"] == "edit" || context.query["action"] == "create"){
				   context.res.setHeader("Content-Type", "text/html; charset=utf-8");
				   if (context.query["action"] == "create"){
					   var path = context.pathName;
					   if (config.basepath){
						   path = config.basepath + context.pathName;
					   }
					   path = Path.resolve(path);
					   if (!fs.existsSync(path)){
							fs.writeFileSync(path, "", null);   
					   };
				   }
				   fs.readFile(Path.resolve("./Klab/TextEditor.htm"), "utf8", function(err, result){   
					   if (err){
						   context.finish(500, "Not found files view page " + err);
						   return;
					   }		
					   context.finish(200, result);
				   });
				   return false;
			   }
			   var path = context.pathName;
			   if (config.basepath){
					 path = config.basepath + context.pathName;
			   }
			   if (path.indexOf(".") != 0){
					path = "." + path;   
			   }
			   path = Path.resolve(path);
			   fs.stat(path, function(err, stat){
				   if (err){
					   if (context.query["action"] == "file"){
						   fs.writeFile(path, null, null, function(err, result){ 
							   context.res.setHeader("Content-Type", "text/plain; charset=utf-8");
							   context.finish(200, result);
							   context.continue();
						   });
						   return;
					   }
					   if(context.query["action"] == "dir"){
						   fs.mkdir(path, null, function(err, result){ 
							   context.res.setHeader("Content-Type", "text/plain; charset=utf-8");
							   context.finish(200, result);
							   context.continue();
						   });
						   return;
					   }
					   context.continue();
					   return;
				   }
				   if (stat.isDirectory()){
					   context.res.setHeader("Content-Type", "text/html; charset=utf-8");
					   fs.readFile(Path.resolve("./Klab/files.htm"), "utf8", function(err, result){   
						   if (err){
							   context.finish(500, "Not found files view page " + err);
							   return;
						   }		
						   context.finish(200, result);
					   });
					   return;
				   }
				   if (stat.isFile()){
						
				   }
				   context.continue();
			   });
			   return false;
		   },
		   POST : function(context){
			   if (context.completed) return true;
			   var path = context.pathName;
			   if (config.basepath){
					 path = config.basepath + context.pathName;
			   }
			   if (path.indexOf(".") != 0){
					path = "." + path;   
			   }
			   path = Path.resolve(path);
			   var writeable = fs.createWriteStream(Path.resolve(path),{'flags': 'w', 'encoding': 'binary'});
			   if (context.data) console.error("DATA DETECTED!");
			   context.req.on("data", function(data){
				   writeable.write(data);
			   });
			   context.req.on("end", function(){
				   context.finish(200);
				   context.continue();					   
			   });
			   return false;
		   },
			DELETE : function(context){
				if (context.completed) return true;
				var path = context.pathName;
				if (config.basepath){
					path = config.basepath + context.pathName;
				}
				if (path.indexOf(".") != 0){
					path = "." + path;   
				}
				path = Path.resolve(path);
				fs.exists(path, function(exists){
					if (!exists){
						context.finish(404, "file " + path + " not found");
						return;
					}
					info("Deleting " + path);
					fs.unlink(path, function(err, result){
						if (err){
							Channels.emit("/file-system/action.delete.error", path,err);
							context.finish(500, "Delete error " + path + " " + err);	
							context.continue();
							return;
						}			
						Channels.emit("/file-system/action.delete", path);
						context.finish(200, "Deleted " + path);			
						context.continue();
					});
				});
				return false;
			}
	   });
	router.for("Main","/<", filesRouter);
};
	
module.exports = function(config, router){
	return new KLabServer(config, router);
}


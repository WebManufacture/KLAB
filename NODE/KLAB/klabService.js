var http = require('http');
var Url = require('url');
var fs = require('fs');
var Path = require('path');

useModule("Utils.js");
useModule("Channels.js");
var Files = useModule("Files.js");
var Logger = useModule('Logger.js');
useModule('Async.js');
var StaticFilesService = useService('StaticService');

function KLabService(parentNode){
	
};

Inherit(KLabService, StaticFilesService, {
	loading: function(node){
		
		var fpath = this.FormatPath(this.basepath);
		fs.readFile(fpath, 'utf8', function(err, result){
			if (!err){
				serv.defaultTemplate = result;
			}
		});
	
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
				/*POST : function(context){
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
						   //create file || dir
						   context.continue();   
						   return;
					   }
					   if (stat.isDirectory()){
						   context.res.setHeader("Content-Type", "text/html; charset=utf-8");
						   //put files heres
						   return;
					   }
					   if (stat.isFile()){
							//replace file content
					   }
					   context.continue();
				   });
				   return false;
			   }*/
		   });
		router.for("Main","/<", filesRouter);
	},
	
	starting : function(node){
		
	},

	stopping : function(node){
		
	},
	
	unloading : function(node){
		
	}
});

	
module.exports = KLabService;


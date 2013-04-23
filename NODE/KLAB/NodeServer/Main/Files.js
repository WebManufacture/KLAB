var fs = require('fs');
var paths = require('path');
var ChildProcess = require('child_process');

module.exports = function(config, router, logger){
	log = logger;
	return FilesRouter;
};

Files = {};

Files.MimeTypes = {
	htm : "text/html",
	html : "text/html",
	js : "application/x-javascript",
	css : "text/css",
	json : "application/json",
};

FilesRouter = {};

FilesRouter.GET = FilesRouter.HEAD = function(context){	
	var fpath = context.pathTail.replace("/", "\\");
	fpath = "." + fpath;
	fs.readFile(fpath, function(err, result){
		if (err){
			context.finish(500, "File " + fpath + " read error " + err);
			return;
		}
		var ext = paths.extname(fpath);
		ext = ext.replace(".", "");
		ext = Files.MimeTypes[ext];
		if (ext){
			context.res.setHeader("content-type", ext + "; charset=utf-8");
		}
		else{
			context.res.setHeader("content-type", "text/plain; charset=utf-8");
		}
		context.finish(200, result);
	});	
	return false;
};

FilesRouter.SEARCH = function(context){
	var fpath = context.pathTail.replace("/", "\\");
	fpath = "." + fpath;
	fs.readdir(fpath, function(err, files){
		if (err){
			context.finish(500, "readdir " + fpath + " error " + err);
			return;
		}
		context.res.setHeader("content-type", "application/json; charset=utf-8");
		context.finish(200, JSON.stringify(files));
	});
	return false;
};

FilesRouter.DELETE = function(context){
	var fpath = context.pathTail.replace("/", "\\");
	fpath = "." + fpath;
	fs.exists(fpath, function(exists){
		if (!exists){
			context.finish(404, "file " + fpath + " not found");
			return;
		}
		fs.unlink(fpath, function(){
			context.finish(200, "Deleted " + fpath);
		});
	});
	return false;
};

FilesRouter.POST = function(context){
	var fpath = context.pathTail.replace("/", "\\");
		fpath = "." + fpath;
	var fullData = "";
	context.req.on("data", function(data){
		fullData += data;		
	});
	context.req.on("end", function(){
		log.info("Writing " + fpath);
		fs.writeFile(fpath, fullData, 'utf8', function(err, result){
			if (err){
				context.finish(500, "File " + fpath + " write error " + err);
				return;
			}
			context.finish(200);
		});
	});
	return false;
};
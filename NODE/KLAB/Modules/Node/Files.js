var fs = require('fs');
var paths = require('path');
var ChildProcess = require('child_process');
var crypto = require('crypto');
log = require(paths.resolve('./Modules/Node/Logger.js')).log;
error = require(paths.resolve('./Modules/Node/Logger.js')).error;
info = require(paths.resolve('./Modules/Node/Logger.js')).info;
debug = require(paths.resolve('./Modules/Node/Logger.js')).debug;

module.exports = function(config, server){
	cfg = config;
	if (!config) cfg = {};
	if (!cfg.basepath){
	    cfg.basepath = ".";
	}
	if (cfg.basepath.end("\\")){
	    cfg.basepath = cfg.basepath.substr(0, cfg.basepath.length - 1);
	}
	return FilesRouter;
};

LastFiles = {};

Files = {};

Files.MimeTypes = {
	htm : "text/html; charset=utf-8",
	html : "text/html; charset=utf-8",
	js : "text/javascript; charset=utf-8",
	css : "text/css; charset=utf-8",
	json : "text/json; charset=utf-8",
	png : "images/png",
	gif : "images/gif",
	jpg : "images/jpeg",
	bmp : "images/bmp",
};

FilesRouter = {};

function FormatPath(fpath){
    fpath = fpath.replace(/\//g, "\\");
	if (!fpath.start("\\")) fpath = "\\" + fpath;
	
	fpath = cfg.basepath + fpath;
	if (fpath.end("\\")) fpath = fpath.substr(0, fpath.length - 1);
	return fpath;
}

FilesRouter.GET = FilesRouter.HEAD = function(context){	
	var fpath = FormatPath(context.pathTail);
	var inm = context.req.headers["if-none-match"];
	if (inm && LastFiles[fpath] == inm){
	    context.finish(304, null);
	    return;
	}
	var ext = paths.extname(fpath);		
	ext = ext.replace(".", "");
	ext = Files.MimeTypes[ext];
	if (!ext){
		context.res.setHeader("Content-Type", "text/plain; charset=utf-8");
	}
	else{
		context.res.setHeader("Content-Type", ext);	    
	}
	ext = 'binary';
	fs.readFile(fpath, ext, function(err, result){
		if (err){
			context.finish(500, "File " + fpath + " read error " + err);
			return;
		}		
		//var buf = new Buffer(result);
		if (result.length < 1000000){
		    context.res.setHeader("Content-Length", result.length);
		}	
		var dnow = new Date();	
		if (!LastFiles[fpath]){
            var fileHash = crypto.createHash('sha1');
            var str = dnow.toString();
		    fileHash.update(str);
		    LastFiles[fpath] = fileHash.digest('hex');
		}		
		context.res.setHeader("Expires", new Date(dnow.valueOf() + 1000 * 3600).toString());
		context.res.setHeader("Cache-Control", "max-age=3600");
		context.res.setHeader("etag", LastFiles[fpath]);
		//context.res.write(buf);
		context.finish(200, result, ext);
		context.continue();
	});	
	return false;
};

FilesRouter.SEARCH = function(context){
	var fpath = FormatPath(context.pathTail);
	fs.readdir(fpath, function(err, files){
		if (err){
			context.finish(500, "readdir " + fpath + " error " + err);
			return;
		}
		context.res.setHeader("Content-Type", "application/json; charset=utf-8");
		for (var i = 0; i < files.length; i++){
			var fname = files[i];			
			files[i] = fs.statSync(fpath + "\\" + fname);
			files[i].name = fname;
			files[i].fileType = files[i].isDirectory() ? "directory" : files[i].isFile() ? "file" : "unknown";
		}
		context.finish(200, JSON.stringify(files));
		context.continue();
	});
	return false;
};

FilesRouter.DELETE = function(context){
	var fpath = FormatPath(context.pathTail);
	LastFiles[fpath] = null;
	fs.exists(fpath, function(exists){
		if (!exists){
			context.finish(404, "file " + fpath + " not found");
			return;
		}
		fs.unlink(fpath, function(){
			context.finish(200, "Deleted " + fpath);			
			context.continue();
		});
	});
	return false;
};

FilesRouter.POST = FilesRouter.PUT = function(context){
	var fpath = FormatPath(context.pathTail);
	var fullData = "";
	LastFiles[fpath] = null;
	context.req.on("data", function(data){
		fullData += data;		
	});
	context.req.on("end", function(){
		info("Writing " + fpath);
		fs.writeFile(fpath, fullData, 'utf8', function(err, result){
			if (err){
				context.finish(500, "File " + fpath + " write error " + err);
				return;
			}
			context.finish(200);
			context.continue();
		});
	});
	return false;
};
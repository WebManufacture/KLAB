var fs = require('fs');
var paths = require('path');
var ChildProcess = require('child_process');
var crypto = require('crypto');
require(paths.resolve('./Modules/Channels.js'));
require(paths.resolve('./Modules/Node/Logger.js'));


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

Files.channel = Channels.on("/file-system", new Channel("/file-system"));

FilesRouter = {};

function FormatPath(fpath){
    fpath = fpath.replace(/\//g, "\\");
	if (!fpath.start("\\")) fpath = "\\" + fpath;
	
	fpath = cfg.basepath + fpath;
	if (fpath.end("\\")) fpath = fpath.substr(0, fpath.length - 1);
	return fpath.toLowerCase();
}

FilesRouter.GET = FilesRouter.HEAD = function(context){	
	if (context.completed) return true;
	var fpath = FormatPath(context.pathTail);
	var inm = context.req.headers["if-none-match"];
	//console.log("Cache: " + inm + " " +  LastFiles[fpath]);
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
		var etag = LastFiles[fpath];
		if (!etag){
            var etag = (Math.random() + "").replace("0.", "");
		   	LastFiles[fpath] = etag;
			//console.log(etag);
		}		
		context.res.setHeader("Expires", new Date(dnow.valueOf() + 1000 * 3600).toString());
		context.res.setHeader("Cache-Control", "max-age=3600");
		context.res.setHeader("ETag", etag);
		//context.res.write(buf);
		context.finish(200, result, ext);
		context.continue();
	});	
	return false;
};

FilesRouter.SEARCH = function(context){
	if (context.completed) return true;
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
	if (context.completed) return true;
	var fpath = FormatPath(context.pathTail);
	delete LastFiles[fpath];
	fs.exists(fpath, function(exists){
		if (!exists){
			context.finish(404, "file " + fpath + " not found");
			return;
		}
		info("Deleting " + fpath);
		fs.unlink(fpath, function(err, result){
			if (err){
				Files.channel.emit("action.delete.error", fpath, err);
				context.finish(500, "Delete error " + fpath + " " + err);	
				context.continue();
				return;
			}			
			Files.channel.emit("action.delete", fpath);
			context.finish(200, "Deleted " + fpath);			
			context.continue();
		});
	});
	return false;
};

FilesRouter.POST = FilesRouter.PUT = function(context){
	if (context.completed) return true;
	var fpath = FormatPath(context.pathTail);
	var fullData = "";
	//console.log("updating cache: " + fpath + " " + LastFiles[fpath]);
	delete LastFiles[fpath];
	context.req.on("data", function(data){
		fullData += data;		
	});
	context.req.on("end", function(){
		info("Writing " + fpath);
		fs.writeFile(fpath, fullData, 'utf8', function(err, result){
			if (err){
				context.finish(500, "File " + fpath + " write error " + err);
				Files.channel.emit("action.write.error", fpath, err);
				return;
			}
			Files.channel.emit("action.write", fpath);
			context.finish(200);
			context.continue();
		});
	});
	return false;
};
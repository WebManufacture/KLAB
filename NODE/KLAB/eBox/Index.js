RoboUI = {};

RoboUI.InitRoboUI = function(){
	Storage = Net.GetTunnel("storage/");
	RoboUI.LoadSettings(function(result){
		if (result){
			
		}
	});	
	RoboUI.BrowseFiles();
	fileTunnel = new HttpChannel("/channels/file-system", function(args){
		var message = args[0];
		var path = args[1];
		if (message && path){			
			message.file = path;
			message.instance = args[2];
			message.base = args[3];
			if (path.contains("\\storage\\") && path != "Storage"){
				path = path.replace("\\storage\\", "");
				var exists = FilesContainer.get(".file[fname='" + path + "']");
				if (!exists){
					exists = RoboUI.InitFileElement({name : path});
					FilesContainer.add(exists);
				}
			}
		}
	});
}

RoboUI.LoadSettings = function(callback){
	Net.get("ui_settings.json?rnd=" + Math.random(), function(result){
		if (result){			
			RoboUI.Settings = result;
			callback(result);
		}
	});
}

RoboUI.SaveSettings = function(callback){
	Net.POST("ui_settings.json", JSON.stringify(RoboUI.Settings), function(result){	});
}

RoboUI.ShowSettings = function(){
	UiSettingsWindow.Show();	
}

RoboUI.BrowseFiles = function(){
	FilesContainer.clear();
	Storage.All("", function(files){
		for (var i =0; i< files.length; i++){
			FilesContainer.add(RoboUI.InitFileElement(files[i]));
		}
	});
};

RoboUI.InitFileElement = function(fileObj){
	var file = DOM.div(".file", fileObj.name);
	file.fname = fileObj.name;
	file.set("@fname", file.fname);
	file.onclick = function(){
		RoboUI.ShowProgram(this.fname);
	}
	var ext = file.fname.split('.');
	if (ext[1]){
		file.ftype = ext[1];	
	}
	else{
		file.ftype = "unknown";
	}
	file.add("." + file.ftype);
	if (ext[1] && ext[1] == 'graph'){
		var name = ext[0];
		CNC.LoadProgram(fileObj.name, function(text){
			CNC.QPrograms[name] = text;
		});
	}
	return file;
};

RoboUI.ShowProgram = function (fname) {
	Storage.get(fname + ".graph", function(result){
		ProgramArea.LoadProgram(result);
	});	
};

RoboUI.NewProgram = function(){
	ProgramEditor.Init(win);
	Win.CreateWindow(win);	
};

RoboUI.RunProgram = function () {
	if (CNC.ProgramCode) {
		CNC.SendProgram(JSON.stringify(CNC.ProgramCode));
	}
};

RoboUI.SaveProgram = function () {
	Storage.add(FileNameBox.value + ".graph", ProgramArea.GetProgram(result), function(){});
};


WS.DOMload(RoboUI.InitRoboUI);
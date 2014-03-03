CncUI = {};

CncUI.InitCncUI = function(){
	
	
	Storage = Net.GetTunnel("storage/");
	
	CncUI.LoadSettings(function(result){
		if (result){
			if (result.compileSettings){
				CNC.CompileSettings = result.compileSettings;
			}
			if (result.cncList){
				
			}
			if (result.defaultCnc){
				CncUI.LoadCncSettings(result.defaultCnc, function(settings){
					if (!settings.mmCoef) settings.mmCoef = 400;
					if (!settings.mmCoefX){
						settings.mmCoefX = settings.mmCoef;
					}
					if (!settings.mmCoefY){
						settings.mmCoefY = settings.mmCoef;
					}
					if (!settings.mmCoefZ){
						settings.mmCoefZ = settings.mmCoef;
					}
					if (!settings.zGValue){
						settings.zGValue = 80;
					}
					CNC.Init(settings);		
					//CncSettingsGrid.set("@url", "storage/" + result.defaultCnc + ".json");
					//CncSettingsGrid.del(".initialized");
					//SGrid.InitGrid(CncSettingsGrid);
					//CncSettingsGrid.ShowObjects(settings);
				});
			}
		}
	});	
	
	CncUI.BrowseFiles();
	
	//DOM("#programText").onchange = CncUI.SaveProgram;
	
	DOM.all(".tabs-container .tab-btn").each(function(elem){
		elem.onclick = function(){
			DOM.all(".tab-btn").del(".active");
			DOM.all(".tab").del(".active-tab");
			DOM.all(".tab").hide();
			var tab = DOM(this.attr("for"));
			tab.show();
			tab.add(".active-tab");
			this.add(".active");
			return false;
		};
	});
	
	logDiv = DOM("#LogBar");
	
	
	nx = 10;
	ny = 10;
	ps = 0;
	scx = 1;
	scy = 1;
	scz = 1;
	ms = 1000;
}

CncUI.LoadSettings = function(callback){
	Storage.get("ui_settings.json?rnd=" + Math.random(), function(result){
		if (result){			
			CncUI.Settings = result;
			callback(result);
		}
	});
}

CncUI.SaveSettings = function(callback){
	Storage.POST("ui_settings.json", JSON.stringify(CncUI.Settings), function(result){	});
}

CncUI.ShowCncSettings = function(){
	CncSettingsWindow.Show();	
}

CncUI.LoadCncSettings = function(cncName, callback){
	Storage.get(cncName + ".json?rnd=" + Math.random(), function(result){
		if (result){
			/*if (!result.length) result = [ result ];
				var settings = {};
				for (var i = 0; i < result.length; i++){
					settings[result[i].id] = result[i].value;
				}*/
			callback(result);
		}
	});	
}

CncUI.SaveCncSettings = function(cncName, settings){
	/*var data = [];
		for (var item in settings){
			data.push({id: item, value : settings[item]});
		}*/
	Storage.POST(cncName + ".json", JSON.stringify(settings), function(result){
		
	});	
}

logger = function(type){
	//L.Info( "CNC")
	var li = DOM("#ProgramLog").div(".log");
	DOM("#ProgramLog").ins(li);
	li.div(".item.log-time", (new Date()).formatTime(true));
	for (var i = 0; i < arguments.length; i++){
		var text = arguments[i];
		if (typeof(text) == "object"){
			text = JSON.stringify(text);
		}
		li.div(".item", text + "");
	}
}	

logger.Clear = function(){
	DOM("#ProgramLog").clear();	
}


CncUI.BrowseFiles = function(){
	FilesContainer.clear();
	Storage.All("programs", function(files){
		for (var i =0; i< files.length; i++){
			FilesContainer.add(CncUI.InitFileElement(files[i]));
		}
	});
};

CncUI.InitFileElement = function(fileObj){
	var file = DOM.div(".file", fileObj.name);
	file.fname = fileObj.name;
	file.onclick = function(){
		CncUI.ShowProgram(this.fname);
	}
	var ext = file.fname.split('.');
	if (ext[1]){
		file.ftype = ext[1];	
	}
	else{
		file.ftype = "unknown";
	}
	file.add("." + file.ftype);
	if (ext[1] && ext[1] == 'qcnc'){
		var name = ext[0];
		CNC.LoadProgram(fileObj.name, function(text){
			CNC.QPrograms[name] = text;
		});
	}
	return file;
};



CncUI.ShowProgram = function (fname) {
	var win = DOM(".window.program-editor.prototype").clone();
	win.set("@title", fname);
	DOM.add(win);
	ProgramEditor.Init(win);
	Win.CreateWindow(win);
	var ext = fname.split('.');
	if (ext[1]){
		ext = ext[1];	
	}
	else{
		ext = "unknown";
	}
	win.codeType = ext;
	win.LoadProgram(fname);
};

CncUI.CreateNewProgram = function(){
	var win = DOM(".window.program-editor.prototype").clone();
	win.set("@title", "New program");
	DOM.add(win);
	ProgramEditor.Init(win);
	Win.CreateWindow(win);	
};


CncUI.RunProgram = function () {
	if (CNC.ProgramCode) {
		CNC.SendProgram(JSON.stringify(CNC.ProgramCode));
	}
};


CNC.QuickProgram = function(fpath){
	CNC.LoadProgram(fpath, function(text){
		text = CncCompiler.Compile(CNC.Settings, text, { x: lx, y : ly, z: lz, speed : CNC.Settings.speed });
		text = PostCompiler.ProcessCode(text);
		if (text){
			CNC.SendProgram(JSON.stringify(text));
		}	
	});	
};

ProgramEditor = {};

ProgramEditor.Init = function(win){
	Extend(win, this);
	win.editor = win.get(".program-text");	
};

ProgramEditor.SaveProgram = function(){
	var win = this;
	var text = this.editor.value;
	var lines = text.split("\n");
	if (lines.length > 0 && lines[0].start("#")){
		var fname = lines[0].replace("#", '');
		var ext = fname.split('.');
		if (ext[1]){
			ext = ext[1];	
		}
		else{
			ext = "unknown";
		}
		this.codeType = ext;
		Storage.POST("programs/" + fname, text, function(){
			win.get(".window_title").set(fname);
		});
	}
};

ProgramEditor.LoadProgram = function(fname){
	var win = this;
	Storage.get("programs/" + fname + "?rnd=" + Math.random(), function(result){
		win.editor.value = result;
	});
};

ProgramEditor.Compile = function(){
	var compiler = Compilers[this.codeType];
	if (compiler){
		var text = this.editor.value;
		CNC.ProgramCode = compiler.Compile(CNC.Settings, text, { x: lx, y : ly, z: lz, speed : CNC.Settings.speed });
		PostCompiler.ShowCode(CNC.ProgramCode);
		Preview.ShowCode(CNC.ProgramCode);
	}
};



WS.DOMload(CncUI.InitCncUI);
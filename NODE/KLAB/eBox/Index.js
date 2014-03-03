RoboUI = {};

RoboUI.UartUrl = "http://localhost:5898/";

RoboUI.Settings = {};

RoboUI.InitRoboUI = function(){
	Storage = Net.GetTunnel("storage/");
	RoboUI.LoadSettings(function(config){
		if (config){
			Uart.Init(config);
			Net.all(config.UartUrl, function(ports){
				Uart.AvailablePorts = ports;
				if (RoboUI.Settings.port){
					for (var port in ports){
						if (RoboUI.Settings.port == port){
							Uart.Connect(port, RoboUI.UartConnected);
							break;	
						}
					}
				}
				RoboUI.FillSettings(RoboUI.Settings);
			});
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
	CurrentPort.Controller = {
		OnApply : function(value){			
			var port = value.port;
			RoboUI.Settings.port = port;
			RoboUI.SaveSettings();
			Uart.Connect(port, RoboUI.UartConnected);
		},
		
		OnInit : function(value){
			if (Uart.AvailablePorts){
				for (var port in Uart.AvailablePorts){
					var div = this.AddSearchItem(port);
					div.port = port;
				}
			}
			else{
				var elem = this;
				window.setTimeout(function(){
					CurrentPort.Controller.OnInit.call(elem);
				}, 100);
			}
			return true;	
		}
	}
};

RoboUI.UartConnected = function(port){
	PortName.textContent = port;
	WS.Body.set("@state", "connected");
};

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

RoboUI.FillSettings = function(settings){
	AvailablePorts.all(".available-port").del();
	for (var port in Uart.AvailablePorts){
		var div = AvailablePorts.div(".available-port.search-item", port);
		div.port = port;
		div.set("@port", port);
		div.set("@search-value", port);
	}
	if (settings.port){
		CurrentPort.value = settings.port;
	}
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
	return file;
};

RoboUI.ShowProgram = function (fname) {
	Storage.get(fname + ".graph", function(result){
		ProgramArea.LoadProgram(result);
	});
};

RoboUI.NewProgram = function(){
	Storage.add(fname + ".graph", "", function(result){
		ProgramArea.LoadProgram(result);
	});
};

RoboUI.SaveProgram = function () {
	Storage.add(FileNameBox.value + ".graph", ProgramArea.GetProgram(result), function(){});
};


RoboUI.RunProgram = function () {
	if (CNC.ProgramCode) {
		CNC.SendProgram(JSON.stringify(CNC.ProgramCode));
	}
};

WS.DOMload(RoboUI.InitRoboUI);
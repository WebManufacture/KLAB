	CncUI = {};
	
	CncUI.InitCncUI = function(){
		CncUI.LoadSettings(function(result){
			if (result){
				if (result.compileSettings){
					CNC.CompileSettings = result.compileSettings;
				}
				if (result.cncList){
					
				}
				if (result.defaultCnc){
					CncUI.LoadCncSettings(result.defaultCnc, function(settings){
						CNC.Init(settings);		
						//CncSettingsGrid.set("@url", "storage/" + result.defaultCnc + ".json");
						//CncSettingsGrid.del(".initialized");
						//SGrid.InitGrid(CncSettingsGrid);
						//CncSettingsGrid.ShowObjects(settings);
					});
				}
			}
		});
		
		
		Storage = Net.GetTunnel("storage/cnc_table.cnc");
		
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
		
		canv = DOM("#prewiewer");
		canv.height = canv.width;
		canv.width = canv.height;
		dc = canv.getContext("2d");
		logDiv = DOM("#LogBar");
		
		
		nx = 10;
		ny = 10;
		ps = 0;
		zup = 40000;
		zdwn = 54000;
		rbtx = 0;
		rbty = 0;
		rbtz = 0;
		scx = 1;
		scy = 1;
		scz = 1;
		ms = 1000;
		
		CncUI.LoadProgram();
	}
	
	CncUI.LoadSettings = function(callback){
		Net.get("storage/ui_settings.json?rnd=" + Math.random(), function(result){
			if (result){			
				CncUI.Settings = result;
				callback(result);
			}
		});
	}
	
	CncUI.SaveSettings = function(callback){
		Net.POST("storage/ui_settings.json", JSON.stringify(CncUI.Settings), function(result){	});
	}
	
	CncUI.ShowCncSettings = function(){
		CncSettingsWindow.Show();	
	}
	
	CncUI.LoadCncSettings = function(cncName, callback){
		Net.get("storage/" + cncName + ".json?rnd=" + Math.random(), function(result){
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
		Net.POST("storage/" + cncName + ".json", JSON.stringify(settings), function(result){
			
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
	
	
	CncUI.LoadProgram = function(){
		Storage.get("", function(result){
			if (this.status == 200){
				DOM("#programText").value = result;
			}
		});
	};
	
	CncUI.SaveProgram = function(){
		Storage.add("",DOM("#programText").value, 28);
	};

	WS.DOMload(CncUI.InitCncUI);
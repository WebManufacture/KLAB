if (window.log == undefined || window.log == null || !window.log.IsOlmObject) {
    log = DOM.get(".log.provider");
    
    if (!check(log)){
	log = Body.div(".log.provider.system-object");
	log.IsCrudObject = true,
	log.IsOlmObject = true,
    }
    
    LogError = function (message, param1, param2) {
	var log = ev.Div(".error", message);
	if (param1 != undefined && param1 != null) {
	    if (typeof(param1) == "string") {
		if (param1.start(".")) {
		    log.Add(param1);
		}
		else {
		    log.Set("@caller", param1);
		}
	    }
	    else {
		for (var param in param1) {
		    log.Set("@" + param, param1[param]);
		}
	    }
	    if (param2 != undefined && param2 != null) {
		if (typeof(param2) == "string") {
		    if (param1.start(".")) {
			log.Add(param2);
		    }
		    else {
			log.Set("@caller", param2);
		    }
		}
		else {
		    for (var param in param2) {
			log.Set("@" + param, param2[param]);
		    }
		}
	    }
	}
    }; 
    
    Log = LOG = log;
	
    log.Init = function(){
	if (L.initialized) return;
	    E.Create(L, "OnError");
	L.Log = W.div("log");
	L.Log.LogInfo = L.LogInfo;
	L.Log.LogWarn = L.LogWarn;
	L.Log.LogError = L.LogError;
	L.Log.LogItem = L.LogItem;
	L.LogInfo("L initialized!");   
	L.initialized = true;
    };
	
	LogInfo: function(str, module, type){
	    this.LogItem(module, str, "info", type);
	    if (window.console == undefined || window.console == null) return;
		if (module != undefined && module != null)
		{
		    console.info(str); 
		}
	    else
		console.info(str);
	},
	
	LogObject: function(obj, module, type){
	    if (window.console == undefined || window.console == null) return;
		console.info(obj);
	},
	
	LogWarn: function(str, module, type){
	    this.LogItem(module, str, "warn", type);
	    if (window.console == undefined || window.console == null) return;
		if (module != undefined && module != null)
		{
		    console.warn(str); 
		}
	    else
		console.warn(str);
	},
	
	LogError: function(e, m, module, type){
	    this.LogItem(module, e + " : " + module, "err", type);
	    if (window.console == undefined || window.console == null) return;
		this.OnError(e, m);
	    if (Check(module)){
		m = module + ": " + m; 
	    }
	    console.error(e, m);
	},
	
	LogItem : function(module, message, type, itemType){
	    if (this.Log == undefined) return;
		var item = W.div("item");
	    item.cls(type);
	    if (Check(itemType)){
		item.cls(itemType);
	    }
	    item.attr("module", module);
	    item.attr("itemType", itemType);
	    item.html(message + "");
	    item.module = module;
	    item.message = message;
	    item.logtype = type;
	    item.itemtype = itemType;
	    this.Log.add(item);
	}
    }
	}
else{
    Log.LogError("reinitializing Log!"); 
}
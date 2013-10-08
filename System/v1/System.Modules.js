if (window.M == undefined || window.M == null || !window.M.IsOlmObject) {
    
    function starting(e) {
	L.LogInfo("Starting script with ID: " + e.target.getAttribute("src"));
    }
    
    document.addEventListener("beforescriptexecute", starting, true);
    
    
    M = {
	Context : {},
	IsOlmObject : true,
	Element : null,
	url : "System.Modules.js",
	
	Init : function(){
	    M.Element = W.tag("modules", "modules", "", W.Body);
	    L.LogInfo("Module context registered!", M.url);
	    L.LogObject(M.Element, M.url);
	    E.Create(M, "OnModuleRegistered");
	    E.Create(M, "OnModulesLoaded");
	    if (window.DFC_ModulesLoaded != undefined){
		E.AddHandler("OnModulesLoaded", window.DFC_ModulesLoaded, "modules");
	    }
	    
	    E.AddHandler("OnAjaxRequestComplete", M.moduleLoaded, "module");
	   //M.LoadModule("System.Modules.htm");
	    M.SearchModules(W.Body);
	},
	
	GetModuleStatus : function(url){
	    var mod = M.Element.aget("url", url, "module");
	    if (mod == null) return "notfound";
	    if (module.has("inprogress")) return "inprogress";
	    if (module.has("processed")) return "processed";
	    return "unknown";
	},
	
	GetModuleByUrl : function(url){
	    url = url.toLowerCase();
	    return M.Element.aget("url", url, "module");
	},
	
	
	SubscribeTo : function(url, handler){
	    var module = M.GetModuleByUrl(url);
	    if (module.has("inprogress")){
		E.AddHandler("OnModuleRegistered", handler, url);
		return;
		    }
	    handler(url, module);
	},
	
	
	SearchModules: function(elem){
	    var module = M.Element;
	    var nfo = W.get("module-info");
	    if (nfo != null){
		module = W.tag("module", "module", "", M.Element);
		var url = nfo.attr("url");
		module.attr("url", url);
		module.cls("inprogress");		
		module.url = url;
	    } 
	    
	    /*var scripts = W.Body.findAll("script.deffered");
for(var i = 0; i < scripts.length; i++){
W.Header.add(scripts[i]);
}*/
	    var includes = elem.childs("script[url]");
	    for(var i = 0; i < includes.length; i++){
		var inc = M.Element.add(includes[i]);
		M.ProcessScript(inc, module);
	    }
	    var includes = elem.childs("include");
	    for(var i = 0; i < includes.length; i++){
		var inc = M.Element.add(includes[i]);
		M.ProcessInclude(inc);
	    }
	    var modules = elem.childs("module");
	    for(var i = 0; i < modules.length; i++){
		M.Element.add(modules[i]);
		modules[i].cls("module");
		modules[i].cls("inprogress");
		modules[i].url = modules[i].attr("url");
		M.ParseModule(modules[i]);
	    }
	    /*var modules = context.findAll("module");
for(var i = 0; i < modules.length; i++){ 
M.ParseModule(modules[i]);
}*/
	},
	
	ParseModule : function(module){
	    var result = true;    
	    module.url = module.attr("url").toLowerCase();
	    L.LogInfo("parsing: " + module.url, "System.Modules.js", "modules parsing");
	    try{      
		if (module.has("processed")){
		    L.LogInfo("reprocess: " + module.attr("url"), M.url);
		    return true; 
		}
		module.cls("inprogress");
		module.attr("url", module.url);
		var type = module.attr("type");
		module.moduleType = type;
		M.Element.add(module);
		module.includes = 0;
		var includes = module.findAll("include");
		for(var i = 0; i < includes.length; i++){
		    module.includes++;
		    result &= M.ProcessInclude(includes[i], module);
		}
		var checks = module.findAll("check");
		for (var i = 0; i < checks.length; i++){
		    result &= M.ProcessCheck(checks[i]);
		}
		var styles = module.findAll("style");
		for(var i = 0; i < styles.length; i++){
		    result &= M.ProcessStyle(styles[i], module);
		}
		result &= M.CheckModule(module, "Parsing " + module.url);
	    }  
	    catch(e){
		L.LogError(e, "System.Modules.js : Parsing: " + module.url, "System.Modules.js");
	    }
	    return result;
	},
	
	LoadModule : function(ourl, module, cmod){    
	    L.LogInfo("load request: " + ourl + " from: " + cmod, M.url, "modules module request");
	    if (ourl == undefined || ourl == null) return;
		var url = ourl.toLowerCase();
	    if (module == undefined || module == null){
		module = M.GetModuleByUrl(url);
		if (module != null)
		{
		    if (module.has("inprogress")){
			L.LogWarn("inprogress: " + url + " FROM: " + cmod, M.url);
			return true;
		    }
		    else{
			L.LogWarn("reincluding: " + url + " FROM: " + cmod, M.url);
			return false;
		    }      
		}
		else{
		    module = W.tag("module", "module", "", M.Element);
		    module.attr("url", url);
		    module.cls("inprogress");		
		    module.url = url;
		}
	    }
	    module.from = cmod;
	    if (url.endsWith(".js")){
		var docScript = W.get("script.loaded[src='" + ourl + "']");
		if (docScript != null){
		    L.LogWarn("rescript: " + ourl + " FROM: " + cmod, M.url);
		    module.rcs("inprogress");
		    module.cls("processed");
		    return false;
		}
		var docScript = W.Header.get("script[src='" + ourl + "']");
		if (docScript != null){
		    L.LogWarn("rescript-head: " + ourl + " FROM: " + cmod, M.url);
		    module.rcs("inprogress");
		    module.cls("processed");
		    return false;
		}
		if (X.CrossDomain)
		    ourl = X.ServerRoot + url;
		else
		    ourl = url;
		var docScript = W.get("script.loaded[src='" + ourl + "']");
		if (docScript != null){
		    L.LogWarn("rescript: " + url + " FROM: " + cmod, M.url);
		    module.rcs("inprogress");
		    module.cls("processed");
		    return false;
		}
		var docScript = W.Header.get("script[src='" + ourl + "']");
		if (docScript != null){
		    L.LogWarn("rescript-head: " + url + " FROM: " + cmod, M.url);
		    module.rcs("inprogress");
		    module.cls("processed");
		    return false;
		}
		var scriptElement = document.createElement("script");
		scriptElement.attr("type","text/javascript");
		if (X.CrossDomain)
		    scriptElement.attr("src", X.ServerRoot + url);
		else
		    scriptElement.attr("src", url);
		scriptElement.url = url;
		scriptElement.onload = M.scriptLoaded;
		scriptElement.module = module;
		module.appendChild(scriptElement);      
		L.LogInfo("loading-script: " + ourl + " from: " + cmod, M.url);
		return true;
	    }    
	    L.LogInfo("loading: " + url + " from: " + cmod, M.url, "modules module loading");
	    X.LoadModule(url, module);
	    return true;
	},
	
	scriptLoaded : function(){
	    var module = this.module;
	    module.rcs("inprogress");
	    this.cls("loaded");
	    L.LogInfo('script: ' + this.url, M.url, "modules script end");
	    M.ModuleRegistered(this.url, this.module);
	    M.OnModuleRegistered(this.url, this.module);
	},
	
	asyncScriptLoaded : function(){ 
	    this.rcs("inprogress");
	    this.cls("loaded");
	    L.LogInfo('async-script: ' + this.url, M.url, "modules script async-end");
	    M.CheckModule(this.module, "script-async: " + this.url);
	},
	
	moduleLoaded : function(type, req){
	    try
	    {
		var module = req.context;    
		L.LogInfo('module: ' + req.file + ' from: ' + module.from, M.url, "modules module loaded");
		var header = req.getResponseHeader("content-type");
		if (header.contains("text/javascript") || header.contains("application/javascript")){
		    
		}
		var data = req.responseText;
		var exp = /(<script[^>]+)\ssrc=/ig;
		if (exp.test(data)){
		    data = data.replace(exp, "$1 url=");
		    L.LogWarn("scripts reinjection:  from: " + req.file, M.url);
		}
		if (data.contains("<module")){
		    var mod = W.div();
		    mod.html(data);
		    mod = mod.get("module");
		    if (mod != null){
			module.attr("title", mod.attr("title")); 
			data = mod.html();
		    }
		}
		module.html(data);
	    }
	    catch(e){
		L.LogError(e, "System.Modules.js : moduleLoaded: " + req.file, "System.Modules.js");
	    }
	    M.ParseModule(module);
	},
	
	ProcessScript : function(script, module){
	    if (script.attr("url") != null){
		var elem = document.createElement("script");
		elem.attr("type", script.attr("type"));
		elem.attr("url", script.attr("src"));
		elem.async = false;
		elem.attr("async", "false");
		elem.url = script.attr("url");
		if (X.CrossDomain){
		    elem.attr("src", X.ServerRoot + elem.url);
		}
		else
		{
		    elem.attr("src", elem.url); 
		}
		elem.attr("url", elem.url);
		elem.cls("inprogress");
		elem.module = module;
		var docScript = W.get("script.loaded[src='" + elem.url + "']");
		if (docScript != null){
		    L.LogWarn("rescript: " + elem.url, M.url, "modules rescript");
		    script.del();
		    return true;
		}
		var docScript = W.Header.get("script[src='" + elem.url + "']");
		if (docScript != null){
		    L.LogWarn("rescript-head: " + elem.url, M.url, "modules rescript head-rescript");
		    script.del();
		    return true;
		}
		script.del();
		elem.onload = M.asyncScriptLoaded;
		L.LogInfo("async-start: " + elem.url, M.url, "modules script async-start");
		M.Element.appendChild(elem);
		return false;
	    }
	    else{
		if (script.has("deffered")) return true;
		L.LogInfo("executing:" + module.url, M.url, "modules executing-eval");
		try{
		    window.eval(script.innerHTML);        
		}
		catch(e)
		{
		    L.LogError(e, module.url);
		}
	    }
	    return true;
	},
	
	ProcessStyle : function(element, module){
	    return true;
	},
	
	ProcessContext : function(element, context, module){
	    W.LogInfo("__context-M: " + context.Selector, M.url);
	    context.Process(element, context); 
	    return true;
	},
	
	ProcessInclude : function(element, module){
	    element.url = element.attr("url");
	    element.aurl = element.attr("alt");
	    if (Check(element.aurl))
	    {
		var mod = M.GetModuleByUrl(element.aurl);  
		if (mod != null)
		{
		    L.LogWarn("alt-using: " + element.aurl + " not: " + element.url + " FROM: " + module.url, M.url);
		    element.url = element.aurl;
		    element.attr("url", element.url);
		}
	    }
	    var url = "BODY";
	    if (Check(module)){
		url = module.url;
	    }
	    var result = M.LoadModule(element.url, null, url);
	    element.url = element.url.toLowerCase();
	    element.attr("url", element.url);
	    if (result) {
		element.cls("inprogress");
		var url = " _ ";
		if (Check(module)){
		    url = module.url; 
		}
		L.LogInfo("include inprogress: " + element.url + " FROM: " + url, M.url, "modules include");
	    };
	    return result;
	},
	
	ProcessCheck : function(element, module){
	    element.url = element.attr("url").toLowerCase();
	    element.attr("url", element.url);
	    var mod = M.GetModuleByUrl(element.url);
	    if (mod != null)
	    {
		if (mod.has("inprogress")){
		    element.cls("inprogress");
		    L.LogInfo("check inprogress: " + element.url, M.url);
		    return false; 
		}
		if (mod.has("processed")){          
		    element.rcs("inprogress");
		    element.cls("processed");
		    return true; 
		}
	    }
	    element.rcs("inprogress");
	    return true;
	},
	
	
	CheckModule : function(module, from){
	    L.LogInfo("checking: " + module.url + " FROM: " + from, M.url, "modules checking start");    
	    var includings = module.findAll("include.inprogress");
	    if (includings.length > 0)
	    {
		L.LogInfo("decline: " + module.url + " count: " + includings.length + " not checked: " + includings[0].attr("url"), M.url, "modules checking decline");
		return false;
	    }
	    var checks = module.findAll("check.inprogress");
	    if (checks.length > 0)
	    {
		L.LogInfo("decline: " + module.url + " not check: " + checks[0].attr("url"), M.url, "modules checking decline decline-checks");
		return false;
	    }    
	    L.LogInfo("continue: " + module.url, M.url, "modules checking continue");
	    var scripts = module.findAll("script:not(.loaded)");
	    for(var i = 0; i < scripts.length; i++){
		if(!M.ProcessScript(scripts[i], module)) return false;
	    }
	    if (window.Contexts != undefined){
		Contexts.Process(module, "System.Modules.js");
	    }
	    M.ModuleRegistered(module.url, module);
	    M.OnModuleRegistered(module.url, module);
	    return true;
	},
	
	ModuleRegistered: function(url, module){
	    url = url.toLowerCase();
	    L.LogInfo("registered: " + url, M.url, "modules registered");
	    module.rcs("inprogress");
	    var includings = M.Element.findAll("include.inprogress[url='" + url + "']");
	    for(var i = 0; i < includings.length; i++){
		includings[i].rcs("inprogress");
		var mod = includings[i].findParent("module");
		if (mod != null)
		{
		    M.CheckModule(mod, url);
		}
		else
		{
		    
		}
	    }
	    var checks = M.Element.findAll("check.inprogress[url='" + url + "']");
	    for(var i = 0; i < checks.length; i++){
		checks[i].rcs("inprogress");
		var mod = checks[i].findParent("module");
		if (mod != null){
		    M.CheckModule(mod, url);
		}
	    }
	    var scripts = module.findAll("script.deffered");
	    for(var i = 0; i < scripts.length; i++){
		L.LogInfo("Deffered: " + module.url, M.url, "modules deffered");
		window.eval(scripts[i].innerHTML);
	    }
	    module.cls("processed");
	    var modules = M.Element.findAll("module:not(.processed)");
	    if (modules.length == 0)
	    {
		M.OnModulesLoaded();
		L.LogInfo("Modules Loading complete!");
	    }
	},
    }
	
W.Onload(M.Init);
    
}
else
{
    L.LogError("Reinitilizing M (Modules)!");
}
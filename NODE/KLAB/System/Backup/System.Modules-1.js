M = {
  Context : null,
  Element : null,
  url : "System.Modules.js",
  
  Init : function(){
    M.Element = W.tag("modules", "modules", "", W.Body);
    M.Element.add("<module class='module processed' url='System.Modules.js'></module>");
    if (window.X != undefined){
    	M.Element.add("<module class='module processed' url='System.Ajax.js'></module>");
    }
    L.LogInfo("Module context registered!");
    L.LogInfo(M.Element);
    E.Create(M, "OnModuleRegistered");
    E.AddHandler("OnModuleRegistered", M.ModuleRegistered);
    M.SearchModules(W.Body);
    E.AddHandler("OnAjaxRequestComplete", M.moduleLoaded, "module");
  },
  
  GetModuleByUrl : function(url){
    return M.Element.aget("url", url, "module");
  },
  
  SearchModules: function(context){
    var includes = context.findAll("include");
    for(var i = 0; i < includes.length; i++){
        var inc = M.Element.add(includes[i]);
        M.ProcessInclude(inc);
    }
    var modules = context.findAll("module");
    for(var i = 0; i < modules.length; i++){ 
        M.ParseModule(modules[i]);
    }
  },
  
  ParseModule : function(module){
    var result = true;
    if (module.has("processed")){
      L.LogInfo("reprocess: " + module.attr("url"));
      return true; 
    }
    module.cls("inprogress");
    module.url = module.attr("url");
    var type = module.attr("type");
    module.moduleType = type;
    M.Element.add(module);
    module.includes = 0;
    var includes = module.findAll("include");
    for(var i = 0; i < includes.length; i++){
      module.includes++;
      result &= M.ProcessInclude(includes[i], module);
    }
    var styles = module.findAll("style");
    for(var i = 0; i < styles.length; i++){
      result &= M.ProcessStyle(styles[i], module);
    }
    var scripts = module.findAll("script");
    for(var i = 0; i < scripts.length; i++){
      result &= M.ProcessScript(scripts[i], module);
    }
    return result;
  },
    
  LoadModule : function(url, module){
    if (url == undefined || url == null) return;
    if (module == undefined || module == null){
      module = M.GetModuleByUrl(url);
      if (module != null)
      {
        if (module.has("inprogress")){
           L.LogWarn("inprogress: " + url);
           return true;
        }
        else{
           L.LogWarn("reincluding: " + url);
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
    if (url.endsWith(".js")){
        L.LogInfo("loading: " + url);
    	var scriptElement = document.createElement("script");
        scriptElement.attr("type","text/javascript");
        scriptElement.attr("src", url);
        scriptElement.url = url;
        scriptElement.onload = M.scriptLoaded;
        scriptElement.module = module;
        module.appendChild(scriptElement);
        return true;
    }    
    L.LogInfo("loading: " + url);
    X.LoadModule(url, module);
    return true;
  },
  
  scriptLoaded : function(){
    var module = this.module;
    module.rcs("inprogress");
    L.LogInfo('script: ' + this.url);
    M.OnModuleRegistered(this.url, this.module);
  },
  
  moduleLoaded : function(type, req){
    var module = req.context;
    var header = req.getResponseHeader("content-type");
    if (header.contains("text/javascript") || header.contains("application/javascript")){
      
    }
    module.html(req.responseText);
    L.LogInfo('module: ' + req.file);
    if (M.ParseModule(module)){
      module.rcs("inprogress");
      M.OnModuleRegistered(req.file, module);
    }
  },
     
  ProcessScript : function(script, module){
   if (script.attr("src") != null){
	var elem = document.createElement("script");
	elem.attr("type", script.attr("type"));
	elem.attr("url", script.attr("src"));
	elem.async = false;
        elem.attr("async", "false");
	elem.attr("src", script.attr("src"));
        script.del();
	module.appendChild(elem);
        script = elem;
        return true;
   }
   else{
        if (script.has("deffered")) return true;
  	window.eval(script.innerHTML);
   }
   return true;
  },
  
  ProcessStyle : function(element, module){
     return true;
  },
  
  ProcessInclude : function(element, module){
    element.url = element.attr("url");
    element.cls("inprogress");
    return !M.LoadModule(element.url);
  },

  
  CheckModule : function(module){
    L.LogInfo("checking: " + module.url);    
    var includings = module.findAll("include.inprogress");
    if (includings.length > 0) return false;
    module.rcs("inprogress");
    M.OnModuleRegistered(module.url, module);
    return true;
  },
  
  ModuleRegistered: function(url, module){
    L.LogInfo("registered: " + url);
    var includings = M.Element.findAll("include.inprogress[url='" + url + "']");
    for(var i = 0; i < includings.length; i++){
      includings[i].rcs("inprogress");
      var mod = includings[i].findParent("module");
      if (mod != null){
        M.CheckModule(mod);
      }
      else{
        
      }
    }
    var scripts = module.findAll("script.deffered");
    for(var i = 0; i < scripts.length; i++){
      L.LogInfo("Deffered: " + module.url);
      window.eval(scripts[i].innerHTML);
    }
    module.cls("processed");
  },
  
}

W.Onload(M.Init);

M = {
  Context : null,
  Element : null,
  url : "System.Modules.js",
  
  Init : function(){
    M.Element = W.tag("modules", "modules", "", W.Body);
    if (window.X != undefined){
    	M.Element.add("<module class='module processed' url='System.Ajax.js'></module>");
    }
    L.LogInfo("Module context registered!");
    L.LogInfo(M.Element);
    E.Create(M, "OnModuleRegistered");
    E.AddHandler("OnModuleRegistered", M.ModuleRegistered);
    E.AddHandler("OnAjaxRequestComplete", M.moduleLoaded, "module");
    M.LoadModule("System.Modules.htm");
    
    M.SearchModules(W.Body);
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
    /*var modules = context.findAll("module");
    for(var i = 0; i < modules.length; i++){ 
        M.ParseModule(modules[i]);
    }*/
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
    result &= M.CheckModule(module);
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
        var docScript = W.get("script.loaded[src='" + url + "']");
        if (docScript != null){
          L.LogWarn("rescript: " + url);
          module.rcs("inprogress");
          module.cls("processed");
          return false;
        }
        var docScript = W.Header.get("script[src='" + url + "']");
        if (docScript != null){
          L.LogWarn("rescript-head: " + url);
          module.rcs("inprogress");
          module.cls("processed");
          return false;
        }
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
    this.cls("loaded");
    L.LogInfo('script: ' + this.url);
    M.OnModuleRegistered(this.url, this.module);
  },
  
  asyncScriptLoaded : function(){ 
    this.rcs("inprogress");
    this.cls("loaded");
    L.LogInfo('async-script: ' + this.url);
    M.CheckModule(this.module);
  },
  
  moduleLoaded : function(type, req){
    var module = req.context;
    var header = req.getResponseHeader("content-type");
    if (header.contains("text/javascript") || header.contains("application/javascript")){
      
    }
    var html = document.createElement("div");
    html.html(req.responseText);
    var scripts = html.findAll("script[src]");
    for(var i = 0; i < scripts.length; i++){
      var url = scripts[i].attr("src");
      var docScript = W.get("script.loaded[src='" + url + "']");
      if (docScript != null){
        scripts[i].del();
        L.LogWarn("script reinjection: " + url);
      }
      var docScript = W.Header.get("script[src='" + url + "']");
      if (docScript != null){
        scripts[i].del();
        L.LogWarn("script reinjection: " + url);
      }
    }
    module.html(html.innerHTML);
    L.LogInfo('module: ' + req.file);
    M.ParseModule(module);
  },
     
  ProcessScript : function(script, module){
   if (script.attr("src") != null){
	var elem = document.createElement("script");
	elem.attr("type", script.attr("type"));
	elem.attr("url", script.attr("src"));
	elem.async = false;
        elem.attr("async", "false");
        elem.url = script.attr("src");
	elem.attr("src", elem.url);
     	elem.attr("url", elem.url);
        elem.cls("inprogress");
        elem.module = module;
        var docScript = W.get("script.loaded[src='" + elem.url + "']");
        if (docScript != null){
          L.LogWarn("rescript: " + elem.url);
          script.del();
          return true;
        }
        var docScript = W.Header.get("script[src='" + elem.url + "']");
        if (docScript != null){
          L.LogWarn("rescript-head: " + elem.url);
          script.del();
          return true;
        }
        script.del();
        elem.onload = M.asyncScriptLoaded;
	module.appendChild(elem);
        return false;
   }
   else{
      if (script.has("deffered")) return true;
      L.LogInfo("executing:" + module.url);
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
    W.LogInfo("__context-M: " + context.Selector);
    context.Process(element, context); 
    return true;
  },
  
  ProcessInclude : function(element, module){
    element.url = element.attr("url");
    var result = M.LoadModule(element.url);
    if (result) {
        element.cls("inprogress");
        var url = " _ ";
        if (Check(module)){
          var url = module.url; 
        }
        L.LogInfo("include inprogress: " + element.url + " " + url);
    };
    return result;
  },

  
  CheckModule : function(module){
    L.LogInfo("checking: " + module.url);    
    var includings = module.findAll("include.inprogress");
    if (includings.length > 0)
    {
      L.LogInfo("decline: " + module.url + " count: " + includings.length);
      return false;
    }
    L.LogInfo("continue: " + module.url);
    var scripts = module.findAll("script:not(.loaded)");
    for(var i = 0; i < scripts.length; i++){
      if(!M.ProcessScript(scripts[i], module)) return false;
    }
    if (window.Contexts != undefined){
      for(var c = 0; c < Contexts.length; c++){
        var context = Contexts[c];
        if (Check(context.Condition)){
          if (context.Condition != "System.Modules.js"){
            continue; 
          }
        }
        var tags = module.findAll(context.Selector);      
        for(var i = 0; i < tags.length; i++){
          M.ProcessContext(tags[i], context, module);
        }
      }
    }
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

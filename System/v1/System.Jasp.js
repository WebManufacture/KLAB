if (window.Contexts == undefined || window.C == null || !window.C.IsOlmObject) {

  C = Contexts = AArray();
  
  C.isOlmObject = C.IsOlmObject = true;
  
  Contexts.AddFirst = function(newContext){
    this.objects[newContext.Selector] = newContext;
    var index = 0;
    if (Check(newContext.Condition)){
    	for(var c = 0; c < Contexts.length; c++){
      	   var selector = Contexts[c];
           var context = this.get(selector);
           if (context.Condition == newContext.Condition){
             index = c;
             break;
           }
        }
    }
    this.insert(index, newContext.Selector, newContext);
    L.LogInfo("context: " + newContext.Selector, "System.Jasp.js");
  }
  
  Contexts.Add = function(context){
     this.add(context.Selector, context);
     L.LogInfo("context: " + context.Selector, "System.Jasp.js");
  }

  Contexts.Process = function(element, condition, param1){
    L.LogInfo("processing contexts: " + condition, "System.Jasp.js");
    for(var c = 0; c < Contexts.length; c++){
      var context = Contexts[c];
      context = this.get(context);
      if (Check(context.Condition)){
        if (context.Condition != condition){
          continue; 
        }
      }
      this.ProcessContext(element, context, param1);
    }
  }

  Contexts.ProcessContext = function(element, context, param1){
    L.LogInfo("processing context: " + context.Selector, "System.Jasp.js");
    if (context.OnlyChilds){
      var tags = element.childs(context.Selector);             
    }
    else{
      var tags = element.findAll(context.Selector);      
    }
    for(var i = 0; i < tags.length; i++){
      context.Process(tags[i], context, element, param1);
    }
  }
  
  L.LogInfo("Contexts created!");
}
else
{
  L.LogError("Reinitilizing Contexts!");
}

if (window.J == undefined || window.J == null || !window.J.IsOlmObject) {
    
    J = Jasp = {IsOlmObject: true};
    
    J.JaspContext = { Condition: "System.Modules.js" };
    J.JaspContext.Selector = "context:not(.registered)";
    J.JaspContext.Process = function(element){
      var context = {};
      context.Selector = element.attr("selector");
      context.Condition = element.attr("condition");
      context.OnlyChilds = element.attr("onlychilds");
      context.element = element;
      context.code = element.html();
      context.module = element.findParent("module");
      context.Process = J.ProcessJaspContext;
      C.Add(context);
      element.cls("registered");
      //Contexts.ProcessContext(W.Body, context);
    }
    C.Add(J.JaspContext);
    
    J.ProcessJaspContext = function(element, context, processingElem, param1){
      var Processor = {};
      Processor.Element = element;
      Processor.Context = context;
      Processor.ProcessingElement = processingElem;
      Processor.Param = param1;
      Processor.ContextElement = context.element;
      try{
        with(Processor){
          eval(context.code);
        }
      }
      catch(e){
        var url = context.Selector;
        if (Check(context.module))
        {
          url += " : " + context.module.url; 
        }
        L.LogError(e, "ProcessingContext : " + url, "System.Jasp.js");
      }
    };
    
    
    J.LoadingContext = { Condition: "System.Modules.js" };
    J.LoadingContext.Selector = ".content[url]:not(.loaded)";
    J.LoadingContext.Process = function(element){
	var url = element.url = element.attr("url");
	X.GetHTML(url, element, J.ProcessLoadedContent);
    }
    C.Add(J.LoadingContext);
    
    J.ProcessLoadedContent = function(result, context){
	var load = context.attr("onload");
	if (Check(load)){
	   window.eval(load);   
	}
    }
    
    L.LogInfo("JASP Contexts registered!");
}
else
{
  L.LogError("Reinitilizing JASP!");
}
  
//M.Element.add("<module class='module processed' url='System.Jasp.js'></module>");

 
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
      if (Check(condition) && Check(context.Condition)){
        if (context.Condition != condition){
          continue; 
        }
      }
      this.ProcessContext(element, context, param1);
    }
  }

  Contexts.ProcessContext = function(element, context, param1){
      L.LogInfo("processing context: " + context.Selector + " in: " + element.attr('url') + " only>" + context.OnlyChilds, "System.Jasp.js");
    if (context.OnlyChilds != undefined && context.OnlyChilds){
      var tags = element.childs(context.Selector);             
    }
    else{
      var tags = element.findAll(context.Selector);      
    }
    for(var i = 0; i < tags.length; i++){
	L.LogInfo("found: " + element.ToString(true) + (Check(element.url) ? "@url='" + element.url + "'" : ""), "System.Jasp.js");
      context.Process(tags[i], context, element, param1);
    }
  }
      
      Controllers = {};
    
    Controllers.Context = { Condition: "System.Windows.htm" };
    Controllers.Context.Selector = "[controller]";
    Controllers.Context.Process = function(element){
	element.controller = element.attr("controller");
	element.controller = window[element.controller];
	element.Event = Controllers.StartEvent;
    }
	
    Controllers.StartEvent = function(event, argument1, argument2){
	if (check(argument1)){
	    if (check(argument2)){
		return this.controller[event](argument1, argument2);
	    }
	    return this.controller[event](argument1);
	}	
	return this.controller[event]();
    }
	
    C.Add(Controllers.Context);
	  
  L.LogInfo("Contexts created!");
}
else
{
  L.LogError("Reinitilizing Contexts!");
}

if (window.J == undefined || window.J == null || !window.J.IsOlmObject) {
    
    J = Jasp = {IsOlmObject: true};
    
    J.ContextContext = { Condition: "System.Modules.js" };
    J.ContextContext.Selector = "context:not(.registered)";
    J.ContextContext.Process = function(element){
      var context = {};
      context.Selector = element.attr("selector");
      context.Condition = element.attr("condition");
      context.OnlyChilds = element.attr("onlychilds");
      context.element = element;
      context.code = element.html();
      context.module = element.findParent("module");
      context.Process = J.ProcessContext;
      C.Add(context);
      element.cls("registered");
      //Contexts.ProcessContext(W.Body, context);
    }
    C.Add(J.ContextContext);
    
    J.ProcessContext = function(element, context, processingElem, param1){
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
	C.Process(context);
	var scripts = context.findAll("script:not(.loaded)");
	if (check(window.M) && M.IsOlmObject){
	    for(var i = 0; i < scripts.length; i++){
		M.ProcessScript(scripts[i], context)
            }
	}
	else{
	    for(var i = 0; i < scripts.length; i++){
		window.eval(scripts[i].innerHTML);
            }   
	}
	var load = context.attr("onload");
	if (Check(load)){
	   window.eval(load);   
	}
    }

    J.Commands = ['+', '<', '-', '=', '!'];
	
    J.ProcessJaspContext = function(element){
      element.code = J.Compile(element.html());
      element.attr("code", element.code);
      element.cls("compiled");
      //Contexts.ProcessContext(W.Body, context);
    }	
	
    J.JaspContext = { Condition: "System.jasp.js" };
    J.JaspContext.Selector = "jasp:not(.compiled)";
    J.JaspContext.Process = J.ProcessJaspContext;
    C.Add(J.JaspContext);
    
    J.Macros = AArray();
    
    J.Compile = function(code){
      var compiledCode = "";
      var lines = code.split('\n');
      for (var i = 0; i < lines.length; i++){
	  var line = lines[i];
	  var index = -1;
	  for (var c = 0; c < J.Commands.length; c++){
	      var ind = line.indexOf(J.Commands[c]);
	      if (ind >= 0 && (ind < index || index < 0)){
		  index = ind;
		  var command = J.Commands[c];
	      }
	  }
	  if (index >= 0){
	      var left = line.substring(0, index);
	      var right = J.Compile(line.substring(index + 1));
	      if (left.length > 0){
		  if (left.search(/^\s*[.#]/) >= 0){
		      compiledCode += "var elem = W.findAll('" + left + "');";
		      switch(command){
			  case "<" : 
			      compiledCode += "elem.html(" + right + ");";
			      break;
		          case "+" : 
			      compiledCode += "elem.add(" + right + ");";
			      break;
				  }
		      continue;
			  }
		  if (line.search(/^\s*[!]/) >= 0){

	      switch(command){
		  case "<" : 
		      compiledCode += "window." + left.raplace('!', "").trim() + "(" + right + ");";
		      break;
		  case "+" : 
		      compiledCode += "J.CallParams.add(" + right + ");";
		      break;
			  }
	      continue;
		  }
		  
		  if (command == "="){
		      compiledCode += "J.Macros.add(" + left.replace('!', '') + ");";
		      continue;
			  }
		  switch(command){
		      case "<" : 
			  compiledCode += left + "=" + right + ";";
			  break;
		      case "+" : 
			  compiledCode += left.trim() + ".add(" + right + ");";
			  break;
		  }		  
	      }
	  }
	  else{
	      if (line.search(/^\s*[!]/) >= 0){
		  compiledCode += "window." + left + "(J.CallParams); J.CallParams.clear();";
	      }
	      if (left.search(/^\s*[.#]/) >= 0){
		      compiledCode += "W.findAll('" + left + "')";
	      }
	  }
      }
      return compiledCode;
    }
    
    L.LogInfo("JASP Contexts registered!");
}
else
{
  L.LogError("Reinitilizing JASP!");
}
  
//M.Element.add("<module class='module processed' url='System.Jasp.js'></module>");

 
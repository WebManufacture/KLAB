P = function(contexts){
  this.contextString = contexts;
  this.contexts = C.GetContexts(contexts);
  this.context = this.contexts[this.contexts.length - 1];
  //this.ProcessElements(element);
}

P.prototype = {
  PushContext : function(context){
     this.oldContextString = this.contextString;
     this.contextString = context + " " + this.contextString;
     context = C.GetContexts(context);
     for (var i = context.length - 1; i >= 0 ; i--)
     {
       this.contexts.push(context[i]);
     }
     //this.context = context;
  },
  
  PopContext : function(processor){
     this.contextString = this.oldContextString ;
     this.contexts.unshift();
     //this.context = this.contexts[this.contexts.length - 1];
  },

    CheckContexts : function(element){
      var protect = element.attr("protect");
      if (protect == undefined || protect == null){
        return true;
      }
      if (typeof(protect) == "string"){
        protect = protect.split(' ');
      }
      for (var j = 0; j < protect.length; j++)
      {
        if (!this.contextString.contains(protect[j])){
            return false;
        }
      }
      return true;      
    },
    
    ProcessElements : function(element){
    if (element.jver == undefined) return;
    var protect = element.attr("protect");
    if (protect != null)
      {
        if (!this.CheckContexts(element, protect)){
          return "protect";
        }
      }
      var name = element.sname;
      var result = true;
      for (var i = 0; i < this.contexts.length; i ++)
      {
        var context = this.contexts[i];
        var alias = context[name];
        if (alias != undefined && alias != null && alias.preHandler != undefined && alias.preHandler != null){
          this.LogProcess("pre: ", element);
          result &= alias.preHandler(element, this);
        }
        if (context._processOther == false) break;
      }
      if (!result) return;
      var results  = this.ProcessChilds(element);
      for (var i = 0; i < this.contexts.length; i ++)
      {
        var context = this.contexts[i];
        var alias = context[name];
        if (alias != undefined && alias != null && alias.postHandler != undefined && alias.postHandler != null){
          result &= alias.postHandler(element, this, results); 
          this.LogProcess("post: ", element);
        }
        if (context._processOther == false) break;
      }
      if (result){
        element.cls("processed");  
      }
      return "processed";
    },
  
  
    LogProcess: function(str, element){
      var result = str + element.sname + "." + element.attr("class");
      
      for (var i = 0; i < element.attributes.length; i++)
      {
        result += "  " + element.attributes[i].name + ":" + element.attributes[i].value;
      }
      J.LogInfo(result);
    },
  
    ProcessChilds : function(element){
      var results = [];
      var childs = element.childs();
      for (var i = 0; i < childs.length; i++)
      {
        results.push(this.ProcessElements(childs[i]));
      }
      return results;
    }
}
  
C = {};

if (window.Contexts == undefined) {

  Contexts = AArray();
  
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
    L.LogInfo("context: " + newContext.Selector);
  }
  
  Contexts.Add = function(context){
     this.add(context.Selector, context);
     L.LogInfo("context: " + context.Selector);
  }

  Contexts.Process = function(element, condition){
    for(var c = 0; c < Contexts.length; c++){
      var selector = Contexts[c];
      var context = this.get(selector);
      if (Check(context.Condition)){
        if (context.Condition != condition){
          continue; 
        }
      }
      this.ProcessContext(element, context);
    }
  }

  Contexts.ProcessContext = function(element, context){
    var tags = element.findAll(context.Selector);      
    for(var i = 0; i < tags.length; i++){
      context.Process(tags[i], context);
    }
  }
}
else
{
  L.LogError("Reinitilizing Contexts!");
}

C.Jasp = {
  enabled : true,
  
  context : {
    selector: "context",  
    
    preHandler : function(element, processor){
      var id = element.attr("name");
      processor.PushContext(id);
      return true;
    },
    
    postHandler : function(element, processor){
      processor.PopContext();
      return true;
    }
  },
  
  protect : {

    preHandler : function(element, processor){
      return P.CheckContexts(element);
    },
      
    selector: "protect"
  },
  
  get :  {
    selector: "get",
    preHandler: function(element, context){
          
    }
  },
            
  set : {
    selector: "set",
    postHandler: function(element, context){
      
    }
  },
  
  alias : {
    selector: "alias",
    preHandler: function(element, context){
        var aliasName = element[0].getAttribute("for");
        if (aliasName == null || aliasName == undefined){
          return false;
        }
        var aliasObject = {};
        aliasObject.alias = aliasName;
        aliasObject.process = "pre";
        
        var linkPath = element.attr("path");
        if (linkPath == null || linkPath == undefined){
          aliasObject.link = element;
          aliasObject.handler = H.ProcessLinkedHTML;
          A[aliasName] = aliasObject;
          return false;
        }
        if (linkPath == "object"){
          aliasObject.link = element;
          aliasObject.handler = H.ProcessLinkedCode;
          A[aliasName] = aliasObject;
          return false;
        }
        aliasObject.linkPath = linkPath;
        var protocol = "css";
        var protocolIndex = linkPath.firstIndexOf("://");
        if (protocolIndex > 0){
          protocol = linkPath.substring(0, protocolIndex);
        }
        linkPath = linkPath.remove("://");
        aliasObject.protocol = protocol;
        aliasObject.path = linkPath;
        switch (protocol){
          case "css":
            aliasObject.linked = $(linkPath);
            break;
              case "js":
          case "javascript":
            aliasObject.handler = window[linkPath];
            break;
              case "alias":
            aliasObject.process = "pre post";
            aliasObject.handler = H.ProcessLinkedAlias;
            break;
              }
        A[aliasName] = aliasObject;
        return false;
      },
      
      ProcessLinkedCode : function(element, context, process, results){
        var alias = A[this.linkPath];
        if (alias == null || alias == undefined)
        {
          return true;
        }
        var processor = new J.Processor(context); 
        processor.ProcessChilds(alias.link);     
        return true;
      },
      
      ProcessLinkedHTML : function(element, context, process, results){
        for (var j = 0; j < this.link[0].attributes.length; j++)
        {
          var attr = this.link[0].attributes[j];
          if ("path id for".contains(attr.name)) continue;
            element[0].setAttribute(attr.name, attr.value);
        }
        element[0].innerHTML += this.link[0].innerHTML;
        return true;
      },
      
      ProcessLinkedAlias : function(element, contexts, process, results){
        var alias = A[this.linkPath];
        if (alias == null || alias == undefined)
        {
          return true;
        }
        if(process == "pre" && alias.process.contains("pre")){
          if (!alias.handler(element, contexts, "pre")){
            return false;
          }
        }
        if(process == "post" && alias.process.contains("post")){
          if (!alias.handler(element, contexts, "post", results)){
            return false;
          }
        }
        return true;
      }
    },    
  
    ajax :
    {
      selector: "ajax",
      preHandler : function(element, context){
       
      },
      postHandler : function(element, context){
       
      }
    },
    
    event :
    {
      selector: "event",
      preHandler : function(element, context){
       
      }
    }, 
  
    eval :
    {
      selector: "eval",
      preHandler : function(element, context){
        window.eval(element.html());
        return false;
      }
    },
  
}

J = Jasp = {    
  Modules : {},
  
  GetCommands : function(command, element){
    var commands;
    if (element != undefined && element != null){
      commands = element.findAll(command + ":not(.processed)");
    }
    else {
      commands = W.findAll(command + ":not(.processed)");
    }
    return commands;
  },
  
  Init : function(){
    Jasp.Processor = P;
    J.OnInitComplete.add(J.ParseBody);
    W.OnNodeInserted.add(J.Parse);
  
   // var browser = C.CreateContext("Browser");
   // var app = C.CreateContext(navigator.appCodeName);
  },
  
  DScriptID : 0,
  
  DScriptContainer : {},
  
  DScript : function(text, module){
  //var scr = document.body.add(W.tag("script", "temp"));
  J.DScriptID++;
  //var name = "DynScr" + J.DScriptID;
  try{
    window.eval(text);
  }
  catch(e){
    J.LogError(e, module);
  }
  },  
  
  
  Parse : function(element)
  {
    var contexts = C.GetEnabledContexts();
    var processor = new Jasp.Processor(contexts);
    processor.ProcessElements(element);
  },
    
  ParseBody : function(){
    J.Parse(W.Body);
  },
  
  OnInitComplete : E.Create(this, "OnJaspInitComplete"),
}
  
//M.Element.add("<module class='module processed' url='System.Jasp.js'></module>");

 
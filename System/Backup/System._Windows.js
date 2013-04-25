    Win = M.GetModuleByUrl("System.Windows.htm");

    Win.Items = [];
    Win.OnWindowCreated = E.Create(Win, "OnWindowCreated");
      
    Win.Init = function(){
      Contexts.ProcessContext(M.Element, Win.Context);
      //M.OnModuleRegistered.add(Win.ProcessContexts);
    }
      
    Win.ProcessContexts = function(element, context){
      Contexts.Process(M.Element, "System.Windows.htm");     
    }
      
    Win.CreateWindow = function(element, windowType){
      try{
        if (windowType == undefined || windowType == null){
          windowType = "ui_standart_window"; 
        }
        var proto = W.get(".window.prototype." + windowType);
        if (proto == null){
          alert("unknown window type: " + windowType);
          return;
        }
        var win = proto.clone();
        var class = element.attr("class");
        if (class == null) class = "";
        win.attr("class", class + " window " + windowType);
        win.title = element.attr("title");
        var title = win.find(".window_title");
        if (title != null){
          title.html(win.title);
        }
        win.module = element.attr("module");
        var content = win.find(".window_content");
        content.html(element.innerHTML);
        W.Body.add(win);
        Win.Items.push(win);
        //new DragObject(window, true);
        
        Contexts.Process(win, "System.Windows.htm");     
        win.cls("processed");
        win.show();        
        Win.OnWindowCreated(win.module, win);
        return win;
      }
      catch(e)
      {
         L.LogError(e, "System.Windows.htm : CreateWindow");
      }    
    }
      
    Win.ShowWindow = function(){
      Win.Manager.show();
    }
      
    var cnt = W.get(".window_manager");
    Win.Manager = Win.CreateWindow(cnt, "frame_window");
    //W.Body.add(Win.Manager);
      
    Win.Manager.Init = function(){
       var items = Win.Manager.findAll(".window_manager_item");
       items.eadd("click", Win.Manager.Activate);
       for(var i = 0; i < Win.Items.length; i++){
            var win = Win.Items[i];
            if (win != null){
              Win.Manager.AddWindow(win);
            }
       }
       Win.OnWindowCreated.add(Win.Manager.AddWindow);
    }
        
    Win.Manager.Activate = function(event){
       Win.Manager.show();
    }
        
    Win.Manager.AddWindow = function(win){
          var proto = W.get(".window_manager_item");
          var clone = proto.clone();
          if (win.title != null){
            clone.find(".title").html(win.title);
          }
          else{
            clone.find(".title").html(win.module);
          }
          clone.win = win;
          clone.eadd("click", Win.Manager.Activate);
          Win.Manager.get(".window_content").add(clone);
        }
              
      Win.Context = {};
      Win.Context.Condition = "System.Modules.js";
      Win.Context.Selector = "win:not(.prototype):not(.processed)";
      Win.Context.Process = function(element){
         var windowType = element.attr("type");
         var module = element.findParent("module");
         var win = Win.CreateWindow(element, windowType);
         win.module = module;
         win.attr("module", module.url);
         element.cls("processed");
      }
        
        
      Contexts.Add(Win.Context);
        
      Win.HeaderContext = {};
      Win.HeaderContext.Condition = "System.Windows.htm";
      Win.HeaderContext.Selector = ".header.toolbar:not(.window-header)";
      Win.HeaderContext.Process = function(element, module){
         var parent = element.findParent("win");
         var header = parent.get(".window_header");
         header.add(element.html());
         element.del();
      }
        
        
      Contexts.AddFirst(Win.HeaderContext);
      
      Win.CloseWindow = function(elem){
	 var parent = elem.findParent("win");
         parent.del();
      }
        
      Win.HideWindow = function(elem){
	 var parent = elem.findParent("win");
         parent.hide();
      }  
        
      Win.Init();
      Win.Manager.Init();
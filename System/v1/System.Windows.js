    Win = M.GetModuleByUrl("System.Windows.htm");

    Win.Items = [];
    Win.OnWindowCreated = E.Create(Win, "OnWindowCreated");
      
    Win.Init = function(){
      Contexts.ProcessContext(Win, Win.Context);
      //Contexts.ProcessContext(M.Element, Win.Context);
    }
           
    Win.CreateWindow = function(element, windowType){
      try{
        if (!Check(windowType)){
          windowType = element.attr("type");
          if (!Check(windowType)){
            windowType = "ui_standart_window"; 
          }
        }
        var proto = W.get(".window.prototype." + windowType);
        if (proto == null){
          windowType = "ui_standart_window";
          var proto = W.get(".window.prototype.ui_standart_window");
        }
        var win = proto.clone();
        win.attr("class", element.attr("class"));
        
        win.cls(windowType);
        win.cls("window");
        win.rcs("prototype");
        win.title = element.attr("title");
        var title = win.find(".window_title");
        if (title != null){
          title.html(win.title);
        }
        win.moduleName = element.attr("module");
        
        if (!Check(win.moduleName)){
          win.module = element.findParent("module");
          if (Check(win.module)){
            win.moduleName = win.module.url;
          }
        }
        else{
          win.module = M.GetModuleByUrl(win.moduleName);
        }
        
        
        
        var id = element.attr("id");
        /*if (id != null){
           win.attr('id', id);
           element.removeAttribute("id");
        }
        else{
           win.attr("id", (win.module + "").replace(/\./g, "") + Win.Items.length);
        }*/
        win.id = "win" + Win.Items.length;
        //win.attr("id", );
        win.content = element;
        element.cls("window_content");
        element.rcs("window");
        var nc = element.findAll(".not-content");
        for (var i = 0; i < nc.length; i++){
          win.add(nc[i]);
        }
	win.add(element);
        W.Body.add(win);
        Win.Items.push(win);
        //new DragObject(window, true);
        
        win.header = win.get(".window_header");
                
        Contexts.Process(win, "System.Windows.htm");   
        
        if (win.attr("draggable") == true){
          Drag.MakeDraggable(win); 
        }
        
        if (win.header != null){
           win.header.click = Win.MakeTop;
           var toolbar = element.child(".header.toolbar");
          if (toolbar != null){
            win.header.add(toolbar.childs());
            toolbar.del();
          }
          if (element.has("no-close")){
            win.header.get(".menuitem.btn-close").hide();
          }
        }
        
        element.rcs("invisible");
        if (!win.has("invisible")){
	   win.show();        
        }
        
        win.init = element.attr("oninit");
        if (win.init != null){
          window.eval(win.init + "('" + win.id + "')");
        }
        L.LogInfo("Window: " + win.id + " : " + win.moduleName , "System.Windows.htm");
        Win.OnWindowCreated(win.module, win);
        return win;
      }
      catch(e)
      {
         L.LogError(e, "System.Windows.htm : CreateWindow", "System.Windows.htm");
      }    
    }
      
    Win.CreateNewWindow = function(windowType){
      try{
        if (!Check(windowType)){
          windowType = element.attr("type");
          if (!Check(windowType)){
          	windowType = "ui_standart_window"; 
          }
        }
        var proto = W.get(".window.prototype." + windowType);
        if (proto == null){
          alert("unknown window type: " + windowType);
          return;
        }
        var win = proto.clone();
        win.cls(windowType);
        win.cls("window");
        win.rcs("prototype");
        var title = win.find(".window_title");
        if (title != null){
          win.title = title.html;
        }
        win.id = "win" + Win.Items.length;
        win.content = win.adv("window_content");
        W.Body.add(win);
        Win.Items.push(win);
        //new DragObject(window, true);
        
        if (win.attr("draggable") == true){
          Drag.MakeDraggable(win); 
        }
        
        win.header = win.get(".window_header");
        if (win.header != null){
           win.header.click = Win.MakeTop;
        }
        element.cls("invisible");
        Win.OnWindowCreated(null, win);
        return win;
      }
      catch(e)
      {
         L.LogError(e, "System.Windows.htm : CreateNewWindow", "System.Windows.htm");
      }    
    }
      
    Win.ShowWindow = function(){
      Win.Manager.show();
    }
      
      Win.MakeTop = function(){
        var win = this.findParent(".window");
        var top = W.get(".window.top");
        if (top != null){
          top.rcs("top"); 
        }
        win.cls("top");
      }
      
      Win.Context = {};
      Win.Context.Condition = "System.Modules.js";
      Win.Context.Selector = "win:not(.prototype):not(.processed)";
      Win.Context.Process = function(element){
         var windowType = element.attr("type");
         var module = element.findParent("module");
         var win = Win.CreateWindow(element, windowType);
         if (!Check(win)){
            return;
         }
        if (module != null){
         win.module = module;
         win.attr("module", module.url);
        }
         element.cls("processed");
      }       
              
      Contexts.Add(Win.Context);  
        
      Win.SubbarContext = {};
      Win.SubbarContext.Condition = "System.Windows.htm";
      Win.SubbarContext.Selector = "win>.subbar";
      Win.SubbarContext.Process = function(element, context, win){
        if (win.header != null){
          win.header.add(element);
        }
      }       
              
      Contexts.Add(Win.SubbarContext);  

      Win.CloseWindow = function(elem){
	 var parent = elem.findParent(".window");
         Win.Manager.Remove(parent);
         parent.del();
      }
        
      Win.HideWindow = function(elem){
	 var parent = elem.findParent(".window");
        if (Check(parent.onclose)){
          parent.onclose();
        }
         parent.hide();
      }
        
      Win.MakeFullscreen = function(elem){
	 var parent = elem.findParent(".window");
         parent.toggle("fullscreen");
      }
      
    Win.Init();
      
    Win.Manager = W.get(".window_manager.window");
      
    Win.Manager.Init = function(){
       var items = W.findAll(".window:not(.prototype):not(.processed)");
       for(var i = 0; i < items.length; i++){
            var win = items[i];
            if (win != null){
              Win.Manager.AddWindow(win.attr("module"), win);
            }
       }
       Win.OnWindowCreated.add(Win.Manager.AddWindow);
    }
        
    Win.Manager.Activate = function(event){
       this.win.show();
    }
      
    Win.Manager.Remove = function(win){
       var id = win.attr("id");
       var item = Win.Manager.aget("winid", id);
        if (Check(item)){
         item.del();
        }
    }
        
    Win.Manager.AddWindow = function(module, win){
        var proto = W.get(".window_manager_item");
        var clone = proto.clone();
        if (win.title != null){
          clone.find(".title").html(win.title);
        }
        else{
          clone.find(".title").html(win.module);
        }
        clone.attr("winid", win.attr("id"));
        clone.win = win;
        clone.eadd("click", Win.Manager.Activate);
        Win.Manager.get(".windows").add(clone);
    }
      
              
      
        
      Win.Manager.Init();
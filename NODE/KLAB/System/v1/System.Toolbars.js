    Toolbar = M.GetModuleByUrl("System.Toolbars.htm");
    
    Toolbar.Init = function(){
      var toolbars = W.findAll(".toolbar"); 
      for (var i=0; i < toolbars.length; i++){
        Toolbar.InitToolbar(toolbars[i]);
      }
      Toolbar.SpienBar = W.Body.append(".spien-bar");
      //Toolbar.SpienBar.onmouseover = Toolbar.SpienBarHover;
      //Toolbar.SpienBar.onmouseout = Toolbar.SpienBarOut;
      L.LogInfo("Toolbars initialized!");
    }
      
    Toolbar.SpienBarHover = function(){
        this.cls("over");
    }
      
    Toolbar.SpienBarOut = function(){
        this.rcs("over");
    }
      
    Toolbar.InitToolbar = function(toolbar){
      var menus = toolbar.findAll(".menuitem");
      for (var i=0; i < menus.length; i++){
        Toolbar.InitItem(menus[i]);
      }
    }
      
    Toolbar.InitItem = function(item){
      var icon = item.attr("icon");
      if (icon != null){
      	item.style.backgroundImage = "url('" + icon +"')";
      }
    }
      
    Toolbar.Context = {};  
    Toolbar.Context.Selector = "div.toolbar";  
    Toolbar.Context.Condition = "System.Windows.htm";
    Toolbar.Context.Process = function(element){
  	Toolbar.InitToolbar(element);
    };

    Contexts.Add(Toolbar.Context);

    Toolbar.BtnContext = {};  
    Toolbar.BtnContext.Selector = "[icon]";  
    Toolbar.BtnContext.Condition = "System.Modules.js";
    Toolbar.BtnContext.Process = function(element){
  	Toolbar.InitItem(element);
    };

    Contexts.Add(Toolbar.BtnContext);    
      
    Toolbar.Init();
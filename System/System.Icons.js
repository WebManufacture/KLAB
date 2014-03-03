L.LogInfo("Icons loading...");

Icons = {};

Icons.IsOlmObject = true;

Icons.InitItem = function(item){
    var icon = item.attr("icon");
    if (icon != null){
	if (!icon.start("http://")){
	    icon = "Images/" + icon;
	}
      	item.style.backgroundImage = "url('" + icon + "')";
    }
};

Icons.Context = {};  
Icons.Context.Selector = "[icon]";  
Icons.Context.Condition = "System.Modules.js";
Icons.Context.Process = Icons.InitItem;

Contexts.Add(Icons.Context);    

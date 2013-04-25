 if (window.XComs == undefined || window.XComs== null || !window.XComs.IsOlmObject) {
    XComs = {IsOlmObject: true};

    XComs.MainContext = { Condition: "body" };
    XComs.MainContext.Selector = ".component[url]:not(.xcom-processed)";
    XComs.MainContext.Process = function(element){
	var url = element.url = element.attr("url");
	if (element.has("xcom-loading")) return;
	var module = M.GetModuleByUrl(url);
	if (Check(module)){ 
	    XComs.ProcessComponent(element, module);
	    element.cls("xcom-processed");
	}
	else
	{
	    XComs.ProcessedElement = element;
	    M.OnModuleRegistered.add(XComs.ModuleLoaded, url);
	    M.LoadModule(url, null, "system.components.js");
	    element.cls("xcom-loading");
	}
    }
	
    C.Add(XComs.MainContext);
     
    //XComs.WinContext = { Condition: "System.Windows.htm" };
    //XComs.WinContext.Selector = "win .component[url]:not(.xcom-processed)";
    //XComs.WinContext.Process = XComs.MainContext.Process;
     
    //C.Add(XComs.WinContext);
     
    XComs.ModuleLoaded = function(module){
	XComs.ProcessedElement.rcs("xcom-loading");
	XComs.ProcessComponent(XComs.ProcessedElement, module);
    }
     
    XComs.ProcessComponent = function(elem){
	var module = M.GetModuleByUrl(elem.attr("url"));
	var onc = elem.attr("oncreated");
	try{
	    module.Create(elem);
	    if (onc != null){
		try{
		    window.eval(onc);
		}
		catch (e){
		    throw e;
		}
	    }
	}
	catch (e){
	    L.LogError(e, "Component error in " + module.url, module);
	}	
	elem.cls("xcom-processed");
    }
    
    L.LogInfo("Components registered!");
}
else
{
  L.LogError("Reinitilizing XComs!");
}
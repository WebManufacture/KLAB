Favelets = {};

L.LogInfo("Favelets loaded");

Favelets.Init = function(){

}

Favelets.ReceiveMessage = function(event)  
	{  
		 //f (event.origin != "http://system.web-manufacture.net/Chrome.Extention") return;
		 L.LogInfo("Message received!");
		 var data = W.Wrap(event.data);
		 var text = data.html();
		 var type = data.attr("type");
		 if (type == "LoadModule"){
			M.LoadModule(text);
		 }
	         if (type == "Load"){
		     if (!text.start("http://")){
			text = X.ServerRoot + text;
		     }
		     window.location = text;
		 }
	}	

W.onload(Favelets.Init);
	    
window.addEventListener("message", Favelets.ReceiveMessage, false);
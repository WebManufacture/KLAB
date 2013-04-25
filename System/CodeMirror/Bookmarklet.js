if (window.MRT_IS_OSC_Bookmarklet == undefined)
{
  window.MRT_IS_OSC_Bookmarklet = {
    
    ServerAddress : "http://system.web-manufacture.net/",
    
    GetXMLHttpRequest :function()
    {
      var req = null;
      if (window.XMLHttpRequest) {
        try {
          req = new XMLHttpRequest();
        } catch (e){}
      } else if (window.ActiveXObject) {
        try {
          req = new ActiveXObject('Msxml2.XMLHTTP');
        } catch (e){
          try {
            req = new ActiveXObject('Microsoft.XMLHTTP');
          } catch (e){}
        }
      }
      
      return req;
    },
    
    
    MRT_IS_OSC_Bookmarklet_OnLoadComplete : function(req)
    {
      try { // Важно!
        // только при состоянии "complete"
        if (this.readyState == 4) {
          // для статуса "OK"
          if (this.status == 200) {
            var faveletDiv=document.getElementById("MRT-IS-OSC-faveletDiv");
            if (faveletDiv != null)
            {
              faveletDiv.parentNode.removeChild(faveletDiv);
            }
            faveletDiv = document.createElement("div");
            faveletDiv.setAttribute("id", "MRT-IS-OSC-faveletDiv");
            faveletDiv.innerHTML = this.responseText;
            var body = document.getElementsByTagName("body");
            if (body.length > 0)
            {
              body[0].appendChild(faveletDiv);
            }
            else
            {
              document.documentElement.appendChild(faveletDiv);
            }
          } else {
            alert("Не удалось получить данные: " + this.statusText + " \nСтатус: " + this.status);
          }
        }
      }
      catch( e ) {
        alert('Caught Exception: ' + e.message);
        //В связи с багом XMLHttpRequest в Firefox приходится отлавливать ошибку
        // Bugzilla Bug 238559 XMLHttpRequest needs a way to report networking errors
        // https://bugzilla.mozilla.org/show_bug.cgi?id=238559
      }
    },
    
    Init: function(){
      var req = this.GetXMLHttpRequest();
      req.open("GET", this.ServerAddress + "System.ContentHandler.ashx?file=Bookmarklet.htm&action=text", true);
      //req.setRequestHeader("Origin", "http://" + window.document.domain);
      req.onreadystatechange = this.MRT_IS_OSC_Bookmarklet_OnLoadComplete;
      req.send(null);
    }
  }
    
    window.MRT_IS_OSC_Bookmarklet.Init();
}
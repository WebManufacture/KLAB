if (window.Node && window.XMLSerializer) {
    Node.prototype.__defineGetter__('outerHTML', function() { return new XMLSerializer().serializeToString(this); });
}

L = J.L = J.Log = {
	Init : function()
	{
	  if (window.console != undefined)
	  {
	  
	  }
	},	
	
	ShowNotify : function(message) {
		$("#Notify-container .message").html(message);
		$("#Notify-container").fadeIn();
		LogInfo(message);
		window.setTimeout(HideNotifications, 3000);
	},

	ShowError : function(message) {
		alert(e.message + "\n" + e.line + "\n" + e.url);
	    /*
		$("#Error-container .message").html(message);
		$("#Error-container").fadeIn();
		LogError(message);
		window.setTimeout(HideNotifications, 3000);
		*/
	},

	HideNotifications : function() {
		$("#Notify-container").fadeOut();
		$("#Error-container").fadeOut();
	},

	

	LogInfo : function(info){
	  info = "<info class='info' type='info'>" + info + "</message>";
	  $$.ProcessMessage(info, "info");
	},
	  
  
	LogError : function(error, url, lineNumber, exception){
	  var message = $$.CreateMessage("error", 'error');
	  if (message != undefined && message != null){
		message.setAttribute("type",'error');
		message.setAttribute("url", url);
		message.setAttribute("line", lineNumber);
		message.innerHTML = error;
		message.exception = error;
		message.url = url;
		message.lineNumber = lineNumber;
		$$.ProcessMessage(message);
	  }
	  // Just let default handler run.
	  return false;
	},


	ShowLogWindow : function()
	{
	  $("#messages_queue").toggle();
	}
}



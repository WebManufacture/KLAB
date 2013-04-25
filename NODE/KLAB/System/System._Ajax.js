if (window.X == undefined) {
X = {
    ServerRoot: "http://system.web-manufacture.net/",
    Queue: [],

    Init: function(root) {
        if (root != undefined) {
            X.ServerRoot = root;
        }
        else {
            X.ServerRoot = X.GetRoot();
        }
		E.Create(this, "OnAjaxRequestComplete");
		E.Create(this, "OnAjaxRequestStart");
		E.Create(this, "OnAjaxError");
    },

    GetRoot: function() {
        return "http://" + window.location.host + "/";
    },

    AddQueue: function(name) {
        for (var i = 0; i < X.Queue.length; i++) {
            if (X.Queue[i] == null) {
                X.Queue[i] = name;
                return i;
            }
        }
        X.Queue.push(name);
        return X.Queue.length - 1;
    },

    CheckQueue: function(name) {
        for (var i = 0; i < X.Queue.length; i++) {
            if (X.Queue[i] != null && X.Queue[i] == name) {
                return i;
            }
        }
        return -1;
    },

    RemoveQueue: function(name) {
        var id = X.CheckQueue(name);
        if (id >= 0) {
            X.Queue[id] = null;
        }
    },

    GetServerRoot: function(file) {
        if (file != undefined) {
            return X.ServerRoot + file;
        }
        return X.ServerRoot;
    },

    GetFileRequest: function(filename, callback) {
        var req = new XMLHttpRequest();
        req.file = fileName;
        req.url = X.GetSimpleHandler(filename);
        req.open("GET", req.url, true);
        req.onerror = X.ShowAjaxError;
        req.start = X.StartRequest;
        if (callback != undefined)
            req.onload = callback;
        return req;
    },

    GetFile: function(filename, callback) {
        X.GetFileRequest(fileName, callback).start();
    },

    GetSimpleHandler: function(filename) {
        var path = X.GetServerRoot() + filename; //+ ;
        return path;
    },

    GetProxiedUrl: function(filename, action) {
        if (action == undefined || action == null) action = "get";
        var path = "System.ContentHandler.ashx?file=" + filename + "&action=" + action;
        return path;
    },

    GetImagesHandler: function(path, params) {
        var path = GetServerRoot() + "System.ImagesHandler.ashx?path=" + path;
        if (params.length != undefined) {
            path += "&" + params;
        }
        return path;
    },


    LoadModule: function(fileName, context) {
        if (X.CheckQueue(fileName) >= 0) {
            J.LogWarn("rejected: " + fileName);
            return;
        }
        var req = new XMLHttpRequest();
	    req.start = X.StartRequest;
        req.context = context;
        req.queueOrder = X.AddQueue(fileName);
        req.file = fileName;
        req.url = X.GetSimpleHandler(fileName);
        req.open("GET", req.url, true);
        req.onerror = X.ShowAjaxError;
        req.onload = X.moduleLoaded;
	X.OnAjaxRequestStart("module", req);
        req.send(null);
        return req;
    },
  
  moduleLoaded : function(){
     X.Queue[this.queueOrder] = null;
     /*if (this.context != undefined && this.context != null) {
         this.context.add(this.responseText);          
     }
     else{
         W.Body.add(this.responseText);
     }*/
     X.OnAjaxRequestComplete("module", this);
     if (this.callback != undefined){
	this.callback(this.responseText);
     }
  },
  

    GetHTML: function(fileName, context) {
        if (X.CheckQueue(fileName) >= 0) {
            J.LogWarn("rejected: " + fileName);
            return;
        }
        X.AddQueue(fileName);
        var req = new XMLHttpRequest();
		req.start = X.StartRequest;
        req.queueOrder = X.AddQueue(fileName);
        req.file = fileName;
        req.context = context;
        req.url = X.GetSimpleHandler(fileName);
        req.open("GET", req.url, true);
        req.onerror = X.ShowAjaxError;
        req.onload = X.AppendResult;
		X.OnAjaxRequestStart();
        req.send(null);
        return req;
    },
	
	StartRequest: function() {
		X.OnAjaxRequestStart(this.type, this);
		if (this.data != undefined){
			this.send(this.data);
		}
		else{
			this.send(null);
		}
	},

    GetRequest: function(fileName, callback, type) {
        var req = new XMLHttpRequest();
        req.file = fileName;
        req.url = X.GetSimpleHandler(fileName);
        req.open("GET", req.url, true);
		req.type = type;
        req.onerror = X.ShowAjaxError;
		req.start = X.StartRequest;
		req.callback = callback;
		req.onload = X.EndRequest;
        return req;
    },
	
	GetPostRequest: function(fileName, callback, type, data) {
        var req = new XMLHttpRequest();
        req.file = fileName;
        req.url = X.GetSimpleHandler(fileName);
        req.open("POST", req.url, true);
		req.type = type;
		req.data = data;
        req.onerror = X.ShowAjaxError;
		req.start = X.StartRequest;
		req.callback = callback;
		req.onload = X.EndRequest;
        return req;
    },
	
	Post: function(fileName, callback, type, data) {
        var req = X.GetPostRequest(fileName, callback, type, data);
        req.start();
        return req;
    },

    Get: function(fileName, callback) {
        var req = X.GetRequest(fileName, callback);
        req.start();
        return req;
    },
	
    EndRequest: function(req) {
	X.OnAjaxRequestComplete(this.type, this);
	if (this.callback != undefined){
	   this.callback(this.responseText);
	}
    },
	
    AppendResult: function() {
        X.Queue[this.queueOrder] = null;
        if (this.context != undefined && this.context != null) {
            this.context.add(this.responseText);
        }
      else{
         W.Body.add(this.responseText);
      }
      X.OnAjaxRequestComplete(this.type, this);
      if (this.callback != undefined){
	this.callback(this.responseText);
      }
    },


    Handle: function(action, callback) {
        var req = new XMLHttpRequest();
        req.action = action;
        req.open("GET", X.GetProxiedUrl("", action), true);
        req.onerror = X.ShowAjaxError;
        if (callback != undefined)
            req.onload = callback;
	X.OnAjaxRequestStart();
        req.send(null);
        return req;
    },

    ContentGet: function(fileName, callback) {
        var req = new XMLHttpRequest();
        req.file = fileName;
        req.open("GET", X.GetProxiedUrl(fileName, "text"), true);
        req.onerror = X.ShowAjaxError;
        if (callback != undefined)
            req.onload = callback;
	X.OnAjaxRequestStart();
        req.send(null);
        return req;
    },

    ContentSave: function(fileName, data, callback) {
        var req = new XMLHttpRequest();
        req.file = fileName;
        req.open("POST", X.GetProxiedUrl(fileName, "save"), true);
        req.onerror = X.ShowAjaxError;
        if (callback != undefined)
            req.onload = callback;
		X.OnAjaxRequestStart();
        req.send(data);
        return req;
    },

    ShowAjaxError: function(e) {
        var message = this.statusText + "<br/>" + this.file;
		if (X.OnAjaxError != undefined){
			X.OnAjaxError("Ajax", message);
		}
		if (Window.L != undefined){
			L.ShowError(message);
		}
	}
}

X.Init();

}
else
{
  L.LogError("Reinitilizing X (AJAX)!");
}

/*function COMETMessageReceived(event) {
var result = event.target.responseText;
if (result == "end") {
InitCOMETQuery();
return;
}
var parts = result.split(".");
var currentString = "";
for(var i = 0; i < parts.length; i++)
{
currentString +=  parts[i];
CallCOMETMessage(currentString);     
}
}
  
function CallCOMETMessage(message)
{
var action = $("messages #" + message);
if (action.length > 0) {
if (action[0].OnMessage != undefined && action[0].OnMessage != null) {
action[0].OnMessage(message);
}
var OnMessageHandler = action.attr("OnMessage");
if (OnMessageHandler.length > 0) {
window[OnMessageHandler](message);
}
if (action[0].tagName == "MESSAGE") {
action.remove();
}
} 
}
  
function COMETMessageComplete(req) {
if (this.readyState != 4) return;
}
      
function InitCOMETQuery() {
var req = new XMLHttpRequest();
req.multipart = true;
req.open("GET", "MessagesHandler.ashx?r=" + Math.random(), true);
req.onreadystatechange = COMETMessageComplete;
req.onload = COMETMessageReceived;
req.send(null);
}
  
  
function ContentMessageGet(name, source)
{
MessageQueue.Message({type: MessageQueue.MSG_TYPE_EVENT, source: source, body: "ContentLoad"});
var req = new XMLHttpRequest();
req.open("GET", GetProxiedUrl(name, "text"), true);
req.onload = SendServerMessage;
req.message = {type: MessageQueue.MSG_TYPE_EVENT, source: "server"}
req.send(null);
}
  
  
function SendServerMessage()
{
this.message.body = this.responseText;
MessageQueue.Message(this.message);
}
*/
  

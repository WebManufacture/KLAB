if (window.X == undefined || window.X == null || !window.X.IsOlmObject) {
    X = {
        SystemRoot: "system.web-manufacture.net",
        ServerRoot: "http://system.web-manufacture.net/",
        IsSystem: true,
        Queue: [],
        IsOlmObject: true,

        Init: function(root) {
            if (root != undefined) {
                X.ServerRoot = root;
            }
            if (X.SystemRoot != window.location.host) {
                X.CrossDomain = true;
                X.IsSystem = false;
            }
            E.Create(this, "OnAjaxRequestComplete");
            E.Create(this, "OnAjaxRequestStart");
            E.Create(this, "OnAjaxError");
            L.LogInfo("Ajax initialized!");
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
            var path = X.ServerRoot + "System.ContentHandler.ashx?file=" + filename + "&action=" + action;
            return path;
        },

        GetImagesHandler: function(path, params) {
            var path = GetServerRoot() + "System.ImagesHandler.ashx?path=" + path;
            if (params.length != undefined) {
                path += "&" + params;
            }
            return path;
        },


        LoadModule: function(fileName, context, cache) {
            if (X.CheckQueue(fileName) >= 0) {
                L.LogWarn("rejected: " + fileName);
                return;
            }
            var req = new XMLHttpRequest();
            req.start = X.StartRequest;
            req.context = context;
            req.queueOrder = X.AddQueue(fileName);
            req.file = fileName;
            req.url = X.GetSimpleHandler(fileName);
            req.onerror = X.ShowAjaxError;
            req.onload = X.moduleLoaded;
            X.OnAjaxRequestStart("module", req);

            if (X.CrossDomain) {
                var url = X.GetProxiedUrl(fileName);
            }
            else {
                var url = req.url;
            }
            if (cache) url += '?rnd=' + Math.random();
            req.open("GET", url, true);
            L.LogInfo("GET " + url, "system.ajax.js", "loadmodule");
            req.send(null);
            return req;
        },

        moduleLoaded: function() {
            X.Queue[this.queueOrder] = null;
            /*if (this.context != undefined && this.context != null) {
            this.context.add(this.responseText);          
            }
            else{
            W.Body.add(this.responseText);
            }*/
            X.OnAjaxRequestComplete("module", this);
            if (this.callback != undefined) {
                this.callback(this.responseText);
            }
        },


        GetHTML: function(fileName, context, callback) {
            var req = new XMLHttpRequest();
            req.start = X.StartRequest;
            req.queueOrder = X.AddQueue(fileName);
            req.file = fileName;
            req.context = context;
            req.url = X.GetSimpleHandler(fileName);
            req.open("GET", req.url, true);
            req.onerror = X.ShowAjaxError;
            req.callback = callback;
            req.onload = X.AppendResult;
            X.OnAjaxRequestStart();
            L.LogInfo("Content loading: " + fileName);
            L.LogInfo("GET " + req.url, "system.ajax.js", "get-html");
            req.send(null);
            return req;
        },

        GetProxiedHTML: function(fileName, context, callback) {
            var req = new XMLHttpRequest();
            req.start = X.StartRequest;
            req.queueOrder = X.AddQueue(fileName);
            req.file = fileName;
            req.context = context;
            req.url = X.GetProxiedUrl(fileName, "proxy");
            req.open("GET", req.url, true);
            req.onerror = X.ShowAjaxError;
            req.callback = callback;
            req.onload = X.AppendResult;
            X.OnAjaxRequestStart();
            L.LogInfo("GET " + req.url, "system.ajax.js", "GetProxiedHTML");
            req.send(null);
            return req;
        },

        GetProxied: function(fileName, callback) {
            var req = new XMLHttpRequest();
            req.start = X.StartRequest;
            req.queueOrder = X.AddQueue(fileName);
            req.file = fileName;
            req.url = X.GetProxiedUrl(fileName, "proxy");
            req.open("GET", req.url, true);
            req.onerror = X.ShowAjaxError;
            req.callback = callback;
            req.onload = X.EndRequest;
            X.OnAjaxRequestStart();
            L.LogInfo("GET " + req.url, "system.ajax.js", "GetProxied");
            req.send(null);
            return req;
        },

        StartRequest: function() {
            X.OnAjaxRequestStart(this.type, this);
            if (this.data != undefined) {
                L.LogInfo("POST " + this.url, "system.ajax.js", "StartRequest");
                this.send(this.data);
            }
            else {
                L.LogInfo("GET " + this.url, "system.ajax.js", "StartRequest");
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
            if (this.callback != undefined) {
                this.callback(this.responseText);
            }
        },

        AppendResult: function() {
            X.Queue[this.queueOrder] = null;
            if (this.context != undefined && this.context != null) {
                this.context.add(this.responseText);
            }
            else {
                W.Body.add(this.responseText);
            }
            X.OnAjaxRequestComplete(this.type, this);
            if (this.callback != undefined) {
                this.callback(this.responseText, this.context);
            }
        },


        Handle: function(action, callback) {
            var req = new XMLHttpRequest();
            req.action = action;
            req.url = X.GetProxiedUrl("", action);
            req.open("GET", req.url, true);
            req.onerror = X.ShowAjaxError;
            if (callback != undefined)
                req.onload = callback;
            X.OnAjaxRequestStart();
            L.LogInfo("GET " + req.url, "system.ajax.js", "Handle");
            req.send(null);
            return req;
        },


        Jasp: function(action, object, callback) {
            var req = new XMLHttpRequest();
            req.action = action;
            req.url = X.GetProxiedUrl("", action);
            req.open("GET", req.url, true);
            req.onerror = X.ShowAjaxError;
            if (callback != undefined)
                req.onload = callback;
            X.OnAjaxRequestStart();
            L.LogInfo("GET " + req.url, "system.ajax.js", "Jasp");
            req.send(null);
            return req;
        },

        GetText: function(fileName, callback) {
            var req = new XMLHttpRequest();
            req.file = fileName;
            req.url = X.GetProxiedUrl(fileName, "text");
            req.open("GET", req.url, true);
            req.onerror = X.ShowAjaxError;
            if (callback != undefined)
                req.onload = callback;
            X.OnAjaxRequestStart();
            L.LogInfo("GET " + req.url, "system.ajax.js", "GetText");
            req.send(null);
            return req;
        },

        ContentGet: function(fileName, action, callback) {
            var req = new XMLHttpRequest();
            req.file = fileName;
            req.url = X.GetProxiedUrl(fileName, action);
            req.open("GET", req.url, true);
            req.onerror = X.ShowAjaxError;
            if (callback != undefined)
                req.onload = callback;
            X.OnAjaxRequestStart();
            L.LogInfo("GET " + req.url, "system.ajax.js", "ContentGet");
            req.send(null);
            return req;
        },

        ContentSave: function(fileName, data, callback) {
            var req = new XMLHttpRequest();
            req.file = fileName;
            req.url = X.GetProxiedUrl(fileName, "save");
            req.open("POST", req.url, true);
            req.onerror = X.ShowAjaxError;
            if (callback != undefined)
                req.onload = callback;
            X.OnAjaxRequestStart();
            L.LogInfo("POST " + req.url, "system.ajax.js", "ContentGet");
            req.send(data);
            return req;
        },

        ShowAjaxError: function(e) {
            var message = "AJAX: " + this.status + ":" + this.statusText + ":" + this.url;
            if (X.OnAjaxError != undefined) {
                X.OnAjaxError("Ajax", message);
            }
            if (window.L != undefined) {
                L.LogError(message);
            }
        }
    }

    X.Init(window.DFCTech_WEB_ServerRoot);
}
else {
    L.LogError("Reinitilizing X (AJAX)!");
}


if (window.AX == undefined || window.AX == null || !window.AX.IsOlmObject) {
    AX = { IsOlmObject: true };

    AX.SystemRoot = "system.web-manufacture.net";
    AX.Root = "system.web-manufacture.net";
    AX.CrossDomain = false;
    AX.UserDomain = false;

    AX.Init = function(root, sysRoot) {
	//var hostSettings = AX.Get("system.settings.xml", );
	if (sysRoot != undefined) {
            AX.SystemRoot = sysRoot;
        }
	else{
	    if (Request.Params.SystemDomain) {
		AX.SystemRoot = Request.Params.SystemDomain;
	    }    
	}
	if (check(root)) {
            AX.Root = root;
        }
        else {
            if (Request.Params.UserDomain) {
                AX.Root = Request.Params.UserDomain;
                AX.UserDomain = true;
            } else {
                AX.Root = window.location.host;    
            }
        }
        if (AX.SystemRoot != window.location.host) {
            AX.CrossDomain = true;
	}
	
	if (Request.Params.SystemPath) {
	    AX.SystemPath = Request.Params.SystemPath;
        }
	else{
	    AX.SystemPath = "";
	}
        L.LogInfo("Ajax initialized!");
    };

    AX.Log = function(url, logtype, data) {
        if (data) {
            L.LogInfo("POST " + url, "sys.ax.js", logtype);
        }
        else {
            L.LogInfo("GET " + url, "sys.ax.js", logtype);
        }
    };

    AX.GetUrl = function(url) {
        if (!url.start("http://")) {
            url = "http://" + url;
        }
        if (!url.end("/")) {
            url += "/";
        }
        return url;
    };

    AX.GetFileUrl = function(fileName) {
        return AX.GetUrl(AX.Root) + fileName;
    };

    AX.GetSystemUrl = function(path) {
        if (!check(path)) {
            path = "";
        }
	if (AX.UserDomain){
	    return AX.GetUrl(AX.Root) + path;
	}
	else{
	    if (AX.CrossDomain){
		return AX.GetUrl(AX.SystemRoot) + path;   
	    }
	    else
	    {
		return path;   
	    }
	}
    };

    AX.GetHandlerPath = function(path) {
        if (!check(path)) {
            return AX.GetSystemUrl("System.Handler.ashx");
        }
        path = AX.GetSystemUrl("System.Handler.ashx?") + path;
        return path;
    };

    AX.GetActionPath = function(action, params) {
        var path = AX.GetHandlerPath("action=" + action);
	if (AX.SystemPath.length > 0) {
            path += "&path=" + AX.SystemPath;
        }
        if (check(params)) {
            path += "&" + params;
        }
        return path;
    };

    AX.GetFileActionPath = function(action, file) {
        return AX.GetActionPath(action, "file=" + file);
    };

    AX.StartRequest = function() {
        X.OnAjaxRequestStart(this.type, this);
        AX.Log(this.url, this.type, this.rqData);
        if (this.rqData != undefined) {
            this.send(this.rqData);
        }
        else {
            this.send(null);
        }
    };

    AX.AjaxError = function(e) {
        var message = "AJAX: " + this.status + ":" + this.statusText + ":" + this.url;
        if (X.OnAjaxError != undefined) {
            X.OnAjaxError("Ajax", message);
        }
        if (window.L != undefined) {
            L.LogError(message);
        }
    };

    AX.EndRequest = function(req) {
        X.OnAjaxRequestComplete(this.type, this);
        var result = true;
        if (check(this.callback)) {
            var context = this.responseText;
            if (check(this.context)) {
                context = W.div("", context);
            }
            var res = this.callback(context, this.context);
            if (res != undefined) {
                result = result && res;
            }
        }
        if (check(this.context) && result) {
            this.context.add(this.responseText);
        }
    };

    AX.Request = AX.request = function(url, callback, data) {
        if (data) {
            return AX.GetPostRequest(url, callback, data);
        }
        else {
            return AX.GetRequest(url, callback);
        }
    };

    AX.GetRequest = function(url, callback) {
        var req = new XMLHttpRequest();
        req.url = url;
        req.open("GET", req.url, true);
	//req.setRequestHeader("Access-Control-Allow-Methods", "POST, GET");
	//req.setRequestHeader("Access-Control-Allow-Origin", "*");
        req.onerror = AX.AjaxError;
        req.callback = callback;
        req.start = AX.StartRequest;
        req.onload = AX.EndRequest;
        return req;
    };

    AX.GetPostRequest = function(url, data, callback) {
        var req = new XMLHttpRequest();
        req.url = url;
        req.open("POST", req.url, true);
	//req.setRequestHeader("Access-Control-Request-Headers", "x-requested-with");
	req.setRequestHeader("Content-Type", "text/plain");
	//req.setRequestHeader("Access-Control-Allow-Origin", "*");
        req.rqData = data;
        req.onerror = AX.AjaxError;
        req.callback = callback;
        req.start = AX.StartRequest;
        req.onload = AX.EndRequest;
        return req;
    };

    AX.Get = AX.get = function(url, callback, params) {
        var req = AX.GetRequest(url, callback);
        if (check(params)) {
            for (var p in params) {
                req[p] = params[p];
            }
        }
        req.start();
        return req;
    };

    AX.Post = AX.post = function(url, data, callback, params) {
        var req = AX.GetPostRequest(url, data, callback);
        if (check(params)) {
            for (var p in params) {
                req[p] = params[p];
            }
        }
        req.start();
        return req;
    };

    AX.GetHTML = function(url, context, callback) {
        return AX.Get(url, callback, { context: context });
    };
    
    AX.PostHTML = function(url, data, context, callback) {
        return AX.Post(url, data, callback, { context: context });
    };

    AX.Command = function(action, params, callback) {
        if (typeof (params) == 'function') {
            callback = params;
            params = null;
        }
        var url = AX.GetActionPath(action, params);
        return AX.Get(url, callback);
    };

    AX.Action = function(action, file, callback) {
    return AX.Get(AX.GetFileActionPath(action, file), callback);
    };

    AX.Text = AX.ContentGet = function(file, callback) {
        return AX.Action("text", file, callback);
    };

    AX.File = AX.ContentGet = function(file, callback) {
        return AX.Action("get", file, callback);
    };

    AX.Proxied = function(url, callback) {
        return AX.Action("proxy", url, callback);
    };

    AX.ProxiedByUrl = function(url, callback) {
        return AX.Action("url", url, callback);
    };

    AX.LoadUrl = function(url, callback) {
        return AX.Action("urlload", url, callback);
    };

    AX.LoadModule = function(fileName, context, cache, callback) {
        var url = fileName;
        if (AX.CrossDomain) {
            url = AX.GetFileActionPath("get", url);
        }
        else {
            url = url;
        }
        if (cache) {
            if (url.indexOf('?') >= 0) {
                url += '&rnd=' + Math.random();
            }
            else {
                url += '?rnd=' + Math.random();
            }
        }
        return AX.Get(url, callback, { module: context, file: fileName, type: "module" });
    };

    AX.Save = AX.save = function(fileName, data, callback) {
        return AX.post(AX.GetFileActionPath("save", fileName), data, callback);
    };

    AX.Init();

    AJ = {};

    AJ.Handler = "system.jasp.ashx";

    AJ.CreateHandler = function(file) {
        var obj = {};
        obj.GetUrl = AJ.GetUrl;
        obj.Request = AJ.Request;
        obj.Get = AJ.Get;
        obj.Del = AJ.Del;
        obj.Set = AJ.Set;
        obj.Ins = AJ.Ins;
        obj.Add = AJ.Add;
        obj.Acs = AJ.Acs;
        obj.Rcs = AJ.Rcs;
        obj.File = file;
        return obj;
    };

    AJ.GetUrl = function(selector, file, rtype) {
        var url = AX.GetSystemUrl(AJ.Handler);
        if (!check(file)) {
            file = this.File;
        }
        if (check(file)) {
            url += "?file=" + escape(file);
        }
        if (check(selector)) {
            if (url.indexOf('?') >= 0) {
                url += "&selector=" + escape(selector);
            }
            else {
                url += "?selector=" + escape(selector);
            }
        }
        if (check(rtype)) {
            if (url.indexOf('?') >= 0) {
                url += "&type=" + escape(rtype);
            }
            else {
                url += "?type=" + escape(rtype);
            }
        }
        return url;
    };

    AJ.Request = function(url, callback, data) {
        var req = new XMLHttpRequest();
        req.url = url;
	    if (check(data)){
	        req.open("POST", url, true);
	    }
	    else{
	        req.open("GET", url, true);
	    }
	    req.onerror = AX.AjaxError;
        req.callback = callback;
        req.onload = AJ.DataReceived;
        if (data == undefined) data = null;
        AX.Log(url, "jasp", data);
        X.OnAjaxRequestStart("jasp", this);
        req.send(data);
        return req;
    };

    AJ.DataReceived = function(result) {
        X.OnAjaxRequestComplete("jasp", this);
        if (this.callback) {
            this.callback(this.responseText);
        }
        
    };

    AJ.Get = function(selector, callback, file) {
        var obj = AJ;
        if (this != AJ) {
            obj = this;
        }
        return obj.Request(obj.GetUrl(selector, file), callback);
    };

    AJ.Set = function(selector, data, callback, file) {
        var obj = AJ;
        if (this != AJ) {
            obj = this;
        }
        return obj.Request(obj.GetUrl(selector, file, "set"), callback, data);
    };

    AJ.Del = function(selector, callback, file) {
        var obj = AJ;
        if (this != AJ) {
            obj = this;
        }
        return obj.Request(obj.GetUrl(selector, file, "delete"), callback, "");
    };

    AJ.Add = function(selector, data, callback, file) {
        var obj = AJ;
        if (this != AJ) {
            obj = this;
        }
        return obj.Request(obj.GetUrl(selector, file, "append"), callback, data);
    };

    AJ.Ins = function(selector, data, callback, file) {
        var obj = AJ;
        if (this != AJ) {
            obj = this;
        }
        return obj.Request(obj.GetUrl(selector, file, "prepend"), callback, data);
    };

    AJ.Acs = function(selector, data, callback, file) {
        var obj = AJ;
        if (this != AJ) {
            obj = this;
        }
        return obj.Request(obj.GetUrl(selector, file, "addclass"), callback, data);
    };

    AJ.Rcs = function(selector, data, callback, file) {
        var obj = AJ;
        if (this != AJ) {
            obj = this;
        }
        return obj.Request(obj.GetUrl(selector, file, "delclass"), callback, data);
    };
}
else {
    L.LogError("Reinitilizing AX (AJAX)!");
}


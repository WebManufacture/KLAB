if (!UsingDOM("KLabNet")){
	KLabNet = {
		Tunnels : {}
	};
	
	Net = NET = _klabNetInternal = {
		GetTunnel : function(serverUrl){	
			return new KLabTunnel(serverUrl);	
		}	
	};
	
	function HttpChannel(url, read){
		this.url = url;
		if (read){
			this.connectRead();
		}
		EV.CreateEvent("onRead", this);
	};
	
	HttpChannel.prototype = {
		connectRead : function() {
			var url = new Url(this.url);
			url.addParam("rnd", Math.random());
			var rq = _klabNetInternal.GET(url);
			rq.lastStateChar = 0;
			rq.channel = this;
			rq.onreadystatechange = this.readStateChanged;
			rq.send();
		},
		
		write : function(messages){
			var url = new Url(this.url + url);
			url.addParam("rnd", Math.random());
			var rq = _klabNetInternal.POST(url, messages);
			rq.send(messages);
		},
		
		send : function(url, data){
			if (!url) url = "";
			if (!data) data = null;
			url = new Url(this.url + url);
			url.addParam("rnd", Math.random());
			var rq = _klabNetInternal.POST(url, data);
			rq.send(data);
		},
		
		readStateChanged: function() {
			var channel = this.channel;
			if (this.readyState == 3){
				var result = this.responseText.substr(this.lastStateChar);
				this.lastStateChar = this.responseText.length;				
				if (result && result.length > 0 && this.status == 200) {
					result = JSON.parse(result);
					channel.processMessages(result);
				}
			}
			if (this.readyState == 4){
				if (this.status == 200){
					setTimeout(function(){ channel.connectRead(); }, 500);	
				}
				else{
					setTimeout(function(){ channel.connectRead(); }, 5000);	
				}
			}
		},
		
		processMessages : function(messages){
			this.onRead.fire(messages);
		}
	};	
	
	
	
	function ServerTunnel(url, isFullDuplex){
		this.url = url;
		if (isFullDuplex){
			this.connect();
		}
	};
	
	ServerTunnel.prototype = {
		Init: function(){
			EV.CreateEvent("OnMessage", this);
		},
		
		connect : function() {
			var url = new Url(this.url);
			url.addParam("rnd", Math.random());
			var rq = _klabNetInternal.POST(url);
			rq.lastStateChar = 0;
			rq.tunnel = this;
			rq.onreadystatechange = this.stateChanged;
			rq.send();
		},
		
		stateChanged: function() {
			var tunnel = this.tunnel;
			if (this.readyState == 3){
				_klabNetInternal.Online = true;
				_klabNetInternal.OnConnectionState.fire(true);
				if (tunnel.onConnected){
					tunnel.onConnected();
				}
				var result = this.responseText.substr(this.lastStateChar);
				this.lastStateChar = this.responseText.length;
				
				if (result && result.length > 0 && this.status == 200) {
					result = JSON.parse(result);
					tunnel.processMessages(result);
				}
			}
			if (this.readyState == 4){
				if (this.status == 200){
					setTimeout(function(){ tunnel.connect(); }, 500);	
				}
				else{
					_klabNetInternal.Online = false;
					_klabNetInternal.OnConnectionState.fire(false);
					setTimeout(function(){ tunnel.connect(); }, 5000);	
				}
			}
		},
		
		processMessages : function(messages){
			if (messages.length){
				for (var i = 0; i < messages.length; i++){
					this.OnMessage.fire(messages[i]);
				}
			}
			else{
				this.OnMessage.fire(messages);
			}
		}
	};	
	
	
	function KLabTunnel(url, isPermanent){
		if (!url){
			this.TunnelUrl = null; //Url.Resolve(window.location.protocol + "//" + window.location.host);
			this.ServerUrl = "";
		}
		else{
			this.TunnelUrl = url;//new Url(serverUrl, true);
			this.ServerUrl = (new Url(url, true)) + "";
			//this.crossDomain = this.ServerUrl.hostname != window.location.hostname;	
		}
		if (isPermanent){
			this._createServerTunnel();
		}
	};
	
	
	KLabTunnel.prototype = {
		_endRequest : function(){		
			if (this.callback){
				if (typeof(this.callback) == "function"){
					this.callback(this.responseText, this.status);
					return;
				}
				if (this.callback.add){
					if (DOM){
						this.callback.add(DOM.Wrap(this.responseText));
					}
					else{
						this.callback.add(this.responseText);
					}
					return;
				}
				delete this.callback;
			}
		},
		
		_createServerTunnel : function(){		
			if (KLabNet.Tunnels[this.ServerUrl]){
				this.serverTunnel = KLabNet.Tunnels[this.ServerUrl];
			}
			else{
				this.serverTunnel = KLabNet.Tunnels[this.ServerUrl] = new ServerTunnel(this.ServerUrl, true);
			}
			this.serverTunnel.Init();
			EV.CreateEvent("OnConnected", this);
			var tunnel = this;
			this.serverTunnel.onConnected = function(){
				tunnel.OnConnected.fire();
			}
		},
		
		
		_errorRequest : function(){		
			if (this.callback){
				if (typeof(this.callback) == "function"){
					this.callback(this.responseText, this.status);
					return;
				}
			}
		},
		
		_getRequest : function(method, url, callback){
			var rq = new XMLHttpRequest();
			if (this.TunnelUrl && typeof(url) == "string"){			
				url = this.TunnelUrl + url;
				/*if (typeof url == "string"){
url = new Url(url);
}
url.rebase(this.TunnelUrl);
url = url.toString();*/
			}
			rq.open(method, url + "", true);
			rq.callback = callback;
			rq.onload = this._endRequest;
			rq.onerror = this._errorRequest;
			return rq;
		},
		
		_sendRequest : function(method, url, data, callback){
			if (typeof(url) == "function"){
				callback = url;
				url = "";
			}
			var rq = this._getRequest(method, url, callback);
			if (callback){
				rq.send(data);
			}
			return rq;
		},
		
		
		get : function(url, callback){
			return this._sendRequest("GET", url, null, callback);
		},
		
		all : function(url, callback){
			return this._sendRequest("SEARCH", url, null, callback);
		},
		
		add : function(url, text, callback){
			return this._sendRequest("POST", url, text, callback);
		},
		
		set : function(url, text, callback){
			return this._sendRequest("PUT", url, text, callback);
		},
		
		del : function(url, callback){
			return this._sendRequest("DELETE", url, null, callback);
		}	
	};
	
	KLabTunnel.prototype.Gdd = KLabTunnel.prototype.GET = KLabTunnel.prototype.get;
	KLabTunnel.prototype.Add = KLabTunnel.prototype.POST = KLabTunnel.prototype.add;
	KLabTunnel.prototype.All = KLabTunnel.prototype.browse = KLabTunnel.prototype.all;
	KLabTunnel.prototype.Set = KLabTunnel.prototype.set;
	KLabTunnel.prototype.Del = KLabTunnel.prototype.del;
	
	for (var item in KLabTunnel.prototype){
		Net[item] = KLabTunnel.prototype[item];	
	}
	
	Net.POST = Net.add;
	Net.GET = Net.get;
	Net.DELETE = Net.del;
	Net.PUT = Net.set;
	Net.SEARCH = Net.all;
	
	Net.Online = false;
	WS.DOMload(function(){
		EV.CreateEvent("OnConnectionState", Net);
	});
}

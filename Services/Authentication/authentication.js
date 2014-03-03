Auth = {};

function getXmlHttp(){
	var xmlhttp;
	try {
		xmlhttp = new ActiveXObject("Msxml2.XMLHTTP");
	} catch (e) {
		try {
			xmlhttp = new ActiveXObject("Microsoft.XMLHTTP");
		} catch (E) {
			xmlhttp = false;
		}
	}
	if (!xmlhttp && typeof XMLHttpRequest!='undefined') {
		xmlhttp = new XMLHttpRequest();
	}
	return xmlhttp;
};

Auth.InitAuth = function(){
	var mod = M.GetModuleEndsUrl("authentication.htm");
	AuthForm = mod.get("#AuthenticationForm");
	WS.Body.ins(AuthForm);
	//Auth.Form.Get("#LoginButton");
	var loginButton = AuthForm.loginButton = AuthForm.get("#LoginButton");
	loginButton.onclick = Auth.SignIn;
	
	var logoutButton = AuthForm.logoutButton = AuthForm.get("#LogoutButton");
	logoutButton.onclick = Auth.SignOut;
	
	AuthForm.loginField = AuthForm.get('#aUserLogin');
	AuthForm.passField = AuthForm.get('#aUserPass');
	AuthForm.userName = AuthForm.get('#UserName');
	
	var login = localStorage['user-login'];
	var pwd = localStorage['user-pass'];
	var sessionkey = localStorage['user-sessionkey'];
	
	if (login && sessionkey){
		Auth.SessionReqest(login, sessionkey);
		//alert(sessionkey);
		return;
	};
	if (login && pwd && login != '' && pwd != '') {
		//Auth.Login = login;
		var reqestHash = Auth.Hash(login, pwd);
		Auth.AuthReqest(login, reqestHash, pwd);
	};
};

Auth.SignIn = function(){
	var login =  AuthForm.loginField.value;
	var pass =  AuthForm.passField.value;
	if (!login || login == ''){
		AuthForm.loginField.add(".empty");
	}
	if (!pass || pass == ''){
		AuthForm.passField.add(".empty");
	}
	if (login && pass && login != '' && pass != '') {
		//Auth.Login = login;
		//Auth.Pass = pass;
		var reqestHash = Auth.Hash(login, pass);
		Auth.AuthReqest(login, reqestHash, pass);
	};
};

Auth.SignOut = function (){
	Auth.LogoutReqest(Auth.Login);
	Auth.Logout();
};

Auth.Logout = function (){
	localStorage.removeItem('user-login');
	localStorage.removeItem('user-pass');
	AuthForm.del('.authenticated');
	AuthForm.userName.set('Аноним (Войти)');
	AuthForm.passField.value = "";
	AuthForm.Login = null;
	clearInterval(Auth.sessionKeepTimeout);
	window.location = window.location;
};

Auth.Hash = function(login, pwd) {
	var date = new Date(new Date().toUTCString());
	date = date.getTime();
	date = Math.floor(date/60000) * 60000;
	return sha1(pwd + " " + date);	
};


Auth.LogoutReqest = function(login){
	var xmlhttp = getXmlHttp();
	xmlhttp.login = login;
	var url = Request.GetUrl('/Auth', {login: login, key : "logout"});
	xmlhttp.open('Get', url, true);
	xmlhttp.send(null);
};

Auth.KeepReqest = function(login, sessionkey){
	var xmlhttp = getXmlHttp();
	xmlhttp.login = login;
	xmlhttp.sessionkey = sessionkey;
	var url = Request.GetUrl('/Auth', {login: login, key : sessionkey});
	xmlhttp.open('Get', url, true);
	xmlhttp.onload = Auth.KeepSessionComplete;
	xmlhttp.onerror = Auth.AuthError;
	xmlhttp.send(null);
};

Auth.SessionReqest = function(login, sessionkey){
	var xmlhttp = getXmlHttp();
	xmlhttp.login = login;
	xmlhttp.sessionkey = sessionkey;
	var url = Request.GetUrl('/Auth', {login: login, key : sessionkey});
	xmlhttp.open('Get', url, true);
	xmlhttp.onload = Auth.AuthSessionComplete;
	xmlhttp.onerror = Auth.AuthError;
	xmlhttp.send(null);
};

Auth.AuthReqest = function(login, reqestHash, pass) {
	AuthForm.add(".loading");
	var xmlhttp = getXmlHttp();
	xmlhttp.login = login;
	xmlhttp.pwd = pass;
	var url = Request.GetUrl('/Auth', {login: login, hash : reqestHash});
	xmlhttp.open('Get', url, true);
	xmlhttp.onload = Auth.AuthComplete;
	xmlhttp.onerror = Auth.AuthError;
	xmlhttp.send(null);
};

Auth.AuthError = function(error){		
	AuthForm.del(".loading");
	Auth.Error(0);
};

Auth.Error = function(error){		
	localStorage.removeItem('user-login');
	localStorage.removeItem('user-pass');
	AuthForm.passField.value = "";
	//ERROR!401 Неверный пароль!
	//ERROR!403 Доступ запрещен!
	//ERROR!404 Пользователь не найден!
	AuthForm.userName.set('Ошибка #' + error);
	if (error == 401){
		AuthForm.userName.set('Неверный пароль');
	}
	if (error == 403){
		AuthForm.userName.set('Доступ запрещен');
	}
	if (error == 404){
		AuthForm.userName.set('Пользователь не найден');
	}
	AuthForm.del('.authenticated');	
	AuthForm.add('.error');		
};

Auth.KeepSessionComplete = function(result){
	if (this.status != 200) {		
		Auth.Logout();
		Auth.Error(this.status);
		return;
	};
	if (this.responseText.length > 0){
		Auth.Sessionkey = this.responseText;
		localStorage.setItem('user-sessionkey', Auth.Sessionkey);
		return;
	};
	Auth.Logout();
	Auth.Error(0);	
};

Auth.AuthSessionComplete = function(result){
	if (this.status != 200) {		
		Auth.Logout();
		Auth.Error(this.status);
		return;
	};
	if (this.responseText.length > 0){
		Auth.Sessionkey = this.responseText;
		localStorage.setItem('user-sessionkey', Auth.Sessionkey);
		if (!Auth.Authenticated){
			Auth.Login = this.login;
			localStorage.setItem('user-login', Auth.Login);
			AuthForm.add('.authenticated');
			AuthForm.userName.set('' + Auth.Login);
			AuthForm.del('.error');
			Auth.Authenticated = true;
			if (typeof window.onAuth == 'function'){
				window.onAuth(Auth.Login, Auth.Sessionkey);
			}
		}		
		Auth.sessionKeepTimeout = setInterval(function(){
			Auth.KeepReqest(Auth.Login, Auth.Sessionkey);
		}, 15000);
		return;
	};
	Auth.Logout();
	Auth.Error(0);	
};

Auth.AuthComplete = function(result){
	AuthForm.del(".loading");
	if (this.status != 200) {		    
		Auth.Error(this.status);
		return;
	};
	
	if (this.responseText.length > 0){
		Auth.Login = this.login;
		localStorage.setItem('user-login', Auth.Login);
		Auth.Sessionkey = this.responseText;
		localStorage.setItem('user-sessionkey', Auth.Sessionkey);
		window.location = window.location;
		return;
	};	
	Auth.Error(0);
};

Auth.InitAuth();
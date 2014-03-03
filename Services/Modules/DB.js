
WebDB = {};
		
WebDB.Init = function(){
	
	if ("webkitIndexedDB" in window){
		webDB.db = window.webkitIndexedDB;
	} else if ("mozIndexedDB" in window){
		webDB.db = window.mozIndexedDB;
	} else {
		alert('Браузер не поддерживает IndexDB');
		return null;
	};
	
	var idbRequest = webDB.db.open('dataBase');
		
	idbRequest.onsuccess = WebDB.Success;
	idbRequest.onerror=WebDB.Error;
};	

WebDB.Error = function(err){
	alert('Ошибка инициализации');
};
	
WebDB.Success = function(e){  
	webDB.db=e.target.result;
	if (webDB.db.version!=dbVersion){
	var setVersion=webDB.db.setVersion(dbVersion);
	setVersion.onsuccess=WebDB.CreateStore;
	};	
};
WebDB.CreateStore = function(){
	var visit = webDB.db.createObjectStore('visit');
	visit.createIndex('date','specialist', 'organisation','tipe', 'status');
};
		
WebDB.get = function(selector, callback){
	
};	
	

WS.DOMload(WebDB.Init);


/*
WebDb = {
     get (selector, callback);
     add (value, callback);
     set (selector, value, callback)
     del (selector, callback);
}


*/
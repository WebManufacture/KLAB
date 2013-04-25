WebDb = WebDB = {
	DB : [],
	
	init : function(){
		var names = ["abrams", "John", "Vasya", "Petya", "Ira", "Kolya", "Sema", "Suxx", "James", "Alex"];
		for (var i = 0; i < 100; i++){
			var rec = { name : names[Math.round(Math.random(10))]};
			rec.title = rec.name + " " + i;
			rec._id = "spec" + i;
			rec.class = "specialist";
			rec.orgId = "org" + Math.round(Math.random(10));
			WebDb.DB[i] = rec;
		}
	},
	
	_getData : function(){
		for (var i = 0; i <= 100000; i++){
			var body = DOM("body");	
		}
		return WebDb.DB;
	},
	
	get: function (selector, callback){		
		window.setTimeout(function(){
			callback(WebDb.DB);
		}, 1000);
	},
	
	add: function (value, callback){
	 	return '2';
	},
	set: function (selector, value, callback){
	 	return '3';
	},
	del: function (selector, callback){
	 	return '4';
	},
};

WebDb.init();
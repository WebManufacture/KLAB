var log = require("./log.js").info;
log.error = require("./log.js").error;
log.info = log;
require('./Mongo.js');
var http = require('http');


try{
	
	var server = require("./DBServer.js");
	
	function InitDB(){
		replicaSet([{host: "127.0.0.1", port : 20000}], "UniMedica3", function(error, database){
			err = error;
			db = database;
			server = new server(db, "specialists");
			server.SEARCH = Tabs.SearchSort; //Подменяем метод SEARSH
			Tabs.Start();
		});
	};

	InitDB();
	
	Tabs = {};
	
	Tabs.Start = function(){
		Tabs.Count();
		Tabs.GetRecords();
	};
	
	Tabs.Count = function(){
		db.collection('specialists').count(function(err, count){
			Tabs.RecordsQuantity = count; //Количество записей в базе
			Tabs.GetTabLength(count);
		});
	};
	
	Tabs.GetTabLength = function(count){
		Tabs.TabsQantity = 10; //Количество табов
		Tabs.TabLength = Math.ceil(count / Tabs.TabsQantity); // Количество записей в табе
	};
	
	Tabs.TabsRanges = []; //Массив с именами табов;
	
	Tabs.GetRecords = function(){
		var ftc; //Первое имя таба
		var ltc; //Второе имя таба
		db.collection('specialists').find().sort({name: 1}).toArray(function(err, res){
			for (var i = 0; i < Tabs.RecordsQuantity; i++){
				var IndexByNameNo = i + ''; //Номер записи по алфавиту имен
				var IndexByNameTabNo = Math.floor(i / Tabs.TabLength); //Номер таба
				db.collection('specialists').update({_id: res[i]['_id']}, {$set: {IndexByName: '' + IndexByNameNo, IndexByNameTab: '' + IndexByNameTabNo, path: '/' + IndexByNameTabNo}});
				
				if ((i + Tabs.TabLength) % Tabs.TabLength == 0){ //Проверяется не являеться ли запись первой записью таба
					ftc = res[i].name.substr(0, 2);
				}else if ((i + 1) % Tabs.TabLength == 0){ //Проверяется не являеться ли запись последней записью таба
					ltc = res[i].name.substr(0, 2);
					Tabs.TabsRanges.push(ftc + '-' + ltc); //Добавляеться в массив
					ftc = null; //Первое и сторое имя таба соеденились
				};
			};
			if (ftc){ // Если первое имя таба, в конце массива не получила второе
				ltc = res[Tabs.RecordsQuantity - 1].name.substr(0, 2);
				Tabs.TabsRanges.push(ltc + '-' + ltc);
			};
			log(Tabs.TabsRanges);
			Tabs.GiveTabsRanges();
		});
	};
	
	Tabs.SearchSort = function(url, req, res, server){ 
		var callback = function(err, result){
			if (err){
				res.finish(500, " " + url.pathname + " error " + err);
				return;
			}
			if (result){
				result = server.ProcessResult(result);
			}
			else{
				result = JSON.stringify("[]");
			}		
			res.setHeader("Content-Type", "application/json; charset=utf-8");
			res.finish(200, result);
		}
		if (url.hasParams){
			db.collection('specialists').find(url.searchObj).sort({name: 1}).toArray(callback);
		}
		else{
			db.collection('specialists').find().sort({name: 1}).toArray(callback);
		}
	};
	

	http.createServer(function(request, response){
		server.ProcessRequest(request, response);
	}).listen(14211);
	
	Tabs.GiveTabsRanges = function(){
		
		var onRequest = function onRequest(request, response) {
			log("Request received.");
			
			response.setHeader("Access-Control-Allow-Origin", "*");
			response.setHeader("Access-Control-Allow-Methods", "POST,GET, HEAD,OPTIONS");
			response.setHeader("Access-Control-Request-Header", "X-Prototype-Version, x-requested-with");
			response.writeHead(200, {"Content-Type": "text/plain"});
			response.write(JSON.stringify(Tabs.TabsRanges));
			response.end();
			
		};
		http.createServer(onRequest).listen(14212);
		
	};

} catch(err){
	log.error(err);
	process.exit();
}
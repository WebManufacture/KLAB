Tabs = {};

//Tabs.Init = function(){
//	Tabs.ContentServer = new NodeTunnel('http://unimedica3.web-manufacture.net');
//	Tabs.ContentServer.get('/', function(rt, er){
//		Tabs.CreateTab(JSON.parse(rt));
//	});	
//};

//Формеруем табы из массива Tabs.TabsName
Tabs.CreateTab = function(TabsNames){
	var proto = DOM(".tab-container.prototype");
	var tabDiv = DOM.get("#tabs-panel");
	var oldTabs = tabDiv.all('.created');
	oldTabs.del();
	for (var i = 0; i<TabsNames.length; i++){
		var tabProto = proto.clone();
		tabProto.add('.created');
		tabProto.set('@tab-no', i + '');
		//var tn = TabsNames[i];
		//tn = tn.split('-');
		//tabProto.innerHTML = "<div class='tab-val first'>"+ tn[0] + "</div><div class='tab-val last'>"+ tn[1] + "</div>";
		var nameTab = tabProto.get('.name-tab');
		nameTab.set(null, TabsNames[i].ftc + '-' + TabsNames[i].ltc);
		tabDiv.add(tabProto);
	};	
};

//По клику выводим содержимое нужного таба
Tabs.ContentDisplay = function(displayidTab){
	var tabNo = displayidTab.get('@tab-no');
	Tabs.makeTabSelected(displayidTab); //Здесь таб делаеться выделеным, а содержимое других табов удаляется
	//Tabs.specLightbox();
	//var ContentQueryString = Request.GetUrl('http://web-manufacture.net:14211', {IndexByNameTab: '' + tabNo});
	//здесь
	SpecsCash.Select(tabNo);
};


//WS.DOMload(Tabs.Init);



function fix(){
	var lPan = DOM.get("#specialists");
	var pin = DOM.get("#pinButton");
	if (lPan.is('.panel-pin')){
		pin.del('.pined');
		lPan.del('.panel-pin'); 
	} else {
		pin.add('.pined');
		lPan.add('.panel-pin');
	};
};

Tabs.makeTabSelected = function(displayidTab){
	var allTabs = DOM.all('.tab-container');
	allTabs.del('.selected');
	displayidTab.add('.selected');
};  

Tabs.showSelectedSpecs = function(tab){
	var spcDiv = DOM.get("#specialists");
	var proto = DOM(".specialist.prototype");
	spcDiv.all(".specialist").del();
	for (var i = 0; i < tab.length; i++){
		var spec_proto = proto.clone();
		spec_proto.FullName = tab[i].name;
		spec_proto.Tel = tab[i].Tel;
		spec_proto.Mail = tab[i].Mail;
		spec_proto.id = 'id' + tab[i]._id;
		spcDiv.add(spec_proto);				
	};	
	Tabs.specLightbox();
};

Tabs.specLightbox = function(){
	var divLB= DOM.get('.lightbox')	
		if (divLB.is('.show')) divLB.del('.show');
	else divLB.add('.show');
};


Tabs.showInfo = function(sh){
	var spcDiv = sh.get("^.specialist");
	if (spcDiv.is('.small-plate')){
		sh.del('.hide');
		spcDiv.del('.small-plate');
		
	} else {
		sh.add('.hide');
		spcDiv.add('.small-plate');
		
	}
};

Tabs.CreateNewSpecPrototype = function(){
	var proto = DOM.get(".newSpec.prototype");
	var nsproto=proto.clone();	
	var srcDiv = nsproto.get('.speciality');
	proto = DOM(".speciality-item.prototype");
	var sSpec=FullSpecialities;
	for (var i=0; i < sSpec.length; i++){
		var sSpec_proto = proto.clone();					
		//sSpec_proto.all(".speciality.addInfo .selectSpeciality").set(null, sSpec[i]);
		//srcDiv.add(sSpec_proto);
		sSpec_proto.set(null, sSpec[i]);
		srcDiv.add(sSpec_proto);
		
	}
	return nsproto;
};


Tabs.CreateNewSpec = function(){
	var proto = DOM(".specialist.prototype").clone();//прототип специалиста для клонирования
	proto.add(".new");
	Tabs.ShowEditForm(proto).add('.new');
};

Tabs.EditSpecsProto = function(s){
	Tabs.ShowEditForm(s.get('^.specialist')).add(".edit");
};

Tabs.ShowEditForm = function(editSpec){
	editSpec.hide();
	var editProto = Tabs.CreateNewSpecPrototype();
	var container = DOM.get('#specialists');
	editProto.EditedSpecialist = editSpec;
	editProto.FullName = editSpec.FullName;	
	editProto.Tel = editSpec.Tel;
	editProto.Mail = editSpec.Mail;
	if (editSpec.is(".new")){
		container.ins(editProto);	
	}
	else{
		container.insertBefore(editProto, editSpec); //выводит форму для редактирования на месте специалиста
	}
	return editProto;
};


Tabs.saveSpec = function(s){
	var editProto = s.get('^.newSpec');
	editProto.EditedSpecialist.FullName = editProto.FullName;
	editProto.EditedSpecialist.Tel = editProto.Tel;
	editProto.EditedSpecialist.Mail = editProto.Mail;
	editProto.EditedSpecialist.attr("name", editProto.FullName);
	editProto.EditedSpecialist.show();
	editProto.EditedSpecialist.Save();
	if (editProto.is('.new')){
		DOM.get("#specialists").ins(editProto.EditedSpecialist);
	}	
	editProto.del();
	
};

Tabs.CancelChanges = function(s){
	var editProto = s.get('^.newSpec');
	if (editProto.is('.new')){
		editProto.del();
	}
	else {
		editProto.EditedSpecialist.show();
		editProto.del();
	}
};

Tabs.DeleteSpecialist = function(s){
	var spec2kill = s.get('^.specialist');
	if (!spec2kill.is('.spec2bkilled'))
		{spec2kill.add('.spec2bkilled');}
	else if(confirm('Вы отвечаете за последствия принятых вами решений в здравом уме и умном здравии ?')){
		spec2kill.del();
		spec2kill.Kill();
		//SpecsCash.KillSpec(spec2kill);
	}
	else{
		spec2kill.del('.spec2bkilled');
	}
	
};


Tabs.Init = function(){
	var sp = DOM("#SpecProto");
	sp.onclone = function(clone){
		clone.AttrInnerProperty("FullName", ".full-name.field");
		clone.AttrInnerProperty("Tel", ".telephone.field");
		clone.AttrInnerProperty("Mail", ".e-mail.field");
		clone.Save = SpecsCash.SaveChanges;
		clone.Kill = SpecsCash.KillSpec;
	};
	
	var sep = DOM("#EditSpecForm");
	sep.onclone = function(clone){
		//InputWDT.Init(clone);
		clone.AttrValueProperty("FullName", ".input.full-name");	
		clone.AttrValueProperty("Tel", ".input.telephone");
		clone.AttrValueProperty("Mail", ".input.e-mail");	
	};
	SpecsCash.Init();
}

	
	
WS.DOMload(Tabs.Init);


InputWDT = {
	Init : function(initElem){
		var vse = initElem.all("input[default-text]").each(function(elem){
			InputWDT.InitInput(elem);
		});
	},
	
	InitInput : function(elem){
		elem.onfocus = InputWDT.InputFocused;
		elem.onblur = InputWDT.InputBlur;
		elem.update = InputWDT.CheckChanges;
		if(!elem.value || elem.value == elem.get('@default-text')){
			elem.add('.empty');
			elem.value = elem.get('@default-text');
		}
	},
	
	CheckChanges : function(){
		if(this.value && this.value != ""){
			this.del('.empty');
		}
		else{
			this.add('.empty');
			this.value = this.get('@default-text');
		}
	},
	
	InputFocused : function(){
		if(this.is('.empty')){
			this.del('.empty');
			this.value='';
		}
	},
	
	InputBlur : function(){
		if(!this.value || this.value == ""){
			this.add('.empty');
			this.value=this.get('@default-text');
		}
	},
	
	
}
/*	
	TestSpecsDB = {};
/*
TestSpecsDB.DB = [ //c, f, h, k, m
{name: 'a'},
{name: 'b'},
{name: 'd'},
{name: 'e'},
{name: 'g'},
{name: 'i'},
{name: 'j'},
{name: 'l'}
];




TestSpecsDB.UN = [
	{name: 'c'},
	{name: 'f'},
	{name: 'h'},
	{name: 'k'},
	{name: 'm'}
];

TestSpecsDB.IB = {};

//localStorage.removeItem('spec');

TestSpecsDB.Init = function(){
	
	var sp = DOM("#SpecProto");
	sp.onclone = function(clone){
		clone.AttrInnerProperty("FullName", ".full-name");
		clone.AttrInnerProperty("Tel", ".additional-info .spec-field .telephone");
		clone.AttrInnerProperty("Mail", ".additional-info .spec-field .e-mail");
		clone.Save = TestSpecsDB.SaveChanges;
	};
	
	var sep = DOM("#EditSpecForm");
	sep.onclone = function(clone){
		InputWDT.Init(clone);
		clone.ValueProperty("FullName", ".input.Name");	
		clone.ValueProperty("Tel", ".input.Tel");
		clone.ValueProperty("Mail", ".input.Mail");	
	};
	
	
	//TestSpecsDB.TabRanger();
	TestSpecsDB.Server = new NodeTunnel('http://web-manufacture.net:12222');
	
	if (localStorage['spec'] && localStorage['spec'].length > 10){
		TestSpecsDB.DB = JSON.parse(localStorage['spec']);
		//TestSpecsDB.TabRanger();
		var sorted = TestSpecsDB.Sorter(TestSpecsDB.DB); // предворительная сортировка
		TestSpecsDB.TabRanger(sorted); // предварительное табирование
		Tabs.CreateTab(TestSpecsDB.TabsRanges)// предварительное отображение табов
			
	}else{
		TestSpecsDB.Server.all('http://web-manufacture.net:12222', function(rt, er){
			localStorage.setItem('spec', rt);
			TestSpecsDB.DB = JSON.parse(rt);
			//TestSpecsDB.TabRanger();
			var sorted = TestSpecsDB.Sorter(TestSpecsDB.DB); // предворительная сортировка
			TestSpecsDB.TabRanger(sorted); // предварительное табирование
			Tabs.CreateTab(TestSpecsDB.TabsRanges)// предварительное отображение табов
				
		});
	};
};

TestSpecsDB.Select = function(tabNo){
	// выбор таба
	//Tabs.CreateTab(TestSpecsDB.TabsRanges);// отображение табов
	Tabs.showSelectedSpecs(TestSpecsDB.IB[tabNo]); // отобразить специалистов
	Tabs.specLightbox();
	
	var selectedTab = TestSpecsDB.TabsRanges[tabNo]
		
		if (!TestSpecsDB.TabsRanges[(parseInt(tabNo) + 1) + '']){
			
			var tabRequestUrl = Request.GetUrl('http://web-manufacture.net:12222/sync/', {ftc: selectedTab['ftc'], ltc: 'ђ'});// формирование запроса
			
		}else if (!TestSpecsDB.TabsRanges[(parseInt(tabNo) - 1) + '']){	
			
			var tabRequestUrl = Request.GetUrl('http://web-manufacture.net:12222/sync/', {ftc: '!', ltc: selectedTab['ltc']});
			
		}else{
			var tabRequestUrl = Request.GetUrl('http://web-manufacture.net:12222/sync/', selectedTab);// формирование запроса
		};
	
	
	TestSpecsDB.Server.all(tabRequestUrl, function(rt, er){ // получение несохраненных спецов
		if (rt){
			rt = JSON.parse(rt);
			for (var i = 0; i < rt.length; i++){
				TestSpecsDB.DB.push(rt[i]); // добавляем новых спецов
				var dellReceivedSpecUrl = Request.GetUrl('http://web-manufacture.net:12222/sync/', {_id: rt[i]['_id']})
					TestSpecsDB.Server.del(dellReceivedSpecUrl);
			};
			
			var sorted = TestSpecsDB.Sorter(TestSpecsDB.DB); // сортировка
			localStorage.setItem('spec', JSON.stringify(TestSpecsDB.DB));
			TestSpecsDB.TabRanger(sorted); // табирование
			Tabs.CreateTab(TestSpecsDB.TabsRanges);// отображение табов
			
			var allTabs = DOM.all('.tab-container.created'); //подсветить таб
			var activeTab = allTabs[tabNo];
			activeTab.add('.selected');	
		};
		
		Tabs.showSelectedSpecs(TestSpecsDB.IB[tabNo]); // отобразить специалистов
		for (var j = 0; j < rt.length; j++){
			var newSpecID = 'id' + rt[j]._id;
			var newSpecDiv = DOM.get('#' + newSpecID);
			newSpecDiv.add('.new-sync-spec');
		};
		Tabs.specLightbox();
	});
	
};


TestSpecsDB.TabsRanges = []; //Массив с именами табов;

TestSpecsDB.TabRanger = function(){
	TestSpecsDB.TabsRanges = [];
	var sortedSp = TestSpecsDB.Sorter(TestSpecsDB.DB);// сортированный массив юзверей
	TestSpecsDB.TabLength = 10;
	var ftc; //Первое имя таба
	var ltc; //Второе имя таба
	var a = []; //ЭТУ ХРЕНЬ УДАЛИТЬ ПРИ ПЕРВОЙ ЛОКАЛЬНОЙ БД
	
	for (var i = 0; i < sortedSp.length; i++){
		
		var IndexByNameNo = i + ''; //Номер записи по алфавиту имен
		var IndexByNameTabNo = Math.floor(i / TestSpecsDB.TabLength); //Номер таба
		//TestSpecsDB.IB.IndexByNameTabNo;
		a.push(sortedSp[i]); //ЭТУ ХРЕНЬ УДАЛИТЬ ПРИ ПЕРВОЙ ЛОКАЛЬНОЙ БД
		//db.collection('specialists').update({_id: res[i]['_id']}, {$set: {IndexByName: '' + IndexByNameNo, IndexByNameTab: '' + IndexByNameTabNo, path: '/' + IndexByNameTabNo}});
		
		if ((i + TestSpecsDB.TabLength) % TestSpecsDB.TabLength == 0){ //Проверяется не являеться ли запись первой записью таба
			ftc = sortedSp[i].name.substr(0, 1);
		}else if ((i + 1) % TestSpecsDB.TabLength == 0){ //Проверяется не являеться ли запись последней записью таба
			ltc = sortedSp[i].name.substr(0, 1);
			TestSpecsDB.IB['' + IndexByNameTabNo] = a; //ЭТУ ХРЕНЬ УДАЛИТЬ ПРИ ПЕРВОЙ ЛОКАЛЬНОЙ БД
			a = [];                                    //ЭТУ ХРЕНЬ УДАЛИТЬ ПРИ ПЕРВОЙ ЛОКАЛЬНОЙ БД
			TestSpecsDB.TabsRanges.push({ftc: ftc, ltc: ltc}); //Добавляеться в массив
			ftc = null; //Первое и сторое имя таба соеденились
		};
	};
	
	if (ftc){ // Если первое имя таба, в конце массива не получила второе
		ltc = sortedSp[sortedSp.length - 1].name.substr(0, 1);
		TestSpecsDB.IB['' + IndexByNameTabNo] = a; //ЭТУ ХРЕНЬ УДАЛИТЬ ПРИ ПЕРВОЙ ЛОКАЛЬНОЙ БД
		a = [];                                    //ЭТУ ХРЕНЬ УДАЛИТЬ ПРИ ПЕРВОЙ ЛОКАЛЬНОЙ БД
		TestSpecsDB.TabsRanges.push({ftc: ftc, ltc: ltc});
		
	};
	return;
};

TestSpecsDB.Sorter = function(toSort){
	var sorted = toSort.sort(function(a, b){
		return a.name > b.name ? 1 : -1;
	});
	return sorted;
	
};


TestSpecsDB.SaveChanges = function(saveObj){ //saveObj = {name: '', id: ''}
	var lsSpec = JSON.parse(localStorage['spec']);
	if (localStorage['chsp']){
		var chSp = JSON.parse(localStorage['chsp']);
	}else{
		var chSp = [];
	};
	
	if (!saveObj.id){
		saveObj.id = TestSpecsDB.NewID();
		chSp.push(saveObj);
		lsSpec.push(saveObj);
	}else{
		lsSpec = TestSpecsDB.SearchAndChangeByID(saveObj, lsSpec);
		chSp = TestSpecsDB.SearchAndChangeByID(saveObj, chSp);
	};
	localStorage.setItem('spec', JSON.stringyfy(lsSpec));
	localStorage.setItem('chsp', JSON.stringyfy(chSp));
	
};


TestSpecsDB.SearchAndChangeByID = function (spec, base){ //Ищит объект с таким же ID, если не находит, то создает новый
	for (var i = 0; i < base.length; i++){
		if (base[i].id == spec.id){
			base[i] = spec;
			return base;
		};
	};
	base.push(spec);
	return base;
};

TestSpecsDB.NewID = function(){
	if (localStorage['newid']){
		return ('newID' + (parseInt(localStorage['newid']) + 1));
	};
	localStorage.setItem('newid', 1000);
	return 'newID1000';
};

TestSpecsDB.SyncChanges = function(){
	if (localStorage['chsp']){
		var chSp = JSON.parse(localStorage['chsp']);
		//var newChSp = [];
		
		while (chSp.length > 0){
			var spec = chSp.pop();
			if (spec['id'][0] = 'i'){
				var idDB = spec['id'];
				delete spec['id'];
				var newSpecData = JSON.stringify(spec);
				var newSpecUrl = Request.GetUrl('http://web-manufacture.net:12222/spec/', idDB);
				TestSpecsDB.Server.set(newSpecUrl, newSpecData, TestSpecsDB._setSpecFunction(idDB));
			}else{
				var idToUpdate = spec['id'];
				delete spec['id'];
				var newSpecData = JSON.stringify(spec);
				TestSpecsDB.Server.add('http://web-manufacture.net:12222/spec/', newSpecData, TestSpecsDB._addSpecFunction(idToUpdate));	
			};
		};		
	}
	else{
		console.log('not required');
	}
};

TestSpecsDB._addSpecFunction = function(idToUpdate){
	return function(err, res){
		if (res){
			TestSpecsDB.UpdateID(idToUpdate, res);
			TestSpecsDB.RemoveFromShanged(idToUpdate);
		};
		if (err){
			console.log(err);
		};
	};
};

TestSpecsDB._setSpecFunction = function(idDB){
	return function(err, res){
		if (res){
			TestSpecsDB.RemoveFromShanged(idDB);
		};
		if (err){
			console.log(err);
		};
	};
};

TestSpecsDB.UpdateID = function(idToUpdate, resivedID){
	var lsSpec = JSON.parse(localStorage['spec']);
	for (var i = 0; i < lsSpec.length; i++){
		if (lsSpec[i].id == idToUpdate){
			lsSpec[i].id = resivedID;
			break;
		};
	};
	localStorage.setItem('spec', JSON.stringyfy(lsSpec));
};

TestSpecsDB.RemoveFromShanged = function(idOfRemoval){
	var chSp = JSON.parse(localStorage['chsp']);
	for (var i = 0; i < lsSpec.length; i++){
		if (chSp[i].id == idOfRemoval){
			delete chSp[i];
			break;
		};
	};
	localStorage.setItem('chsp', JSON.stringyfy(chSp));
};



TestSpecsDB.AddSpec = function(){
	for (var i = 0; i < TestSpecsDB.UN.length; i++){
		var spec = JSON.stringify(TestSpecsDB.UN[i]);
		TestSpecsDB.Server.add('http://web-manufacture.net:12222/sync/', spec, 'text/plain',  function(){
			//alert('user Was Created');
		});
	};
};

WS.DOMload(TestSpecsDB.Init);

*/
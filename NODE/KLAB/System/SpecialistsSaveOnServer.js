TestSpecsDB.SyncChanges = function(){
	if (localStorage['chsp']){
		var chSp = JSON.parse(localStorage['chsp']);
		var newChSp = [];
		
		while (chSp.length > 0){
			var spec = chSp.pop();
			if (spec['id'][0] = 'i'){
				var idDB = spec['id'];
				delete spec['id'];
				var newSpecData = JSON.stringify(spec);
				var newSpecUrl = Request.GetUrl('http://web-manufacture.net:12222/spec/', idDB);
				TestSpecsDB.Server.set(newSpecUrl, newSpecData, function(err, res){
					if (err){
						spec['id'] = idDB;
						newChSp.push(spec);
					};
				});
			}
			else{
				var idToUpdate = spec['id'];
				delete spec['id'];
				var newSpecData = JSON.stringify(spec);
				TestSpecsDB.Server.add('http://web-manufacture.net:12222/spec/', newSpecData, TestSpecsDB._addSpecFunction(newChSp, spec, idToUpdate));	
			};
		};		
	}
	else{
		alert('not required');
	}
};

TestSpecsDB._addSpecFunction = function(newChSp, spec, idToUpdate){
	return function(err, res){
		if (res){
			TestSpecsDB.UpdateID(idToUpdate, res);
		};
		if (err){
			spec['id'] = idToUpdate;
			newChSp.push(spec);
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



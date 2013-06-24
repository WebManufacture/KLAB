VerbTypes = {
	abbreviation : {
		name: "abbreviation",
		queryString : "SELECT * FROM socrbase WHERE SCNAME like '{0}'",
		query : function(obj, callback){
			fias.get(this.queryString.replace(/\{0\}/ig, obj), callback);
		},
		GetMergeObject : function(verb, obj){
			return { level : obj.level, ".ignore" : true, '.pointer' : true };
		}
	},
	region : {
		name: "region",
		queryString: "SELECT TOP(100) AOGUID, REGIONCODE, AREACODE, AUTOCODE, POSTALCODE, SHORTNAME, FORMALNAME, OFFNAME, AOLEVEL, aolevels.Title as [LEVEL] FROM addrobj LEFT JOIN aolevels ON aolevels.ID = aolevel WHERE AOLEVEL < 4 and (FORMALNAME like '{0}%' or OFFNAME like '{0}%') ORDER BY aolevel",
		queryFilterString: "SELECT TOP(100) AOGUID, REGIONCODE, AREACODE, AUTOCODE, POSTALCODE, SHORTNAME, FORMALNAME, OFFNAME, AOLEVEL, aolevels.Title as [LEVEL] FROM addrobj LEFT JOIN aolevels ON aolevels.ID = aolevel WHERE AOLEVEL = {0} and (FORMALNAME like '{1}%' or OFFNAME like '{1}%') ORDER BY aolevel",
		query : function(obj, callback){
			fias.get(this.queryString.replace(/\{0\}/ig, obj), callback);
		},
		queryFiltered : function(level, obj, callback){
			fias.get(this.queryFilterString.replace(/\{0\}/ig, level).replace(/\{1\}/ig, obj), callback);
		},
		GetMergeObject : function(verb, obj){
			return { level : obj.level, ".ignore" : true, '.pointer' : true };
		}
	},
	city : {
		name: "city",
		queryString: "SELECT TOP(100) AOGUID, CITYCODE, CTARCODE, PLACECODE, POSTALCODE, SHORTNAME, FORMALNAME, OFFNAME, AOLEVEL, aolevels.Title as [LEVEL] FROM addrobj LEFT JOIN aolevels ON aolevels.ID = aolevel WHERE AOLEVEL > 3 and AOLEVEL < 7 and (FORMALNAME like '{0}%' or OFFNAME like '{0}%') ORDER BY aolevel",
		queryFilterString: "SELECT TOP(100) AOGUID, CITYCODE, CTARCODE, PLACECODE, POSTALCODE, SHORTNAME, FORMALNAME, OFFNAME, AOLEVEL, aolevels.Title as [LEVEL] FROM addrobj LEFT JOIN aolevels ON aolevels.ID = aolevel WHERE parentguid = '{0}' and (FORMALNAME like '{1}%' or OFFNAME like '{1}%') ORDER BY aolevel",
		query : function(obj, callback){
			fias.get(this.queryString.replace(/\{0\}/ig, obj), callback);
		},
		queryFiltered : function(parent, obj, callback){
			fias.get(this.queryFilterString.replace(/\{0\}/ig, parent).replace(/\{1\}/ig, obj), callback);
		},
		GetMergeObject : function(verb, obj){
			return { level : obj.level, ".ignore" : true, '.pointer' : true };
		}
	},
	street : {
		name: "street",
		queryFilterString: "SELECT TOP(100) AOGUID, CITYCODE, CTARCODE, PLACECODE, POSTALCODE, SHORTNAME, FORMALNAME, OFFNAME, AOLEVEL, aolevels.Title as [LEVEL] FROM addrobj LEFT JOIN aolevels ON aolevels.ID = aolevel WHERE parentguid = '{0}' and AOLEVEL = 7 and (FORMALNAME like '{1}%' or OFFNAME like '{1}%') ORDER BY aolevel",
		queryFiltered : function(parent, obj, callback){
			fias.get(this.queryFilterString.replace(/\{0\}/ig, parent).replace(/\{1\}/ig, obj), callback);
		},
		GetMergeObject : function(verb, obj){
			return { level : obj.level, ".ignore" : true, '.pointer' : true };
		}
	},
	ignore : {
		name: "ignore",
		GetMergeObject : function(verb, obj){
			return { ".ignore" : true};
		}
	},	
}

VerbLevels = [VerbTypes.abbreviation];
VerbLevels[1] = VerbTypes.region;
VerbLevels[2] = VerbTypes.region;
VerbLevels[3] = VerbTypes.region;
VerbLevels[4] = VerbTypes.city;
VerbLevels[5] = VerbTypes.city;
VerbLevels[6] = VerbTypes.city;
VerbLevels[7] = VerbTypes.address;
VerbLevels[8] = VerbTypes.house;
VerbLevels[9] = VerbTypes.room;

PointersNet = new SemanticNet();
RegionsNet = new SemanticNet();
ClientsNet = new SemanticNet();
ParentsNet = new SemanticNet();

function SaveNet(){
	Net.POST("http://web-manufacture.net/identification/storage/pointers", PointersNet.Serialize(), function(){});	
	Net.POST("http://web-manufacture.net/identification/storage/regions", RegionsNet.Serialize(), function(){});	
	Net.POST("http://web-manufacture.net/identification/storage/clients", RegionsNet.Serialize(), function(){});	
	Net.POST("http://web-manufacture.net/identification/storage/parents", RegionsNet.Serialize(), function(){});	
}

function SavePNet(){
	Net.POST("http://web-manufacture.net/identification/storage/regions", PointerssNet.Serialize(), function(){});	
}

function SaveRNet(){
	Net.POST("http://web-manufacture.net/identification/storage/regions", RegionsNet.Serialize(), function(){});	
}

function SaveCNet(){
	Net.POST("http://web-manufacture.net/identification/storage/clients", ClientsNet.Serialize(), function(){});	
}

function SavePNet(){
	Net.POST("http://web-manufacture.net/identification/storage/parents", ParentsNet.Serialize(), function(){});	
}

function LoadNet(){
	Net.GET("http://web-manufacture.net/identification/storage/pointers", function(result){
		PointersNet.Merge(result);
	});	
	Net.GET("http://web-manufacture.net/identification/storage/regions", function(result){
		RegionsNet.Merge(result);
	});
	Net.GET("http://web-manufacture.net/identification/storage/clients", function(result){
		ClientsNet.Merge(result);
	});	
	Net.GET("http://web-manufacture.net/identification/storage/parents", function(result){
		ParentsNet.Merge(result);
	});		
}

LoadNet();

NeuroParser = {
	ParseRegion : function(text, callback){
		var data = this.ParseToken(text);
		
		for (var i = 0; i < data.length; i++){
			var obj = PointersNet.Process(data[i]);
			if (obj._finished){
				if (obj.direction && obj.direction == "back"){
					if (i > 0){
						data[i-1].level = obj.level;
					}
				}
				if (obj.direction && obj.direction == "next"){
					if (i < data.length - 1){
						data[i+1].level = obj.level;
					}
				}
			}
		}
		
		var cb = function(result){
			callback(result);
		}
		
		for (var i = 0; i < data.length; i++){
			var obj = data[i];
			if (!obj._finished){
				obj = RegionsNet.Process(obj);
				if (!obj._finished){
					if (obj.level){
						VerbTypes.region.queryFiltered(obj.level, obj._content,cb);
					}
					else{
						VerbTypes.region.query(obj._content, cb);		
					}
					return null;
				}
				else{
					return obj;
				}
			}
		}
		return null;
	},
	
	ParseTokens : function(text, mergeObj, tokens){
		//if (!object) object = {};
		text = text.replace(/[,;]/g, " ");
		text = text.toLowerCase().replace(/[^\w\d\.А-Яа-я]/ig, " ");
		var strings = text.split(" ");
		var objects = [];
		for (var i = 0; i < strings.length; i++){
			if (strings[i] == "") continue;
			var str = strings[i];
			if (str.indexOf(".") >= 0){
				str = str.split(".");
				str.unshift(1);
				str.unshift(i);
				strings.splice.apply(strings, str);
				if (strings[i] == "") continue;
				str = strings[i];
			}
			var obj = {_content: str, _verb : str, _path: "", _counter : 0};
			if (/[0-9]+/.test(str)){
				obj._type = "decimal";
			}
			else{
				obj._type = "string";
			}
			objects.push(obj);
		}
		if (mergeObj){
			for (var i = 0; i < objects.length; i++){
				var obj = objects[i];
				for (var key in mergeObj){
					if (obj[key])	
					{
						if (typeof obj[key] == 'number' && typeof mergeObj[key] == 'number'){
							obj[key] += mergeObj[key];
						}
					}
					else{
						obj[key] = mergeObj[key];
					}
				}
				if (tokens && Array.isArray(tokens)) tokens.push(obj);
			}
		}
		return objects;	
	}
};


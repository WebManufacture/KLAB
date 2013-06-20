
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
				queryString: "SELECT POSTALCODE, SHORTNAME, FORMALNAME, OFFNAME, AOLEVEL, aolevels.Title as [LEVEL] FROM addrobj LEFT JOIN aolevels ON aolevels.ID = aolevel WHERE AOLEVEL < 7 and (FORMALNAME like '{0}' or OFFNAME like '{0}') ORDER BY aolevel",
					query : function(obj, callback){
						fias.get(this.queryString.replace(/\{0\}/ig, obj), callback);
					},
						GetMergeObject : function(verb, obj){
							return { level : obj.level, ".ignore" : true, '.pointer' : true };
						}
		},
			address : {
				name: "address",
					queryString : "SELECT POSTALCODE, SHORTNAME, FORMALNAME, OFFNAME, AOLEVEL, aolevels.Title as [LEVEL] FROM addrobj LEFT JOIN aolevels ON aolevels.ID = aolevel WHERE AOLEVEL >= 7 and (FORMALNAME like '{0}' or OFFNAME like '{0}') ORDER BY aolevel",
						query : function(obj, callback){
							fias.get(this.queryString.replace(/\{0\}/ig, obj), callback);
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

	
	SemanticNet = function(){
		this.nodes = {};
	}
	
	SemanticNet.prototype.Process = function(verb){
		return this.processNode({_content: verb, _verb : verb, _path: "", _counter : 0}, this.nodes);
	}
	
	SemanticNet.prototype.processNode = function(object, node){
		if (!object._verb || object._verb == ""){
			object._counter++;
			this.applyValues(object, node);
			object._values = node.values;
			object._finished = true;
			return object;
		}
		var sym = object._verb[0];
		object._path += sym;
		if (node[sym]){
			object._counter++;
		}
		else{
			object._finished = false;
			return object;
		}
		object._verb = object._verb.substring(1);	
		return this.processNode(object, node[sym]);
	}
	
	SemanticNet.prototype.applyValues = function(object, node){
		if (!node.values){
			node.values = {};
			return;
		}
		for (var item in node.values){
			if (object[item]){
				if (typeof (object[item]) == "number"){
					object[item] += node.values[item];
				}
			}
			else{
				object[item] = node.values[item];
			}
		}
	}
	
	SemanticNet.prototype.Serialize = function(){
		return JSON.stringify(this.nodes);
	}
	
	SemanticNet.prototype.Clear = function(valuesOnly){
		if (valuesOnly){
			return this._clearValues(this.nodes);
		}
		this.nodes = {};
		return;
	}
	
	SemanticNet.prototype._clearValues = function(node){
		if (!node.values) return;
		node.values = {};
		for (var item in node){
			if (item != "values"){
				this._clearValues(node);
			}
		}
	}
	
	SemanticNet.prototype.Merge = function(net){
		this._merge(this.nodes, net);
	}
	
	SemanticNet.prototype._merge = function(node, net){
		if (node.values){
			this._mergeValues(node.values, net.values);
		}
		else{
			node.values = net.values;	
		}
		for (var item in net){
			if (item == "values") continue;
			if (node[item]){
				this._merge(net[item], node[item]);	
			}
			else{
				node[item] = net[item];	
			}
		}
	}
	
	
	
	SemanticNet.prototype._mergeValues = function(values, otherValues, withReplace){
		if (values && otherValues){
			for (var item in otherValues){
				if (typeof (values[item]) == 'undefined' || withReplace){
					if (otherValues[item] == null){
						delete values[item]	
					}
					else{
						values[item] = otherValues[item];
					}
				}			
			}
		}
	}
	
	
	SemanticNet.prototype.MergeVerb = function(verb, obj){
		return this.mergeNodeInternal(verb, this.nodes, obj);
	}
	
	SemanticNet.prototype.mergeNodeInternal = function(verb, node, object){
		if (!verb || verb == ""){
			if (!object) object = {};
			if (node.values){
				this._mergeValues(node.values, object, true);
			}
			else{
				node.values = object;
			}
			return node;
		}
		var sym = verb[0];
		if (!node[sym]){
			node[sym] = {};
		}
		verb = verb.substring(1);	
		return this.mergeNodeInternal(verb, node[sym], object);
	}
	
	
PointersNet = new SemanticNet();
RegionsNet = new SemanticNet();

Semantic = {};

Semantic.Parse = function(text){
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
	for (var i = 0; i < objects.length; i++){
		PointersNet.processNode(objects[i], PointersNet.nodes);
	}
	return objects;
}

Semantic.MergeVerb = function(verb, obj){
	PointersNet.MergeVerb(verb, obj);
}


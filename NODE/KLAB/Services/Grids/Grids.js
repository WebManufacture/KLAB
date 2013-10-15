Grids = {};


Grids.Init = function() {
	
};

Grids.InitGrid = function(table) {
	Extend(table, Grids._umGridMixin);
	table.Actions = {};
	
	//получить ссылки на прототипы
	table.ObjectProto = table.get('.table-object.prototype');
	if (!table.ObjectProto){
		table.ObjectProto = GridsGeneralObjectPrototype;	
	}
	
	
	table.EditFormProto = table.get('.edit-object-form.prototype');
	if (!table.EditFormProto){
		table.EditFormProto = GridsGeneralEditPrototype;	
	}	
	if (!table.get('.content')){
		table.ins(GridsSupport.get(".content").clone());	
	}
	table.ObjectsContainer = table.get('.objects-container');
	
	EV.CreateEvent('onObjectSelected', table);
	EV.CreateEvent('onObjectUnSelected', table);
	table.Storage = table.getStorageSource();
	//table.Storage.OnItemStateUpdatedAsync.subscribe(function(condition, obj){table._onAddServerback(obj);}, "ADD");
	//table.Storage.OnItemStateUpdatedAsync.subscribe(function(condition, obj){table._onDelServerback(obj);}, "DEL");
	//table.Storage.OnItemStateUpdatedAsync.subscribe(function(condition, obj){table._onSetServerback(obj);}, "SET");
	if (table.is(".load-immediate")){
		table.Load();
	}
	if (window.Channels){
		table.Storage.on("add", function(message, obj) {table._onAddServerback(obj)});
		table.Storage.on("del", function(message, obj) {table._onDelServerback(obj)});
		table.Storage.on("set", function(message, obj) {table._onSetServerback(obj)});
	}
	if (typeof table.oninit == "function"){
		table.oninit();
	}
	/*
	if (navigator.onLine){
		table.add(".online");
	}
	else{
		table.add(".offline");	
	}
	
	Net.OnConnectionState.subscribe(
		function(state){
			table._netConnectionStateChanged(state);
		}
	);*/
};



//________________________Примесь к гриду______________________________//

Grids._umGridMixin = {};

Grids._umGridMixin.Load = function(dataobj, callback){
	var table = this;
	table.Storage.all(dataobj, function(result){
		if (Array.isArray(result)){
			if (!dataobj){
				table.ObjectsContainer.clear();
			}
			table.ShowObjects(result);
		}
		if (typeof (callback) == "function"){
			callback.call(table, result);
		}
	});
}

Grids._umGridMixin._netConnectionStateChanged = function(state){
	if (state){
		this.add(".online");
		this.del(".offline");
	}
	else{
		this.del(".online");
		this.add(".offline");
	}
};


Grids._umGridMixin._onAddServerback = function(obj){
	if (!obj.id){
		obj.id = obj._id;
	}
	if (obj.id){
		var item = this.ObjectsContainer.get("[key='" + obj.id + "']");
		if (item == null){
			if (obj.internalNum){
				var item = this.ObjectsContainer.get("[internalNum='" + obj.internalNum + "']");
				if (item == null){
					item = this.CreateObject(obj);
					item.add(".new");
				}
				else{
					item.update(obj);
					item.add(".new");
				}
				return;
			}
			item = this.CreateObject(obj);
			item.add(".new");
			//item.show();
			//item.update(obj);
		}
		else{
			item.add(".error");
		}
	}
};

Grids._umGridMixin._onDelServerback = function(obj){
	if (!obj.id) obj.id = obj._id;
	if (obj.id){
		var item = this.ObjectsContainer.get("[key='" + obj.id + "']");
		if (item){
			item.del();
		}
	}
};

Grids._umGridMixin._onSetServerback = function(obj){
	if (!obj.id) obj.id = obj._id;
	if (obj.id){
		var item = this.ObjectsContainer.get("[key='" + obj.id + "']");
		if (item){
			item.update(obj);
		}
	}
};

Grids._umGridMixin.getStorageSource = function(readyFunc){
	var surl = this.attr("storage-url");
	return new SimpleStorage(surl);
};

Grids._umGridMixin.ShowObjects = function(data) {
	for (var i = 0; i < data.length; i++) {
		this.CreateObject(data[i]);
	};
};

Grids._umGridMixin.AddObject = function(dataObj) {
	var table = this;
	if (window.Channels){
		this.Storage.add(dataObj);
	}
	else{
		this.Storage.add(dataObj, function(result){table._onAddServerback(result)});
	}
};

Grids._umGridMixin.CreateObject = function(dataObj) {
	var proto = this.ObjectProto.clone();
	if (!proto.extended){
		Extend(proto, Grids.TableObject);
	}
	var allFields = proto.all('[field]').each(function(field){
		var key = field.get("@field");
		try{
			proto.AttrInnerProperty(key, "[field='" + key + "']");
		}
		catch(e){
			
		}
	});
	proto.update(dataObj);
	this.ObjectsContainer.add(proto);
	return proto;
};


Grids._umGridMixin.AddObjectAction = function(obj) {
	this.EditObjectAction();
};

Grids._umGridMixin.EditObjectAction = function(obj) {
	var editForm = this.EditFormProto.clone();
	editForm.editingObject = obj;
	if (!obj) {
		this.ObjectsContainer.ins(editForm);
		return;
	};
	if (typeof editForm.Create == "function"){
		if (editForm.Create(obj)) return;
	}
	var allFields = obj.all('[field]');
	for (var i = 0; i < allFields.length; i++) {
		var field = allFields[i];
		var efield = editForm.get('[field="' + field.get('@field') + '"]');
		if (field && efield) {
			var newValue = null;
			if (field.value){
				newValue = field.value;
			}
			else{
				var value = field.get(".field-value");
				if (value){
					newValue = value.innerHTML;
				}
				else{
					newValue = field.innerHTML;	
				}
			}
			if (efield.value != undefined){
				efield.value = newValue;
			}
			else{
				efield.innerHTML = newValue;
			}
			if (efield.update){
				efield.update();
			}
		};
	};
	this.ObjectsContainer.insertBefore(editForm, obj);
	if (typeof editForm.OnLoad == "function"){
		if (editForm.OnLoad(obj)) return;
	}
	obj.hide();
};

Grids._umGridMixin._filterObjects = function(field, search) {
	if (!search) {
		this.del(".filtered");
		this.ObjectsContainer.all(".table-object .highlight").del(".highlight");
		this.ObjectsContainer.all('.table-object').del('.invisible');
		return;
	};
	this.add(".filtered");
	this.ObjectsContainer.all('.table-object').each(function(elem){
		elem.all(".highlight").del(".highlight");
		elem.all('[field]').each(function(fcell){
			if (fcell && fcell.textContent.contains(search)){
				fcell.add(".highlight");
			}
		});	
		if (elem.get(".highlight")){
			elem.show();		
		}
		else{
			elem.hide();
		}
	});
};



//__________________________________________________________//

//_________________Действия UI______________________________//

Grids.EditFormActions = {};

Grids.EditFormActions.Clear = function() {
	this.all("[field]").each(function(elem){
		elem.value = "";
		elem.update();
	});
};

Grids.EditFormActions.Save = function() {
	var table = this.get("^.grid");
	var allFields = this.all('[field]');
	var isNew = false;
	if (!this.editingObject){
		this.editingObject = table.CreateObject();
		this.editingObject.hide();
		table.ObjectsContainer.ins(this.editingObject);
	}
	for (var i = 0; i < allFields.length; i++) {
		var field = allFields[i].get('@field');
		var value = allFields[i].value;
		if (field && value != undefined) {
			this.editingObject[field] = value;
		};		
	};	
	var dataObj = this.editingObject.createDataObj();
	this.editingObject.del();
	if (dataObj.id){
		table.Storage.set(dataObj);
	}
	else{
		table.Storage.add(dataObj);	
	}
	this.del();	
};

Grids.EditFormActions.Cancel = function(s) {
	if (this.editingObject) {
		this.editingObject.show()
	}
	this.del();
};


Grids.EditFormActions.ObjectCheker = function() {
	var object = this.get('^.object-prototype');
	if (object.is('.checked')) {
		object.del('.checked');
		Grids.ObjectsContainer.onuncheck.fire(object);
	} else {
		object.add('.checked');
		Grids.ObjectsContainer.oncheck.fire(object);
	};
};

//__________________________________________________________//

Grids.TableObject = {};

Grids.TableObject.initObject = function(){
	//var event = EV.CreateEvent("OnObjectSelected", this);
	/*var to = this;
this.onclick = function(){
to._objectClicked();
}*/
	this.extended = true;
	this.onclick = this._objectClicked;
};

Grids.TableObject._objectClicked = function(){
	if (this._is(".selected")){
		//this.BubbleEvent("OnObjectSelected", this, false);
		this.BubbleEvent("OnObjectUnSelected", this);
		this.del(".selected");
	}
	else{
		this.BubbleEvent("OnObjectSelected", this, true);
		this.add(".selected");
	}
};

Grids.TableObject.createDataObj = function() {
	var dataObj = {};
	this.all("[field]").each(function(field){
		var fname = field.get("@field");
		if (fname){
			if (field.value){
				dataObj[fname] = field.value;
			}
			else{
				var value = field.get(".field-value");
				if (value){
					dataObj[fname] = value.innerHTML;
				}
				else{
					dataObj[fname] = field.innerHTML;	
				}
			}
		}
	});
	var key = this.get("@key");
	if (key){
		dataObj.id = key;
	}
	return dataObj;
};

Grids.TableObject.update = function(dataObj) {
	if (!dataObj) return;
	var elem = this;	
	if (dataObj.id === undefined || dataObj.id == null) {
		dataObj.id = dataObj._id;
	}
	for (var key in dataObj) {
		this[key] = dataObj[key];
		if (key.start(".")){
			this.add(key);	
			continue;
		}
		if (key.start("@")){
			this.add(key);	
			this[key] = this.get(key);
			continue;
		}
		if (key.start("#")){
			key = key.replace('#', '');
			this.id = key;	
			this.set('@key', key);
			continue;
		}
		if (typeof(dataObj[key]) !='object' && key != 'id' && !key.start('_')){ 
			this.set("@data-" + key.toLowerCase(), dataObj[key]);
		}
		
	};
	this.key = dataObj.id;
	if (this.key){
		this.id = 'obj' + dataObj.id;
	}
	this.set('@key', dataObj.id);
	this.data = dataObj;
	var allFields = this.all('[field]').each(function (field) {
		var key = field.get("@field");
		if (key && dataObj[key]) {
			field.textContent = dataObj[key];
		}
	});
	var lookup = this.all('.lookup[field]:not(.looked)');
	lookup.each(function (field) {
		var key = field.get("@field");
		var value = dataObj[key];
		var lsrc = field.get("@lookup-source");
		var lprefix = field.get("@lookup-prefix");
		var lselector = field.get("@lookup-selector");
		if (lprefix) value = lprefix + value;
		if (lsrc) {
			lsrc = DOM.get(lsrc);
			if (lsrc) {
				var mapfunc = function () {
					var src = lsrc.get("#" + value);
					if (src) {
						value = src.get(lselector);
						if (value) {
							if (value.textContent) {
								field.add(".looked");
								field.textContent = value.textContent;
								if (table && table.filter && table.filter.length > 0 && !field.is(".highlight")){
									elem._highlightFieldValue(field, table.filter);
								}
							}
							else {
								if (value.value) {
									field.add(".looked");
									field.textContent = value.value;
								}
								else {
									field.add(".looked");
									field.textContent = value;
								}
							}
						}
					}
					else {
						window.setTimeout(mapfunc, 400);
					}
				};
				mapfunc();
			}
		}
	});
	var oncalc = this.get("@oncalc");
	var obj = { data: dataObj, element: this };
	try {
		with (obj) {
			eval(oncalc);
			this.add(".calculated");
		}
	} catch (e) {
		console.error(e);
	}
};


Grids.TableObject.DeleteAction = function() {
	var table = this.get("^.grid");
	if (this.is(".deleted")) return;
	/*if (window.Channel){
		table.Storage.del({_id: this.key});
	}
	else{
		
	}*/
	table.Storage.del({id: this.key, _id : this.key}, function(result){table._onDelServerback(result)});
	//this.del();
	this.add(".deleted");
};


Grids.TableObject.AddAction = function() {
	var table = this.get("^.grid");
	table.EditObjectAction();
};



Grids.TableObject.EditAction = function() {
	var table = this.get("^.grid");
	table.EditObjectAction(this);
};



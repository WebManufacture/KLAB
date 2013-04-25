UMGrids = {};


UMGrids.Init = function() {
	
};

UMGrids.InitGrid = function(table) {
	Extend(table, UMGrids._umGridMixin);
	table.Actions = {};
	
	//получить ссылки на прототипы
	table.ObjectProto = table.get('.table-object.prototype');
	if (!table.ObjectProto){
		table.ObjectProto = UniTableGeneralObjectPrototype;	
	}
	
	
	table.EditFormProto = table.get('.edit-object-form.prototype');
	if (!table.EditFormProto){
		table.EditFormProto = UniTableGeneralEditPrototype;	
	}	
	if (!table.get('.uni-table-content')){
		table.ins(UniTableSupport.get(".uni-table-content").clone());	
	}
	table.ObjectsContainer = table.get('.uni-table-content .objects-container');
	
	EV.CreateEvent('onObjectSelected', table);
	EV.CreateEvent('onObjectUnSelected', table);
	table.Storage = table.getStorageSource();
	table.Storage.OnItemStateUpdatedAsync.subscribe(function(condition, obj){table._onAddServerback(obj);}, "ADD");
	table.Storage.OnItemStateUpdatedAsync.subscribe(function(condition, obj){table._onDelServerback(obj);}, "DEL");
	table.Storage.OnItemStateUpdatedAsync.subscribe(function(condition, obj){table._onSetServerback(obj);}, "SET");
	table.Storage.Refresh(function(result){
		table.Storage.Sort("fullName");
		table.ShowObjects(table.Storage.cache);
	});
	
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
	);
};



//________________________Примесь к гриду______________________________//

UMGrids._umGridMixin = {};

UMGrids._umGridMixin._netConnectionStateChanged = function(state){
	if (state){
		this.add(".online");
		this.del(".offline");
	}
	else{
		this.del(".online");
		this.add(".offline");
	}
};


UMGrids._umGridMixin._onAddServerback = function(obj){
	if (obj.id){
		var item = this.ObjectsContainer.get("[key='" + obj.id + "']");
		if (item == null){
			if (obj.internalNum){
				var item = this.ObjectsContainer.get("[internalNum='" + obj.internalNum + "']");
				if (item == null){
					item = this.ObjectsContainer.add(this.CreateObject(obj));
					item.add(".new");
				}
				else{
					item.update(obj);
					item.add(".new");
				}
				return;
			}
			item = this.ObjectsContainer.add(this.CreateObject(obj));
			item.add(".new");
		}
		else{
			item.update(obj);
			item.add(".error");
		}
	}
};

UMGrids._umGridMixin._onDelServerback = function(obj){
	if (obj.id){
		var item = this.ObjectsContainer.get("[key='" + obj.id + "']");
		if (item){
			item.del();
		}
	}
};

UMGrids._umGridMixin._onSetServerback = function(obj){
	if (obj.id){
		var item = this.ObjectsContainer.get("[key='" + obj.id + "']");
		if (item){
			item.update(obj);
		}
	}
};

UMGrids._umGridMixin.getStorageSource = function(readyFunc){
	var surl = this.attr("storage-url");
	return new KLabCachedStorage(surl);
};

UMGrids._umGridMixin.ShowObjects = function(data) {
	this.ObjectsContainer.clear();
	for (var i = 0; i < data.length; i++) {
		this.ObjectsContainer.add(this.CreateObject(data[i]));
	};
};


UMGrids._umGridMixin.CreateObject = function(dataObj) {
	var proto = this.ObjectProto.clone();
	var allFields = proto.all('[field]').each(function(field){
		var key = field.get("@field");
		proto.AttrInnerProperty(key, "[field='" + key + "']");
	});
	proto.update(dataObj);
	return proto;
};


UMGrids._umGridMixin.AddObjectAction = function(obj) {
	this.EditObjectAction();
};

UMGrids._umGridMixin.EditObjectAction = function(obj) {
	var editForm = this.EditFormProto.clone();
	editForm.editingObject = obj;
	if (!obj) {
		this.ObjectsContainer.ins(editForm);
		return;
	};
	var allFields = obj.all('[field]');
	for (var i = 0; i < allFields.length; i++) {
		var field = allFields[i];
		var efield = editForm.get('[field="' + field.get('@field') + '"]');
		if (field && efield) {
			if (field.value){
				efield.value = field.value;
			}
			else{
				var value = field.get(".field-value");
				if (value){
					efield.value = value.innerHTML;
				}
				else{
					efield.value = field.innerHTML;	
				}
			}
			if (efield.update){
				efield.update();
			}
		};
	};
	this.ObjectsContainer.insertBefore(editForm, obj);
	obj.hide();
};

UMGrids._umGridMixin._filterObjects = function(field, search) {
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

UMGrids.EditFormActions = {};

UMGrids.EditFormActions.Clear = function() {
	this.all("[field]").each(function(elem){
		elem.value = "";
		elem.update();
	});
};

UMGrids.EditFormActions.Save = function() {
	var table = this.get("^.uni-table");
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
	if (dataObj.id){
		table.Storage.set(dataObj);
	}
	else{
		this.editingObject.AttrProperty("internalNum");
		dataObj.internalNum = Math.random();
		dataObj.id = Math.random();
		this.editingObject.update(dataObj);
		table.Storage.add(dataObj);	
	}
	this.editingObject.show();
	this.del();	
};

UMGrids.EditFormActions.Cancel = function(s) {
	if (this.editingObject) {
		this.editingObject.show()
	}
	this.del();
};


UMGrids.EditFormActions.ObjectCheker = function() {
	var object = this.get('^.object-prototype');
	if (object.is('.checked')) {
		object.del('.checked');
		UMGrids.ObjectsContainer.onuncheck.fire(object);
	} else {
		object.add('.checked');
		UMGrids.ObjectsContainer.oncheck.fire(object);
	};
};

//__________________________________________________________//

UMGrids.TableObject = {};

UMGrids.TableObject.initObject = function(){
	//var event = EV.CreateEvent("OnObjectSelected", this);
	/*var to = this;
this.onclick = function(){
to._objectClicked();
}*/
	this.onclick = this._objectClicked;
};

UMGrids.TableObject._objectClicked = function(){
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

UMGrids.TableObject.createDataObj = function() {
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

UMGrids.TableObject.update = function(dataObj) {
	if (dataObj){
		for (var key in dataObj) {
			this[key] = dataObj[key];
		};		
		this.id = 'id' + dataObj.id;
		this.set('@key', dataObj.id);
	}
};


UMGrids.TableObject.DeleteAction = function() {
	var table = this.get("^.uni-table");
	if (this.is(".deleted")) return;
	table.Storage.del(this.createDataObj());
	//this.del();
	this.add(".deleted");
};


UMGrids.TableObject.AddAction = function() {
	var table = this.get("^.uni-table");
	table.EditObjectAction();
};



UMGrids.TableObject.EditAction = function() {
	var table = this.get("^.uni-table");
	table.EditObjectAction(this);
};


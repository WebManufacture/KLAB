SGrid = {};

SGrid.Init = function() {
	
};

SGrid.InitGrid = function (table) {
	Extend(table, SGrid._umGridMixin);
	table.Actions = {};
	table.ObjectProto = table.get('.object-template.prototype');
	table.EditFormProto = table.get('.edit-template.prototype');
	if (table.ObjectProto) table.ObjectProto = table.ObjectProto.clone();	
	if (table.EditFormProto) table.EditFormProto = table.EditFormProto.clone();
	EV.CreateEvent('onObjectSelected', table);
	EV.CreateEvent('onObjectUnSelected', table);
	EV.CreateEvent('onObjectAdd', table);
	EV.CreateEvent('onObjectUpdate', table);
	EV.CreateEvent('onObjectDelele', table);
	EV.CreateEvent('onItemShow', table);
	EV.CreateEvent('onLoaded', table);
	var url = table.get("@url");
	if (url){
		table.tunnel = Net.GetTunnel(table.get("@url"));
	}
	console.log("SimpleGrid initialized");
	table.add(".initialized");
	var onInit = table.get("@oninit");
	if (onInit){
		eval(onInit);
	}
	table.LoadData();
};



//________________________Примесь к гриду______________________________//

SGrid._umGridMixin = {};

SGrid._umGridMixin.LoadData = function(){
	var table = this;
	if (this.tunnel){
		this.clear();
		//.Page(0, table.pageSize)
		table.add(".loading");
		table.tunnel.All(function (result) {
			table.ShowObjects(result);
			table.del(".loading");
			table.add(".loaded");
			table.onLoaded.fire();
		});
	}
};

SGrid._umGridMixin.ShowObjects = function (data, start, count) {
	this.clear();
	if (!start) start = 0;
	var end = data.length;
	if (count) end = start + count;
	if (end > data.length) end = data.length;
	for (var i = start; i < end; i++) {
		var elem = this.CreateObject(data[i]);
		this.onItemShow.fire(elem);
		this.add(elem);
	};
};

SGrid._umGridMixin.ShowObject = function (data) {
	var elem = this.CreateObject(data);
	var table = this;
	this.onItemShow.fire(elem);
	this.ObjectsContainer.add(elem);
};


SGrid._umGridMixin.CreateObject = function(dataObj) {
	if (this.ObjectProto){
		var proto = this.ObjectProto.clone();
		proto.del(".object-template");
		proto.add(".object-item");
		for (var func in SGrid.TableObject){
			proto[func] = SGrid.TableObject[func];
		}
		proto.update(dataObj, this);
	}
	else{
		proto = J.JsonToDivObject(dataObj);	
	}
	
	return proto;
};


SGrid._umGridMixin.AddObjectAction = function(obj) {
	this.EditObjectAction();
};

SGrid._umGridMixin.EditObjectAction = function(obj) {
	var editForm = this.EditFormProto.clone();
	editForm.editingObject = obj;
	if (!obj) {
		this.ins(editForm);
		return;
	};
	var allFields = obj.all('[field]');
	for (var i = 0; i < allFields.length; i++) {
		var field = allFields[i];
		var efield = editForm.get('[field="' + field.get('@field') + '"]');
		if (field && efield) {
			if (field.value) {
				efield.value = field.value;
			}
			else {
				var value = field.get(".field-value");
				if (value) {
					efield.value = value.innerHTML;
				}
				else {
					efield.value = field.innerHTML;
				}
			}
			if (efield.update) {
				efield.update();
			}
		};
	};
	this.insertBefore(editForm, obj);
	obj.hide();
};

//__________________________________________________________//

//_________________Действия UI______________________________//

SGrid.EditFormActions = {};

SGrid.EditFormActions.Clear = function() {
	this.all("[field]").each(function(elem) {
		elem.value = "";
		elem.update();
	});
};

SGrid.EditFormActions.Save = function() {
	var table = this.get("^.simple-grid");
	var allFields = this.all('[field]');
	var isNew = false;
	if (!this.editingObject) {
		this.editingObject = table.CreateObject();
		this.editingObject.hide();
		table.ObjectsContainer.ins(this.editingObject);
	}
	for (var i = 0; i < allFields.length; i++) {
		var field = allFields[i].get('@field');
		var value = allFields[i].value;
		if (field && value != undefined) {
			this.editingObject[data-field] = value;
		};
	};
	var dataObj = this.editingObject.createDataObj();
	if (dataObj.id) {
		table.Storage.set(dataObj);
	}
	else {
		this.editingObject.AttrProperty("internalNum");
		dataObj.internalNum = Math.random();
		dataObj.id = Math.random();
		this.editingObject.update(dataObj);
		table.Storage.add(dataObj);
	}
	this.editingObject.show();
	this.del();
};

SGrid.EditFormActions.Cancel = function(s) {
	if (this.editingObject) {
		this.editingObject.show();
	}
	this.del();
};


SGrid.EditFormActions.ObjectCheker = function() {
	var object = this.get('^.object-prototype');
	if (object.is('.checked')) {
		object.del('.checked');
		SGrid.ObjectsContainer.onuncheck.fire(object);
	} else {
		object.add('.checked');
		SGrid.ObjectsContainer.oncheck.fire(object);
	};
};

//__________________________________________________________//

SGrid.TableObject = {};

SGrid.TableObject.initObject = function() {
	//var event = EV.CreateEvent("OnObjectSelected", this);
	/*var to = this;
this.onclick = function(){
to._objectClicked();
}*/
	this.onclick = this._objectClicked;
};

SGrid.TableObject._objectClicked = function() {
	if (this._is(".dfselected")) {
		//this.BubbleEvent("OnObjectSelected", this, false);
		this.BubbleEvent("onObjectUnSelected", this);
		this.del(".selected");
	}
	else {
		this.BubbleEvent("onObjectSelected", this);
		this.add(".selected");
	}
};


SGrid.TableObject.createDataObj = function() {
	var dataObj = {};
	this.all("[field]").each(function(field) {
		var fname = field.get("@field");
		if (fname) {
			if (field.value) {
				dataObj[fname] = field.value;
			}
			else {
				var value = field.get(".field-value");
				if (value) {
					dataObj[fname] = value.innerHTML;
				}
				else {
					dataObj[fname] = field.innerHTML;
				}
			}
		}
	});
	var key = this.get("@key");
	if (key) {
		dataObj.id = key;
	}
	return dataObj;
};

SGrid.TableObject.update = function (dataObj, table) {
	if (!dataObj) return;
	var elem = this;
	for (var key in dataObj) {
		this[key] = dataObj[key];
		if (typeof(dataObj[key]) !='object' && key != 'id' && !key.start('_')){ 
			this.set("@data-" + key.toLowerCase(), dataObj[key]);
		}
	};
	if (!dataObj.id) dataObj.id = dataObj._id;
	this.id = 'obj' + dataObj.id;
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


SGrid.TableObject.DeleteAction = function() {
	var table = this.get("^.simple-grid");
	if (this.is(".deleted")) return;
	table.Storage.del(this.createDataObj());
	//this.del();
	this.add(".deleted");
};


SGrid.TableObject.AddAction = function() {
	var table = this.get("^.simple-grid");
	table.EditObjectAction();
};



SGrid.TableObject.EditAction = function() {
	var table = this.get("^.simple-grid");
	table.EditObjectAction(this);
};

C.Add({id: 'SGridContext', Condition: 'ui-processing', Selector:'.simple-grid:not(.initialized)', Process: function(elem){
	SGrid.InitGrid(elem);
}});

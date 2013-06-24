Wizard = function(ui, parent, dataobj, callback){
	this.parent = parent;
	if (typeof dataobj == 'function'){
		callback = dataobj;
		dataobj = {};
	}
	this.callback = callback;	
	this.wizardObj = dataobj;
	this.next(ui);
}

Wizard.prototype = {
	next : function(div){
		if (this.currentStep){
			this.currentStep.del();
		}
		if (div){
			var wizard = Wizard.Init(div.clone());
			wizard.wizard = this;	
			if (this.parent){
				this.currentStep = this.parent.add(wizard);
			}
			else{
				this.currentStep = DOM.add(wizard);	
			}
			wizard.show();
			return wizard;
		}
		return null;
	},
	
	updateObject : function(item){
		var obj = this.wizardObj;
		var add = item.get("@add");
		if (add) {
			add = add.split(",");
			for (var i=0; i < add.length; i++){
				var token = add[i];
				if (token != ""){
					var pair = token.split("=");
					if (pair[0] != ""){
						var val = pair[1];
						if (!val) val = null;
						if (obj[pair[0]]){
							if (val && typeof obj[pair[0]] == 'number' && !isNaN(parseFloat(val))){
								obj[pair[0]] += parseFloat(val);
							}
						}
						else{
							obj[pair[0]] = val;
						}
					}
				}
			}
		}
		var values = item.get("@value");
		if (values) {
			values = values.split(",");
			for (var i=0; i < values.length; i++){
				var token = values[i];
				if (token != ""){
					var pair = token.split("=");
					if (pair[0] != ""){
						var val = pair[1];
						if (!val) val = null;
						if (!isNaN(parseFloat(val))){
							val = parseFloat(val);
						}
						obj[pair[0]] = val;
					}
				}
			}
		}
	},
	
	end: function(){
		if (this.currentStep){
			this.currentStep.del();
		}
		if (this.callback){
			if (this.parent){
				this.callback.call(this.parent, this.wizardObj);	
			}
			else{
				this.callback.call(this, this.wizardObj);		
			}
		}
	}
}

Wizard.Init = function(div){
	div.all(".link, .wizard-step, .wizard-control").each(function(item){
		item.onclick = Wizard.ItemClick;
	});
	return div;
}

Wizard.Next = function(wizardUI){
	
}

Wizard.ItemClick = function(){
	var wizard = this.get("^.wizard");	
	if (wizard){
		wizard = wizard.wizard;
		wizard.updateObject(this);
		if (this.is(".end")){
			wizard.end();
		}		
		else{
			if (this.get("@next")){
				wizard.next(DOM(this.get("@next")));	
			}
		}
	}
}
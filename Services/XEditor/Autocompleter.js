autocomplete = M.GetModuleEndsUrl("autocompleter.htm");

autocomplete.context = { Selector: ".autocompleter", Condition:"ui-processing"};
autocomplete.context.Process = function(element, context){
    autocomplete.initComponent(element); 
}
    
    C.Add(autocomplete.context);

autocomplete.init = function () {
    autocomplete.load("autocomplete-source-js.htm");
};


autocomplete.save = function () {
    return;
	//Закомментил на время отладки
	var data = "";
    var allElem = autocomplete.source.all('.a-item.custom');
    for (var i = 0; i < allElem.length; i++) {
	data += allElem[i].outerHTML;
    }
    localStorage.auto = data;
};

autocomplete.load = function (url) {
    autocomplete.source = DOM('.autocomplete-source');
    if (!autocomplete.source) {
	autocomplete.source = DOM.div('.autocomplete-source.invisible');
    }
    autocomplete.source.clear();
    if (localStorage.auto != null) {
	autocomplete.source.innerHTML = localStorage.auto;
	
    }
    if (url) {
	AJ.get(url, '.a-item', autocomplete.loadFile);
    }
};


autocomplete.loadFile = function (text, obj) {
    autocomplete.source.innerHTML += text;
};


autocomplete.initComponent = function (elem) {
    elem.div(".header");
    elem.div(".elements");   
    
    
    elem.close = function() {
	if (this.is("invisible")) return;
	this.hide();
	this.inputText = "";
	this.clear();
    };
    
    elem.aggregate = function (elem, char, event) {
	this.SetCoord(elem.offsetLeft + elem.offsetWidth, elem.offsetTop);
	var result = null;
	if (char){
	    this.aggregated = true;
	    this.inputText += char;
	    result = this.complete(char);
	}
	else
	{
	    result = this.aggregateKey(elem, event);
	}
	return result;
    };
    
    elem.complete = function () {
        var data = autocomplete.source.all('.a-item[name^="' + this.inputText + '"]');
	if (data.length > 0) {
	    this.show();
	    this.clear();
	    for (var i = 0; i < data.length; i++) {
		var clone = data[i].clone();
		clone.add(".item");
		this.add(clone);
	    }
	    if (this.firstChild){
		this.firstChild.add('.selected');
		return this.firstChild;
	    }
	}
	else{
	    this.clear();
	}
	return null;
    };
   
    
    elem.aggregateKey = function (elem, event) {
	var selected = this.get('.selected');
	if (this.aggregated) {
	    this.aggregated = false;
	    return selected;
	}
	switch (event.keyCode) {
	    //Backspace
	    case 8:
		this.inputText = this.inputText.substring(0, this.inputText.length - 1);
		if (this.inputText.length >= 3){
		    return this.complete();
		}
		else{
		    this.hide();
		    return null;
		}
	    //space, return
	    case 32:
	    case 13:	
		if (event.ctrlKey) {
		    if (selected) {
			return selected;
		    }
		    if (this.inputText.length > 3){
			var newSrc = autocomplete.source.div('.a-item.custom');
			newSrc.add('@name', auto.inputText);
			newSrc.innerHTML = auto.inputText;
			autocomplete.save();
		    }
		}
		break;
	    //up 
	    case 38:
		if (event.ctrlKey) {
		    this.all('.selected').del('.selected');
		    if (selected){
			selected = selected.previousElementSibling;
		    }
		    else{
			selected = this.lastChild;
		    }
		    if (selected) {
			selected.cls("selected");
			return selected;
		    }
   		    return null;
		}
		break;
	    //down 
	    case 40:
		if (event.ctrlKey) {
		    this.all('.selected').del('.selected');
		    if (selected){
			selected = selected.nextElementSibling;
		    }
		    else{
			selected = this.firstChild;
		    }		    
		    if (selected) {
			selected.cls("selected");
			return selected;
		    }
		    return null;
		}
		break;
	}
	this.close();
	return null;
    };
    
    elem.colorSyn = function () {
	autocomplete.proverka = false;
	if (isNaN(parseInt(autocomplete.editedElement.innerHTML.replace(' ', '')))) {
	    var all = DOM.all('.js');
	    for (var i = 0; i < all.length; i++) {
		if (autocomplete.editedElement.innerHTML.replace(' ', '') == all[i].innerHTML) {
		    var clas = all[i].clone();
		    clas.del('.a-item');
		    clas.del('.js');
		    autocomplete.editedElement.add('.' + clas.classList[0]);
		    autocomplete.proverka = true;
		}
	    }
	    if (autocomplete.proverka == false) {
		if (autocomplete.editedElement.previousElementSibling != null) {
		    var prev = autocomplete.editedElement.previousElementSibling;
		    var elem = DOM.get('.a-item[name=' + autocomplete.editedElement.innerHTML.replace(' ', '') + ']');
		    autocomplete.editedElement.add('.' + prev.classList[prev.classList.length - 1]);
		}
	    }
	}
	else {
	    autocomplete.editedElement.add('.js-atom');
	}
    };
};


setInterval(autocomplete.save, 3000); 

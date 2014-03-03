autocomplete = ac = AC = {};

ac.init = function () {
    ac.source = undefined;
    ac.text = '';
    ac.acElement = undefined;
    ac.editedElement = undefined;	
    window.addEventListener('keydown',ac.keydown,false);
    window.addEventListener('keypress',ac.keytext,false);
};

ac.initComponent = function(elem){
    ac.acElement = elem;   
    elem.div(".header");
    elem.div(".elements");
    elem.show();
    ac.width = elem.offsetWidth;
    elem.hide();    
};

ac.activate = function(elem){
    ac.editedElement = elem;
    ac.acElement.SetCoord(elem.offsetLeft - ac.width, elem.offsetTop);
    elem.add(".with-autocomplete");    
};

ac.deactivate = function(elem){
    ac.editedElement = null;
    elem.del(".with-autocomplete");    
    ac.acElement.hide();
    ac.text = "";
    ac.clearAuto();
};

ac.save = function () {
    var data = "";
    var allElem = ac.source.all('.a-item.custom');
    for (var i = 0; i < allElem.length; i++) {
	data += allElem[i].outerHTML;
    }
    localStorage.auto = data;
};

ac.load = function (url) {
    ac.source = DOM('.autocomplete-source');
    if (!ac.source){
        ac.source = DOM.div('.autocomplete-source.invisible');
    }    
    ac.source.clear();
    if (localStorage.auto != null) {
	ac.source.innerHTML = localStorage.auto;
	if(url){
	    AJ.get(url,'.a-item',ac.loadFile);
	}
    }
};
ac.loadFile = function (text,obj){
    ac.source.innerHTML+=text;
};
ac.complete = function(){
    var auto = ac.clearAuto();
    ac.acElement.SetCoord(ac.editedElement.offsetLeft + ac.editedElement.offsetWidth, ac.editedElement.offsetTop);
    if (ac.text.length > 0){
	var data = DOM.all('.a-item[name^="'+ac.text+'"]');
	if (data.length > 0){
	    for (var i = 0; i < data.length;i++){
		var clone = data[i].clone();
		auto.add(clone);
	    }
	    //Дефолт - это состояние банкротства :) А default - по умолчанию )
	    auto.firstChild.add('.selected');
	}
    }
};

ac.clearAuto = function(){
    var elems = ac.acElement.get(".elements");
    elems.clear();
    return elems;
};


ac.keydown = function(event){
    var element = DOM.get('.selected');
    if (!ac.editedElement) return false;
    if(event.keyCode == 8){
        ac.text = ac.text.substring(0, ac.text.length - 1);
        ac.complete();
        return true;
    }
    else if(event.ctrlKey && event.keyCode==38){
        DOM.all('.selected').del('.selected');
        element = element.previousElementSibling;
        if(!element){
            element=DOM.get('.elements').lastChild;
        }
        //up
    }
    else if(event.ctrlKey && event.keyCode==40){
        DOM.all('.selected').del('.selected');
        element = element.nextElementSibling;
        if(!element){
            element=DOM.get('.elements').firstChild;
        }
    }
    // Строка по длинне такая же, зато гораздо понятнее что она делает :) Ведь у нас таких клавиш не так много!
    //if (ac.key.join().search(event.keyCode) != -1){
    else if (event.keyCode != 32 && event.keyCode != 13) return true;
    else if (event.keyCode == 32 || event.keyCode == 13){
        ac.colorSyn();
    }
    if(element){
        element.add('.selected');
    }
    if (ac.text == 'clearauto'){
	localStorage.auto = "";
	ac.source.all(".custom").del();
    }
    else{
	var elem = ac.acElement.get(".selected");
	if (elem)
	{
	    ac.editedElement.innerHTML = elem.innerHTML;    
	}
	else
	{
	    if (ac.text.length <= 3) {
		ac.text = '';
		return true;   
	    }
	    var newSrc = ac.source.div('.a-item.custom');
	    newSrc.add('@name', ac.text);
	    newSrc.innerHTML = ac.text;	 
	    ac.save();
	}
    }
    ac.text = '';
    return true;
};


ac.keytext = function(event){
    if (!ac.editedElement) return false;
    if (event.charCode == 0) return true;
    if (event.charCode != 13 & event.charCode != 32){
	ac.text += String.fromCharCode(event.charCode);
        var hd = ac.acElement.get('.header');
	if (hd){
	    hd.innerHTML = ac.text;
	}
	
	if (ac.text.length >= 3){
	    ac.acElement.show();
	    ac.complete();
	}
    }
};
ac.colorSyn = function(){
    ac.proverka=false;
    if(isNaN(parseInt(ac.editedElement.innerHTML.replace(' ','')))){
        var all = DOM.all('.js');
        for(var i = 0;i<all.length;i++){
            if(ac.editedElement.innerHTML.replace(' ','')==all[i].innerHTML){
                var clas=all[i].clone();
                clas.del('.a-item');
		clas.del('.js');
                ac.editedElement.add('.'+clas.classList[0]);
                ac.proverka=true;
            }
        }
        if(ac.proverka==false){
	    if(ac.editedElement.previousElementSibling!=null){
		var prev = ac.editedElement.previousElementSibling;
		var elem = DOM.get('.a-item[name='+ac.editedElement.innerHTML.replace(' ','')+']');
		ac.editedElement.add('.'+prev.classList[prev.classList.length-1]);
	    }
        }
    }
    else{
        ac.editedElement.add('.js-atom');
    }
};


//Закомментил на время отладки
//setInterval(ac.save, 3000);setInterval(ac.save, 18000);
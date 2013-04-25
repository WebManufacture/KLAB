xed = M.GetModuleEndsUrl("module.xeditor.htm");

xed.init = function () {
    xed.temp = undefined;
};

xed.id = 'XEditor';

xed.info = L.Info;

xed.context = { Selector: ".x-editor", Condition:"ui-processing"};
xed.context.Process = function(element, context){
    xed.initComponent(element); 
}
    
C.Add(xed.context);

xed.initComponent = function (element) {
    xed.work = element;
    element.onclick = function(){
	xed.inputElement.focus();
	return false;
    }
    Events.CreateEvent("OnActivateElem", element);
    Events.CreateEvent("OnDeactivateElem", element);
    xed.auto = DOM(".autocompleter");
    xed.file = element.get("@file");
    if (xed.file){
	xed.info("init_comp", "file detected", xed.file);
	Files.Get(xed.file + ".xfile", {context: element, postback: xed.fileLoaded});
	return false;
    }
    xed.initInternal(element);
    return true;
};

xed.initInternal = function (element) {
    xed.inputElement = element.add("    <input type='text' style='width: 2px; border: none; opacity:0.1; position:absolute;' onfocus='this.style.backgroundColor=\"red\";'></input>");
    var lines = element.all(".line");
    for (var i = 0; i < lines.length; i++){
	xed.InitLine(lines[i]);
	if (lines[i].get(".element") == null){
	    lines[i].AddElem = xed.AddElem;
	}
    }
    var elem = xed.work.get('.element.active');
    if (!elem){  
	var line = xed.work.get('.line');
        if (line)
        {
            elem = null;
        }
        else
        {
            line = xed.AddLine();
            elem = line.AddElem();
        }
        line.add(".current");
    }
    xed.ActivateElement(elem);    
    xed.inputElement.onkeyup = xed.navig;
    xed.inputElement.onkeypress = xed.ProcessInput;
    if (element.OnInit){
	element.OnInit(element);
    }
};

xed.fileLoaded = function(context){
    xed.info("file_loaded", xed.file);
    xed.initInternal(context);
};
    
xed.SaveFile = function(callback){
    if (xed.file){
	Files.Set(xed.file + ".xfile", xed.work.innerHTML, xed.SaveFileComplete, {handler: callback});
	return true;
    }
    return false;
};

xed.CompileFile = function(callback){
    if (xed.file){
	var html = xed.work.textContent;
	Files.Set(xed.file, html, xed.SaveFileComplete, {handler: callback});
	return true;
    }
    return false;
};

xed.SaveFileComplete = function(){
    if (typeof this.handler == 'function'){
	this.handler(xed.file);
    }
    if (Notification){
	Notification.Info("saved", xed.file);
    }
};


xed.InitLine = function(line){
    line.AddElem = xed.AddElem;
    line.IsEmpty = xed.lineIsEmpty;
    return line;
};


xed.AddLine = function(beforeLine){
    if (beforeLine){
        var line = DOM.div('.line');
        xed.work.insertBefore(line, beforeLine);
    }
    else{
	var line = xed.work.div('.line');
    }
    line.AddElem = xed.AddElem;
    line.IsEmpty = xed.lineIsEmpty;
    return line;
};

xed.AddElem = function(beforeElem){
    if (beforeElem){
        var elem = DOM.div('.element');
        this.parentNode.insertBefore(elem, beforeElem);
    }
    else{
	var elem = this.div('.element');
    }    
    elem.onclick = xed.ElementClick;    
    return elem;
};

xed.ElementClick = function(event){
    xed.ActivateElement(this);
};

xed.ActivateElement = function(elem){
    if (elem){
        var act = xed.work.get('.element.active');
        if (act){
            //act.deactivate();
	    act.del(".active");
            xed.work.OnDeactivateElem.fire(null, act);
        }
        xed.currentElem = elem;
	elem.activated = true;
	elem.add(".active");
        xed.work.OnActivateElem.fire(null, elem);
	xed.inputElement.SetCoord(elem.offsetLeft, elem.offsetTop);
	xed.inputElement.focus();
    }
};

xed.ActivateLine = function(line){
    if (line){
        xed.work.all('.line.current').del('.current');
        line.add('.current');
	if (line.activate){
	    line.activate();
	}
    }
};

xed.RemoveLine = function(line){
    if(line){
	line.del();
    }
};


xed.lineIsEmpty = function(){
    var elems =  this.all(".element");
    for(var i = 0; i < elems.length; i++) {
	if (line.children[i].innerHTML.length > 0) {
	    return false;
	}    
    }   
    return true;
}

xed.ProcessInput = function(event){
    if (!xed.currentElem) return false;
    if (event.charCode <= 32) return false;
    var symbol = String.fromCharCode(event.charCode);
    if (symbol != ' '){
	if (xed.currentElem.activated){
	    xed.currentElem.innerHTML = symbol;   
	    xed.currentElem.activated = false;
	}
	else{
	    xed.currentElem.innerHTML += symbol;
	}
    }
    if (xed.auto){
	xed.auto.aggregate(xed.currentElem, symbol);
    }
    return false;
};

xed.navig = function(event){
    var currentElem = xed.work.get('.element.active');
    if (!currentElem){
	currentElem = xed.work.get('.element');
    }    
    var line = currentElem.parentNode;
    var nextLine = null;
    var prevLine = null;
    var nextElem = null;
    var result = false;
    var autoString = null;
    if (xed.auto){
	autoString = xed.auto.aggregate(currentElem, null, event);
    }
    switch(event.keyCode){
	case 33:                 //PgUp
	    nextLine = line.parentNode.firstChild;
	    nextElem = nextLine.firstChild;
	    break;
	case 34:                   //PgDown
	    nextLine = line.parentNode.lastChild;
	    nextElem = nextLine.firstChild;
	    break;
	case 36:                                   //Home
	    nextElem = line.firstChild;
	    break;
	case 35:                                   //End
	    nextElem = line.lastChild;
	    break;		    
	case 8:               //backSpace   , удаление пустых строк
	    var ElementIsEmpty = true;		
	    //если элемент не пустой то стирается 1 символ
	    if (currentElem.innerHTML.length > 0)
	    {
		var text = currentElem.innerHTML;
		currentElem.innerHTML = text.substring(0, text.length - 1);		   		   
		ElementIsEmpty = text.length == 0;
	    } 		
	    //если элемент пуст то перейти на предыдущий
	    if (ElementIsEmpty){
		if (currentElem.previousSibling) {
		    nextElem = currentElem.previousSibling;
		    currentElem.del();
		}
		else{
		    if(line.IsEmpty) {// если строка пустая, то перейти наверх
			nextLine = line.previousSibling;		    
			nextElem = nextLine.lastChild;   
			xed.RemoveLine(line);		    
		    } 		
		}
	    }
	    break;	  
		case 38:	    // 38 up		
	    nextLine = line.previousElementSibling;		
	    if (nextLine){
		nextElem = nextLine.get(".element");
	    }
	    else{
		nextElem = line.get(".element");
	    }
	    break;		
		case 40:		// 40 down		
	    nextLine = line.nextElementSibling;
	    if (nextLine){
		nextElem = nextLine.get(".element");
	    }
	    else{
		nextLine = xed.AddLine();
		nextElem = nextLine.AddElem();
	    }
	    break;		
		case 37:	    // 37 left
	    nextElem = currentElem.previousElementSibling;
	    if (!nextElem){
		nextLine = line.previousElementSibling;
		nextElem = nextLine.get(".element:last-child");
	    }
	    break;		
		case 39:	    // 39 right
	    nextElem = currentElem.nextElementSibling;
	    if (!nextElem){
		nextLine = line.nextElementSibling;
		if (nextLine){
		    nextElem = nextLine.get(".element");
		}
		else{
		    nextLine = xed.AddLine();
		    nextElem = nextLine.AddElem();
		}
	    }
	    break;
		case 13:	    //13 return enter
	    if (event.ctrlKey && autoString && currentElem){
		currentElem.innerHTML = autoString.innerHTML;
	    }
	    nextLine = line.nextElementSibling;
	    if (nextLine)
	    {
		if (event.shiftKey){
		    nextLine = xed.AddLine(nextLine);
		    nextElem = nextLine.AddElem();   
		}
		else{
		    nextElem = nextLine.get(".element");
		}
	    }
	    else{
		nextLine = xed.AddLine();
		nextElem = nextLine.AddElem();		    
	    }
	    break;
	case 32:// 32 space
	case 45://insert
	    if (event.ctrlKey && autoString && currentElem){
		currentElem.innerHTML = autoString.innerHTML;
	    }
	    var nextElem = currentElem.nextElementSibling;
	    if (nextElem)
	    {
		nextElem = line.AddElem(nextElem);
	    }
	    else{
		nextElem = line.AddElem();
	    }
	    break;
		case 46: //delete , удаление пустых строк		
	    var el = line.all(".element");
	    if(el.length > 1){		    		    
		if(currentElem.nextElementSibling){ nextElem = currentElem.nextElementSibling;} else { nextElem = currentElem.previousElementSibling;}
		currentElem.del();		    
	    } 
	    else {
		if(line.nextElementSibling){
		    nextLine = line.nextElementSibling;
		} 
		else {
		    nextLine = line.previousElementSibling;			
		}		    
		if (nextLine != null){
		    nextElem = nextLine.get(".element");
		    xed.RemoveLine(line); 
		}
		else{
		    currentElem.del();
		    nextElem = line.AddElem();
		}
	    }
	    break;
		default:
	    result = true;
	    break;
    }
    if (nextLine != line){
	xed.ActivateLine(nextLine);
    }
    if (nextElem != currentElem){
	if (autoString && currentElem && !currentElem.state && currentElem.innerHTML == autoString.innerHTML){
	    xed.state = autoString.attr("name");
	    currentElem.attr('state', xed.state);
	    currentElem.state = xed.state;
	    if (xed.state){
		currentElem.cls(xed.state);
	    }
	}
	xed.state = currentElem.state;
	xed.ActivateElement(nextElem);
	currentElem = nextElem;
    }
    return result;
};


xed.positElem = function(element,elementPos,clas){
    var obj = element.all(clas);
    for(var i = 0; i<obj.length;i++){
        if(obj[i]==elementPos){
            xed.posit=i;
        }
    }
    return false;
};

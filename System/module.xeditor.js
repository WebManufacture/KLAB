xed={};

xed.init = function () {
    xed.work = undefined;
    xed.temp=undefined;
};

xed.initComponent = function(element) {
    xed.work = element;
    var lines = element.all(".line");
    for (var i = 0; i < lines.length; i++){
	lines[i].AddElem = xed.AddElem;
    }
    var elem = xed.work.get('.element.active');
    if (elem){  
	ed.initComponent(elem);
    }    
    else{
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
    window.addEventListener('keydown',xed.navig,false);
    element.focus();
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
    ed.initComponent(elem);
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
            act.deactivate();
            ac.deactivate(elem);
        }
        elem.activate();
        ac.activate(elem);
    }
};

xed.ActivateLine = function(line){
    if (line){
        xed.work.all('.line.current').del('.current');
        line.add('.current');
        line.activate();
    }
};

xed.navig = function(event){
    var currentElem = xed.work.get('.element.active');
    if (!currentElem){
	currentElem = xed.work.get('.element');
    }
    if(event.ctrlKey || event.keyCode==38){
	
    }
    else if (event.ctrlKey || event.keyCode==40){
	
    }
    var line = currentElem.parentNode;
    var nextElem = null;
    if(!event.ctrlKey){
	switch(event.keyCode){
	    case 38:	    // 38 up
		var prevLine = line.previousElementSibling;
		if (prevLine){
		    xed.ActivateLine(prevLine);
		    nextElem = prevLine.get(".element");
		}
		else{
		    nextElem = line.get(".element");
		}
		break;		
		    case 40:		// 40 down
		var nextLine = line.nextElementSibling;
		if (nextLine){
		    xed.ActivateLine(nextLine);
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
		    var prevLine = line.previousElementSibling;
		    xed.ActivateLine(prevLine);
		    nextElem = prevLine.get(".element:last-child");
		}
		break;		
		    case 39:	    // 39 right
		nextElem = currentElem.nextElementSibling;
		if (!nextElem){
		    var nextLine = line.nextElementSibling;
		    if (nextLine){
			xed.ActivateLine(nextLine);
			nextElem = nextLine.get(".element");
		    }
		    else{
			nextLine = xed.AddLine();
			nextElem = nextLine.AddElem();
		    }
		}
		break;
		    case 13:	    //13 return enter
		nextElem = currentElem.nextElementSibling;
		if (nextElem)
		{
		    var nextLine = xed.AddLine(line);
		    while (nextElem != null){
			var nextNextElem = nextElem.nextElementSibling;
			nextLine.add(nextElem);
			nextElem = nextNextElem;
		    }
		    nextElem = nextLine.get(".element");
		}
		else{
		    var nextLine = line.nextElementSibling;
		    if (nextLine){
			xed.ActivateLine(nextLine);
			nextElem = nextLine.get(".element");
		    }
		    else{
			nextLine = xed.AddLine();
			nextElem = nextLine.AddElem();
		    }
		}
		break;
		    case 32:// 32 space
	    case 45://insert
		var nextElem = currentElem.nextElementSibling;
		if (nextElem)
		{
		    nextElem = line.AddElem(nextElem);
		}
	    else{
		nextElem = line.AddElem();
	    }
	    break;
		case 46: //delete
	    var nextElem = currentElem.nextElementSibling;
	    currentElem.del();
	    currentElem=nextElem;
    }}
    
    xed.ActivateElement(nextElem);
    return true;
};


xed.positElem = function(element,elementPos,clas){
    var obj = element.all(clas);
    for(var i = 0; i<obj.length;i++){
        if(obj[i]==elementPos){
            xed.posit=i;
        }
    }
};

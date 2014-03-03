var xed={};
xed.work = undefined;
xed.str = undefined;
xed.element = undefined;
xed.strNum=1;
xed.allStr = undefined;
xed.start = function() {
    body = document.body;
    if (body.get('.work') == null) {
        xed.work = body.div('.work');
        if (xed.str == null) {
            xed.newStr(xed.work);
        }
    }
    else {
        xed.work = DOM('.work');
        xed.allStr = xed.work.all('.str');
        xed.srt = str[xed.allStr.length - 1];
        var elem = xed.str.all('.element');
        xed.element = elem[elem.length - 1];
    }
    window.onkeydown = xed.navig;
};
xed.newStr = function(){
    xed.str = xed.work.div('.str');
    xed.str.add('@num', xed.strNum.toString());
    xed.strNum++;
    xed.allStr=DOM.all('.str').length;
};
xed.navig = function(event){
    if(event.keyCode==38){
        xed.str=xed.str.previousSibling
	    }
    // 38 up
    else if(event.keyCode==40){
        xed.str=xed.str.nextSibling;
	}
    // 40 down
    else if(event.keyCode==37){
        xed.element=xed.element.nextSibling;
	}
    // 37 left
    else if(event.keyCode==39){
        xed.element=xed.element.previousSibling
	    }
    // 39 ring
};
xed.newElem = function(){
    xed.element = xed.str.div('.element');
};
//str.substring(0, str.length - 1) 
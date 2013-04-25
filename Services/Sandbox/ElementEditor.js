ED=ed={};

ed.init = function(){
    ed.currentElement = undefined;//Этого можно не писать
    return true;
};

ed.initComponent = function(element){
    element.activate = ed.activate;
    element.deactivate = ed.deactivate;
};

ed.activate = function(){
    ed.currentElement = this;
    this.add(".active");
    window.addEventListener('keydown',ed.backspace,false);
    window.addEventListener('keypress',ed.addText,false);
};

ed.deactivate = function(){
    ed.currentElement = null;
    this.del(".active");
    window.removeEventListener('keydown',ed.backspace,false);
    window.removeEventListener('keypress',ed.addText,false);
};

ed.addText = function(event){
    if (!ed.currentElement) return true;
    if (event.charCode == 0) return true;
    var symbol = String.fromCharCode(event.charCode);
    if (symbol != ' '){
        ed.currentElement.innerHTML += symbol;
    }
    return true;
};

//ed.backspace = function(event){
//    if (!ed.currentElement) return true;    
//    if(event.keyCode==8){
//        var text = ed.currentElement.innerHTML;
//        ed.currentElement.innerHTML=text.substring(0, text.length - 1);
//        return true;
//    }
//};

  Drag = {dragObject : null};

  Drag.Context = { Selector: "[draggable='true']", Condition : "System.Windows.htm"}; 
  Drag.Context.Process = function(element){
     Drag.MakeDraggable(element);
     element.cls("draggable");
  }

  Contexts.Add(Drag.Context);

  Drag.Init = function(text){
    W.Body.ondragover = Drag.BodyOver;
    W.Body.ondrop = Drag.BodyDrop;
  }
    
  Drag.BodyOver = function(event){
//    alert (
    var elem = Drag.dragObject;
    if (Check(elem)){
      var dragType = Drag.dragType;
      if (dragType == "application/jasp-window"){
        elem.style.left = (event.pageX - Drag.startX) + "px";
        elem.style.top = (event.pageY - Drag.startY) + "px";
        event.preventDefault();
        return true;
      }
      if (dragType == "resize"){
        var width = event.pageX - elem.offsetLeft;
        var height = event.pageY - elem.offsetTop;
        elem.style.width = width + "px";
        elem.style.height = height + "px";
        event.preventDefault();
        return true;
      }
      if (dragType == "element" || dragType == "dragger"){
        elem.style.left = (event.pageX - Drag.startX) + "px";
        elem.style.top = (event.pageY - Drag.startY) + "px";
        event.preventDefault();
        return true;
      }
    }
    return false;
  }
    
  Drag.BodyDrop = function(event){
//    alert (
    return false;
  }
    
  Drag.DragStart = function(){
      
  }
    
  Drag.DragElement = function(event){
//    alert (
    /*var elem = event.target;
    var dragType = elem.attr("drag-type");
    if (dragType == "application/jasp-window"){
      Drag.event = event;      
      elem.style.left = event.X + "px";
      elem.style.top = event.Y + "px";
      event.preventDefault();
      return true;
    }
    return false;*/
  }
    
  Drag.DragElementStart = function(event){
    var dt = event.dataTransfer;
    dt.setData("application/node", this.outerHTML);
    dt.effectAllowed = "move";
    dt.dropEffect = "move";
    Drag.dragType = this.attr("drag-type");
    Drag.startX = event.pageX - this.offsetLeft;
    Drag.startY = event.pageY - this.offsetTop;
    if (Drag.dragType == "resize")
    {
       Drag.dragObject = this.parentNode; 
       event.stopPropagation();
       return true;
    }
    if (Drag.dragType == "element")
    {
       Drag.dragObject = this; 
       event.stopPropagation();
       return true;
    }
    if (Drag.dragType == "dragger")
    {
       Drag.dragObject = this.parentNode; 
       Drag.startX = event.pageX - Drag.dragObject.offsetLeft;
       Drag.startY = event.pageY - Drag.dragObject.offsetTop;
       event.stopPropagation();
       return true;
    }
    Drag.dragObject = this;
    return true;
  }
    
  Drag.CreateElementImage = function(element)
  {
    var canvas = document.createElementNS("http://www.w3.org/1999/xhtml","html:canvas");
    canvas.width = element.offsetWidth;
    canvas.height = element.offsetHeight;
  
    var ctx = canvas.getContext("2d");
    ctx.lineWidth = 4;
    ctx.moveTo(0, 0);
    ctx.lineTo(50, 50);
    ctx.moveTo(0, 50);
    ctx.lineTo(50, 0);
    ctx.stroke();
    
    return canvas;
  }
    
    
  Drag.MakeDraggable = function(element){
     element.ondragstart = Drag.DragElementStart;
     element.ondrag = Drag.DragElement;
     element.attr("draggable", "true");
  }

  Drag.Init();
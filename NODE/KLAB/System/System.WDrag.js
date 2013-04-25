
  Drag = {dragObject : null};
  
  Drag.Init = function(text){
    W.Body.eadd("drop", Drag.BodyDrop);
    W.Body.eadd("dragover", Drag.BodyOver);
  }  
    
  Drag.BodyOver = function(event){
    event.preventDefault();
    return false;
  }
    
  Drag.BodyDrop = function(event){
    if (Check(Drag.dragObject))
    {
      Drag.dragObject.style.left = (event.clientX - Drag.startX) + "px";
      Drag.dragObject.style.top = (event.clientY - Drag.startY) + "px";
    }
    event.preventDefault();
    return false;
  }    
        
  Drag.DragElementStart = function(event){
    var dt = event.dataTransfer;
    dt.setData("Node", this.outerHTML);
    dt.effectsAlloved = "all";
    var win = Drag.dragObject = this.findParent("win");
      if (win == null) win =Drag.dragObject = this; 
    var offset = win.getBoundingClientRect();
    Drag.startX = event.clientX - offset.left;
    Drag.startY = event.clientY - offset.top;
    dt.setDragImage(win, Drag.startX, Drag.startY);
    Drag.dragObject.cls("dragging");
    event.stopPropagation();
    return false;
  }
    
  Drag.DragElementEnd = function(event){
    this.rcs("dragging");
    Drag.dragObject = null;
    event.stopPropagation();
    return false;
  }
        
    
  Drag.MakeDraggable = function(element){
     element.attr("draggable", "true"); 
     element.cls("draggable");
     element.eadd("dragstart", Drag.DragElementStart);
     element.eadd("dragend", Drag.DragElementEnd);
  }
          
  Drag.Init();
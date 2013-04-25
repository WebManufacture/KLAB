  Drag = {dragObject : null};
  
  Drag.Init = function(text){
    document.addEventListener("dragdrop", Drag.BodyDrop);
    document.addEventListener("dragover", Drag.BodyOver);
  }  
    
  Drag.BodyOver = function(event){
    event.preventDefault();
    return false;
  }
    
  Drag.BodyDrop = function(event){
    if (Drag.dragObject)
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
    var win = Drag.dragObject;
    //if (this._is(".dragger")){
	//win = this._get("^.draggable");  
    //}
    if (win == null) win = Drag.dragObject = this; 
    var offset = win.getBoundingClientRect();
    Drag.startX = event.screenX - offset.left;
    Drag.startY = event.screenY - offset.top;
    dt.setDragImage(win, Drag.startX, Drag.startY);
    Drag.dragObject.className = Drag.dragObject.className + " " + "dragging";
    event.stopPropagation();
    return false;
  }
    
  Drag.DragElementEnd = function(event){
	  this.className = (function(cls, dcn){
		  var clsArr = cls.split(' ');
		  for (var i = 0; i < clsArr.length; i++){
			  if (clsArr[i] == dcn){
				  clsArr.splice(i, 1);
				  i--;
			  };
			  
		  };
		  return clsArr.join(' ')
	  })(this.className, 'dragging');
    //this.rcs("dragging");
    Drag.dragObject.style.left = (event.screenX - Drag.startX) + "px";
    Drag.dragObject.style.top = (event.screenY - Drag.startY) + "px";
    Drag.dragObject = null;
    event.stopPropagation();
	  
	  Blocks.BustConnections();
    return false;
  }
        
    
  Drag.MakeDraggable = function(element){
     element.draggable = true; 
     //element.className = element.className + " " + "draggable";
	  element.className = (function(cls, acn){
		  var clsArr = cls.split(' ');
		  for (var i = 0; i < clsArr.length; i++){
			  if (clsArr[i] == acn){
				 return clsArr.join(' '); 
			  };  
		  };
		  clsArr.push(acn);
		  return clsArr.join(' ');
	  })(element.className, 'draggable');
     element.addEventListener("dragstart", Drag.DragElementStart);
     element.addEventListener("dragend", Drag.DragElementEnd);
  }
         

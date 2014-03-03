Drag = {dragObject : null};

Drag.dContext = { Selector: "[draggable='true']", Condition : "System.Windows.htm"};
Drag.dContext.Process = function(element){
    Drag.MakeDraggable(element);
    element.add(".draggable");
};

Contexts.Add(Drag.dContext);

Drag.rContext = { Selector: ".drop-receiver", Condition : "System.Windows.htm"};
Drag.rContext.Process = function(element){
    Drag.MakeReceiver(element);
};

Contexts.Add(Drag.rContext);

Drag.Init = function(text){
    WS.Body.addEventListener("drop", Drag.BodyDrop);
    WS.Body.addEventListener("dragover", Drag.BodyOver);
};

Drag.BodyOver = function(event){
    if (Drag.dragType == "resize"){
        var width = event.pageX - Drag.dragObject.offsetLeft;
        var height = event.pageY - Drag.dragObject.offsetTop;
        Drag.dragObject.style.width = width + "px";
        Drag.dragObject.style.height = height + "px";
    }
    event.preventDefault();
    return false;
};

Drag.BodyDrop = function(event){
    if (Check(Drag.dragObject) && "clone clone-proto dragger self".contains(Drag.dragType))
    {
        if (Drag.dragObject.has("no-body-drop"))
            return false;
        if (Drag.dragType == "clone" || Drag.dragType == "clone-proto")
        {
            var clone = Drag.dragObject.clone();
            clone.dragProto = Drag.dragObject;
            clone.style.width = Drag.dragObject.offsetWidth + "px";
            clone.style.height = Drag.dragObject.offsetHeight + "px";
            Drag.dragObject = clone;
            if (clone.is("[drag-type]")){
                clone.add("@draggable", "true");
                Drag.MakeDraggable(clone);
            }
        }
        else
        {
            if (!Drag.dragObject.has("fixed-width")){
                Drag.dragObject.style.width = Drag.dragObject.offsetWidth + "px";
                Drag.dragObject.style.height = Drag.dragObject.offsetHeight + "px";
            }
        }
        Drag.dragObject.style.left = (event.clientX - Drag.startX) + "px";
        Drag.dragObject.style.top = (event.clientY - Drag.startY) + "px";
        Drag.dragObject.add(".body-element");
        W.Body.add(Drag.dragObject);
    }
    event.preventDefault();
    return false;
}

Drag.DropObject = function(event){
    this.del(".dragover");
    if (Check(Drag.dragObject))
    {
        if (Check(this.dragFilter) && !Drag.dragObject.is(this.dragFilter)) return true;
        Drag.dragObject.add(".dropped");
        if (Drag.dragType == "clone" || Drag.dragType == "clone-proto")
        {
            var clone = Drag.dragObject.clone();
            clone.dragProto = Drag.dragObject;
            Drag.dragObject = clone;
        }
        if (Drag.dragType == "self" || Drag.dragType == "dragger")
        {
            Drag.dragObject = Drag.dragObject;
        }
        if (Check(this.objectReceived) || Check(this.controller))
        {
            var result = true;
            if (Check(this.controller)){
                result &= this.Event("objectReceived", Drag.dragObject, this);
            }
            if (Check(this.objectReceived)){
                result &= this.objectReceived(Drag.dragObject);
            }
            if (result){
                this.add(Drag.dragObject);
                if (!Drag.dragObject.has("fixed-width")){
                    Drag.dragObject.style.width = Drag.dragObject.offsetWidth + "px";
                    Drag.dragObject.style.height = Drag.dragObject.offsetHeight + "px";
                }
                Drag.dragObject.style.left = (event.clientX - Drag.startX) + "px";
                Drag.dragObject.style.top = (event.clientY - Drag.startY) + "px";
            }
        }
        else
        {
            if (!Drag.dragObject.has("no-body-drop"))
                this.add(Drag.dragObject);
        }
        event.stopPropagation();
        return false;
    }
    else
    {
        var data = event.dataTransfer.getData("text/html");
        data = WS.Wrap(data);
        if (Check(this.dragFilter) && !data.is(this.dragFilter))
        {
            return false;
        }
        if (Check(this.objectReceived))
        {
            this.objectReceived(data);
        }
        else
        {
            this.add(data);
        }
        event.stopPropagation();
        return false;
    }
    return true;
}

Drag.ReceiverEnter = function(event){
    if (Check(Drag.dragObject)){
        if (Check(this.dragFilter) && !Drag.dragObject.is(this.dragFilter))
        {
            return false;
        }
        this.cls("dragover");
        Drag.dragObject.cls("receiver-accept");
    }
    else
    {
        var data = event.dataTransfer.getData("text/html");
        if (check(data)){
            data = WS.Wrap(data);
            if (Check(this.dragFilter) && !data.is(this.dragFilter))
            {
                return false;
            }
            this.add(".dragover");
        }
    }
    return true;
}

Drag.ReceiverOver = function(event){
    event.stopPropagation();
    return false;
}

Drag.ReceiverLeave = function(event){
    this.del(".dragover");
    if (Check(Drag.dragObject)){
        Drag.dragObject.del(".receiver-accept");
    }
}

Drag.DragElementStart = function(event){
    var dt = event.dataTransfer;
    dt.setData("Node", this.outerHTML);
    dt.effectsAlloved = "all";
    Drag.dragType = this.dragType;
    Drag.dragObject = null;
    if (Drag.dragType == "resize")
    {
        Drag.dragObject = this.parentNode;
        Drag.SetClickCoords(event);
        dt.setDragImage(this, 0, 0);
        event.stopPropagation();
        return false;
    }
    if (Drag.dragType == "dragger")
    {
        Drag.dragObject = this.parentNode;
        Drag.SetClickCoords(event);
    }
    if (Drag.dragType == "clone-proto")
    {
        var proto = this.get(".drag-proto");
        if (proto == null && this.getDragClone != undefined){
            proto = this.getDragClone();
        }
        Drag.dragObject = proto;
        Drag.startX = 0;
        Drag.startY = 0;
    }
    if (Drag.dragObject == null)
    {
        Drag.dragObject = this;
        Drag.SetClickCoords(event);
    }
    dt.setDragImage(Drag.dragObject, Drag.startX, Drag.startY);
    Drag.dragObject.add(".dragging");
    event.stopPropagation();
    return false;
}

Drag.SetClickCoords = function(event){
    var offset = Drag.GetElemScreenCoords(Drag.dragObject);
    Drag.startX = event.clientX - offset.X;
    Drag.startY = event.clientY - offset.Y;
}

Drag.GetElemScreenCoords = function(elem){
    var offset = elem.getBoundingClientRect();
    offset.Y = offset.top;
    offset.X = offset.left;
    return offset;
}

Drag.DragElementEnd = function(event){
    this.del(".dragging");
    if (this.OnDrop){
        this.OnDrop(event);
    };
    Drag.dragObject = null;
    event.stopPropagation();
    return false;
}


Drag.MakeDraggable = function(element, dragType){
    if (!Check(dragType)){
        dragType = element.add("@drag-type");
    }
    element.dragType = dragType;
    element.add("@drag-type", dragType)
    element.add("@draggable", "true");
    element.add(".draggable");
    element.addEventListener("dragstart", Drag.DragElementStart);
    element.addEventListener("dragend", Drag.DragElementEnd);
}

Drag.MakeReceiver = function(element, filter){
    element.add(".drop-receiver");
    element.add("@droppable", "true");
    element.ondrop = Drag.DropObject;
    element.ondragenter = Drag.ReceiverEnter;
    element.ondragleave = Drag.ReceiverLeave;
    if (!Check(filter)){
        filter = element.attr("drop-filter");
    }
    element.dragFilter = filter;
    element.add("@drop-filter", filter)
}
WS.DOMload(Drag.Init); 
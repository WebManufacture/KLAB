window.MRT_IS_OSC_BOOKMARKLET_CONTROLLER = {
  parentContainer : null,
  
  Init: function()
  {
    this.parentContainer = $("#MRT-IS-OSC-faveletDiv");
    this.parentContainer.draggable();
    $("img").draggable({zIndex: 11, revert: true, opacity: 0.5, helper: "clone"});
    $("img").addClass("MRT_IS_OSC_BOOKMARKLET_Images_draggableClass");
    $("img").attr("draggable", "true");
    $("#MRT_IS_OSC_BOOKMARKLET_ImagesDropPlace").droppable({accept:".MRT_IS_OSC_BOOKMARKLET_Images_draggableClass", activeClass: 'image-drag-active', hoverClass: 'image-drag-accept'});
  },
  
  ElementDragged: function()
  {
    
  }
}  

$(MRT_IS_OSC_BOOKMARKLET_CONTROLLER.Init());
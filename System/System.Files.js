FileSystem = {};

FileSystem.Init = function() {
    if (Request.Params.url){
	AX.Init(Request.Params.url);
	AX.SystemRoot = Request.Params.url;
    }    
    FileSystem.Win = W.get(".files-block");
    FileSystem.Tree = W.get(".files-block .tree-container");
    FileSystem.Filter = W.get(".files-block .filter");
    var url = "browse";
    if (Check(Request.Params.filter)){
	url += "&filter=" + Request.Params.filter;
    }
    url = X.Handle(url, FileSystem.LoadTreeComplete);
    Drag.NoBodyDrop = true;
    E.AddHandler("OnModuleRegistered", FileSystem.ProcessTags, "system.tags.htm");
};

FileSystem.ReloadSystem = function() {
    FileSystem.Tree.clear();
    var url = X.Handle("reload", FileSystem.LoadTreeComplete);
};


FileSystem.GetActiveFiles = function() {
    return  FileSystem.Tree.findAll(".File.selected");
};

FileSystem.LoadTreeComplete = function(result) {
    FileSystem.Tree.add(this.responseText);
    if (Check(window.Tags)){
	FileSystem.ProcessTags();
    }
    var files = FileSystem.Tree.findAll(".File");
    for (var i=0; i < files.length; i++){
	FileSystem.InitFileElement(files[i]); 
    } 
    //$("#files-block .tree-container .tag").addClass("ui-item");
};

FileSystem.ProcessTags  = function(result) {
    Tags.OnTagSelected = FileSystem.TagClick;
    var tag = FileSystem.Tree.get("tag");
    while (tag != null){
	var next = tag.nextElementSibling;
	Tags.Add(tag);
	if (next == null || next.sname != "tag"){
	    tag = null; 
	}
	else{
	    tag = next; 
	}
    }
};

FileSystem.InitFileElement = function(elem){
    var fileName = elem.fileName = elem.attr("name");
    elem.cls("file");
    var name = elem.name = elem.get("name");
    elem.onclick = FileSystem.ShowContextMenu;
    elem.ondblclick = FileSystem.LoadFile;
    Drag.MakeReceiver(elem, "tag");
    elem.objectReceived = FileSystem.TagDropped;
    var tags = elem.findAll(".tag");
    for (var i=0; i < tags.length; i++){
	FileSystem.InitTagElement(tags[i]); 
    } 
    
};

FileSystem.InitTagElement = function(tag){  
    var result = false;
    var name = tag.attr("name");
    if (name == null || name == "")
    {
	var file = tag.findParent(".File");
	if (file != null){
	    file.cls("ERROR"); 
	}
	tag.del();
	return;
	    }
    tag.cls(name);
    Drag.MakeDraggable(tag, "clone");
    tag.onclick = FileSystem.TagClick; 
    return result;
};


FileSystem.NewFileReturned = function(result) {
    if (this.responseText == "Error!" || result == "Error!")
    {
	Notify.Error("Error!");
	return;
	    }
    var files = W.Wrap(this.responseText);
    if (files.has("tag")) {
	FileSystem.InitTagElement(files);
    }
    Notify.Show("<h4>Добавлены файлы:<h4>" + result);
};

FileSystem.tagFilterStarted = false;
FileSystem.tagFilterInterval = null;

FileSystem.RenewInterval = function(start){
    FileSystem.tagFilterStarted = true;
    window.clearTimeout(FileSystem.tagFilterInterval);
    FileSystem.tagFilterInterval = window.setTimeout(FileSystem.ClearInterval, 1000);
};

FileSystem.ClearInterval = function(){
    window.clearTimeout(FileSystem.tagFilterInterval);
    FileSystem.tagFilterStarted = false;
    if (FileSystem.Filter != null)
    FileSystem.Filter.rcs("active");
};


FileSystem.ClearTagFilter = function() {
    window.clearTimeout(FileSystem.tagFilterInterval);
    var files = FileSystem.Tree.findAll(".file");
    for (var i=0; i < files.length; i++){
	files[i].show();
    }
    if (FileSystem.Filter != null)
    FileSystem.Filter.clear();
};


FileSystem.TagClick = function(name) {
    if (typeof(name) != "string"){
	var name = this.attr("name");
    }
    if (name.length <= 0) {
	FileSystem.ClearTagFilter();
	return false;
    }
    else {
	if (!FileSystem.tagFilterStarted)
	{
	    FileSystem.ClearTagFilter();           
	}
	var files = FileSystem.Tree.findAll(".file:not(." + name + ")");
	for (var i=0; i < files.length; i++){
		files[i].hide();
	    }
	if (FileSystem.Filter != null){
	    FileSystem.Filter.cls("active");
	    FileSystem.Filter.add("<span class='filter'>" + name + "&gt;" + "</span>");
	}
	FileSystem.RenewInterval();
	//$("#files-block .tree-container .File." + name).show();
    }
};

FileSystem.TagDropped = function (elem)
    {
	var tag = elem.attr("name");
	var fileName = this.attr("name");
	if (this.has(tag))
	{
	    this.rcs(tag);
	    tag = this.get(".tags tag[name='" + tag +"']");
	    if (tag != null){
		tag.del();
	    }
	    X.ContentGet(fileName, "resettag&tag=" + tag, FileSystem.OnTagSet);
	}
	else
	{
	    this.get(".tags").add(elem);
	    this.cls(tag);
	    FileSystem.InitTagElement(elem);
	    X.ContentGet(fileName, "settag&tag=" + tag, FileSystem.OnTagSet);
	}
    };


FileSystem.OnTagSet = function(result) {
    var fileName = W.Wrap(this.responseText).attr("name");
    Notify.Show(fileName + "tag added");
    //var element = $("#files-block .tree-container .File[name='" + fileName + "']");
    //element.replaceWith(result);
};


FileSystem.DeleteDoc = function() {
    var elements = FileSystem.GetActiveFiles();
    for (var i = 0; i<elements.length; i++){
	X.ContentGet(escape(elements[i].attr(name)), "delete", FileSystem.LogResult);
	elements[i].del();
    }
};

FileSystem.LogResult = function() {
    Notify.Show(this.responseText);
} ; 

FileSystem.ShowContextMenu = function() {
    this.toggle("selected");
    /*ShowAdvanced("files");
$("#btnSetBackground").hide();
if (activeFiles.hasClass("jpg") || activeFiles.hasClass("png")) {
$("#btnSetBackground").show();
}*/
				    };

FileSystem.CreateNewDoc = function() {
    var dialog = W.get(".edit-name-dialog");
    dialog.show();
    dialog.onapply = FileSystem.NewDocApply;
};

FileSystem.NewDocApply = function(name) {
    if (name.length > 0) {
	X.ContentGet(escape(name), "new", FileSystem.NewDocCreated);
    }
};

FileSystem.NewDocCreated = function(result) {
    var file = FileSystem.Tree.add(this.responseText);
    FileSystem.InitFileElement(file);
    Notify.Show(file.fileName + " file created");
    window.open(X.ServerRoot + "System.TextEditor.htm?file=" + file.fileName);
};


function UrlUpLoad() {
    var dialog = W.get(".edit-name-dialog");
    dialog.show();
    dialog.onapply = FileSystem.OnUrlUpLoad;
}

FileSystem.OnUrlUpLoad = function(result) {
    var url = result;
    if (url.length > 0) {
	X.ContentGet(escape(url), "urlload", FileSystem.NewDocCreated);
    }
}

function CopyFile() {
    var file = GetActiveFile();
    var url = file.attr("name");
    url = GetProxiedUrl(escape(url), "filecopy");
    $.get(url, null, NewFileReturned);
}

function OnUploadFile() {
    $("#LoadDocDialog")[0].OnApply = OnUploadApply;
    $("#LoadDocDialog").show();
    
    var fileInput = document.getElementById("fileUploader");
    //fileInput.
}

function OnUploadApply() {
    $("#LoadDocDialog").hide();
    var files = document.getElementById("fileUploader").files;
    // object for allowed media types
    var accept = {
	binary: ["image/png", "image/jpeg"],
	text: ["text/plain", "text/javascript", "text/css", "application/xml", "text/html"]
    };
    var file;
    for (var i = 0; i < files.length; i++) {
	
	file = files[i];
	if (file !== null) {
            
	    var xhr = new XMLHttpRequest();
	    xhr.open("POST", GetProxiedUrl(file.fileName, "save"));
	    xhr.overrideMimeType(file.mediaType);
	    xhr.onload = NewFileReturned;
	    if (accept.binary.indexOf(file.type) > -1) {
		
		xhr.sendAsBinary(file.getAsBinary());
		continue;
		    }
	    if (accept.binary.indexOf(file.type) > -1) {
		xhr.sendAsText(file.getAsText());
		continue;
		    }
	}
    }
    $("#fileUploader").val("");
}


FileSystem.LoadFile = function() {
    if (this.has("Image") || this.has("png") || this.has("jpg") || this.has("gif")) {
	window.open(Request.CreateUrl(this.fileName));
	return this;
    }
    if (this.has("css") || this.has("htm") || this.has("html") || this.has("js") || this.has("cs")) {
	window.open(Request.CreateUrl("System.TextEditor.htm", "file=" + this.fileName));
	return this;
    }      
    window.open(Request.CreateUrl("System.TextEditor.htm", "file=" + this.fileName));
}
    
    
    
    
    FileSystem.Init(); 

FileSystem = {};

FileSystem.Init = function () {
    FileSystem.Win = DOM.get(".files-block");
    FileSystem.Tree = DOM.get(".files-block .tree-container");
    FileSystem.Filter = DOM.get(".files-block .filter");
    FileSystem.Loaded = false;
    FileSystem.Search = DOM.get(".search-elem");
    FileSystem.Search.designMode = "off";
    FileSystem.Search.onkeyup = FileSystem.SearchFile;
    Drag.NoBodyDrop = true;
    DOM.get(".files-block").addEventListener('drop', function (event) {
        if (event.dataTransfer.files) {
            // Если были заброшены файлы передадим массив функции addFiles.
            event.preventDefault();
            event.stopPropagation();

            var dt = event.dataTransfer;
            var files = dt.files;
            FileSystem.GlobalObjectDragged(files);

        }
    });
    var start = "";
    if (Request.Params.UserDomain) {
        start += Request.Params.UserDomain;
    }

    if (Request.Params.SystemPath) {
        start += "/" + Request.Params.SystemPath.replace('\\', '/');
    }
    document.title = start != "" ? "FS " + start : "Files System";
    AX.Command("browse", FileSystem.LoadTreeComplete);
    E.AddHandler("OnModuleRegistered", FileSystem.InitTags, "system.tags.htm");
};

FileSystem.ReloadSystem = function () {
    FileSystem.Tree.clear();
    AX.Command("browse", FileSystem.LoadTreeComplete);
};

FileSystem.GetActiveFiles = function () {
    return FileSystem.Tree.findAll(".File.selected");
};

FileSystem.LoadTreeComplete = function (result) {
    FileSystem.Tree.add(this.responseText);
    var files = FileSystem.Tree.findAll(".File");
    for (var i = 0; i < files.length; i++) {
        FileSystem.InitFileElement(files[i]);
    }
    FileSystem.Loaded = true;
};

FileSystem.InitTags = function () {
    if (!FileSystem.Loaded) {
        window.setTimeout(FileSystem.InitTags, 300);
        return;
    }
    Tags.style.left = "800px";
    Tags.style.top = "100px";
    Tags.OnTagSelected = FileSystem.TagClick;
    var files = FileSystem.Tree.findAll(".File");
    for (var i = 0; i < files.length; i++) {
        FileSystem.AttachTags(files[i]);
    }
};

FileSystem.AttachTags = function (file) {
    var tags = Tags.GetTagsByRef(file.fileName.toLowerCase());
    for (var i = 0; i < tags.length; i++) {
        file.AddTag(tags[i].attr("name"));
    }
};

FileSystem.InitFileElement = function (elem) {
    var fileName = elem.fileName = elem.attr("name");
    elem.cls("file");
    elem.tags = elem.adv("tags");
    elem.AddTag = FileSystem.AddTag;
    elem.ext = elem.attr("ext");
    if (!elem.ext || elem.ext == "") {
        elem.ext = "NOEXT";
        elem.attr("ext", elem.ext);
    }
    elem.AddTag(elem.ext);
    var name = elem.name = elem.get("name");
    elem.onclick = FileSystem.FileClick;
    elem.ondblclick = FileSystem.FileActivate;
    elem.objectReceived = FileSystem.TagDropped;
    Drag.MakeReceiver(elem, "tag");
    return elem;
};

FileSystem.AddTag = function (name) {
    this.cls(name);
    var tag = W.tag("tag", "tag", name);
    tag.name = name;
    tag.attr("name", name);
    Drag.MakeDraggable(tag, "clone");
    tag.onclick = FileSystem.TagClick;
	if (this.tags.firstChild){
		this.tags.insertBefore(tag, this.tags.firstChild);
	}
	else{
    	this.tags.add(tag);
	}
};

FileSystem.NewFileReturned = function (result) {
    if (this.responseText == "Error!" || result == "Error!") {
        Notify.Error("Error!");
        return;
    }
    FileSystem.Tree.appendChild(FileSystem.InitFileElement(DOM.div("", result).firstChild));
};


FileSystem.LoadFile = function (file) {
    if (file.has("Image") || file.has("png") || file.has("jpg") || file.has("jpeg") || file.has("gif")) {
        var url = "";
        if (Request.UserDomain) {
            url = "http://" + Request.UserDomain;
        }
        if (Request.SystemPath) {
            url += "/" + Request.SystemPath;
        }
        url += "/" + file.fileName;
        window.open(url);
        return file;
    }
    /*if (file.has("css") || file.has("htm") || file.has("html") || file.has("js") || file.has("cs")) {
window.open(Request.CreateUrl("System.TextEditor.htm", "file=" + file.fileName));
return file;
}*/
    var url = X.ServerRoot + "TextEditor.htm?file=" + file.fileName;
    if (Request.UserDomain) {
        url += "&UserDomain=" + Request.UserDomain;
        if (Request.SystemPath) {
            url += "&SystemPath=" + Request.SystemPath;
        }
    }
    window.open(url);
};

FileSystem.FileClick = function (event) {
    if (event.shiftKey) {
        this.toggle("selected");
        return;
    }
    if (event.ctrlKey) {
        window.open(Request.CreateUrl(this.fileName));
        return;
    }
    FileSystem.ShowContextMenu(this);
};

FileSystem.FileActivate = function () {
    FileSystem.LoadFile(this);
};

FileSystem.SearchFile = function () {
    var text = FileSystem.Search.innerHTML;
    text = text.trim("\n");
    text = text.trim(" ");
    text = text.replace("<br/>", "");
    text = text.replace("<br>", "");
    if (text.length > 0) {
        var files = FileSystem.Tree.findAll(".file");
        files.hide();/*
for (var i = 0; i < files.length; i++) {
files[i].show();
}*/
        files = FileSystem.Tree.findAll(".file[name*='" + text + "']");
        files.show();
    }
    else {
        var files = FileSystem.Tree.findAll(".file");
        files.show();
        FileSystem.Search.innerHTML = "";
    }
};

FileSystem.ShowContextMenu = function (file) {
    file.toggle("selected");
};

FileSystem.tagFilterStarted = false;
FileSystem.tagFilterInterval = null;

FileSystem.RenewInterval = function (start) {
    FileSystem.tagFilterStarted = true;
    window.clearTimeout(FileSystem.tagFilterInterval);
    FileSystem.tagFilterInterval = window.setTimeout(FileSystem.ClearInterval, 1000);
};

FileSystem.ClearInterval = function () {
    window.clearTimeout(FileSystem.tagFilterInterval);
    FileSystem.tagFilterStarted = false;
    if (FileSystem.Filter != null)
        FileSystem.Filter.rcs("active");
};

FileSystem.ClearTagFilter = function () {
    window.clearTimeout(FileSystem.tagFilterInterval);
    var files = FileSystem.Tree.findAll(".file");
    for (var i = 0; i < files.length; i++) {
        files[i].show();
    }
    if (FileSystem.Filter != null)
        FileSystem.Filter.clear();
};

FileSystem.TagClick = function (name) {
    if (typeof (name) != "string") {
        var name = this.attr("name");
    }
    if (name.length <= 0) {
        FileSystem.ClearTagFilter();
        return false;
    }
    else {
        if (!FileSystem.tagFilterStarted) {
            FileSystem.ClearTagFilter();
        }
        var files = FileSystem.Tree.all(".file:not(." + name + ")");
        for (var i = 0; i < files.length; i++) {
            files[i].hide();
        }
        if (FileSystem.Filter != null) {
            FileSystem.Filter.cls("active");
            FileSystem.Filter.add("<span class='filter'>" + name + "&gt;" + "</span>");
        }
        FileSystem.RenewInterval();
        //$("#files-block .tree-container .File." + name).show();
    }
};

FileSystem.TagDropped = function (elem) {
    var tag = elem.attr("name");
    var fileName = this.attr("name");
    if (this.is("." + tag)) {
        this.rcs(tag);
        tag = this.get(".tags tag[name='" + tag + "']");
        if (tag != null) {
            tag.del();
        }
        Tags.DelRef(tag, fileName);
    }
    else {
        this.AddTag(tag);
        Tags.AddRef(tag, fileName);
    }
};

FileSystem.DeleteDoc = function () {
    var elements = FileSystem.GetActiveFiles();
    for (var i = 0; i < elements.length; i++) {
        AX.Action("delete", elements[i].fileName);
        elements[i].del();
    }
};

FileSystem.LogResult = function () {
    Notify.Show(this.responseText);
};

FileSystem.CreateNewDoc = function () {
    var dialog = DOM.get(".edit-name-dialog");
    dialog.show();
    dialog.onapply = FileSystem.NewDocApply;
};

FileSystem.NewDocApply = function (name) {
    if (name.length > 0) {
        X.ContentGet(escape(name), "new", FileSystem.NewDocCreated);
    }
};

FileSystem.NewDocCreated = function (result) {
    var file = FileSystem.Tree.add(this.responseText);
    FileSystem.InitFileElement(file);
    Notify.Show(file.fileName + " file created");
    var url = X.ServerRoot + "TextEditor.htm?file=" + file.fileName;
    if (Request.UserDomain) {
        url += "&UserDomain=" + Request.UserDomain;
        if (Request.SystemPath) {
            url += "&SystemPath=" + Request.SystemPath;
        }
    }
    window.open(url);
};



function UrlUpLoad() {
    var dialog = DOM.get(".edit-name-dialog");
    dialog.show();
    dialog.onapply = FileSystem.OnUrlUpLoad;
}

FileSystem.OnUrlUpLoad = function (result) {
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

FileSystem.OnUploadFile = function () {
    var dlg = DOM.get("#LoadDocDialog");
    dlg.get(".dialog-apply").onclick = FileSystem.OnUploadApply;
    dlg.get(".dialog-close").onclick = function () {
        DOM.get("#LoadDocDialog").hide();
        document.getElementById("fileUploader").value = "";
    };
    dlg.show();
};

FileSystem.OnUploadApply = function (event) {
    var dlg = DOM.get("#LoadDocDialog");
    dlg.hide();
    var files = document.getElementById("fileUploader").files;
    // object for allowed media types
    var file;
    for (var i = 0; i < files.length; i++) {

        file = files[i];
        if (file !== null) {
            FileSystem.UploadFile(file);
        }
    }
    document.getElementById("fileUploader").value = "";
};

FileSystem.GlobalObjectDragged = function (files) {
    for (var i = 0; i < files.length; i++) {
        var file = files[i];
        if (file !== null) {
            FileSystem.UploadFile(file);
        }
    }
};

FileSystem.UploadFile = function (file) {
    var accept = {
        binary: ["image/png", "image/jpeg", "image/gif"],
        text: ["text/plain", "text/javascript", "text/css", "application/xml", "text/html"]
    };
    var fr = new FileReader();
    var xhr = new XMLHttpRequest();
    var upload = xhr.upload;
    var url = "System.Handler.ashx?action=save";
    if (Request.SystemPath) {
        url = url + "&path=" + Request.SystemPath;
    }
    url += "&file=" + file.name;
    if (Request.UserDomain) {
        url = "http://" + Request.UserDomain + "/" + url;
    }
    xhr.open("POST", url);
    xhr.overrideMimeType(file.mediaType);
    upload.addEventListener('progress', function (event) {
        if (event.lengthComputable) {
            var percent = Math.round((event.loaded / event.total) * 100);
        }
    }, false);
    upload.addEventListener('error', function (event) {
        Notify.Error("Ошибка при загрузке " + file.name);
    }, false);
    upload.addEventListener('load', function (event) {
        Notify.Show("Файл " + file.name + "загружен");
    });
    xhr.onload = function () {
        FileSystem.NewFileReturned(this.responseText);
    }
    xhr.send(file);
    return;
    if (accept.binary.indexOf(file.type) > -1) {
        var buf = fr.readAsArrayBuffer(file);
        xhr.sendAsBinary(buf);
        return;
    }
    if (accept.text.indexOf(file.type) > -1) {
        xhr.sendAsText(fr.readAsText(file));
        return;
    }
};


FileSystem.Init();

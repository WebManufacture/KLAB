FileSystem = {};
    
  FileSystem.Init = function() {
    var url = X.Handle("browse", FileSystem.LoadTreeComplete);
  }
    
  FileSystem.ReloadSystem = function() {
    FileSystem.Tree.clear();
    FileSystem.Tags.clear();
    var url = X.Handle("reload", FileSystem.LoadTreeComplete);
  }
    
  
  FileSystem.GetActiveFile = function() {
    var file = $(".tree-container .File.selected:first");
    return file;
  }
  
    
  FileSystem.Tags = W.get("#files-block .tags-container");
  FileSystem.Tree = W.get("#files-block .tree-container");
  FileSystem.Filter = W.get("#files-block .filter");
  
  FileSystem.LoadTreeComplete = function(result) {
      result = W.Wrap(this.responseText);
      var tag = result.get("tag");
      while (tag != null){
        var next = tag.nextElementSibling;
        if (FileSystem.InitTagElement(tag)){
          tag.del();   
        }
        else{
          FileSystem.Tags.add(tag);
        }
        if (next.sname != "tag"){
          tag = null; 
        }
        else{
          tag = next; 
        }
      }
      var files = result.findAll(".File");
      for (var i=0; i < files.length; i++){
       	FileSystem.InitFileElement(files[i]); 
      } 
      //$("#files-block .tree-container .tag").addClass("ui-item");
    }
    
    FileSystem.InitFileElement = function(file){
        var elem = W.div("file " + file.attr("class"));
        elem.attr("id", file.attr("id"));
        var fileName = file.attr("name");
        elem.attr("name", fileName);
        var name = W.tag("a", "name", fileName, elem);
        name.attr("target", "_blank");
        //elem.onclick = FileSystem.ShowContextMenu;
        elem.ondblclick = FileSystem.LoadFile;
        elem.add(file.get(".tags"));
        FileSystem.Tree.add(elem);
        var tags = elem.findAll(".tag");
        for (var i=0; i < tags.length; i++){
          FileSystem.InitTagElement(tags[i]); 
        } 
        if (file.has("Image") || file.has("png") || file.has("jpg") || file.has("gif")) {
     	  name.attr("href", Request.CreateUrl(fileName));
          return;
        }
        if (file.has("css") || file.has("htm") || file.has("html") || file.has("js") || file.has("cs")) {
     	  name.attr("href", Request.CreateUrl("_System.TextEditor.htm", "file=" + fileName));
          return;
        }
    }
    
    FileSystem.InitTagElement = function(tag){  
      var result = false;
      var name = tag.attr("name");
      if (FileSystem.Tags.get("." + name) != null){
        var result = true; 
      }
      tag.cls(name);
      tag.onclick = FileSystem.TagClick; 
      return result;
    }
    
    
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
    }
      
    FileSystem.tagFilterStarted = false;
    FileSystem.tagFilterInterval = null;
    
    FileSystem.RenewInterval = function(start){
      FileSystem.tagFilterStarted = true;
      window.clearTimeout(FileSystem.tagFilterInterval);
      FileSystem.tagFilterInterval = window.setTimeout(FileSystem.ClearInterval, 1000);
    }
    
    FileSystem.ClearInterval = function(){
      window.clearTimeout(FileSystem.tagFilterInterval);
      FileSystem.tagFilterStarted = false;
      FileSystem.Filter.rcs("active");
    }
      
      
    FileSystem.ClearTagFilter = function() {
      window.clearTimeout(FileSystem.tagFilterInterval);
      var files = FileSystem.Tree.findAll(".file");
      for (var i=0; i < files.length; i++){
       	files[i].show();
      }
      FileSystem.Filter.clear();
    }
    
      
    FileSystem.TagClick = function() {
      var name = this.attr("name");
      if (name.length <= 0) {
        FileSystem.ClearTagFilter();
        return;
      }
      else {
          if (!FileSystem.tagFilterStarted)
          {
             FileSystem.ClearTagFilter();           
          }
          var files = FileSystem.Tree.findAll(".file:not(." + name + ")");
          FileSystem.Filter.add("<span class='filter active'>" + name + "&gt;" + "</span>");
          for (var i=0; i < files.length; i++){
             files[i].hide();
          }
          FileSystem.RenewInterval();
        //$("#files-block .tree-container .File." + name).show();
      }
    }
      
    FileSystem.DeleteDoc = function() {
        var element = GetActiveFile();
        var url = GetProxiedUrl(escape(element.attr("name")), "delete")
        $.get(url, null, FileDeleted);
      }
      
      function OnNewDoc() {
        $("#NewDocDialog .file-name").val("");
        $("#NewDocDialog")[0].OnApply = OnNewFileApply;
        $("#NewDocDialog").show();
      }
      
      function NewTag() {
        $("#NewDocDialog .file-name").val("");
        $("#NewDocDialog")[0].OnApply = OnNewTagApply;
        $("#NewDocDialog").show();
      }
      
      function OnNewFileApply() {
        $("#NewDocDialog").hide();
        var name = $("#NewDocDialog .file-name").val();
        if (name.length > 0) {
          var url = GetProxiedUrl(escape(name), "new");
          $.get(url, null, NewFileReturned);
        }
      }
      
      function OnNewTagApply() {
        $("#NewDocDialog").hide();
        var name = $("#NewDocDialog .file-name").val();
        if (name.length > 0) {
          var url = GetProxiedUrl(escape(name), "newtag");
          $.get(url, null, NewFileReturned);
        }
      }
      
      
      function ChangeRoot() {
        $("#NewDocDialog .file-name").val(GetServerRoot());
        $("#NewDocDialog")[0].OnApply = ChangeRootApply;
        $("#NewDocDialog").show();
      }
      
      function ChangeRootApply() {
        $("#NewDocDialog").hide();
        var name = $("#NewDocDialog .file-name").val();
        SetCurrentPath(name)
          var url = GetProxiedUrl("","browse");
        LoadFiles(url);
        ShowFiles();
      }
      
      
      function UrlUpLoad() {
        $("#NewDocDialog .file-name").val("");
        $("#NewDocDialog")[0].OnApply = OnUrlUpLoad;
        $("#NewDocDialog").show();
      }
      
      function OnUrlUpLoad() {
        $("#NewDocDialog").hide();
        var url = $("#NewDocDialog .file-name").val();
        if (url.length > 0) {
          var url = GetProxiedUrl(escape(url), "urlload");
          $.get(url, null, NewFileReturned);
        }
      }
      
      function CopyFile() {
        var file = GetActiveFile();
        var url = file.attr("name");
        url = GetProxiedUrl(escape(url), "filecopy");
        $.get(url, null, NewFileReturned);
      }
      
      function FileDeleted(result) {
        if (result.length > 0) {
          $(".tree-container .File[name='" + result + "']").remove();
          ShowNotify("<h4>Файл удален<h4>" + result);
        }
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
        var file = GetActiveFile();
        var fileName = file.attr("name");
        $("storage .current-edited").html(fileName);
        if (file.hasClass("Image") || file.hasClass("png") || file.hasClass("jpg") || file.hasClass("gif")) {
          //designer_frame.location = GetServerRoot(fileName);
          $("#designer-block .image-preview .image").attr("src", GetServerRoot(fileName));
          $("#designer-block .image-preview").show();
          ShowDesigner();
          return;
        }
      TextSystem.ShowTextEditor(escape(fileName));
    }
        
    function ShowContextMenu() {
      var activeFiles = GetActiveFile();
      activeFiles.removeClass("selected");
      activeFiles = $(this);
      activeFiles.addClass("selected");
      ShowAdvanced("files");
      $("#btnSetBackground").hide();
      if (activeFiles.hasClass("jpg") || activeFiles.hasClass("png")) {
        $("#btnSetBackground").show();
      }
    }
    
    function OnTagDropped(event, ui) {
      var tag = ui.draggable.attr("name");
      var fileName = $(this).attr("name");
      
      if ($(this).hasClass(tag))
      {
        $(this).removeClass(tag);
        fileName = GetProxiedUrl(fileName, "resettag&tag=" + tag)
          }
          else
          {
          $(this).addClass(tag);
        fileName = GetProxiedUrl(fileName, "settag&tag=" + tag);
      }
      $.get(fileName , null, OnTagSet);
    }
    
    function OnTagSet(result) {
      var fileName = $(result).attr("name");
      var element = $("#files-block .tree-container .File[name='" + fileName + "']");
      element.replaceWith(result);
    }
     
    FileSystem.Init(); 
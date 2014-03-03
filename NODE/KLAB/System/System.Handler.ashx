<!DOCTYPE html>
<head>
	
	<meta content="text/html; charset=utf-8" http-equiv="Content-Type">
	<script type="text/javascript" src="http://services.web-manufacture.net/Base/v1.3/Utils.js"></script>
	<script type="text/javascript" src="http://services.web-manufacture.net/Base/v1.3/DOM.js"></script>
	<script type="text/javascript" src="http://services.web-manufacture.net/Base/v1.3/Url.js"></script>
	<script type="text/javascript" src="http://services.web-manufacture.net/Base/v1.3/Events.js"></script>
	<script type="text/javascript" src="http://services.web-manufacture.net/Base/v1.3/Log.js"></script>
	<script type="text/javascript" src="http://services.web-manufacture.net/Base/v1.3/Ajax.js"></script>
	<script type="text/javascript" src="http://services.web-manufacture.net/Base/v1.3/Net.js"></script>
	
	<script type="text/javascript" src="http://Services.web-manufacture.net/Base/v1.3/Jasp.js"></script>
	<script type="text/javascript" src="http://Services.web-manufacture.net/Base/v1.3/Modules.js"></script>
	<script type="text/javascript" src="http://Services.web-manufacture.net/Base/v1.3/ui.js"></script>
	
	<link href="http://services.web-manufacture.net/Styles/System.default.css" rel="stylesheet">
	<title>Server Files</title>
	
	<script type="text/javascript">
		Notify = {};
		
		Notify.Show = Notify.info = Notify.Info = function (message) {
			var nf = DOM("#Notify");
			var ev = nf.div(".event.first", (new Date()).formatTime() + " " + message);
			nf.show();
			nf.ins(ev);
			Notify.setTimeout();
		};
		
		Notify.Error = function (error) {
			var nf = DOM("#Notify");
			var ev = nf.div(".event.error.first", (new Date()).formatTime() + " " + error);
			nf.show();
			nf.ins(ev);
			Notify.setTimeout();
		};
		
		Notify.setTimeout = function () {
			if (Notify.timeout) {
				window.clearTimeout(Notify.timeout);
			}
			Notify.timeout = window.setTimeout(Notify.clearFirst, 3000);
		};
		
		Notify.clearFirst = function () {
			DOM.all("#Notify .event.first").del(".first");
		};
		
		Dialog = {};
		
		Dialog.Apply = function(elem){
			var dialog = elem.findParent(".dialog");
			dialog.hide();
			var value = dialog.get(".dialog-value");
			if (Check(dialog.onapply)){
				dialog.onapply(value.value);
			}
		};
		
		Dialog.Close = function(elem){
			var dialog = elem.findParent(".dialog");
			dialog.hide();
		};
		
		FS = {};
		
		FS.Init = function() {
			FS.Loaded = false;
			FS.Tree = DOM.get(".files-block .tree-container");
			FS.InputField = DOM.get('.search-elem');
			FS.InputField.onkeyup = FS.SearchFile;
			FS.Filter = DOM(".filter-bar");
			//Drag.NoBodyDrop = true;
			FS.server = {
				browse: function(path, callback){
					Net.get(path + "System.Handler.ashx?action=browse", callback);					
				}				
			}
			M.OnModuleRegistered.subscribe(FS.InitTags, "http://system.web-manufacture.net/system.tags.htm");
			FS.ReloadSystem();
		};
		
		FS.ReloadSystem = function() {
			FS.Loaded = false;
			FS.Tree.clear();
			FS.server.browse("/", FS.LoadTreeComplete);
		};
		
		FS.GetActiveFiles = function() {
			return FS.Tree.all(".File.selected");
		};
		
		FS.LoadTreeComplete = function(result, status) {
			if (status == 200){
				var files = DOM.wrap(result);
				for (var i = 0; i < files.length; i++) {
					var file = FS.Tree.div('.File');
					var item =  files[i];
					file.div(".name", item.get("@name"));
					file.fileName = item.get("@name");
					FS.InitFileElement(file);
				}
				FS.Loaded = true;
			}
			else{
				Notify.Error("Browse aborted");
			}
		};
		
		FS.InitFileElement = function(elem, tags) {
			var fileName = elem.fileName;// = elem.innerHTML;
			elem.cls("file");
			var splt = fileName.split(".");
			if (splt.length < 2){
				splt.push("unknown");	
			}
			elem.ext = splt[splt.length-1];
			elem.cls(elem.ext);
			elem.attr("ext", elem.ext);
			var name = elem.name = fileName.replace("." + elem.ext, "");
			elem.add('@name', fileName.toLowerCase());
			FS.AddTag(elem, elem.ext);
			if (tags){
				for (var i = 0; i < tags.length; i++){
					FS.AddTag(elem, tags[i])
				}
			}
			elem.onclick = FS.FileClick;
			elem.ondblclick = FS.FileActivate;
			elem.objectReceived = FS.TagDropped;
			Drag.MakeReceiver(elem, ".tag");
		};
		
		FS.InitTags = function () {
			if (!FS.Loaded || !Tags.Ready) {
				window.setTimeout(FS.InitTags, 300);
				return;
			}
			Tags.style.left = "800px";
			Tags.style.top = "100px";
			Tags.OnTagSelected = FS.TagClick;
			var files = FS.Tree.all(".file");
			for (var i = 0; i < files.length; i++) {
				FS.AttachTags(files[i]);
			}
		};
		
		FS.AttachTags = function (file) {
			var tags = Tags.GetTagsByRef(file.fileName.toLowerCase());
			for (var i = 0; i < tags.length; i++) {
				FS.AddTag(file, tags[i].attr("name"));
			}
		};
		
		FS.AddTag = function(elem, tagName){
			var tag = DOM.div('.tag', '' + tagName);
			tag.parent = elem;
			tag.name = tagName;
			tag.attr("name",tagName);
			tag.onclick = function(event){
				FS.TagClick.call(this, this.name);
			};
			elem.cls(tagName);
			elem.add(tag);
		};
		
		
		FS.TagClick = function (name) {
			if (typeof (name) != "string") {
				var name = this.attr("name");
			}
			if (name.length <= 0) {
				FS.ClearTagFilter();
				return false;
			}
			else {
				if (!FS.tagFilterStarted) {
					FS.ClearTagFilter();
				}
				var files = FS.Tree.all(".file:not(." + name + ")").hide();
				if (FS.Filter != null) {
					FS.Filter.cls("active");
					FS.Filter.add("<span class='filter'>" + name + "&gt;" + "</span>");
				}
				FS.RenewInterval();
				//$("#files-block .tree-container .File." + name).show();
			}
		};
		
		FS.TagDropped = function (elem) {
			var tag = elem.attr("name");
			var fileName = this.attr("name");
			if (this.is("." + tag)) {
				this.rcs(tag);
				tag = this.get(".tag[name='" + tag + "']");
				if (tag != null) {
					tag.del();
				}
				Tags.DelRef(tag, fileName);
			}
			else {
				FS.AddTag(this, tag);
				Tags.AddRef(tag, fileName);
			}
		};
				
		FS.tagFilterStarted = false;
		FS.tagFilterInterval = null;
		
		FS.RenewInterval = function (start) {
			FS.tagFilterStarted = true;
			window.clearTimeout(FS.tagFilterInterval);
			FS.tagFilterInterval = window.setTimeout(FS.ClearInterval, 1000);
		};
		
		FS.ClearInterval = function () {
			window.clearTimeout(FS.tagFilterInterval);
			FS.tagFilterStarted = false;
			if (FS.Filter != null)
				FS.Filter.rcs("active");
		};
		
		FS.ClearTagFilter = function () {
			window.clearTimeout(FS.tagFilterInterval);
			FS.Tree.all(".file").show();
			if (FS.Filter != null)
				FS.Filter.clear();
		};
		
		FS.NewFileReturned = function(result) {
			if (this.responseText == "Error!" || result == "Error!") {
				Notify.Error("Error!");
				return;
			}
			var files = W.Wrap(this.responseText);
			if (files.has(".tag")) {
				FS.InitTagElement(files);
			}
			Notify.Show("<h4>Добавлены файлы:<h4>" + result);
		};	
		
		
		FS.FileClick = function(event) {
			if (event.shiftKey) {
				this.add(".selected");
				return;
			}
			if (event.ctrlKey) {				
				FS.LoadFile(this);
				return;
			}
			//this.toggle("selected");
			FS._toggle(this, 'selected');
		};
		
		FS._toggle = function(elem, toggledclass){
			if (elem.is('.' + toggledclass)){
				elem.del('.' + toggledclass);
			}else{
				elem.add('.' + toggledclass);
			};
		};
		
		FS.ClearSelect = function(){
			FS.Tree.all('.file').del('.selected');
		};
		
		FS.FileActivate = function() {
			window.open("/" + this.fileName);
			this.del('.selected');
		};
		
		FS.LoadFile = function(file) {
			var url = "/" + file.fileName;
			if (file.is(".css") || file.is(".htm") || file.is(".html") || file.is(".js") || file.is(".cs")) {
				url = Url.Resolve("TextEditor.htm", {url : url});
			}
			window.open(url);
		};
		
		FS.DeleteDoc = function() {
			var elements = FS.GetActiveFiles();
			
			if (!elements.length) {
				alert('Нет выбранных файлов');
				return;
			};
			var confirmString = ' файлов';
			if(elements.length == 1) confirmString = ' файл';
			if(elements.length > 1 && elements.length < 5) confirmString =  'файла';
			
			if(confirm('Вы действительно хотите удалить ' + (elements.length) + confirmString + '?')){
				for (var i = 0; i < elements.length; i++) {
					//AX.Action("delete", elements[i].fileName);
					elements[i].del();
				};	   
			};
			
		};
		
		FS.SearchFile = function(){
			var text = FS.InputField.innerHTML;
			text = text.trim("\n");
			text = text.trim(" ");
			text = text.replace("<br/>", "");
			text = text.replace("<br>", "");
			if (text.length > 0){
				var files = FS.Tree.all(".file");
				files.hide();
				files = FS.Tree.all(".file[name*='" + text.toLowerCase() + "']");
				files.show();
			}
			else{
				var files = FS.Tree.all(".file");
				files.show();
				FS.InputField.innerHTML = "";
			};
		};
		
		FS.LogResult = function() {
			Notify.Show(this.responseText);
		};
		
		FS.CreateNewDoc = function() {
			var fileName = FS.InputField.innerHTML;
			if(FS.InputField.innerHTML.length > 0){
				var file = FS.Tree.div('.File');
				file.div(".name", fileName);
				file.fileName = fileName;
				if (fileName.lastIndexOf(".") > 0){
					file.attr("ext",fileName.substr(fileName.lastIndexOf(".") + 1));
				}
				FS.InitFileElement(file);
				Notify.Show(file.fileName + " file created");
				var url = new Url();
				url.repath("TextEditor.htm");
				url.addParam("url", encodeURIComponent(file.fileName));
				window.open(url);
			};
			
			//var dialog = W.get(".edit-name-dialog");
			//dialog.show();
			//dialog.onapply = FileSystem.NewDocApply;
		};
		
		FS.NewDocApply = function(name) {
			if (name.length > 0) {
				X.ContentGet(escape(name), "new", FileSystem.NewDocCreated);
			}
		};
		
		
		function UrlUpLoad() {
			var dialog = W.get(".edit-name-dialog");
			dialog.show();
			dialog.onapply = FileSystem.OnUrlUpLoad;
		}
		
		FS.OnUrlUpLoad = function(result) {
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
		
		
		WS.DOMload(FS.Init); 
		
		
	</script>
	
	<style type="text/css">
		
		#Notify{
			background-color: white;
			border: 1px solid navy;
			border-radius: 10px 10px 10px 10px;
			cursor: default;
			font-size: 16px;
			height: 300px;
			text-align: left;
			width: 8%;
			opacity: 0.5;
			position: fixed;
			top: 1%;
			right: 1%;
			z-index: 20;
			padding: 7px;
			font-size: 12px;
			overflow: hidden;
		}
		
		#Notify .event{
			color: #333;
		}
		
		#Notify .event.first{
			background-color:yellow;
		}
		
		#Notify .event.error{
			color: red;
		}
		
		.filter-bar {
			display: inline-block;	
		}
		
		.search-elem {
			width: 150px;
			height: 25px;
			border: solid 1px #3366FF;
			float: left;
			height: 25px;
			margin-top: 13px;
			text-align: left;
			width: 150px;    
		}
		
		.window.files-block{
			height: 400px;
		}
		
		.window .files-block{
			margin-top: 0px;
			height: 100%;
			width: 100%;
		}
		
		.window .tree-container {
			padding-left: 5px;
			padding-right: 10px;
			height: 100%;
			width: 100%;
			overflow-y : scroll;
		}
		
		.tree-container
		{
			position: relative;
			margin-top: 10px;
			padding-left: 55px;
			padding-right: 100px;
			box-sizing: border-box;
			max-width: 800px;
			-moz-box-sizing: border-box;
		}
		
		
		.filter
		{
			color: #9900FF;
			margin: 5px 10px 10px 5px;
			display: block;
			float: left;
		}
		
		.filter.active
		{
			background-color: #CCFF33;
		}
		
		
		.tree-container .File
		{
			color: gray;
			display: block;
			clear: both;
			padding-left: 5px;
			padding-top: 5px;
			padding-bottom: 5px;
			cursor: pointer;
		}
		
		.tree-container .tag
		{
			color: #3366AA;
			display: inline;
			float: right;
		}
		
		.tree-container .file.htm, .tree-container .file.html
		{
			color: navy;
		}
		
		.tree-container .file.css
		{
			color: #FF00CC;
		}
		
		.tree-container .file.js
		{
			color: #007766;
		}
		
		.tree-container .file.ERROR
		{
			background-color: #FF7766;
		}
		
		.files-block
		{
			display: block;
		}
		
		.tree-container .File.selected
		{
			background-color: #EEE;
		}
		
		
		.tree-container .File.drop-ready
		{
			border: dotted 1px gray;
			border-radius : 4px;
			-moz-border-radius : 4px;
		}
		
		.tree-container .File.drop-selected
		{
			border: solid 1px gray;
			background-color: #CCFFFF;
		}  
		
		.tree-container .File:hover
		{
			text-shadow: 1px 1px 1px #ccc;
			border-bottom: dotted 1px gray;
			color: red; 
		}
		
		
		.tree-container .File .name
		{
			display: inline;
			color: inherit;
			text-decoration: none;
		}
		
		.tree-container .File .tags{
			float: right;
		}
		
		.upload-frame
		{
			border: none;
			height: 40px;
			width: 300px;
		}
		
		#NewDocDialogInner
		{
			width: 300px;
			height: 200px;
		}
	</style>
</head>
<body>
	<include url='http://services.web-manufacture.net/UI/Win.htm'></include>
	<include url='http://services.web-manufacture.net/UI/Dragging.htm'></include>
	<include url='http://services.web-manufacture.net/UI/toolbars.htm'></include>
	<include url='http://system.web-manufacture.net/system.tags.htm'></include>
	<div class='header toolbar'>
		<div class='menuitem file-manager-button' id='create-file-button' icon="http://system.web-manufacture.net/images/document-small.png" onclick="FS.CreateNewDoc()">
			Создать
		</div>
		<div class='menuitem file-manager-button' id='delete-file' icon="http://system.web-manufacture.net/images/delete-mini.png" onclick="FS.DeleteDoc()">
			Удалить
		</div>
		<div class="menuitem round" icon="http://system.web-manufacture.net/images/ButtonUSSR.png" onclick="FS.ClearTagFilter();">
			Отменить фильтрацию
		</div>
		<div class="menuitem round" icon="" onclick="FS.ClearSelect();">
			Убрать выделение
		</div>
		<div contenteditable="true" class="search-elem"></div>
		<div class="filter-bar"></div>
	</div> 
	
	<div id="Notify">
	</div>
	<div id="files-block" class="files-block" title="File System">
		
		<div class="tree-container">
			
		</div>  
		<div class="edit-name-dialog dialog">
			<div class="dialog-inner" id="NewDocDialogInner">
				<input id="txtFileName" class="file-name dialog-value" value="" type="text"><br>
				<div id="btnApply" class="button dialog-apply" onclick="Dialog.Apply(this)">
					Принять</div>
				<div id="btnCancel" class="button dialog-close" onclick="Dialog.Close(this)">
					Отменить</div>
			</div>
		</div>
		<div id="LoadDocDialog" class="dialog">
			<div class="dialog-inner">
				<input id="fileUploader" multiple="multiple" type="file">
				<button type="button" id="btnApply" class="dialog-apply">
					Принять</button>
				<button type="button" id="btnCancel" class="dialog-close">
					Отменить</button>
			</div>
		</div>
		
	</div>
	
</body>
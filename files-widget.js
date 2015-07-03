
		WS.DOMload(function(){
			WS.Body.ondragover = function(event) {
				var types = event.dataTransfer.types;
				if (types[2] && types[2] == "Files"){ event.preventDefault(); return true; }
				return false;
			};	
			
			function upload(file){
				Notify.Show("Uploading " + file.name + "");
				var xhr = new XMLHttpRequest();
				xhr.open('POST',  window.location + "/" + file.name, true);
				xhr.onload = function(e) { Notify.Show("file " + file.name + " uploaded!"); };
				xhr.send(file);
			}
			
			WS.Body.ondrop = function(event) {
				var types = event.dataTransfer.types;
				var files = event.dataTransfer.files;
				if (types && types.length && (types[0] == "Files" || types[0]== "application/x-moz-file") && files && files.length > 0){ 
					event.preventDefault(); 
					for (var i = 0; i < files.length; i++){
						upload(files[i]);
					}
					return true; 
				}
				return false;
			};
		})
		
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
			FS.InputField = DOM("#FilterInput");
			FS.InputField.onkeyup = FS.SearchFile;
			//Drag.NoBodyDrop = true;
			FS.server = Net.GetTunnel();
			FS.CurrentDir = window.location.pathname.replace(/\/\//g, "/");
			FS.ReloadSystem();
			
			Events.on("onmoduleregistered", "http://services.web-manufacture.net/ui/toolbars.htm", function(module){
				var sb = DOM(".spien-bar");
				if (sb){
					sb.del();
				}
			});
		};
		
		FS.ReloadSystem = function() {
			FS.Loaded = false;
			LoadingMask.show();
			FS.server.browse(new Url(".." + FS.CurrentDir) + "", FS.LoadTreeComplete);			
		};
		
		FS.GetActiveFiles = function() {
			return FS.Tree.all(".file.selected");
		};
		
		FS.LoadTreeComplete = function(files, status) {
			if (status == 200){
				if (typeof files == 'string'){
					files = JSON.parse(files);
				}
				FS.Tree.clear();
				if (FS.CurrentDir != "/"){
					var fname = "..";
					var file = FS.Tree.div();
					file.div(".name", fname);
					file.fileType = "link";
					file.fileName = fname;
					FS.InitDirElement(file);
				}
				for (var i = 0; i < files.length; i++) {
					if (files[i].fileType == "directory"){
						var fname = files[i].name;
						var file = FS.Tree.div();
						file.fileName = fname;
						file.fileType = "directory";
						FS.InitDirElement(file);
					}
				}
				for (var i = 0; i < files.length; i++) {
					if (files[i].fileType == "file"){
						var fname = files[i].name;
						var file = FS.Tree.div();
						file.fileName = fname;
						file.fileType = "file";
						FS.InitFileElement(file);
					}
				}
				FS.Loaded = true;
				LoadingMask.hide();
			}
			else{
				Notify.Error("Browse aborted");
			}
		};
		
		FS.InitFileElement = function(elem) {
			var fileName = elem.fileName;// = elem.innerHTML;
			elem.add(".file");			
			var nameDiv = elem.div(".name", fileName);
			var splt = fileName.split(".");
			if (splt.length < 2){
				splt.push("unknown");	
			}
			elem.ext = splt[splt.length-1];
			elem.cls(elem.ext);
			elem.attr("ext", elem.ext);
			var name = elem.name = fileName.replace("." + elem.ext, "");
			elem.add('@name', name.toLowerCase());
			FS.InitExt(elem);
			elem.onclick = FS.FileClick;
			elem.ondblclick = FS.FileActivate;
			//Drag.MakeDraggable(elem);
		};
		
		FS.InitDirElement = function(elem) {
			var fileName = elem.name = elem.fileName;// = elem.innerHTML;
			elem.div(".name").textContent = fileName;
			if (elem.fileType == "link"){
				elem.add(".link");	
				if (elem.name == "."){
					elem.add(".top");		
				}
				if (elem.name == ".."){
					elem.add(".back");		
				}
				elem.ondblclick = FS.DirActivate;
				
			}
			else{
				elem.add(".dir");	
				elem.onclick = FS.DirClick;
				elem.ondblclick = FS.DirActivate;
				elem.touchmove = FS.DirActivate;
			}
			elem.add('@name', fileName.toLowerCase());
			//Drag.MakeDraggable(elem);
		};
		
		FS.InitExt = function(elem){
			var ext = DOM.div('.tag', '' + elem.ext);
			ext.parent = elem;
			ext.onclick = FS.SortTag;
			elem.add(ext);
		};
		
		FS.SortTag = function(event){
			FS.Tree.all('.file:not([ext=' +this.parent.ext + '])').hide();
			event.stopPropagation();
		};
		
		FS.ClearTagFilter = function(){
			FS.InputField.value='';
			FS.Tree.all('.file').show();
		};
		
		FS.NewFileReturned = function(result) {
			if (this.responseText == "Error!" || result == "Error!") {
				Notify.Error("Error!");
				return;
			}
			var files = W.Wrap(this.responseText);
			if (files.has("tag")) {
				FileSystem.InitTagElement(files);
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
		
		FS.DirClick = function(event) {
			if (event.shiftKey) {
				this.add(".selected");
				return;
			}
			if (event.ctrlKey) {	
				if (location.pathname == "/"){
					window.open(location + this.name);
				}
				else{
					window.open(location + "/" + this.name);
				}
				return;
			}
			FS._toggle(this, 'selected');
		};
		
		FS.DirActivate = function(event) {
			if (this.is(".link")){
				if (this.is(".back")){
					var parts = FS.CurrentDir.split("/");
					FS.CurrentDir = "";
					for (var i = 0; i < parts.length - 1; i++){
						if (parts[i] != ""){
							FS.CurrentDir += "/" + parts[i];
						}
					}
					if (FS.CurrentDir == "") FS.CurrentDir = "/";
				}
				if (this.is(".top")){
					FS.CurrentDir = "/";
				}
			}
			if (this.is(".dir")){
				if (FS.CurrentDir == "/") FS.CurrentDir = "";
				FS.CurrentDir += "/" + this.name;				
			}	
			history.pushState(null, FS.CurrentDir, FS.CurrentDir);
			//location.pathname = FS.CurrentDir;
			FS.ReloadSystem();
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
			if (location.pathname == "/"){
				window.open(location + this.fileName);
			}
			else{
				window.open(location + "/" + this.fileName);
			}
			this.del('.selected');
		};
		
		FS.LoadFile = function(file) {
			var url = location + file.fileName;
			if (location.pathname != "/"){
				url = location + "/" + file.fileName;
			}
			//if (file.is(".css") || file.is(".htm") || file.is(".html") || file.is(".js") || file.is(".cs") || file.is() {
				url += "?action=edit";
			//}
			window.open(url);
		};
		
		FS.DeleteDocs = function() {
			var elements = FS.GetActiveFiles();
			
			if (!elements.length) {
				alert('Нет выбранных файлов');
				return;
			};
			
			var confirmString = ' файлов';
			if(elements.length == 1) confirmString = ' файл';
			if(elements.length > 1 && elements.length < 5) confirmString =  'файла';
			
			if(confirm('Вы действительно хотите удалить ' + (elements.length) + confirmString + '?')){
				for(var i = 0; i < elements.length; i++){
					FS.DeleteDoc(elements[i]);
				}
			};			
		};
		
		FS.DeleteDoc = function(element) {
			Net.Del(window.location.href + "/" + element.fileName, function(message){
				Notify.info(message);
				element.del();
			});			
		};
		
		FS.SearchFile = function(){
			var text = FS.InputField.value;
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
				FS.InputField.value = "";
			};
		};
		
		FS.LogResult = function() {
			Notify.Show(this.responseText);
		};
		
		FS.CreateNewDoc = function() {
			var fileName = FS.InputField.value;
			var cpath = location.href;
			if (!cpath.ends('/')) cpath += "/" 
			if(fileName.length > 0){
				if (fileName.lastIndexOf(".") > 0){
					var file = FS.Tree.div('.File');
					//file.div(".name", fileName);
					file.fileName = fileName;
					file.attr("ext",fileName.substr(fileName.lastIndexOf(".") + 1));
					FS.InitFileElement(file);
					Notify.Show(file.fileName + " file created");
					window.open(cpath + fileName + "?action=create");
				}
				else{
					Net.get(cpath + fileName + "?action=dir", "", function(){
						location.href = cpath + fileName;						
					})

				}
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
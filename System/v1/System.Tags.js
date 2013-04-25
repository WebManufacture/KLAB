Tags = W.get("win.tagCloud");

Tags.Init = function(){
    Tags.Status = this.get(".status-box"); 
    Tags.Status.wrap();
    Tags.Status.Image = this.get(".image");
    Tags.Status.Message = Tags.Status.Elems.message;
    Tags.RemoveContainer = this.get(".remove-container");
    Drag.MakeReceiver(Tags.RemoveContainer, ".tag");
    Tags.RemoveContainer.objectReceived = Tags.RemoveTag;
    Tags.Loaded = this.get(".loaded-tags"); 
    Drag.MakeReceiver(Tags.Loaded, ".tag");
    Tags.Loaded.objectReceived = Tags.AddTag;
    Tags.Custom = this.get(".custom-tags");
    Drag.MakeReceiver(Tags.Custom, ".tag");
    Tags.Custom.objectReceived = Tags.Add;
    Tags.NameControl = this.get(".tag-name");
    Tags.Load();
};

Tags.Load = function(){
    X.GetHTML("Tags-Default.htm", Tags.Loaded, Tags.InitLoaded);
};

Tags.Save = function(){
    Tags.Status.show();
    X.ContentSave("Tags-Default.htm", Tags.Loaded.html(), Tags.HideStatus);
};

Tags.HideStatus = function(){
    Tags.Status.hide();
};

Tags.InitLoaded = function(){
    var tags = Tags.Loaded.findAll(".tag");
    var maxClicks = 1;
    for (var i = 0; i < tags.length; i++){
	Tags.InitTag(tags[i]);
	if (tags[i].clicks > maxClicks){
  	  maxClicks = tags[i].clicks;
	}
    }
    var dole = maxClicks/100;
    var normal = dole * 50;
    var med = dole * 80;
    for (var i = 0; i < tags.length; i++){
	if (tags[i].clicks <= maxClicks){
  	  tags[i].style.fontSize = "18px";
	}
	if (tags[i].clicks <= med){
  	  tags[i].style.fontSize = "14px";
	}
	if (tags[i].clicks <= normal){
  	  tags[i].style.fontSize = "10px";
	}
    }
};

Tags.Add = function(tag){
    var name = tag.attr("name");
    var exist = Tags.Custom.aget("name", name);
    if (exist) return;
	tag.cls(name);
    Tags.Custom.add(tag);
    Tags.InitTag(tag);
};

Tags.AddTag = function(tag){

    var name = tag.attr("name");
    var exist = Tags.Loaded.aget("name", name);
    if (exist) return;
    Tags.Loaded.add(tag);
    Tags.InitTag(tag);
    Tags.Status.Message.html(name + " saving...");
    Tags.Save();
};

Tags.InitTag = function(tag){
    var name = tag.attr("name");
    tag.name = name;
    tag.cls(name);
    tag.clicks = tag.attr("clicks");
    if (!tag.clicks){
	tag.clicks = 0;
	tag.attr("clicks", "0");
    }
    Drag.MakeDraggable(tag, "clone");
    tag.eadd("click", Tags.TagSelected); 
};


Tags.TagSelected = function(){
    this.clicks++;
    this.attr("clicks", this.clicks);
    Tags.Save();
    var tags = Tags.Loaded.findAll(".tag");
    var maxClicks = 1;
    for (var i = 0; i < tags.length; i++){
	if (tags[i].clicks > maxClicks){
  	  maxClicks = tags[i].clicks;
	}
    }
    var dole = maxClicks/100;
    var normal = dole * 50;
    var med = dole * 80;
    for (var i = 0; i < tags.length; i++){
	if (tags[i].clicks <= maxClicks){
  	  tags[i].style.fontSize = "18px";
	}
	if (tags[i].clicks <= med){
  	  tags[i].style.fontSize = "14px";
	}
	if (tags[i].clicks <= normal){
  	  tags[i].style.fontSize = "10px";
	}
    }
    if (Check(Tags.OnTagSelected))
    {
	Tags.OnTagSelected(this.name);
    }
};

Tags.NewTag = function(){
    var name = Tags.NameControl.value;
    Tags.NameControl.value = "";
    if (name.length > 0) {
	var tag = W.tag("tag", "tag", name);
	tag.attr("name", name);
	Tags.AddTag(tag);
	Tags.Save();
    }
};

Tags.RemoveTag = function(tag){
    tag = tag.dragProto;
    if (tag.parentNode == Tags.Loaded){
	tag.del();
	Tags.Save();
    }
    if (tag.parentNode == Tags.Custom){
	tag.del();
    }
};

Tags.Init();
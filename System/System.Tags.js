Tags = DOM.get("win.tagCloud");

Tags.Init = function () {
	Tags.Ready = false;
    Tags.Index = DOM.div("tags-index");
    Tags.Status = this.get(".status-box");
    Tags.Status.wrap();
    Tags.Status.Image = this.get(".image");
    Tags.Status.Message = Tags.Status.get(".message");
    Tags.RemoveContainer = this.get(".remove-container");
    Drag.MakeReceiver(Tags.RemoveContainer, ".tag");
    Tags.RemoveContainer.objectReceived = Tags.RemoveTag;

    var ccont = Tags.all(".class-container");
    for (var i = 0; i < ccont.length; i++) {
        Drag.MakeReceiver(ccont[i], ".tag");
        ccont[i].objectReceived = Tags.AddTagClass;
    }

    Tags.Loaded = this.get(".loaded-tags");
    Drag.MakeReceiver(Tags.Loaded, ".tag");
    Tags.Loaded.objectReceived = Tags.AddTag;
    Tags.Custom = this.get(".custom-tags");
    Drag.MakeReceiver(Tags.Custom, ".tag");
    Tags.Custom.objectReceived = Tags.Add;
    Tags.NameControl = this.get(".tag-name");
	if (AJ.CreateHandler){
		Tags.Handler = AJ.CreateHandler("Tags-Index.htm");
	}
	if (Tags.Handler){
    	Tags.Handler.Get("tag", Tags.IndexLoaded);
	}
	else{
		AJ.Get("Tags-Index.htm", "tag", Tags.IndexLoaded);
	}
};

Tags.HideStatus = function () {
    Tags.Status.hide();
};

Tags.IndexLoaded = function (result) {
	Tags.Loaded.innerHTML = result;
    var tags = Tags.Loaded.all(".tag");
    for (var i = 0; i < tags.length; i++) {
        Tags.InitTag(tags[i]);
    }
    Tags.Recalc();
	Tags.Ready = true;
};



Tags.InitTag = function (tag) {
    var name = tag.attr("name");
    tag.name = name;
    tag.cls(name);
    tag.clicks = tag.attr("clicks");
    if (!tag.clicks) {
        tag.clicks = 0;
        tag.attr("clicks", "0");
    }
    var refs = tag.get("ref");
    if (refs != null) {
        tag.cls("used");
    }
    Drag.MakeDraggable(tag, "clone");
    tag.GetRef = Tags.GetRef;
    tag.jid = "#" + tag.id;
    tag.onclick = Tags.TagSelected;
};



Tags.Recalc = function () {
    var tags = Tags.Loaded.all(".tag");
    var maxClicks = 1;
    for (var i = 0; i < tags.length; i++) {
        var clicks = parseInt(tags[i].clicks);
        if (clicks > maxClicks) {
            maxClicks = clicks;
        }
    }
    for (var i = 0; i < tags.length; i++) {
        var dole = tags[i].clicks / maxClicks;
        tags[i].style.fontSize = Math.ceil(dole * 20 + 10) + "px";
    }
};

Tags.GetTag = function (tag) {
    return Tags.Loaded.aget("name", tag, "tag");
};

Tags.GetRef = function (ref) {
    ref = ref.toLowerCase();
    return this.get("ref[key='" + ref + "']");
};

Tags.GetTagsByRef = function (ref) {
    var tags = [];
    ref = ref.toLowerCase();
    var refs = Tags.Loaded.all("ref[key='" + ref + "']");
    for (var i = 0; i < refs.length; i++) {
        var tag = refs[i].parentNode;
        if (tags.indexOf(tag) < 0) {
            tags.push(tag);
        }
    }
    return tags;
};


Tags.AddTag = function (tagName) {
    var exist = Tags.GetTag(tagName);
    if (exist) return;
    var tag = DOM.tag("tag", "tag", tagName);
    tag.attr("name", tagName);
    Tags.Loaded.add(tag);
    var id = "tag" + parseInt(Math.random() * 10000000000);
    tag.id = id;
    Tags.InitTag(tag);
    Tags.Status.Message.html(name + " saving...");
    AJ.Add("Tags-Index.htm",null, tag.outerHTML, Tags.HideStatus);
};

Tags.AddRef = function (tag, ref) {
    var tag = Tags.Loaded.aget("name", tag);
    if (tag != null) {
        ref = ref.toLowerCase();
        var exist = tag.GetRef(ref);
        if (exist) return;
        var nRef = tag.tag("ref");
        nRef.attr("key", ref);
        AJ.Add("Tags-Index.htm", tag.jid, nRef.outerHTML + "\n", Tags.HideStatus);
        tag.cls("used");
    }
};

Tags.DelRef = function (tag, ref) {
    var tag = Tags.Loaded.aget("name", tag);
    if (tag != null) {
        ref = ref.toLowerCase();
        var exist = tag.GetRef(ref);
        if (!exist) return;
        AJ.Del("Tags-Index.htm", tag.jid + " ref[key='" + ref + "']");
        exist.del();
        var refs = tag.get("ref");
        if (refs != null) {
            tag.cls("used");
        }
    }
};

Tags.TagSelected = function () {
    this.clicks++;
    this.attr("clicks", this.clicks);
    AJ.Set("Tags-Index.htm", this.jid + "@clicks", this.clicks);
    Tags.Recalc();
    if (Check(Tags.OnTagSelected)) {
        Tags.OnTagSelected(this.name);
    }
};

Tags.NewTag = function () {
    var name = Tags.NameControl.value;
    Tags.NameControl.value = "";
    if (name.length > 0) {
        Tags.AddTag(name);
    }
};

Tags.RemoveTag = function (tag) {
    tag = tag.dragProto;
    if (tag.parentNode == Tags.Loaded) {
        AJ.Del("Tags-Index.htm", tag.jid, Tags.HideStatus);
        tag.del();
    }
    if (tag.parentNode == Tags.Custom) {
        tag.del();
    }
};

Tags.AddTagClass = function (tag) {
    tag = tag.dragProto;
    if (tag.parentNode == Tags.Loaded) {
        var classname = this.attr("classname");
        if (classname != null && classname.length > 0) {
            if (tag.has(classname)) {
                AJ.Rcs("Tags-Index.htm", tag.jid, "." + classname, Tags.HideStatus);
                tag.rcs(classname);
            }
            else {
                AJ.Acs("Tags-Index.htm", tag.jid, "." + classname, Tags.HideStatus);
                tag.cls(classname);
            }
        }
    }
};


Tags.Init();
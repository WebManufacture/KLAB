Toolbar = M.GetModuleContainsUrl("UI/Toolbars.htm");

Toolbar.Init = function() {
    Toolbar.NoCache = false;
    Toolbar.SpienBar = Toolbar.get(".spien-bar");
	WS.Body.add(Toolbar.SpienBar);
    Toolbar.LList = Toolbar.get("#loader-list");
    Toolbar.LIcon = Toolbar.get("#loader-icon");
	WS.Body.add(Toolbar.LList);
	WS.Body.add(Toolbar.LIcon);
    //Toolbar.SpienBar.onmouseover = Toolbar.SpienBarHover;
    //Toolbar.SpienBar.onmouseout = Toolbar.SpienBarOut;
    L.LogInfo("Toolbars initialized!");
    M.OnModuleLoaded.subscribe(Toolbar.MLoaded);
    M.OnModuleLoad.subscribe(Toolbar.MLoad);
	if (window.AX){
    AX.onAjaxStart.subscribe(Toolbar.ALoad);
    AX.onAjaxFinish.subscribe(Toolbar.ALoaded);
	}
}

Toolbar.ALoad = function(url) {
    Toolbar.LIcon.show();
};

Toolbar.ALoaded = function(url) {
    Toolbar.LIcon.hide();
};

Toolbar.MLoad = function(url) {
    Toolbar.LIcon.show();
    var ll = DOM.get("#loader-list");
    var mod = ll.div(".module-line.loading");
    mod.attr("url", url);
    mod.html("<span class='name'>" + url + "</span>" + "<span class='info'>&nbsp;Loading...</span>");
    ll.show();
}

Toolbar.MLoaded = function(url, mod) {
    var mod = DOM.aget("url", url, "#loader-list .module-line");
    if (mod != null) {
        mod.get('.info').html(" complete");
        mod.cls("complete");
        mod.rcs("loading");
        var mods = DOM.all("#loader-list .module-line.loading");
        if (mods.length <= 0) {
            Toolbar.LIcon.hide();
            var ll = DOM.get("#loader-list");
            ll.empty();
            ll.hide();
        }
    }
}

Toolbar.SpienBarHover = function() {
    this.cls("over");
}

Toolbar.SpienBarOut = function() {
    this.rcs("over");
}

Toolbar.InitToolbar = function(toolbar) {
	if (toolbar._is(".header")){
		WS.Body.add(".with-header-toolbar");	
	}
    var menus = toolbar._all(".menuitem");
	var itemTitle = false;
    for (var i = 0; i < menus.length; i++) {
        itemTitle = Toolbar.InitItem(menus[i]) || itemTitle;
    }
	if (itemTitle){
		toolbar._add(".with-titles");
	}
}

Toolbar.InitItem = function(item) {
	var result = false;
	var text = item.innerHTML;
	if (!item._is(".text") && text && text.length > 0 && text.trim().length > 0){
		item.clear();
		item.Div(".title", text.trim());
		result = true;
	}
    Toolbar.InitIcon(item);
	return result;
}
	
	
Toolbar.InitIcon = function(item) {
    var icon = item.attr("icon");
    if (icon != null) {
	if (icon.start('http')){
	    item.style.backgroundImage = "url('" + icon + "')";
	}
	else{
	    item.style.backgroundImage = "url('Images/" + icon + "')";
	}
        item.style.backgroundRepeat = "no-repeat";
        item.style.backgroundPosition = "center center";
    }
}

Toolbar.BtnContext = {};
Toolbar.BtnContext.Selector = "[icon]";
Toolbar.BtnContext.Condition = "ui-processing";
Toolbar.BtnContext.Process = function(element) {
    Toolbar.InitIcon(element);
};

Contexts.Add(Toolbar.BtnContext);

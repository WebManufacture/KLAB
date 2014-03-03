Toolbar = M.GetModuleByUrl("System.Toolbars.htm");

Toolbar.Init = function() {
    var toolbars = W.findAll(".toolbar");
    for (var i = 0; i < toolbars.length; i++) {
        Toolbar.InitToolbar(toolbars[i]);
    }
    var subbars = W.findAll(".spien-subbar");
    for (var i = 0; i < subbars.length; i++) {
        Toolbar.InitToolbar(subbars[i]);
    }
    Toolbar.SpienBar = W.Body.append(".spien-bar");
    Toolbar.LList = W.Body.append("#loader-list");
    Toolbar.LIcon = W.Body.append("#loader-icon");
    //Toolbar.SpienBar.onmouseover = Toolbar.SpienBarHover;
    //Toolbar.SpienBar.onmouseout = Toolbar.SpienBarOut;
    L.LogInfo("Toolbars initialized!");
    M.OnModuleLoaded.add(Toolbar.MLoaded);
    M.OnModuleLoad.add(Toolbar.MLoad);
    X.OnAjaxRequestStart.add(Toolbar.ALoad);
    X.OnAjaxRequestComplete.add(Toolbar.ALoaded);
}

Toolbar.ALoad = function(url) {
    Toolbar.LIcon.show();
};

Toolbar.ALoaded = function(url) {
    Toolbar.LIcon.hide();
};

Toolbar.MLoad = function(url) {
    Toolbar.LIcon.show();
    var ll = W.get("#loader-list");
    var mod = ll.adv("module-line loading");
    mod.attr("url", url);
    mod.html("<span class='name'>" + url + "</span>" + "<span class='info'>&nbsp;Loading...</span>");
    ll.show();
}

Toolbar.MLoaded = function(url, mod) {
    var mod = W.aget("url", url, "#loader-list .module-line");
    if (mod != null) {
        mod.get('.info').html(" complete");
        mod.cls("complete");
        mod.rcs("loading");
        var mods = W.findAll("#loader-list .module-line.loading");
        if (mods.length <= 0) {
            Toolbar.LIcon.hide();
            var ll = W.get("#loader-list");
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
    var menus = toolbar.findAll(".menuitem");
    for (var i = 0; i < menus.length; i++) {
        Toolbar.InitItem(menus[i]);
    }
}

Toolbar.InitItem = function(item) {
    var icon = item.attr("icon");
    if (icon != null) {
        item.style.backgroundImage = "url('Images/" + icon + "')";
        item.style.backgroundRepeat = "no-repeat";
        item.style.backgroundPosition = "center center";
    }
}

Toolbar.Context = {};
Toolbar.Context.Selector = "div.toolbar";
Toolbar.Context.Condition = "System.Windows.htm";
Toolbar.Context.Process = function(element) {
    Toolbar.InitToolbar(element);
};

Contexts.Add(Toolbar.Context);

Toolbar.BtnContext = {};
Toolbar.BtnContext.Selector = "[icon]";
Toolbar.BtnContext.Condition = "System.Modules.js";
Toolbar.BtnContext.Process = function(element) {
    Toolbar.InitItem(element);
};

Contexts.Add(Toolbar.BtnContext);

Toolbar.Init();
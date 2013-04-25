Planning = {};

Planning.Init = function() {
    AX.Get("PlanNewVisit.htm", Planning.FormLoadComplete);
};

WS.DOMload(Planning.Init);

Planning.FormLoadComplete = function(data) {
    data = DOM.wrap(data)[0];
    data._add(".invisible");
    window.PForm = WS.Body._add(data);
    PForm.HCal = PForm._get(".hcal");
    if (Drag) {
        Drag.MakeDraggable(PForm);
    }
    HCal.Init(PForm.HCal);
};

Planning.LoadPlanning = function(specId, sotrId, visitData) {
    PForm._get(".ajax-screen")._del(".invisible");
    var title = PForm._get(".pf_visit_title");
    title.clear();
    var vdline = visitData._all(".vr_visit_content_line");
    for (var i = vdline.length - 1; i >= 0; i--) {
        title._add(vdline[i]._clone());
    }
    var date = title._get(".vr_date_fact_text").innerHTML;
    date = PForm.CDate = Date.ParseRus(date);
    var cd = PForm._get(".current-date");
    cd.innerHTML = date.formatRus();
    PForm._each(".pf_dates_add .dadd-btn", function(elem) {
        elem.onclick = function() {
            Planning.AddDaysToFact(parseInt(this.innerHTML));
        };
    });
    PForm.VDates = PForm._get(".pf_vdates");
    PForm.VDates.clear();
    PForm.HCal.initHCal(date);
    PForm.HCal.OnSelectDate = Planning.HCalDateSelected;
    PForm.HCal.OnUnSelectDate = Planning.HCalDateUnSelected;
    var vt = title._get(".vr_visit_type");
    var tkey = vt._get(".vr_vtype_name")._get("@key");
    var vtype = vt._get(".vr_vtype_name").innerHTML;
    vt = PForm.VType = PForm._get(".pf_vtype");
    vt.cls("editable");
    vt.attr("key", tkey);
    vt.innerHTML = vtype;
    vt.onclick = Planning.ChangeType;

    PForm.Grid = PForm._get(".pf_visits_grid");
    PForm.Grid._all(".row")._del();

    PForm.SpecId = specId;
    PForm._set("@SpecId", specId);
    PForm.SotrId = sotrId; 
    PForm._set("@SotrId", sotrId);
    PForm.Show();
    var url = Request.GetUrl("VisitsSource.aspx", { SpecId: specId, SotrId: sotrId });
    url = url.replace("/", "");
    AX.Get(url, Planning.VisitsLoaded);
};

Planning.VisitsLoaded = function(data) {
    PForm._get(".ajax-screen")._add(".invisible");
    PForm.Grid._add(DOM.Div(null, data)._all(".row"));
    var dates = PForm.Grid._all(".value.date");
    for (var i = 0; i < dates.length; i++) {
        var date = Date.ParseRus(dates[i].innerHTML);
        PForm.HCal.MarkDate(date);
    }
};

Planning.ChangeType = function(event) {
    var report = DOM._get(".vr_frame.report");
    var srcData = report._get(".source.visit-types");
    var vname = PForm._get(".pf_working .pf_vtype");
    var key = vname.attr("key");
    var nextItem = srcData._get(".value[key='" + key + "']+.value");
    if (nextItem == null) {
        nextItem = srcData.firstChild;
    }
    if (nextItem != null) {
        vname.attr("key", nextItem.attr('key'));
        vname.html(nextItem.attr('value'));
    }
    vname.cls("changed");
    vname.cls("insession");
    event.stopPropagation();
    return true;
};

Planning.AddDaysToFact = function(days) {
    var cdate = PForm.CDate;
    var day = cdate.getDate();
    var month = cdate.getMonth();
    var year = cdate.getFullYear();
    cdate = new Date(year, month, day + days);
    Planning.AddDate(cdate);
};

Planning.AddDate = function(date) {
    var vdd = PForm.VDates._get("#vd" + date.formatDate(""));
    if (vdd) {
        return;
    }
    if (DDates.HasDate(date)) {
        return;
    }
    vdd = PForm.VDates._div(".vdate", date.formatDateRus());
    vdd.date = date;
    vdd.value = date.formatDate("-");
    vdd.id = "vd" + date.formatDate("");
    vdd.onclick = function() {
        PForm.HCal.UnSelectDate(this.date);
        this._del();
    };
    var dates = PForm.VDates._all(".vdate");
    for (var i = 0; i < dates.length; i++) {
        if (dates[i].date > date) {
            PForm.VDates.insertBefore(vdd, dates[i]);
            return;
        }
    }
};


Planning.HCalDateSelected = function(date) {
    Planning.AddDate(date);
};

Planning.HCalDateUnSelected = function(date) {
    var vdd = PForm.VDates._get("#vd" + date.formatDate(""));
    if (vdd) {
        vdd._del();
    }
};


Planning.Cancel = function(data) {
    PForm.Hide();
};

Planning.Close = function() {
    PForm.Hide();
};

Planning.Error = function(message) {
    var err = PForm._get(".errors");
    err.Show();
    err._div(".error", message);
    window.setTimeout(Planning.HideErrors, 10000);
};

Planning.HideErrors = function() {
    var err = PForm._get(".errors");
    err.Hide();
};

Planning.Save = function() {
    PForm._get(".errors").Clear();
    var dates = PForm.VDates._all(".vdate");
    if (dates.length == 0) {
        Planning.Error("Вы не выбрали не одной даты для новых визитов!");
        return;
    }
    var dteString = "";
    for (var i = 0; i < dates.length; i++) {
        var date = dates[i].date;
        dteString += date.formatDate("-") + ",";
    }
    dteString = dteString.substr(0, dteString.length - 1);
    dteString += "";
    var vtype = PForm.VType._get("@key");
    var url = Request.GetUrl("Visits.ashx", { vtype: vtype, action: "add", specId: PForm.SpecId, sotrId: PForm.SotrId });
    AX.Post(url.replace("/", ''), dteString, Planning.SaveComplete);
    PForm._get(".ajax-screen")._del(".invisible");
};

Planning.SaveComplete = function() {
    var result = DOM.div(this.responseText);
    var theme = "default";
    if (result._is(".error")) {
        theme = "error";
    }
    $.jGrowl(result.innerHTML, { theme: theme, position: 'top-right', life: 5000 });
    PForm._get(".ajax-screen")._add(".invisible");
    PForm.Hide();
    if (grdVisits) {
        grdVisits.PerformCallback('update');
    }
};
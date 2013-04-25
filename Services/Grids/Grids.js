Grids = grids = {};

Table = {};

Grids.InitGrid = Grids.InitTable = function(table){
    for(var elem in Table){
	table[elem] = Table[elem]; 
    }
    table.init();
    return table;
};

Grids.Handler = function(handler){
    return function(event){
	var table = this.get("^.simple-grid");
	handler.call(table);
    };
};

Table.Init = Table.init = function(){
    if (this.childNodes.length > 0){
	var source = this.div(".source");
	while(this.childNodes[0] != source){
	    source.add(this.childNodes[0]);
	}
    }
    var top = this.div(".top");
    var title = this.attr("title");
    if (title != null){
	this.title = top.div(".title");
    }
    var header = this.header = top.div(".header");
    var items = this.items = this.div(".items");
    /*
if (header != null) {
var headers = header.findAll(".td");

if (headers.length > 0) {
for (var r = 0; r < rows.length; r++) {
var cells = rows[r].childs(".td");
for (var c = 0; c < cells.length; c++) {
cells[c].style.width = headers[c].offsetWidth + 'px';
}
}
}
}
*/
	if (this.is(".top-fixed")){
	    top.add(".absolute");
	    items.style.paddingTop = top.offsetHeight + "px";
	}
        this.maxRows = parseInt(this.attr("max-rows"));
	this.rowsCount = 0;
	/*
var topscroll = table.get(".scroll_up");
var bottomScroll = table.get(".scroll_down");
if (topscroll != null && bottomScroll != null) {
topscroll.onclick = Reports.ScrollUpHandler;
bottomScroll.onclick = Reports.ScrollDownHandler;
if (rowsCount > rows.length) {
bottomScroll.hide();
topscroll.hide();
}
else {
bottomScroll.show();
}
var inputs = table.findAll(".data input");
for (var i = 0; i < inputs.length; i++) {
inputs[i].onfocus = Reports.checkScroll;
}
}

var moveup = table.get(".move_up");
var movedown = table.get(".move_down");
if (moveup != null && movedown != null) {
moveup.onclick = Reports.MoveUpHandler;
movedown.onclick = Reports.MoveDownHandler;
}

*/
	
	var bottom = this.bottom = this.div(".bottom");
	if (this.is(".allow-add")){
	    var bottomAdd = bottom.div(".table-btn.add");
	    bottomAdd.onclick = Grids.Handler(this.AddLine);
	    //if (rows.length < rowsCount || isNaN(rowsCount)) {bottomAdd.show();}
	}
	
	var support = this.support = this.div(".support.invisible");
	
	if (this.is(".allow-save")){
	    var saveBtn = bottom.div(".table-btn.save");
	    saveBtn.onclick = Grids.Handler(this.Save);
	}
    };



Table.Load = function(){
    var src = this.GetNodesBySelector(this.attr("source"));
    if (src.length > 0){
	Grids.CreateTemplateRow(this, src[0]);
    }
    for (var i = 0; i < src.length; i++){
	this.AddRow(src[i]);
    }
};

Grids.CreateTemplateRow = function(table, elem) {       
    var line = table.get(".support").div(".template");
    for (var i = 0; i < elem.classList.length; i++){
	line.addc(elem.classList[i]);
    }
    for (var i = 0; i < elem.attributes.length; i++){
	if(!table.is("show-id") && elem.attributes[i].name == "id") {
	    continue;
		}
	if (elem.attributes[i].name != "class" && elem.attributes[i].name != "style"){
	    table.AddCell(line, elem.attributes[i].name, elem.attributes[i].value);
	}
    }
    return line;
};

Table.UpdateButtons = function(){
    if (clone.RowNumber >= items.maxRows) {
	var bottomAdd = this.get(".table-btn.add");
	bottomAdd.hide();
    }
};

Table.AddCell = function(row, name, value) {       
    var cell = row.div(".cell");	
    cell.addc(name);
    cell.attr("field", name);
    cell.value = value;
    cell.name = name;
    cell.html(value);
    return cell;
},
    
    Table.ProcessNewRow = function(row) {
        var remove = row.get(".btn.remove");
        if (remove != null)
            remove.onclick = Reports.RemoveLine;
        var comment = row.get(".td.comment");
        if (comment != null) {
            var value = comment.getValue(".value");
            if (value != undefined && value.length > 0) {
                comment.cls("active");
            }
            var commentControl = comment.get(".control.comment");
            if (commentControl != null) {
                commentControl.onclick = Reports.ShowComment;
            }
            var commentBtn = comment.get(".save_comment");
            if (commentBtn != null) {
                commentBtn.onclick = Reports.SaveComment;
            }
        }
        var moveup = row.get(".move_up");
        var movedown = row.get(".move_down");
        if (moveup != null && movedown != null) {
            moveup.onclick = Reports.MoveUpHandler;
            movedown.onclick = Reports.MoveDownHandler;
        }
    };	

Table.AddRow = function(elem) {       
    var line = this.items.div(".row");
    line.source = elem;
    this.rowsCount++;
    line.rowNumber = this.items.rowsCount;
    line.attr("row-num", line.RowNumber);
    if (elem.id != null){
	line.attr("identifier", elem.id);
    }
    for (var i = 0; i < elem.classList.length; i++){
	line.addc(elem.classList[i]);
    }
    for (var i = 0; i < elem.attributes.length; i++){
	if(!this.is("show-id") && elem.attributes[i].name == "id") continue;
	    if (elem.attributes[i].name != "class" && elem.attributes[i].name != "style")
		this.AddCell(line, elem.attributes[i].name, elem.attributes[i].value);
    }
    return line;
};

Table.AddLine = function(id) {
    var template = this.support.get(".template");
    this.AddRow(template);
    this.UpdateButtons();        
};

Table.RemoveLine = function() {
    var parent = this.findParent(".item");
    var table = parent.findParent(".vr_table");
    var items = table.get(".items");
    items.rowsCount -= 1;
    var next = parent.nextSibling;
    var rowNum = parent.RowNumber;
    while (next != null) {
	next.RowNumber = rowNum;
	next.attr("row-num", rowNum);
	rowNum++;
	next = next.nextSibling;
    }
    parent.remove();
    if (items.rowsCount < items.maxRows) {
	var bottomAdd = table.get(".bottom .add");
	bottomAdd.show();
    }
};

Table.GetDataCount = function(table) {
    var data = table.items.all(".item");
    return data.length;
};

Table.checkScroll = function() {
    var items = this.findParent(".items");
    var row = this.findParent(".item");
    if (row.RowNumber > items.currentRows) {
	Reports.ScrollDown(this.findParent(".vr_table"));
	return;
	    }
    if (row.RowNumber < items.currentRows - items.maxRows + 2) {
	Reports.ScrollUp(this.findParent(".vr_table"));
    }
};

Table.ScrollUp = function(table) {
    var items = table.get(".items");
    if (items.currentRows <= items.maxRows) return;
	var height = items.clientHeight;
    var rowHeight = parseInt(items.attr("row-size"));
    var minHeight = items.rowsCount * rowHeight;
    var topscroll = table.get(".scroll_up");
    var bottomScroll = table.get(".scroll_down");
    bottomScroll.show();
    if (items.marginTop == undefined) {
	items.marginTop = 0;
	items.currentRows = items.maxRows;
    }
    items.marginTop -= rowHeight;
    items.currentRows -= 1;
    items.style.marginTop = "-" + items.marginTop + "px";
    if (items.currentRows <= items.maxRows) {
	items.marginTop = 0;
	topscroll.hide();
    }
    return false;
};


Table.ScrollDown = function(table) {
    var items = table.get(".items");
    if (items.currentRows + 1 > items.rowsCount) return;
	var height = items.clientHeight;
    var rowHeight = parseInt(items.attr("row-size"));
    var minHeight = items.rowsCount * rowHeight;
    var topscroll = table.get(".scroll_up");
    var bottomScroll = table.get(".scroll_down");
    topscroll.show();
    if (items.marginTop == undefined) {
	items.marginTop = 0;
	items.currentRows = items.maxRows;
    }
    items.currentRows += 1;
    items.marginTop += rowHeight;
    items.style.marginTop = "-" + items.marginTop + "px";
    if (items.currentRows + 1 >= items.rowsCount) {
	bottomScroll.hide();
    }
    return false;
};

Table.MoveDown= function(table, row) {
    var items = table.get(".items");
    if (row.RowNumber >= items.rowsCount) return;
	var nextRow = row.nextElementSibling;
    var insertedElement = items.insertBefore(nextRow, row);
};

Table.MoveUp= function(table, row) {
    var items = table.get(".items");
    if (row.RowNumber <= 0) return;
	var prevRow = row.previousElementSibling;
    var insertedElement = items.insertBefore(row, prevRow);
};

Table.LoadTable= function(table, handler, tag) {
    var value = Reports.Cache[handler];
    if (value != null) {
	Reports.LoadData(table, value);
	return;
	    }
    var req = X.GetRequest(handler, Reports.LoadTableReady, "Table");
    req.Handler = handler;
    req.table = table;
    req.Tag = tag;
    req.start();
};

Table.LoadTableReady= function() {
    if (this.status != 200) {
	Reports.ShowError("", this.url + " = " + this.status + ":" + this.statusText);
	return;
	    }
    var data = W.Wrap(this.responseText);
    Reports.Cache[this.Handler] = data;
    Reports.LoadData(this.table, data);
};

Table.LoadData= function(table, data) {
    try {
	var tag = table.attr("tag");
	var report = data;
	if (!data.has("report")) {
	    report = data.aget("tag", tag);
	}
	if (report == null) return;
	    var ro = report.has("readonly");
	var key = report.attr("key");
	table.attr("key", key);
	if (ro) {
	    table.cls("readonly");
	}
	var template = table.get(".item.template");
	var selects = template.findAll(".select");
	for (var s = 0; s < selects.length; s++) {
	    var type = selects[s].attr("vtype");
	    var src = selects[s].attr("source");
	    if (src == null) {
		src = type;
	    }
	    var source = data.get(".source." + src);
	    if (source != null) {
		var select = "<select class='vr_select value' vtype='" + type + "'>";
		var options = source.findAll(".option");
		for (var o = 0; o < options.length; o++) {
		    var value = options[o].attr("value");
		    var key = options[o].attr("key");
		    select += "<option title='" + value + "' value='" + key + "'>" + value + "</option>";
		}
		select += "</select>";
		selects[s].html(select);
	    }
	}
	data = report.findAll(".item");
	var items = table.get(".items");
	for (var i = 0; i < data.length; i++) {
	    var clone = template.clone();
	    clone.rcs("template");
	    clone.attr("key", data[i].attr("key"));
	    clone.attr("id", data[i].attr("id"));
	    var values = data[i].childs();
	    if (clone.has("single-item")) {
		var src = clone.attr("source");
		var value = data[i].get(".value[type=" + src + "]");
		clone.add(value.html());
	    }
	    for (var v = 0; v < values.length; v++) {
		var type = values[v].attr("type");
		if (type != null) {
		    var col = clone.get("[vtype='" + type + "']");
		    if (col != null) {
			Reports.SetCellValue(col, values[v], ro);
		    }
		}
	    }
	    Reports.ProcessNewRow(clone);
	    clone.RowNumber = i + 1;
	    clone.attr("row-num", clone.RowNumber);
	    items.add(clone);
	}
	table.cls("loaded");
	Reports.InitTable(table);
	var dl = table.attr("ondataload");
	if (dl != null) {
	    window.eval(dl);
	}
    }
    catch (e) {
	Reports.ShowError("Reports", e);
    }
};

Table.ShowError= function(c, e) {
    var err = W.get(".vr_frame .error_log");
    if (err != null) {
	if (typeof (e) == "string") {
	    err.add(W.div("error", e));
	}
	else {
	    err.add(W.div("error", e.lineNumber + ": " + e.message));
	}
    }
    else {
	throw e;
    }
};

Table.SetCellValue= function(cell, value, ro) {
    if (cell.has("form")) {
	var fvals = value.findAll(".value");
	for (var fv = 0; fv < fvals.length; fv++) {
	    var ftype = fvals[fv].attr("type");
	    var col = cell.get(".form-value." + ftype);
	    Reports.SetCellValue(col, fvals[fv], ro);
	}
	return;
	    }
    var cvalue = value.attr("value");
    if (cvalue == null) {
	cvalue = value.html();
    }
    else {
	cell.attr("value", cvalue);
	cell.value = cvalue;
    }
    if (cell.has("select")) {
	var sel = cell.get("select");
	if (ro) {
	    sel.attr("disabled", "true");
	}
	var val = cell.get("option[value='" + cvalue + "']");
	if (val != null) {
	    val.attr("selected", "selected");
	}
	else {
	    cell.html(value.html());
	}
	return;
	    }
    if (ro) {
	cell.cls("readonly");
	cell.attr("readonly", "true");
    }
    var valueTitles = cell.get(".value-title");
    if (valueTitles != null) {
	valueTitles.attr("title", value.html());
    }
    var val = cell.get(".value");
    if (val != null && val != undefined) {
	if (val.has("checkbox")) {
	    var cvalue = (cvalue == "1");
	    if (ro) {
		val.attr("disabled", "true");
	    }
	    val.checked = cvalue;
	    return;
		}
	Reports.SetCellValue(val, value, ro);
	return;
	    }
    else {
	if (cell.has("checkbox") || cell.is("[type='checkbox']")) {
	    var cvalue = (cvalue == "1");
	    if (ro) {
		cell.attr("disabled", "true");
	    }
	    cell.checked = cvalue;
	    return;
		}
	cell.html(value.html());
    }
};

Table.SaveHandler = function(elem) {
    var table = this.findParent(".vr_table");
    var handler = table.attr("handler");
    if (handler == null) return;
	var tag = table.attr("tag");
    var data = Reports.SaveTable(table);
    var req = X.GetPostRequest(handler + "?tag=" + tag, Reports.SaveTableComplete, "Reports", data);
    req.table = table;
    this.hide();
    req.send(data);
};

Table.Save = function(elem, tag) {
    var parent = elem.findParent(".vr_frame");
    if (parent.readonly) return;
	var tables = W.findAll(".vr_table");
    Reports.PBar.show();
    var st = "";
    for (var i = 0; i < tables.length; i++) {
	st += Reports.SaveTable(tables[i]);
    }
    if (tag == undefined) tag = "save";
    var date = parent.get(".vr_date_fact_text").value;
    var data = W.div();
    data.attr("id", 'report_general');
    data.add(W.div("comment", W.get(".report-comment .comment-text").value));
    var newType = parent.get(".vr_vtype_name_fact");
    if (newType.is(".insession")) {
	data.add(W.div("new-type", newType.attr("key")));
    }
    var formItems = parent.get(".general-report");
    if (formItems != null) {
	var items = formItems.findAll('[vtype]');
	for (var i = 0; i < items.length; i++) {
	    var item = items[i];
	    var type = item.attr("vtype");
	    var val = data.add(Reports.GetCellValue(item));
	    val.cls(type);
	    val.attr("vtype", type);
	}
    }
    data = data.outerHTML;
    X.Post(parent.handler + "?tag=" + tag + "&id=" + parent.attr("key"), Reports.SaveComplete, "Reports", st + "<date class='fact_date'>" + date + "</date>" + data);
};

Table.SaveComplete = function() {
    Reports.HideReports();
    Reports.PBar.hide();
};

Table.SaveTableComplete = function() {
    var saveBtn = this.table.get(".btn.save");
    saveBtn.show();
    var data = W.Wrap(this.responseText);
    var items = this.table.get(".items");
    var item = items.childs(".item:not(.template)");
    item.del();
    Reports.Cache = {};
    Reports.LoadData(this.table, data);
};

Table.LoadComplete= function() {
    var frame = W.get(".vr_frame");
    if (frame != undefined && frame.readonly) {
	var tables = frame.findAll(".vr_table");
	for (var t = 0; t < tables.length; t++) {
	    var table = tables[t];
	    table.attr("readonly", "true");
	    var add = table.get(".control.add");
	    if (add != null) {
		add.onclick = null;
		add.cls("disabled");
	    }
	    var btn = table.findAll(".control.remove");
	    for (var i = 0; i < btn.length; i++) {
		btn[i].onclick = null;
		btn[i].cls("disabled");
	    }
	    var inputs = table.findAll(".vr_table input");
	    for (var i = 0; i < inputs.length; i++) {
		if (inputs[i].attr("type") == "checkbox") {
		    inputs[i].attr("disabled", "true");
		}
		inputs[i].attr("readonly", "true");
	    }
	    var selects = table.findAll(".vr_table select");
	    for (var i = 0; i < selects.length; i++) {
		selects[i].attr("disabled", "true");
	    }
	    var ta = table.findAll(".vr_table textarea");
	    for (var i = 0; i < ta.length; i++) {
		ta[i].attr("readonly", "true");
	    }
	}
    }
    Reports.PBar.hide();
};

Table.SaveTable = function(table) {
    var report = Reports.GetTableReport(table).outerHTML;
    var tables = table.findAll(".vr_table");
    for (var t = 0; t < tables.length; t++) {
	if (tables[t].has('loaded')) {
	    var treport = Reports.GetTableReport(tables[t]);
	    var item = tables[t].findParent(".item");
	    treport.attr("key", item.attr("key"));
	    report += treport.outerHTML;
	}
    }
    return report;
};

Table.GetTableReport = function(table) {
    var items = table.get('.items');
    var data = items.childs(".item:not(.template)");
    var report = W.div("report");
    report.attr("key", table.attr("key"));
    report.attr("tag", table.attr("tag"));
    for (var i = 0; i < data.length; i++) {
	var row = data[i];
	var line = W.div("item");
	var key = row.attr("key");
	if (key != null) {
	    line.attr("key", key);
	    line.attr("id", "item" + key);
	}
	var cells = row.childs(".data");
	for (var c = 0; c < cells.length; c++) {
	    var valClass = ".value";
	    var cell = cells[c];
	    if (cell.has("form")) {
		var type = cell.attr("vtype");
		var div = W.div("form " + type);
		div.attr("type", type);
		var values = cell.findAll(".form-value");
		for (var i = 0; i < values.length; i++) {
		    var val = values[i];
		    div.add(Reports.GetCellValue(val));
		}
		line.add(div);
	    }
	    else {
		line.add(Reports.GetCellValue(cell));
	    }
	}
	report.add(line);
    }
    return report;
};

Table.GetCellValue = function(cell, valclass) {
    var type = cell.attr("vtype");
    var div = W.div("value " + type);
    div.attr("type", type);
    var values = cell.findAll(".value");
    if (values.length > 0) {
	if (cell.has("checkbox")) {
	    if (values[0].checked)
		div.html("1");
	    else
		div.html("0");
	}
	else {
	    div.html(Reports.GetValueXml(values[0]));
	}
    }
    else {
	if (cell.has("checkbox") || cell.is("input[type='checkbox']")) {
	    if (cell.checked)
		div.html("1");
	    else
		div.html("0");
	}
	else {
	    div.html(Reports.GetValueXml(cell));
	}
    }
    return div;
};

Table.GetValueXml = function(val, type) {
    if (typeof (val) == "string") {
	return val;
    }
    else {
	if (val.value != undefined) {
	    return val.value;
	}
	else {
	    return val.html();
	}
    }
    return null;
};
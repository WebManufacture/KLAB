TreeTable = {
    table: null,
    handlerUrl: null,
    pageSize: null,
    currentPage: null,

    Init: function(table) {
        this.table = table;
        $(TreeTable.InitComplete);
    },

    InitComplete: function() {
        TreeTable.table = $(TreeTable.table);
        TreeTable.pageSize = 15;
        TreeTable.currentPage = 1;
        $(document.body).append("<link rel='stylesheet' type='text/css' href='http://services.web-manufacture.net/Grids/MainGrid.css'></link>");
        $(document.body).append("<div class='table-system'></div>");
        $(".table-system").load("http://services.web-manufacture.net/Grids/MainGrid.htm", null, TreeTable.InitInternal);
    },

    InitInternal: function() {
        $(".table-system .grid-holder").insertBefore(TreeTable.table);
        $(".grid-holder .table-holder").append(TreeTable.table);
        TreeTable.content = TreeTable.table.find("tbody");
        TreeTable.meta = TreeTable.table.find(".meta");
        TreeTable.meta.find(".indicator_cells").mouseenter(this.HideMenu);

        var roll_button = $(".table-system .roll-button");
        var metaCell = TreeTable.meta.find(".data");
        for (var i = 0; i < metaCell.length; i++) {
            var div = document.createElement("div");
            div.setAttribute("class", "title-holder");
            var cell = $(metaCell[i]);
            cell.attr("col-num", i);
            cell.wrapInner(div);
            if (cell.hasClass("roll")) {
                var holder = cell.find(".title-holder");
                holder.addClass("relative");
                holder.append(roll_button.clone());
            }
            if (cell.hasClass("falled")) {
                cell.hide();
            }
        }



        TreeTable.handlerUrl = TreeTable.meta.attr("handler-url");
        TreeTable.meta.prepend("<td class='indicator_cells'></td>");
        //$("td.indicator", TreeTable.table).draggable({helper: 'clone'});
        TreeTable.meta.find(".data").click(TreeTable.ChangeSortCriteria);

        var items = TreeTable.table.find(".item");
        for (var i = 0; i < items.length; i++) {
            TreeTable.InitRow($(items[i]));
        }

        TreeTable.footer = $(".grid-holder .table-footer");
        TreeTable.footer.find(".row-processor").droppable({ accept: ".indicator", activeClass: 'row-processor-active', hoverClass: 'row-processor-hover', drop: TreeTable.ItemDrop });
        TreeTable.footer.append($(".table-system .load-indicator"));


        $(".table-menu .button[action='edit']").click(TreeTable.EditRow);
        $(".table-menu .button[action='save']").click(TreeTable.SaveRow);
        $(".table-menu .button[action='cancel']").click(TreeTable.CancelRow);
        $(".table-menu .button[action='remove']").click(TreeTable.RemoveRow);
        $(".table-menu .button[action='removeAll']").click(TreeTable.RemoveRows);
        $(".table-menu .button[action='insert']").click(TreeTable.InsertRow);
        $(".table-menu .button[action='reload']").click(TreeTable.ReloadData);
        $(".table-menu .button[action='save-all']").click(TreeTable.SaveData);
        $(".table-menu .button[action='hide']").click(TreeTable.HideMenu);

        $(".search-menu #search-button").click(TreeTable.Search);

        $(".meta .roll-button").click(TreeTable.RollColumn);

        TreeTable.InitializePager();
        window.setTimeout(TreeTable.InitContent, 100);
    },


    InitContent: function() {
        var message = $("#msg_Messages_System_Loaded");
        if (message.length > 0) {
            TreeTable.ReloadData();
            return;
        }
        window.setTimeout(TreeTable.InitContent, 100);
    },

    InitFilterBar: function() {
        var row = $("<tr class='search-row'></tr>");
        var metaCells = TreeTable.meta.find(".data");
        for (var i = 0; i < metaCells.length; i++) {
            var cell = $(metaCells[i]).clone();
            cell.html("<input type='text'></input>");
            row.append(cell);
        }
        row.prepend("<td class='indicator_cells'></td>");
        TreeTable.content.append(row);
        TreeTable.search = row;
        row.find("td").mouseenter(this.HideMenu);
    },

    DragStart: function(event, ui) {
        TreeTable.draggable = true;
        $(event.target).parent().addClass("selected");
    },

    DragStop: function(event, ui) {
        TreeTable.draggable = false;

    },

    ItemDrop: function(event, ui) {
        event.target.setAttribute("identifier", ui.draggable.attr("identifier"));
        $(event.target).click();
        event.target.removeAttribute("identifier");
    },

    InitRow: function(row) {
        var rowID = row.attr("identifier");
        row.attr("id", "row" + rowID);
        var dataItem = row.find(".data");
        for (var i = 0; i < dataItem.length; i++) {
            var item = $(dataItem[i]);
            var metaRow = TreeTable.GetMetaCell(item);
            item.addClass(metaRow.attr("class"));
        }
        row.prepend("<td class='indicator' identifier='" + rowID + "'><div class='row-menu-holder'></div></td>");
        $("td.indicator", row).draggable({ helper: 'clone', start: TreeTable.DragStart, stop: TreeTable.DragStop });
        var droppedRow = row.find(".data.droppable");
        if (droppedRow.length > 0) {
            var name = droppedRow.attr("name");
            var metaRow = TreeTable.GetMetaCell(name);
            var value = droppedRow.attr("value");
            var valueItem = metaRow.find(".drop-item[value='" + value + "']");
            if (valueItem.length > 0) {
                droppedRow.html(valueItem.html());
            }
        }

        var validating = row.find(".data.validable");
        if (validating.length > 0) {
            if (!TreeTable.ValidateRow(validating.html(), validating.attr("validating"))) {
                $(validating).addClass("invalid");
            }
        }

        var protoRow = row.find(".data.prototable");
        for (var i = 0; i < protoRow.length; i++) {
            var proto = TreeTable.GetMetaCell(protoRow[i]).find(".prototype").clone();
            var html = proto.html();
            html = html.replace(/\[identifier\]/, rowID);
            protoRow[i].innerHTML = html;
        }
        var dataCells = row.find(".data");
        for (var i = 0; i < dataCells.length; i++) {
            dataCells[i].innerHTML = "<div class='cell-structure'><div class='cell-value'>" + dataCells[i].innerHTML + "</div></div>";
            dataCells[i].setAttribute("col-num", i);
            var meta = TreeTable.GetMetaCell(dataCells[i]);
            if ($(dataCells[i]).hasClass("falled") || meta.hasClass("falled"))
                $(dataCells[i]).hide();
            if (meta.hasClass("filtering"))
                $(dataCells[i]).mouseenter(this.ShowSearch);
        }
        dataCells.click(this.EditCellCommand);
        dataCells.dblclick(this.EditCellCommand);
        row.find(".indicator").click(this.ActivateRow);

        row.find("td").mouseleave(this.HideSearch);
    },

    ReloadData: function(url) {
        TreeTable.ParkMenu();
        if (url == undefined || url == null || typeof (url) != "String") url = "";
        url = TreeTable.handlerUrl + "?action=get&page=" + TreeTable.currentPage + "&count=" + TreeTable.pageSize + "&sort=" + TreeTable.GetSortField() + url;
        $(".grid-holder").addClass("loading");
        $(".table-system").load(url, null, TreeTable.ReloadDataInternal);
        TreeTable.table.find(".button[action='reload']").addClass("load-indicator");
        TreeTable.Notify("Обновление...");
    },

    ReloadDataInternal: function(result) {
        TreeTable.table.find(".load-indicator").removeClass("load-indicator");
        TreeTable.ParkMenu(); 
        var source = $(".table-system .data-source");
        var pager = $(".table-system .pager");
        TreeTable.table.find("tbody .item").remove();
        var pagescount = parseInt(pager.find("value[name='count']").text());

        var items = source.find("item");
        for (var i = 0; i < items.length; i++) {
            var row = $(items[i]);
            var rowHTML = $("<tr class='item'></tr>");
            var id = row.find("value[name='identifier']");
            if (id.length > 0) {
                rowHTML.attr("identifier", id.html());
            }
            var meta = TreeTable.meta.find(".data");
            for (var j = 0; j < meta.length; j++) {
                var value = $(meta[j]);
                var name = value.attr("name");
                var item = row.find("value[name='" + name + "']");
                if (item.length > 0) {
                    rowHTML.append("<td class='data' name='" + name + "'>" + item.html() + "</td>");
                }
                else {
                    rowHTML.append("<td class='data'></td>");
                }
            }
            TreeTable.content.append(rowHTML);
            TreeTable.InitRow(rowHTML);
        }
        TreeTable.table.find("tr").show();
        TreeTable.InitializePager(pagescount);
        $(".grid-holder").removeClass("loading");
        TreeTable.ShowNotify("Обновлено успешно!");
    },

    InitializePager: function(itemsCount) {
        var pageCount = Math.ceil(itemsCount / TreeTable.pageSize);
        var pages = TreeTable.footer.find(".pages");
        pages.empty();
        for (var i = 1; i <= pageCount; i++) {
            var elem = document.createElement("span");
            elem.setAttribute("class", "page");
            if (i == TreeTable.currentPage) {
                $(elem).addClass("active");
            }
            elem.innerHTML = i;
            elem.onclick = TreeTable.PageSelected;
            pages.append(elem);
        }
    },


    GetMetaCell: function(cell) {
        if (typeof (cell) == "string") {
            return TreeTable.meta.find(".data[name='" + cell + "']");
        }
        return TreeTable.meta.find(".data[name='" + $(cell).attr("name") + "']");
    },

    ActivateRow: function() {
        if ($(this).hasClass("edited") || $(this).hasClass("template")) return;
        //TreeTable.table.find(".selected").removeClass("selected");
        $(this).parent().toggleClass("selected");
    },

    RollColumn: function() {
        var meta = $(this).parents(".data");
        if (meta.hasClass("roll")) {
            if (meta.hasClass("rolled")) {
                var rollkey = meta.attr("rollkey");
                var falledColumns = $(".tree-table .meta .data[fallkey='" + rollkey + "']");
                for (var i = 0; i < falledColumns.length; i++) {
                    var col = $(falledColumns[i]);
                    var colnum = col.attr("col-num");
                    col.hide();
                    col.removeClass("rolled");
                    col.addClass("falled");
                    $(".tree-table .item .data[col-num='" + colnum + "']").hide();
                }
                meta.removeClass("rolled");
            }
            else {
                var rollkey = meta.attr("rollkey");
                var falledColumns = $(".tree-table .meta .data[fallkey='" + rollkey + "']");
                for (var i = 0; i < falledColumns.length; i++) {
                    var col = $(falledColumns[i]);
                    var colnum = col.attr("col-num");
                    col.show();
                    col.removeClass("falled");
                    col.addClass("rolled");
                    $(".tree-table .item .data[col-num='" + colnum + "']").show();
                }
                meta.addClass("rolled");
            }
        }
        return false;
    },

    ShowMenu: function() {
        if (TreeTable.dragging) return;
        var menu = $(".context-menu");
        var row = $(this);
        var rowID = row.attr("identifier");
        menu.find(".button").attr("identifier", rowID);
        row.find(".row-menu-holder").prepend(menu);
        //var items = row.classList;
        //for (var i = 0; i < items.length; i++)
        //{

        //}
        menu.find("*").show();
        if (row.hasClass("edited")) {
            menu.find(".edited").show();
        }
        else {
            menu.find(".edited").hide();
        }
        if (row.hasClass("template")) {
            menu.find("*").hide();
            menu.find(".template").show();
        }
        menu.show();
    },

    HideMenu: function() {
        $(".context-menu").hide();
        return false;
    },

    ShowSearch: function() {
        if (TreeTable.dragging) return;
        var menu = $("#search-button");
        var cell = $(this);
        if (cell.hasClass("editing")) return;
        var colID = cell.attr("name");
        var cellVal = $(this).find(".cell-structure");
        menu.attr("identifier", colID);
        cellVal.append(menu);
        //menu.css("right", cell.css("right"));
        //menu.css("top", cell.css("top"));
        menu.show();
    },

    HideSearch: function() {
        $("#search-button").hide();
        //$(".relative", TreeTable.table).removeClass("relative");
    },

    Search: function() {
        //var value = $("#search-text").val();
        //$("#search-text").val("");


        var button = $("#search-button");
        var cell = button.parents(".data");
        var name = cell.attr("name");
        var input = $(".tree-table .search-row .data[name='" + name + "'] input");
        var val = cell.find(".cell-value").html();
        input.val(val);
        var url = "&field=" + name + "&value=" + escape(val);
        input.attr("filter-url", url);
        return false;
        //TreeTable.ReloadData(url);
    },

    EditRow: function() {
        var row = this.getAttribute("identifier");
        var row = TreeTable.table.find("#row" + row);
        row.addClass("edited");
        row.removeClass("selected");
        var id = row.attr("identifier");
        var cells = row.find(".data");
        for (var i = 0; i < cells.length; i++) {
            TreeTable.EditCell(cells[i]);
        }
        $(".context-menu .edited").show();
        return false;
    },

    EditCell: function(cell) {
        if ($(cell).hasClass("editing")) return;
        var meta = TreeTable.GetMetaCell(cell);
        if ($(cell).hasClass("read-only") || meta.hasClass("read-only")) {
            return;
        }
        TreeTable.ParkSearch();
        var cellvalue = $(cell).find(".cell-value").html();
        $(cell).addClass("editing");
        if ($(cell).hasClass("droppable") || meta.hasClass("droppable")) {
            var select = document.createElement("select");
            var items = meta.find(".drop-item");
            var value = cell.getAttribute("value");
            for (var j = 0; j < items.length; j++) {
                var option = document.createElement("option");
                var thisValue = items[j].getAttribute("value");
                option.setAttribute("value", thisValue);
                option.innerHTML = items[j].innerHTML;
                if (thisValue == value) {
                    option.setAttribute("selected", "true");
                }
                select.appendChild(option);
            }
            cell.setAttribute("oldvalue", cellvalue);
            $(cell).find(".cell-value").html(select);
            $(cell).addClass("editing");
            return;
        }
        $(cell).removeClass("invalid");

        cell.setAttribute("oldvalue", cellvalue);
        $(cell).find(".cell-value").html("<input type='text' value='" + cellvalue + "'/>");
        $(cell).find("input").focus();
        return false;
    },

    EditCellCommand: function() {
        var cells = $(".tree-table .data.editing");
        for (var i = 0; i < cells.length; i++) {
            TreeTable.SaveCell(cells[i]);
        }
        TreeTable.EditCell(this);
    },

    SaveRow: function() {
        var row = this.getAttribute("identifier");
        var row = TreeTable.table.find("#row" + row);
        if (!row.hasClass("edited")) return false;
        var id = row.attr("identifier");
        var cells = row.find(".data");
        for (var i = 0; i < cells.length; i++) {
            SaveCell(cell);
        }
        $(".context-menu .edited").hide();
        row.addClass("updated");
        row.removeClass("edited");
        return false;
    },

    SaveCell: function(cell) {
        var meta = TreeTable.GetMetaCell(cell);
        if (!$(cell).hasClass("editing") || $(cell).hasClass("readonly") || $(meta).hasClass("readonly")) {
            return;
        }
        $(cell).removeClass("editing");
        if ($(cell).hasClass("droppable") || meta.hasClass("droppable")) {
            var selected = $(cell).find("option[selected='true']");
            if (selected.length <= 0) {
                cell.attr("value", "null");
                cell.innerHTML = "";
                return;
            }
            var selectedValue = selected.attr("value");
            cell.setAttribute("value", selectedValue);
            $(cell).find(".cell-value").html(selected.html());
            return;
        }
        var value = $(cell).find("input").val();
        var validating = meta.attr("validating");
        if (validating != null && validating != undefined) {
            if (!TreeTable.ValidateRow(value, validating)) {
                $(cell).addClass("invalid");
            }
        }
        cell.setAttribute("value", value);
        var format = cell.getAttribute("format");
        if (format != undefined && format != null) {
            value = format.replace(/x/, value);
        }
        else {
            format = meta.attr("format");
            if (format != undefined && format != null) {
                value = format.replace(/x/, value);
            }
        }
        $(cell).find(".cell-value").html(value);
    },

    ValidateRow: function(value, expression) {
        var regexp = new RegExp(expression);
        return regexp.test(value)
    },

    CancelRow: function() {
        var row = this.getAttribute("identifier");
        var row = TreeTable.table.find("#row" + row);
        if (!row.hasClass("edited")) return false;
        var id = row.attr("identifier");
        var cells = row.find(".data");
        for (var i = 0; i < cells.length; i++) {
            var cell = $(cells[i]);
            var meta = TreeTable.GetMetaCell(cell);
            if (!cell.hasClass("editing") || cell.hasClass("readonly") || meta.hasClass("readonly")) {
                continue;
            }
            cell.removeClass("editing");
            var value = cell.attr("oldvalue");
            cell.find(".cell-value").html(value);
        }
        $(".context-menu .edited").hide();
        row.removeClass("edited");
        return false;
    },

    DeleteRow: function(row) {
        row.removeClass("updated");
        row.removeClass("selected");
        row.addClass("deleted");
        if (row.hasClass("new")) {
            row.remove();
        }
    },

    RemoveRow: function() {
        var row = this.getAttribute("identifier");
        var row = TreeTable.table.find("#row" + row);
        TreeTable.ParkMenu();
        TreeTable.DeleteRow(row);
        return false;
    },

    RemoveRows: function() {
        var row = TreeTable.table.find(".item.selected");
        TreeTable.ParkMenu();
        TreeTable.DeleteRow(row);
        return false;
    },

    ParkMenu: function() {
        var menu = $(".context-menu");
        menu.hide();
        $(".meta .indicator_cells", TreeTable.table).prepend(menu);

        TreeTable.ParkSearch();
    },

    ParkSearch: function() {
        var menu = $(".search-menu");
        menu.append($("#search-button"));
        $(".meta .indicator_cells", TreeTable.table).prepend(menu);
    },

    InsertRow: function() {
        var row = this.getAttribute("identifier");
        var row = TreeTable.table.find("#row" + row);
        var newrow = TreeTable.meta.clone();
        newrow.find(".data").empty();
        newrow.removeClass("meta");
        newrow.addClass("item");
        newrow.find(".indicator").remove();
        newrow.find(".indicator_cells").remove();
        if (row.length > 0) {
            row.after(newrow);
        }
        else {
            TreeTable.table.find("tbody").append(newrow);
        }
        newrow.addClass("new");
        newrow.attr("identifier", "new");
        // newrow.attr("class", "item");
        //newrow.attr("name", row.attr("name"));
        // var cells =;
        // for(var i = 0; i<cells.length; i++)
        // {
        // var cell = cells[i];
        // var value = cell.getAttribute("name");
        // newrow.append("<td class='data' name='" + value + "'></td>");
        // }
        TreeTable.InitRow(newrow);
        return false;
    },

    PageSelected: function() {
        TreeTable.footer.find(".pages .active").removeClass("active");
        $(this).addClass("active");
        TreeTable.currentPage = this.innerHTML;
        TreeTable.ReloadData();
    },

    ChangeSortCriteria: function() {
        var descending = false;
        if ($(this).hasClass("sort-field")) {
            descending = true;
        }
        if ($(this).hasClass("sort-descending")) {
            descending = false;
        }
        TreeTable.meta.find(".sort-field").removeClass("sort-field");
        TreeTable.meta.find(".sort-descending").removeClass("sort-descending");
        $(this).addClass("sort-field");
        if (descending) {
            $(this).addClass("sort-descending");
        }
        TreeTable.ReloadData();
    },

    SaveData: function() {
        if (TreeTable.table.find(".load-indicator").length > 0) {
            return;
        }
        var data = document.createElement("div");
        $(data).append(TreeTable.table.find(".new,.updated,.deleted").clone());
        var url = TreeTable.handlerUrl + "?action=save&page=" + TreeTable.currentPage + "&count=" + TreeTable.pageSize + "&sort=" + TreeTable.GetSortField();
        $.post(url, data.innerHTML, TreeTable.ReloadDataInternal);
        TreeTable.table.find(".button[action='save-all']").addClass("load-indicator");
        TreeTable.Notify("Сохранено...");
    },

    GetSortField: function() {
        var sort = TreeTable.table.find(".meta .data.sort-field");
        var sortField = sort.attr("name");
        if (sort.hasClass("sort-descending")) {
            sortField += "&sortback=true";
        }
        return sortField;
    },

    Notify: function(message) {
        TreeTable.table.find(".notify").html(message);
    },

    ShowNotify: function(message) {
        TreeTable.Notify(message);
        TreeTable.table.find(".notify").fadeIn(600);
        window.setTimeout(TreeTable.HideNotify, 2000);
    },

    HideNotify: function() {
        TreeTable.table.find(".notify").fadeOut(600);
        //TreeTable.table.find(".notify").html("");
    }
}

TreeTable.Init(".tree-table");

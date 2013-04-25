HCal = M.GetModuleEndsUrl("/hcal.htm");

HCal.DayVal = 86400000; //Количество миллисекунд в дне

HCal.Months = [
    "январь",
    "февраль",
    "март",
    "апрель",
    "май",
    "июнь",
    "июль",
    "август",
    "сентябрь",
    "октябрь",
    "ноябрь",
    "декабрь"
];

HCal.DNames = [
    "вс",
    "пн",
    "вт",
    "ср",
    "чт",
    "пт",
    "сб"
];

HCal.Init = HCal.init = function() {

};


HCal.InitComponent = HCal.initComponent = function(elem) {
    for (var func in hcal) {
        elem[func] = hcal[func];
    }
    elem.initHCal();
};

hcal = {};

hcal.initHCal = function(currentDate) {
    if (!currentDate) {
        currentDate = new Date();
    }
    this.CalHeader = this.GetOrDiv(".header");
    this.calendar = this.GetOrDiv(".calendar");
    this.leftBtn = this.calendar.GetOrDiv(".left-btn.cal-btn");
    this.rightBtn = this.calendar.GetOrDiv(".right-btn.cal-btn");
    this.CalContent = this.calendar.GetOrDiv(".content");
    this.calendar.GetOrDiv(".clear");    
    this.CalNames = this.GetOrDiv(".day-names");
    
    this.leftBtn.onclick = function(event) {
        cal.MoveLeft();
    };
    this.rightBtn.onclick = function(event) {
        cal.MoveRight();
    };
    this.SelDates = DOM.div(".selected-dates");
    this.MarkDates = DOM.div(".mark-dates");
    this.currentDate = currentDate;
    var month = currentDate.getMonth();
    var year = currentDate.getFullYear();
    this.showDate = new Date(year, month, 1);
    this._setDate(currentDate);
};

hcal.initContent = function() {
    var date = this.showDate;
    var content = this.CalContent;
    content.clear();
    var dn = this.CalNames;
    dn.clear();
    var day = 1;
    var month = date.getMonth();
    while (date.getMonth() == month) {
        content._add(this._createCell(date));
        dn._add(this._createDN(date));
        day++;
        date = new Date(date.getFullYear(), date.getMonth(), day);
    }
};

hcal.Clean = function() {
    this.initHCal();
};

hcal.SetDate = function(currentDate) {
    if (currentDate) {
        this.currentDate = currentDate;
        var month = currentDate.getMonth();
        var year = currentDate.getFullYear();
        this.showDate = new Date(year, month, 1);
    } else {
        var date = new Date();
        var month = date.getMonth();
        var year = date.getFullYear();
        this.showDate = new Date(year, month, 1);
    }
    this._setDate();
};

hcal._setDate = function(currentDate) {
    this.CalHeader.innerHTML = HCal.Months[this.showDate.getMonth()] + " " + this.showDate.getFullYear() + " г.";
    this.initContent();
};

hcal._createCell = function(date) {
    var cell = DOM._div(".hcal-day");
    cell.innerHTML = date.getDate();
    var day = date.getDay();
    if (day == 0 || day == 6) {
        cell._add(".holiday");
        if (day == 0) {
            cell._add(".week-end");
        }
    }
    if (date == this.currentDate) {
        cell._add(".current");
    }
    if ((window.DDates && DDates.HasDate && DDates.HasDate(date)) || (this.DDates && this.DDates.HasDate && this.DDates.HasDate(date))) {
        cell._add(".disabled");
    }
    else {
        if (this.SelDates._has("#date" + date.formatDate(""))) {
            cell._add(".selected");
        }
        if (this.MarkDates._has("#date" + date.formatDate(""))) {
            cell._add(".marked");
        }
    }
    cell.id = 'cell' + date.formatDate("");
    cell.day = date.getDate();
    cell.onclick = function() {
        var hcal = this._get("^.hcal");
        if (this._is(".disabled")) return;
        if (this._is(".selected")) {
            hcal.SelDates._del("#date" + date.formatDate(""));
            this._del(".selected");
        }
        else {
            hcal.SelDates._div("#date" + date.formatDate(""));
            this._add(".selected");
        }
        hcal._dateSelected(this.day, this);
    };
    return cell;
};

hcal._createDN = function(date) {
    var cell = DOM._div(".hcal-day-name");
    cell.day = date.getDay();
    cell.innerHTML = HCal.DNames[date.getDay()];
    if (cell.day == 0 || cell.day == 6) {
        cell._add(".holiday");
        if (cell.day == 0) {
            cell._add(".week-end");
        }
    }
    return cell;
};

hcal._dateSelected = function(day, cell) {
    if (typeof (this.OnSelectDate) == 'function') {
        var date = new Date(this.showDate.getFullYear(), this.showDate.getMonth(), day);
        if (typeof (this.OnUnSelectDate) == 'function' && !cell._is(".selected")) {
            this.OnUnSelectDate(date);
        } else {
            this.OnSelectDate(date);
        }
    }
};

hcal.SelectDate = function(date, toggle) {
    var sd = this.SelDates._get("#date" + date.formatDate(""));
    var cell = this.CalContent._get("#cell" + date.formatDate(""));
    if (sd) {
        if (toggle) {
            sd._del();
            if (cell) {
                cell._del(".selected");
            }
        } else {
            return true;
        }
    } else {
        if (DDates.HasDate && !DDates.HasDate(date)) {
            this.SelDates._div("#date" + date.formatDate(""));
            if (cell) {
                cell._add(".selected");
            }
            return true;
        }
    }
    return false;
};


hcal.MarkDate = function(date) {
    var sd = this.MarkDates._get("#date" + date.formatDate(""));
    var cell = this.CalContent._get("#cell" + date.formatDate(""));
    if (!sd && !DDates.HasDate(date)) {
        this.MarkDates._div("#date" + date.formatDate(""));
            if (cell) {
                cell._add(".marked");
            }
            return true;
    }
    return false;
};


hcal.UnSelectDate = function(date) {
    var sd = this.SelDates._get("#date" + date.formatDate(""));
    var cell = this.CalContent._get("#cell" + date.formatDate(""));
    if (sd) {
        sd._del();
        if (cell) {
            cell._del(".selected");
        }
        return true;
    }
    return false;
};

hcal.MoveLeft = function() {
    var date = this.showDate;
    var month = date.getMonth();
    var year = date.getFullYear();
    if (month == 0) {
        month = 11;
        year--;
    } else {
        month--;
    }
    date = new Date(year, month, 1);
    this.showDate = date;
    this._setDate(date);
};

hcal.MoveRight = function() {
    var date = this.showDate;
    var month = date.getMonth();
    var year = date.getFullYear();
    if (month == 11) {
        month = 0;
        year++;
    } else {
        month++;
    }
    date = new Date(year, month, 1);
    this.showDate = date;
    this._setDate(date);
};


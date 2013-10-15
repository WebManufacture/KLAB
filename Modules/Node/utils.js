global.extend = function (Child, Parent) {
    var F = function() { }
    F.prototype = Parent.prototype
    Child.prototype = new F()
    Child.prototype.constructor = Child
    Child.superclass = Parent.prototype
}

global.mixin = function (Parent, Child) {
    for (var item in Child){
		if (typeof Child[item] == "function" && Parent[item] == undefined){
			Parent[item] = Child[item];
		}
	}
}

Date.prototype.formatTime = function(withMilliseconds){
	if (withMilliseconds){
		return this.getHours() + ":" + this.getMinutes() + ":" + this.getSeconds() + "." + this.getMilliseconds();	
	}
	else{
		return this.getHours() + ":" + this.getMinutes() + ":" + this.getSeconds();
	}
};

Date.prototype.formatDate = function(separator, reverse){
	var date = this.getDate();
	if (date < 10){
		date = "0" + date;
	}
	var month = this.getMonth() + 1;
	if (month < 10){
		month = "0" + month;
	}
	if (!separator){ separator = "-" }
	if (reverse){
		return date + separator + month + separator + this.getFullYear();	
	}
	else
	{
		return this.getFullYear() + separator + month + separator + date;	
	}
};

Date.prototype.formatDateRus = function(){
	return this.formatDate('.', true);
};

Date.MonthRusNames = [
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

Date.prototype.formatRus = function(){
	var date = this.getDate();
	var month = Date.MonthRusNames[this.getMonth()];
	return date + " " + month + " " + this.getFullYear();	
};

Date.ParseRus = function(value){
	var dt = value.split(" ");
	var time = null;
	if (dt.length > 1){
		var time = dt[1].split(":");
	}
	var date = dt[0].split(".");
	if (time){
		return new Date(parseInt(date[2]), parseInt(date[1]) - 1, parseInt(date[0]), parseInt(time[0]), parseInt(time[1]));	
	}
	else{
		return new Date(parseInt(date[2]), parseInt(date[1]) - 1, parseInt(date[0]));
	}
};

Array.prototype.Contains = Array.prototype.contains = Array.prototype.has = function(value){
	return this.indexOf(value) >= 0;
};

String.prototype.Contains = function(str) {
	var type = typeof(str);
	if (type == "string"){
		return this.indexOf(str) >= 0;
	}
	if (str.length != undefined){
		for (var i = 0; i < str.length; i++) {
			if (this.indexOf(str[i]) >= 0) return true;
		}
	}    
	return false;
};


String.prototype.endsWith = String.prototype.end = String.prototype.ends = function(str) 
	{
		return this.lastIndexOf(str) == this.length - str.length;
	};

function StringSelector(){
	return DOM(this);
};

//String.prototype.__defineGetter__("sel", StringSelector);

String.prototype.contains = String.prototype.has = function(substr){
	return this.indexOf(substr) > -1;
};  

String.prototype.start = function(str){
	return this.indexOf(str) == 0;
};

String.prototype.get = function(regex){
	if (regex instanceof RegExp){
		var match = regex.exec(this);
		if (match.length > 0) return match[match.length - 1];
		return null;
	}
	return null;	
};
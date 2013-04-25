var URL;

// Прячем всю реализацию в замыкание. Так надо, т.к. мы прячем служебные функции parseURL и updateURL.
(function() {

URL = function(url) {
    // Собственно, данные. Для каждого нового объекта URL - свои, естественно.
    var href, protocol, host, hostname, port, pathname, search, hash;
    
    // Минус данного подхода - нам приходится определять методы в конструкторе, а не в прототипе.
    // Get/set href - при set вызываем parseURL.call(this), 
    // т.е. внешняя функция parseURL обрабатывает объект типа URL - this.
    this.href = function(val) {
        if (typeof val != "undefined") {
            href = val;
            parseURL.call(this);
        }
        return href;
    }
    
    // Get/set protocol
    // Подобно set href, set protocol вызывает updateURL.call(this), который обновляет все параметры.
    this.protocol = function(val) {
        if (typeof val != "undefined") {
            // Плюшка - если protocol не задан, берём из window.location
            if (!val)
                val = protocol || window.location.protocol;
            protocol = val;
            updateURL.call(this);
        }
        return protocol;
    }
    
    // Get/set host
    // Здесь особенность в том, что host, hostname и port - связаны между собой.
    // Поэтому надо делать дополнительную работу при set host.
    this.host = function(val) {
        if (typeof val != "undefined") {
            val = val || '';
            var v = val.split(':');
            var h = v[0], p = v[1] || '';
            host = val;
            hostname = h;
            port = p;
            updateURL.call(this);
        }
        return host;
    }
    
    // Get/set hostname
    // Опять учитываем связку host, hostname и port.
    this.hostname = function(val) {
        if (typeof val != "undefined") {
            if (!val)
                val = hostname || window.location.hostname;
            hostname = val;
            host = val + (("" + port) ? ":" + port : "");
            updateURL.call(this);
        }
        return hostname;
    }
    
    // Get/set port
    // Опять учитываем связку host, hostname и port.
    this.port = function(val) {
        if (typeof val != "undefined") {
            port = val;
            host = hostname + (("" + port) ? ":" + port : "");
            updateURL.call(this);
        }
        return port;
    }
    
    // Get/set pathname
    // С pathname интересно. Я сделал возможность использования
    // relative pathname, т.е. если мы будем set'ить pathname,
    // и новое значение не будет начинаться с '/', то дополнится текущее.
    this.pathname = function(val) {
        if (typeof val != "undefined") {
            if (val.indexOf("/") != 0) { // relative url
                var _p = (pathname || window.location.pathname).split("/");
                _p[_p.length - 1] = val;
                val = _p.join("/");
            }
            pathname = val;
            updateURL.call(this);
        }
        return pathname;
    }
    
    // Get/set search
    this.search = function(val) {
        if (typeof val != "undefined") {
            search = val;
        }
        return search;
    }
    
    // Get/set hash
    this.hash = function(val) {
        if (typeof val != "undefined") {
            hash = val;
        }
        return hash;
    }
    
    url = url || "";
    parseURL.call(this, url);
}

URL.prototype = {
    /**
     * Есть такой метод у window.location. Переход по заданому URL.
     */
    assign: function(url) {
        parseURL.call(this, url);
        window.location.assign(this.href());
    },
    
    /**
     * Есть такой метод у window.location. Переход по заданому URL, но без внесения в history
     */
    replace: function(url) {
        parseURL.call(this, url);
        window.location.replace(this.href());
    }
}

// Служебная функция, которая разбирает URL на кусочки.
// В предидущей реализации эта ф-ция была методом объекта URL.
// Теперь я её вынес, т.к. пользователь больше никогда не будет её вызывать.
function parseURL(url) {
    if (this._innerUse)
        return;
    
    url = url || this.href();
    var pattern = "^(([^:/\\?#]+):)?(//(([^:/\\?#]*)(?::([^/\\?#]*))?))?([^\\?#]*)(\\?([^#]*))?(#(.*))?$";
    var rx = new RegExp(pattern); 
    var parts = rx.exec(url);
    
    // Prevent infinite recursion
    this._innerUse = true;
    
    this.href(parts[0] || "");
    this.protocol(parts[1] || "");
    //this.host(parts[4] || "");
    this.hostname(parts[5] || "");
    this.port(parts[6] || "");
    this.pathname(parts[7] || "/");
    this.search(parts[8] || "");
    this.hash(parts[10] || "");
    
    delete this._innerUse;
    
    updateURL.call(this);
}

// Служебная функция, которая обновляет URL при изменении кусочка.
// В предидущей реализации эта ф-ция тоже была методом объекта URL.
// Теперь я её вынес, т.к. пользователь больше никогда не будет её вызывать.
// Заметим, что эта фуекция сильно похудела, её части разошлись по setter'ам.
function updateURL() {
    if (this._innerUse)
        return;
    
    // Prevent infinite recursion
    this._innerUse = true;
    
    this.href(this.protocol() + '//' + this.host() + this.pathname() + this.search() + this.hash());
    
    delete this._innerUse;
}

})()
auto={};
auto.sours=undefined;
auto.key=[32,13];
auto.text=undefined;
auto.start = function(event){
    auto.loadData();
    if (auto.key.join().search(event.keyCode) != 0){
        auto.keys(String.fromCharCode(event.keyCode))
	    }
};
auto.keys = function(key){
    texts.innerHTML+=key;
    auto.autocom(texts.innerHTML);
};
auto.saveData = function () {
    var data = [];
    var allElem = DOM.all('.a-item');
    if (allElem.length != 0) {
        for (var i = 0; i < allElem.length; i++) {
            var adds = allElem[i].get('@name');
            if (adds != null) {
                data.push(adds);
            }
        }
    }
    if (data.length != 0) {
        localStorage.auto = JSON.stringify(data);
    }
};
auto.loadData = function () {
    auto.sours = DOM('.sours');
    if (auto.sours==null){
        auto.sours=document.body.div('.sours');
        DOM.hide(auto.sours);
    }
    sours.clear();
    if (localStorage.auto != null) {
        var data = JSON.parse(localStorage.auto);
        for (var i = 0; i < data.length; i++) {
            var divs = sours.div('.a-item');
            divs.add('@name', data[i]);
            divs.innerHTML = data[i];
        }
    }
};
auto.autocom = function(key){
    var auto = DOM('.auto');
    auto.clear();
    var num=1;
    var data = DOM.all('.a-item[name^='+key+']');
    for (var i=0;i<data.length;i++){
        data[i].add('@posit', num).clone();
        auto.add(data[i].clone());
        num++;
    }
    if(auto.get('.a-item')){
        auto.get('.a-item').add('.defolt');
    }
    auto.style.top=input.offsetTop+20;
    auto.style.left=input.offsetLeft;
};
setInterval(auto.saveData, 18000);
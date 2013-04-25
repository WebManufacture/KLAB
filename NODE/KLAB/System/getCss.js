function getCss(selectorName,file){ //вщзвращает именно обьект того класса который мы ищем(ну я тут хотел доделать из какого именно подключаемого файла но это немного позже
    var sty;
    var ret;
    var style = document.styleSheets;
    if(file){
        sty = styleShe();
        if(sty){
            for(var r = 0;r<sty.length;r++){
                if(sty[r].selectorText==selectorName){
                    ret=sty[r];
                }
            }
        }
    }
    else{
        for(var i = 0;i<style.length;i++){
            sty=style[i].rules;
            if(sty){
                for(var r = 0;r<sty.length;r++){
                    if(sty[r].selectorText==selectorName){
                        ret=sty[r];
                    }
                }
            }
        }
    }
    return ret;
}
function styleShe(){ //возвращает обьект со стилями которые прописаны в html файле они там в rules находяться
    var sty;
    var style = document.styleSheets;
    for(var i = 0;i<style.length;i++){
        if(style[i].cssRules!=null || style[i].href==null){
            sty=style[i];
        }
    }
    return sty;
} 
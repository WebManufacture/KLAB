function DFCTech_WEB_Favelets(){
  var req = new XMLHttpRequest();
  req.url = 'http://system.web-manufacture.net/System.ContentHandler.ashx?file=Favelets.htm&action=get';
  req.open('GET', req.url, true);
  req.onload =  function(){
        var div = document.createElement('div');
        div.id = 'DFCTech_WEB_faveletDiv';
        div.style.display = 'none';
        div.innerHTML = this.responseText;
        document.body.appendChild(div);
        var script = div.querySelector('script.MainScript');
        if (script != null){
            window.eval(script.innerHTML);
        }
    };
  req.send(null);
}
DFCTech_WEB_Favelets();
void(0);
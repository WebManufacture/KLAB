DFCTech_WEB_Favelets={file: '{PlaceForFileName}'};
DFCTech_WEB_Favelets.Process = function(){
    var file = DFCTech_WEB_Favelets.file;
    window.DFCTech_WEB_ServerRoot = 'http://system.web-manufacture.net/';
    document.head = document.getElementsByTagName('head');
    document.head = document.head[0];     
    var link = document.createElement('link');
    link.setAttribute('rel', 'stylesheet');
    link.setAttribute('href', window.DFCTech_WEB_ServerRoot + 'system.common.css');
    document.head.appendChild(link);
    if (window.W == undefined || !window.W.IsOlmObject)
    {
	DFCTech_WEB_Favelets.CreateScript('system.js.js', DFCTech_WEB_Favelets.ContinueLoad);        
    }
    else
    {
	DFCTech_WEB_Favelets.ContinueLoad();
    };
};
DFCTech_WEB_Favelets.LoadModule = function(){
    M.LoadModule(DFCTech_WEB_Favelets.file, null, 'favelets');
};
DFCTech_WEB_Favelets.CreateScript = function(url, onload){
    var script = document.createElement('script');
    script.setAttribute('type', 'text/javascript');
    script.setAttribute('src', window.DFCTech_WEB_ServerRoot + url);
    script.onload = onload;
    document.head.appendChild(script);
    return script;
}; 
DFCTech_WEB_Favelets.ContinueLoad = function(){
    if (window.J == undefined || !window.J.IsOlmObject)
    {
	DFCTech_WEB_Favelets.CreateScript('system.jasp.js');        
    };
    if (window.X == undefined || !window.X.IsOlmObject)
    {
	DFCTech_WEB_Favelets.CreateScript('system.ajax.js');        
    };
    if (window.M == undefined || !window.M.IsOlmObject)
    {
	DFCTech_WEB_Favelets.CreateScript('system.modules.js', DFCTech_WEB_Favelets.LoadModule);        
    }
    else
    {
	DFCTech_WEB_Favelets.LoadModule();
    };
};
DFCTech_WEB_Favelets.Process();
void(0);
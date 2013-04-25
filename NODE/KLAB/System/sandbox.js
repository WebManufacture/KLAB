WS.DOMload(
function (){
    ds = DS = DOM.get("body")._div(".designer");
    
    if (Request.Params.File){
	ds.FileName = Request.Params.File;
	ds._set("@file", ds.FileName);
	DS.Data = DOM.div(".ajax-file");
	DS.Data._set("@file", ds.FileName);
	AjaxJasp._add(ds.Data);
	DS.Data.Get("body", ds.AnalizeData, DS);
    }    
    
    ds.AnalizeData = function(){
	
    }
}
)
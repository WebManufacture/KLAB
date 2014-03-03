ProcessorTypes = {
    Null : function(proc, obj){
	if (obj == undefined || obj == null){
	    return proc["null"];
	}
	return proc["exist"];
    },    
    
    UndefOrNull : function(proc, obj){
	if (obj == undefined){
	    return proc["undefined"];
	}
	if (obj == null){
	    return proc["null"];
	}
	return proc["exist"];
    },   
    
    ObjectType : function(proc, obj){
	var ot = typeof(obj);
	ot = proc[ot];
	if (ot == undefined || ot == null){
	   return proc["_default"]; 
	}
	return ot;
    }, 
    
    HtmlId : function(proc, obj){
	return proc[typeof(obj)];
    },
}
    
    




     

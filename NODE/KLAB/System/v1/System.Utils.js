Request = {
  Params : {},
  
  CreateUrl : function(file, param0, param1, param2, param3, param4, param5, param6){
    var url = "http://" + Request.Host + "/" + file;
    if (param0 != undefined && param0 != null){
      url += "?" + param0;
    }
    if (param1 != undefined && param1 != null){
      url += "&" + param1;
    }
    if (param2 != undefined && param2 != null){
      url += "&" + param2;
    }
    if (param3 != undefined && param3 != null){
      url += "&" + param3;
    }
    if (param4 != undefined && param4 != null){
      url += "&" + param4;
    }
    if (param5 != undefined && param5 != null){
      url += "&" + param5;
    }
    if (param6 != undefined && param6 != null){
      url += "&" + param6;
    }
    return url;
  },
      
  ParseRequest: function(){
    var parts = window.location.search.split("&");
    for (var i=0; i < parts.length; i++){
      var parameters = parts[i].split("=");
      var partName = parameters[0];
      partName = partName.replace('?', '');
      var partValue = parameters[1];
      Request.Params[partName] = partValue;
    }
    Request.Host = window.location.host;
    Request.File = window.location.pathname.replace("/", "");
  },
}
  
Request.ParseRequest();

 
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
    }  
      
String.prototype.endsWith = function(str) 
{
  return (this.match(str+"$")==str)
}
  

String.prototype.contains = function(substr){
  return this.indexOf(substr) > -1;
}  
  
String.prototype.start = function(str){
  return (this.match("^" + str)==str)
}  
  
function AArray(){
  var arr = [];  
  
  arr.uadd = function(name){
    if (this.contains(name)) return null;
    this.push(name);
    return this.length;
  }
    
  arr.contains = function(name){
    return this.indexOf(name) >= 0;
  }
  
  arr.add = function(name, elem){
    
    if (this.objects == undefined || this.objects == null)
     {
       this.objects = {};
     }
    var obj = this.objects[name];
    if (obj == undefined || obj == null)
    {
       this.push(name);
       this.objects[name] = elem;
    }
    if (elem == undefined || elem == null){
      this.del(name);
    }    
    return this.length;
  }
    
  arr.get = function(name){
  if (this.objects == undefined || this.objects == null)
     {
       this.objects = {};
     }
    var obj = this.objects[name];
    if (obj != undefined && obj != null)
    {
      return obj;
    }
    return null;
  }
  
  arr.del = function(name){
    if (this.objects == undefined || this.objects == null)
     {
       return this.length;
     }
    var obj = this.objects[name];
    if (obj != undefined && obj != null)
     {
       this.objects[name] = undefined;
       this.remove(name);
     }
     return this.length;
  }
    
  arr.insert = function(index, name, elem){
    if (this.objects == undefined || this.objects == null)
    {
      return this.length;
    }
    if (index == 0 && this.length == 0){
      this.add(name, elem); 
    }
    if (index >= 0 && index < this.length)
    {
      this.objects[name] = elem;
      var other = this.slice(index);
      this[index] = name;
      index++;
      for (var i = 0; i < other.length; i++){
        this[index + i] = other[i];
      }
    }
    return this.length;
  }
  
  return arr;
}
  
 
  

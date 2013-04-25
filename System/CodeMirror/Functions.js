function Function(context)
{
  this.Ready=false;
  this.ReadyParams=[];
  this.Context = context;
  this.Functions = [];
  this.Channels = {};
  
  this.SetParam = function (name, param) {
     this[name] = param;
     if (this.CheckParams != undefined)
     {
        this.CheckParams(name,param);
     }
     return this.Ready;
  }
    
  this.CheckParams(name, param)
  {
     this.Ready = true;
     for (var i=0; i < ReadyParams.length; i++)
     {
        if (Channels[ReadyParams[i]] == undefined)
          this.Ready = false;
     }
  }

  this.Body = function(){
     this.Channels()     
  }
}
       
function Channel(context){
  this.Listeners = [];
  this.Value = null;
    
  this.AddListener = function(listener){
      this.Listeners.push(listener);
  }
  
  this.SetValue = function(value)
  {
     this.Value = value;
     for (var i = 0; i < this.Listeners.length; i++)
     {
       this.Listeners[i](value);
     }
  }
    
  this.GetValue = function()
  {
     return this.Value;  
  }
}

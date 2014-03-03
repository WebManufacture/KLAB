var contentLoaded = 0;

var ContentLoadCompleteOrder = [];

var ScriptsLoadCompleteCounter = {};

if (window.Node && window.XMLSerializer) {
    Node.prototype.__defineGetter__('outerHTML', function() { return new XMLSerializer().serializeToString(this); });
}

if (window.$$ == undefined)
{
  window.$$ = {};
  $$.MessagesCounter = 0;
  $$.Handlers = null;
  $$.Messages = null;
}

$$.Queue = [];

$$.ProcessInterval = 1;

$$.ProcessesCounter = 0;

$$.ProcessHandlers = function(message) {
if (message == undefined || message == null) {
    LogError("$$.ProcessHandlers message in undefined");
    return;
}
  if (message.cancelled) return;
  $$.Current = message;
  var handler = message.handler;
  handler.process = handler.getAttribute("process");
  handler.order = handler.getAttribute("order");
  if (handler.order == null)
  {
  handler.order = "post";
  }
  handler.selector = handler.getAttribute("selector");
  handler.type = handler.getAttribute("type");
  if ((handler.type != "nop") && (handler.order == "prev" || handler.order == "both"))
  {
    $$.ProcessHandlerInternal(message);
    if (message.cancelled){  return; }
  }  
  if (handler.process != "skip")
  {    
    var childs = $(handler).children();
    for(var i = 0; i < childs.length; i++)
    {
      message.handler =  childs[i];
      $$.ProcessHandlers(message);
      if (message.cancelled) return;
    }
  }
  message.handler = handler;
  if ((handler.type != "nop") && (handler.order == "post" || handler.order == "both"))
  {
    $$.ProcessHandlerInternal(message);
  }
}

$$.ProcessHandlerInternal = function(message) {
if (message == undefined || message == null) {
    LogError("$$.ProcessHandlerInternal message in undefined");
    return;
}
    try {
        switch (message.handler.type) {
            case "link":

                var func = message.handler.getAttribute("function");
                $$.Handlers[func](message);
                break;
            case "jasp":
                $$.ParseMessage(message);
                break;
            default:
                window.eval(message.handler.textContent);
                break;
        }
        $$.ProcessesCounter++;
    }
    catch (e) {
        window.LogError(e);
    }
    if (!message.hasAttribute("permanent") && !message.cancelled) {
        message.setAttribute("processed", message.processed);
    }
    message.setAttribute("num", $$.ProcessesCounter);
}

$$.ProcessMessages = function()
{
  var message = $$.Queue.shift();
  if(message != undefined && message != null)
  {
    $$.ProcessHandlers(message);
    $$.CurrentHandler = window.setTimeout($$.ProcessMessages, $$.ProcessInterval);
    return;
  }
  window.clearTimeout($$.CurrentHandler);
  $$.CurrentHandler = null;
}

$$.ProcessMessage = function(message, parent) {
    if (message == undefined || message == null) {
        LogError("$$.ProcessMessage message in undefined");
        return;
    }
  if (typeof message == "string")
  {
    message = $$.AddMessage(message);
  }
  else{
    if (parent == undefined){
      $$.Messages.insertBefore(message, $$.Messages.firstChild);
    }
  }
  if (message.id == undefined || message.id == null || message.id == "")
  {
    message.id = "msg" + $$.MessagesCounter;
    message.setAttribute("id", message.id);
    $$.MessagesCounter++;
  }  
  if (message.processing == undefined || message.processing == null)
  {
    message.processing = 0;  
  }
  message.cancelled = false;
  message.processing ++;
  message.setAttribute("processing", message.processing);
  message.handler = $$.Handlers;
  //$$.ProcessHandlers(message);
  $$.Queue.push(message);
  if ($$.CurrentHandler == null || $$.CurrentHandler == undefined)
  {
    $$.CurrentHandler = window.setTimeout($$.ProcessMessages, $$.ProcessInterval);
  }
}

$$.ProcessElement = function(element)
{
  $$.ProcessHandlers(message);
  $$.Queue.push(message);
  if ($$.CurrentHandler == null || $$.CurrentHandler == undefined)
  {
    $$.CurrentHandler = window.setTimeout($$.ProcessMessages, $$.ProcessInterval);
  }
}

  
$$.ReProcess = function(criteria, handler, full, base)
{
  if (base != undefined && base != null)
  var selector = base + ".jasp-message"+ criteria;
  else
  var selector = "#messages_queue>.jasp-message"+ criteria;
  if (full == undefined || full == null){
    selector += ":not([processed='true'])"
  }
  var notProcessedMessages = document.querySelectorAll(selector);
  for (var i =  notProcessedMessages.length - 1; i >= 0; i--)
  {
    if (handler != undefined && handler != null){
        notProcessedMessages[i].handler = handler;
    $$.ProcessHandlers(notProcessedMessages[i]); 
    }
    else{
    $$.ProcessMessage(notProcessedMessages[i]); 
    }
  }
}

$$.CreateMessage = function(type, classes)
{
  var element = document.createElement(type);
  element.setAttribute("class", "jasp-message");
  $(element).addClass(classes);
  element.id = "msg" + $$.MessagesCounter;
  element.setAttribute("id", element.id);
  $$.MessagesCounter++;
  return element;
}
  
$$.AddMessage = function(element)
{
  if (element == undefined || element == null)
  {
    element = $$.CreateMessage("message");
  }
  else{
    if (typeof element == "string")
    {
      var temp = document.createElement("div");
      temp.innerHTML = element;
      element = temp.firstChild;
    }
  }
  if (element.id == undefined || element.id == null || element.id == "")
  {
    element.id = "msg" + $$.MessagesCounter;
    element.setAttribute("id", element.id);
    $$.MessagesCounter++;
  }
  $(element).addClass("jasp-message");
  var element = $$.Messages.insertBefore(element, $$.Messages.firstChild);
  return element;
}

$$.AddEvent = function(body, eventid){
  $$.ProcessMessage("<eval event-id='" + eventid + ">"+ body + "</eval>");
}
  
$$.FireEvent = function(eventid){
  $$.ProcessMessage("<event target-id='" + eventid + "></event>");
}
  
$$.Subscribe = function(message) {
if (message == undefined || message == null) {
    LogError("$$.Subscribe message in undefined");
    return;
}
  var destination = message.getAttribute("parent");
  message.processed = null;
  message.setAttribute("processed", null);
  message.removeAttribute("event-id");
  message.removeAttribute("num");
  message.removeAttribute("processed");
  message.removeAttribute("processing");
  $(message).addClass("jasp-handler");
  if (destination != undefined && destination != null)
  {
    var isimportant = message.getAttribute("important");
    if (isimportant)
    {
      $(destination, $$.Handlers).prepend(message);
    }
    else
    {
      $(destination, $$.Handlers).append(message);
    }
  }
  else
  {
    $$.Handlers.appendChild(message);
  }
  var reprocess = message.getAttribute("reprocess");
  var full = message.getAttribute("fullreprocess");
  if (reprocess != null && reprocess != undefined)
  {
  if (full)
    {
       $$.ReProcess(reprocess, message, true);
  }
  else{
     $$.ReProcess(reprocess, message);
  }
  }
  }
  
 
function WaitBody() {
    if (document.body != undefined) {
        MRT_IS_SiteFabric_LoadHTML();
        return;
    }
    window.setTimeout(WaitBody, 100);
}

function MRT_IS_SiteFabric_LoadHTML() {
    contentLoaded = 0;
  
  var div = document.createElement("div");
    div.setAttribute("id", "MRT_IS_SiteFabric-MainDiv");
  document.body.appendChild(div);
  window.MRT_IS_SiteFabric_MainDiv = div;
    
  var div = document.createElement("JASP");
    div.setAttribute("id", "MRT_IS_SiteFabric-JASP_Queue");
  document.body.appendChild(div);
  
  var header = document.getElementsByTagName("head")[0];
  document.header = header;
  
  if (window.jQuery == undefined)
  {
    var script = document.createElement("script");
    script.setAttribute("type", "text/javascript");
    script.setAttribute("id", "script_1_MRT_IS_SiteFabric-PRELOAD");
    script.setAttribute("source", "MRT_IS_SiteFabric-MainDiv");
    script.setAttribute("key", "jquery");
    script.setAttribute("src", GetServerRoot() + "jquery-1.4.2.js");
    header.appendChild(script);
  
    script = document.createElement("script");
    script.setAttribute("type", "text/javascript");
    script.setAttribute("id", "script_2_MRT_IS_SiteFabric-PRELOAD");
    script.setAttribute("source", "MRT_IS_SiteFabric-PRELOAD");
    script.setAttribute("src", GetServerRoot() + "jquery-ui-1.8.4.custom.js");
    header.appendChild(script);
  }
  else{
  
    if (window.jQuery.ui == undefined)
    {
    script = document.createElement("script");
    script.setAttribute("type", "text/javascript");
    script.setAttribute("id", "script_2_MRT_IS_SiteFabric-PRELOAD");
    script.setAttribute("source", "MRT_IS_SiteFabric-PRELOAD");
    script.setAttribute("src", GetServerRoot() + "jquery-ui-1.8.4.custom.js");
    header.appendChild(script);
  }
  }
    WaitForSystemInitialized();
}

function WaitForSystemInitialized() {
  if (window.jQuery != undefined) {
    if (window.jQuery.ui != undefined) {
      $$.InitMessagesQueue();
    $$.Initialized = true;
      $$.InitLogSystem();
      $$.InitAjaxSystem();
      $$.InitJASPSystem();
    $$.ProcessMessage("<ajax id='msg_JASP_EXTENTIONS_LOADING' urlbase='proxy' url='System.JASP.htm' append='#MRT_IS_SiteFabric-JASP_Queue'></ajax>");
    //$$.ProcessMessage("<event id='msg_Messages_System_Loaded' target-id='msg_Messages_System_Loaded' ></event>");
    LogInfo("Base systems initialized");
      LoadPages();
      return;
    }
  }
    window.setTimeout(WaitForSystemInitialized, 100);
}


$$.ServerRoot = ""; 

function GetServerRoot(file) {
  if (file != undefined)
  {
    return $$.ServerRoot + file;
  }
    return $$.ServerRoot;
}

function GetSimpleHandler(filename) {
    var path = GetServerRoot() + "System.ContentHandler.ashx?file=" + filename;
    return path;
}

function GetProxiedUrl(filename, action) {
    if (action == undefined || action==null) action = "get";
    var path = GetSimpleHandler(filename) + "&action=" + action;
    return path;
}

function GetImagesHandler(path, params) {
    var path = GetServerRoot() + "System.ImagesHandler.ashx?path=" + path;
    if (params.length != undefined) {
        path += "&" + params;
    }
    return path;
}

function ContentGet(fileName, callback) {
    var req = new XMLHttpRequest();
  req.file = fileName;
    req.open("GET", GetProxiedUrl(fileName, "text"), true);
  req.onerror = ShowAjaxError;
  if (callback != undefined)
        req.onload = callback;
    req.send(null);
    return req;
}

function ContentSave(fileName, data, callback) {
    var req = new XMLHttpRequest();
  req.file = fileName;
    req.open("POST", GetProxiedUrl(fileName, "save"), true);
  req.onerror = ShowAjaxError;
    if (callback != undefined)
        req.onload = callback;
    req.send(data);
    return req;
}
 
$$.InitMessagesQueue = function(){
  $$.Messages = document.getElementById("#messages_queue");
  if ($$.Messages == null)
  {
    $$.Messages = document.createElement("messages");
    $$.Messages.setAttribute('class', 'messages-queue');
    $$.Messages.setAttribute('id', 'messages_queue');
  document.body.appendChild($$.Messages);
  }
  
  $$.Handlers = document.getElementById("#handlers_queue");
  if ($$.Handlers == null)
  {
    $$.Handlers = document.createElement("handler");
    $$.Handlers.setAttribute('class', 'handlers_queue');
    $$.Handlers.setAttribute('id', 'handlers_queue');
    $$.Handlers.setAttribute('type', 'nop');
    document.body.appendChild($$.Handlers);
  }
    
  $$.Handlers.Subscribe = $$.Subscribe;
  
  $$.Handlers.TagsHandler = function(message){
    var type = message.tagName.toLowerCase();
    if (type == undefined || type == null)
    {
      return false;
    }
    var handlers = $("#tags-handler .jasp-handler[for='" + type + "']");
    for(var index = handlers.length - 1; index >= 0 ; index--)
    {
      message.handler =  handlers[index];
      $$.ProcessHandlers(message);
    }
  }
  
  $$.Handlers.TypesHandler = function(message){
    var type = message.getAttribute("type");
    if (type == undefined || type == null)
    {
      return false;
    }
    var handlers = $("#types-handler .jasp-handler[for='" + type + "']");
    for(var index = handlers.length - 1; index >= 0 ; index--)
    {
      message.handler =  handlers[index];
      $$.ProcessHandlers(message);
    }
  }
  
  $$.Handlers.EventProcessor = function(message){
    var type = message.getAttribute("target-id");
  var eventtype = message.getAttribute("type");
  if (type != undefined || type != null)
    {
    var old = $("#messages_queue *[target-id='" + type + "']");
    if (old.length > 1 && eventtype == "single"){
       message.removeAttribute("target-id");
       return;
    }
      $$.ReProcess("[event-id='" + type + "']");
      message.processed = true;
      return;
    }
  }
  
  $$.Handlers.EvalProcessor = function(message){
  try{
    window.eval(message.textContent);
    message.processed = true;
    if (message.getAttribute("permanent")) return;
    message.innerHTML = "";
  }
  catch (e)
    {
    window.LogError(e);
    }
  }
  
  $$.Handlers.CheckEvent = function(message){
    var eventid = message.getAttribute("event-id");
    if (eventid != null && eventid != "")
    {
       var events = $(">[target-id='" + eventid + "']", $$.Messages);
       if (events.length <= 0)
    message.cancelled = true;
    }
  }
    
 
  $$.Handlers.ParseContent = $$.ParseContent;
  
  var html =
  html +=   "<handler class='jasp-handler JaspHandler' id='jasp-events' type='link' order='prev' process='skip' function='CheckEvent'>";
  html +=   "</handler>";
  html +=   "<handler class='jasp-handler TagsHandler' id='tags-handler' selector='*:not(message)' type='link' function='TagsHandler' process='skip'>";
  html +=      "<handler class='jasp-handler CreateHandler' id='create-handler' parent='#tags-handler' for='handler' type='link' function='Subscribe'></handler>";
  //html +=      "<handler class='jasp-handler EventHandler' id='event-handler' parent='#tags-handler' for='event' type='link' function='EventProcessor'></handler>";
  html +=      "<handler class='jasp-handler EvalHandler' id='eval-handler' parent='#tags-handler' for='eval' type='link' function='EvalProcessor'></handler>";
  html +=       '<handler class="jasp-message jasp-handler" parent="#tags-handler" for="subscribe" type="link" function="ForSubscribe"></handler>'
  html +=       '<handler id="jasp-set-handler" class="jasp-message jasp-handler" parent="#tags-handler" for="set" type="link" function="SetterHandler"></handler>'
  html +=   "</handler>";
  html +=   "<handler class='jasp-handler JaspHandler' id='jasp-parser' selector='message.jasp-content' type='link' order='both' function='ParseContent'>";
  html +=     '<handler id="jasp-get-handler" class="jasp-message jasp-handler" parent="#jasp-parser" function="ParseInternal" type="link" function="GetterHandler" subitems="get" important="true"></handler>'
  html +=     '<handler id="jasp-set-not-handler" class="jasp-message jasp-handler" parent="#jasp-parser" function="ParseInternal" type="link" subitems="set:not(\'.jasp-message\')" important="true">'
  html +=       '$$.Handlers.SetterHandler($$.Element);'
  html +=     '</handler>'
  html +=     '<handler class="jasp-message jasp-handler" parent="#jasp-parser" function="ParseInternal" type="link" selector="message" subitems="[ui-event-id]">'
  html +=      'var type = $$.Element.getAttribute("ui-event-type");'
  html +=     '$$.Element[type] = $$.Handlers.UiEventHandler;'
  html +=     '</handler>'
  html +=   "</handler>";
  html +=   "<handler class='jasp-handler' id='target-handler' type='link' function='EventProcessor' process='skip' order='prev'>";
  html +=   "</handler>";
   



  $$.Handlers.innerHTML = html;  
}

$$.InitAjaxSystem = function() {

$$.Handlers.LoadHandler = function(message) {
if (message == undefined || message == null) {
    LogError("$$.LoadHandler message in undefined");
    return;
}
    var url = message.getAttribute("url");
    if (url != undefined && url != null){
      var urlbase = message.getAttribute("urlbase");
    var method = message.getAttribute("method");
      if (urlbase != undefined && urlbase != null){
        switch(urlbase)
        {
      case "url":
          break;
    
          case "system":
          url = GetServerRoot() + url;
          break;
          
          case "proxy":
          url = GetProxiedUrl(url);
          break;
          
          case "content":
          url = GetProxiedUrl(url, message.getAttribute("action"), message.getAttribute("path"));
          break;
          
          case "content-handler":
          url = GetSimpleHandler(message.getAttribute("path"), url);
          break;
          
          case "images-handler":
          url = GetImagesHandler(url);
          break;
          
          case "save":
        method = "POST";
        var path = message.getAttribute("xpath");
        if (path != null && path != "") {
        url = GetProxiedUrl(url, "partial&element=" + path);
        }
        else{
        url = GetProxiedUrl(url, "save");
        }
          break;
          
          default:
          url = urlbase + url;
          break;
        }
      }
      if (method == undefined || method == null)
      {
        method = "GET";
      }
    var nocache = message.getAttribute("cache");
      if (nocache == "nocache") {
        if (url.indexOf("?") > 0) {
          url += "&rnd=" + Math.random();
        }
        else {
          url += "?rnd=" + Math.random();
        }
      }
      var req = new XMLHttpRequest();
      req.message = message;
      message.url = url;
      req.open(method, url, true);
      req.onerror = ShowAjaxError;
      req.onload = $$.CreateAjaxMessage;
      req.send(message.innerHTML);
      message.processed = true;
    return true;
    }
    return false;
  }
  
  
  
  var message = $$.CreateMessage("handler", "load-handler");
  message.setAttribute("parent", "#tags-handler");
  message.setAttribute("type", "link");
  message.setAttribute("function", "LoadHandler");
  message.setAttribute("for", "ajax");
  message.setAttribute("id", "load-handler");
  $$.Subscribe(message);
}

$$.InitJASPSystem = function()
{
  $$.Handlers.ParseMessages = function(message) {
  if (message == undefined || message == null) {
      LogError("$$.ParseMessages message in undefined");
      return;
  }
    $(message).find(".jasp-message").addClass("jasp-message-for-processing");
    var messages = $(message).find(".jasp-message-for-processing");
    var count = messages.length;
    for(var i = 0; i<messages.length; i++)
    {
      var element = messages[i];
      if ($(element).parents(".jasp-message-for-processing").length <= 0)
      {
        element.owner = message;
        element.parent = element.parentNode;
        var eventid = element.getAttribute("event-id");
        if (eventid == null)
        {
          element.setAttribute("event-id", message.related);
        }
        else
        {
          var events = $(">event[target-id='" + eventid + "']", $$.Messages);
          if (events.length > 0)
          {
            if (element.getAttribute("events-nocheck") == null)
            {
              element.setAttribute("event-id", message.related);
            }
          }   
        }
    $$.AddMessage(element);
      }
    }
    $(".jasp-message-for-processing").removeClass("jasp-message-for-processing");
  }
  
  $$.Handlers.ParseScripts = function(message) {
  if (message == undefined || message == null) {
      LogError("$$.ParseScripts message in undefined");
      return;
  }
    var scripts = $(message).find("script");
      for (var i = 0; i < scripts.length; i++) {
      var script = scripts[i];
      var src = script.getAttribute("src");
      var script_id = "script_" + i + "_" + message.id;
      script.setAttribute("id", script_id);
      script.setAttribute("related-id", message.id);
      var scriptexist = $("#" + script_id, document.header);
      if (scriptexist.length > 0) continue;
      script.setAttribute("type", "text/javascript");
      script.setAttribute("class", "jasp-loaded");
      var nocache = script.getAttribute("nocache");
      if (src != undefined && src != null) {

        if (nocache) {
          if (src.indexOf("?") > 0) {
            src += "&rnd=" + Math.random();
          }
          else {
            src += "?rnd=" + Math.random();
          }
        }
        script.setAttribute("src", src);
        //$(script).load(OnScriptLoad);
      }
      document.header.appendChild(script);
    }
  
  $$.Handlers.UiEventHandler = function(event)
  {
      var id = this.getAttribute("ui-event-id") + "." + event.type;
      var eventMessage = $$.CreateMessage("event", "ui-event");
      eventMessage.setAttribute("target-id", id);
      $$.ProcessMessage(eventMessage);
  }
  
  $$.Handlers.SetterHandler = function(message)
  {
    var put = message;
  var value = put.innerHTML;
  var selector = put.getAttribute("selector");
  var type= put.getAttribute("type");
  var process = put.getAttribute("process");
  var subselect = put.getAttribute("subselect");
  var decode = put.getAttribute("decode");
  if (decode == 'html'){
    //var div = document.createElement('div');
  //div.textContent = value;
  value = value.replace(/&amp;/g,'&').replace(/&lt;/g,'<').replace(/&gt;/g,'>');
  }
  if (selector != null)
  {
    element = $(selector); 
    if (element.length <= 0)
    {
      $(message).remove();
    }
    else{
    switch (type){
      case "attribute":
      element[0].setAttribute(subselect, value);
      break;
      
      case "inner":
      
      element[0].innerHTML = value;
      break;
    
      case "text":
      element[0].textContent = value;
      break;    
    
      case "value":
      element[0].value = value;
      break;
      
      case "append":
      $(element).append(value);
      break;
      
      case "prepend":
      $(element).prepend(value);
      break;
      
      case "insert":
      $(element).append($(put).children());
      break;
      
      case "replace":
      $(element).html($(put).children());
      break;
      
      default:
      value = "";
      break;
    }
    }
  message.processed = true;
  }
  
  $$.Handlers.ForSubscribe = function(){
   var target = $$.Current.getAttribute("target");
   var type = $$.Current.getAttribute("ui-event-type");
   var id = $$.Current.getAttribute("ui-event-id");
   var element = $(target);
   if (element.length > 0)
  {
     element[0].setAttribute("ui-event-type", type);
     element[0].setAttribute("ui-event-id", id);
     element[0][type] = $$.Handlers.UiEventHandler;
     message.processed = true;
  }
    else
    {
      message.processed = false;
   }
  }
  
 }
  
    $$.Handlers.GetterHandler = function(message)
  {
   var get = $$.Element;
  var value = "";
  var selector = get.getAttribute("selector");
  if (selector == null)
  {
    selector = get.innerHTML;
  }
  var type= get.getAttribute("type");
  var subselect = get.getAttribute("subselect");
  selector = $(selector);
  if (selector.length <= 0)
  {
    value = "";
  }
  else
  {
    switch (type){
      case "attribute":
      value = selector[0].getAttribute(subselect);
      if (value == null){
       value = "";
      }
      break;
      
      case "inner":
      value = selector[0].innerHTML;
      break;
      
      case "text":
      value = selector[0].textContent;
      break;
      
      case "value":
      value = selector[0].value;
      break;
      
      case "objects":
      value = selector;
      break;
      
      default:
      value = "";
      break;
    }
  }
  $(get).replaceWith(value);
  }
  }
  
  $$.Handlers.ExecScripts = function(message)
  {
    var script = document.createElement("script");
    script.innerHTML = message.textContent;
    message.innerHTML = "";
    if (message.key != undefined && message.key != null)
    {
       script.setAttribute("key", message.key); 
    }
    script.setAttribute("id", message.script_id);
    script.setAttribute("related-id", message.id);
    script.setAttribute("type", "text/javascript");
    script.setAttribute("class", "jasp-loaded");
    if (message.src != undefined && message.src != null) {
      script.setAttribute("src", message.src);
    }
  document.header.appendChild(script);
  message.processed = true;
  }
  
  $$.Handlers.ParseInternal = function(message)
  {
    var elementsSelector = message.handler.getAttribute("subitems");
    if (elementsSelector != null)
    {
      var elements = $(message).find(elementsSelector);
      for(var i = 0; i<elements.length; i++)
      {
        $$.Element = elements[i];
        window.eval(message.handler.textContent);
      }
    }
  }
   
  var message = $$.CreateMessage("handler", "jasp-messages-handler");
  message.setAttribute("parent", "#jasp-parser");
  message.setAttribute("type", "link");
  message.setAttribute("function", "ParseMessages");
  message.setAttribute("selector", "message");
  message.setAttribute("id", "jasp-messages-handler");
  $$.Subscribe(message);

  var message = $$.CreateMessage("handler", "jasp-scripts-handler");
  message.setAttribute("parent", "#jasp-parser");
  message.setAttribute("type", "link");
  message.setAttribute("function", "ParseScripts");
  message.setAttribute("selector", "message");
  message.setAttribute("id", "jasp-scripts-handler");
  $$.Subscribe(message);
  
  var message = $$.CreateMessage("handler", "jasp-exec-handler");
  message.setAttribute("parent", "#tags-handler");
  message.setAttribute("type", "link");
  message.setAttribute("function", "ExecScripts");
  message.setAttribute("for", "jscript");
  message.setAttribute("id", "jasp-exec-handler");
  $$.Subscribe(message);
  
   
  
}

$$.CreateAjaxMessage = function()
{
  this.message.setAttribute("loaded", "true");
  var newMessage = $$.CreateMessage("message", "ajax-result");
  newMessage.setAttribute("type", "ajax-result");
  $(newMessage).addClass("jasp-content");
  var target = this.message.getAttribute("target");
  if (target != null && target != undefined)
  {
    newMessage.setAttribute("target", target);
  }
  var append = this.message.getAttribute("append");
  if (append != null && append != undefined)
  {
    newMessage.setAttribute("append", append);
  }
  var aload = this.message.getAttribute("afterload"); 
  if (aload != null && aload != undefined)
  {
    newMessage.setAttribute("aload", aload);
  }
  newMessage.setAttribute("related-id", this.message.id);
  newMessage.related = this.message.id;

  newMessage.setAttribute("url", this.message.url);
  newMessage.url = this.message.url;
  
  newMessage.innerHTML = this.responseText;
  this.message.setAttribute("ajax-request-id", newMessage.id);
  var scripts = $(newMessage).find("script");
    for (var i = 0; i < scripts.length; i++) {
      var key= scripts[i].getAttribute("key");
      if (key != null)
      {
        var scriptsExists = $("script[key='" + key + "']", document.header);
        if (scriptsExists.length > 0)
        {
          $(scripts[i]).remove();
          continue;
        }
      }
    var src = scripts[i].getAttribute("src");
    var script = $$.CreateMessage("jscript");
    script.key = key;
    script.url = this.message.url;
    script.setAttribute("url", script.url);
    script.textContent = scripts[i].innerHTML;
    script.script_id = "script_" + i + "_" + newMessage.id;
    script.setAttribute("event-id", newMessage.related);
    script.setAttribute("related-id", newMessage.id);
    var nocache = script.getAttribute("nocache");
    if (src != undefined && src != null && src != "") {
      if (nocache == "true") {
        if (src.indexOf("?") > 0) {
          src += "&rnd=" + Math.random();
        }
        else {
          src += "?rnd=" + Math.random();
        }
      }
      script.src = src;
      script.setAttribute("src", src);
    }    
    $(scripts[i]).remove();
    $$.AddMessage(script);
  }
        
  $$.ProcessMessage(newMessage);
}

$$.ParseContent = function(message) {
    if (message == undefined || message == null) {
        LogError("$$.ParseContent message in undefined");
        return;        
    }
    if (!$(message).hasClass("jasp-content")) {
        return;
    }
    if (message.jaspPreProcessed) {
        var event = $$.CreateMessage("event");
        event.setAttribute("type", "event");
        if (message.url != undefined) {
            //$(message.children).attr("url", message.url);
            event.innerHTML = message.url;
            $(event).addClass("ajax-complete");
        }

        var target = message.getAttribute("target");
        var append = message.getAttribute("append");
        var afterload = message.getAttribute("aload");
        if (target != undefined && target != null) {
            $(target).html(message.children);
        }
        if (append != undefined && append != null) {
            $(append).append(message.children);
        }
        if (afterload != undefined && afterload != null) {
            window.eval(afterload);
        }
        message.processed = true;

        if (message.related != undefined) {
            event.setAttribute("target-id", message.related);
        }
        else {
            event.innerHTML = message.getAttribute("id");
        }

        $$.ProcessMessage(event);
        message.jaspPreProcessed = false;
    }
    else {
        message.jaspPreProcessed = true;
    }
}

function LoadPages() {
    //LoadContentById("#MRT_IS_SiteFabric-MainDiv", false, InitUIComplete);
    //LoadContentById(".content", false, InitUIComplete);
  var mode = document.body.getAttribute("system-mode")
  if (mode == "with-ui"){
    $$.ProcessMessage("<ajax urlbase='proxy' url='System.System.html' target='#MRT_IS_SiteFabric-MainDiv' event-id='msg_BaseUI_INITIALIZED'></ajax>");
	$$.ProcessMessage("<eval event-id='msg_Designer_LOADING'>$('img.system-loading').fadeOut()</eval>"); 
  }
  $($$.Messages).hide();
  $($$.Handlers).hide();
  
  $$.ProcessMessage("<event id='msg_Messages_System_Loaded' target-id='msg_Messages_System_Loaded' ></event>");
  var basemode = document.body.getAttribute("base-mode")
  if (basemode == "no-wait"){
  $$.ProcessMessage("<event id='msg_BaseUI_INITIALIZED' target-id='msg_BaseUI_INITIALIZED' ></event>");
  }
  $$.ProcessMessage("<eval event-id='msg_BaseUI_INITIALIZED'>$$.ReProcess('', null, true, 'body>')</eval>"); 
  
  var contents = document.querySelectorAll(".jasp-load-content");
  for(var index = contents.length - 1; index >= 0 ; index--)
  {
  var content = contents[index];
    urlbase = content.getAttribute("urlbase");
    url = content.getAttribute("url");
    id = content.getAttribute("id");
    $$.ProcessMessage("<ajax urlbase='" + urlbase + "' url='" + url + "' target='#" + id +"'></ajax>");
  }
}

function InitUIComplete() {
    //InitCurrentUiBlocks(document)
    InitMenu();
    ShowDesigner();
    LogInfo("Initializing UI Complete: " + contentLoaded);
}


function OnAjaxError(e) {
    contentLoaded--;
    if (!ShowError(e)) {
        alert(e.message + "\n" + e.line + "\n" + e.url);
        return;
    }  
}

function ShowAjaxError(e) {
    var message = this.statusText + "<br/>" + this.file;
    //if (message == undefined || message == null) return;
    $("#Error-container .message").html(message);
    $("#Error-container").fadeIn();
    LogError(message);
    window.setTimeout(HideNotifications, 3000);
}

function ShowNotify(message) {
    if (message == undefined || message == null) return;
    $("#Notify-container .message").html(message);
    $("#Notify-container").fadeIn();
    LogInfo(message);
    window.setTimeout(HideNotifications, 3000);
}

function ShowError(message) {
    if (message == undefined || message == null) return;
    $("#Error-container .message").html(message);
    $("#Error-container").fadeIn();
    LogError(message);
    window.setTimeout(HideNotifications, 3000);
}

function HideNotifications() {
    $("#Notify-container").fadeOut();
    $("#Error-container").fadeOut();
}

$$.InitLogSystem = function()
{
  if (window.console != undefined)
  {
  $$.ProcessMessage("<handler parent='#tags-handler' class='jasp-handler error-handler' for='error'>console.error($$.Current.exception); $$.Current.processed=true;</div>");  
  $$.ProcessMessage("<handler parent='#tags-handler' class='jasp-handler info-handler' for='info'>console.info($$.Current.innerHTML); $$.Current.processed=true;</div>");
  }
}

function ShowLogWindow()
{
  $("#messages_queue").toggle();
}

window.LogInfo = function(info){
  info = "<info class='info' type='info'>" + info + "</message>";
  $$.ProcessMessage(info, "info");
}
  
  
window.LogError = function(error, url, lineNumber, exception){
  var message = $$.CreateMessage("error", 'error');
  if (message != undefined && message != null){
    message.setAttribute("type",'error');
    message.setAttribute("url", url);
    message.setAttribute("line", lineNumber);
    message.innerHTML = error;
    message.exception = error;
    message.url = url;
    message.lineNumber = lineNumber;
    $$.ProcessMessage(message);
  }
  // Just let default handler run.
  return false;
}
  
//gOldOnError = window.onerror;
//window.onerror=window.LogError;

  

WaitBody();



function List(k,e,b){function m(c,a,d){var f=this,l={};this.values=function(a,c){if(a!==void 0){for(name in a)a.hasOwnProperty(name)&&(l[name]=a[name]);c!==true&&n.set(f,f.values())}else return l};this.show=function(){n.show(f)};this.hide=function(){n.hide(f)};(function(a,c,d){typeof c==="undefined"?d?f.values(a,d):f.values(a):(f.elm=c,a=n.get(f,a),f.values(a))})(c,a,d)}var d=this,n=null;this.listContainer=document.getElementById(k);this.items=[];this.list=null;this.templateEngines={};this.maxVisibleItemsCount=
e.maxVisibleItemsCount||200;var o={get:function(){for(var c=d.list.childNodes,a=[],h=0,f=c.length;h<f;h++)typeof c[h].data==="undefined"&&a.push(c[h]);return a},index:function(c,a){for(var h=0,f=c.length;h<f;h++)d.items.push(new m(a,c[h]))},indexAsync:function(c,a){this.index(c.splice(0,100),a);c.length>0&&setTimeout(function(){o.indexAsync(c,a)},10)}};this.add=function(c,a){var h=[],f=false;typeof c[0]==="undefined"&&(c=[c]);for(var l=0,b=c.length;l<b;l++){var g=null;c[l]instanceof m?(g=c[l],g.reload()):
(f=d.items.length>d.maxVisibleItemsCount?true:false,g=new m(c[l],void 0,f));f||n.add(g,a);d.items.push(g);h.push(g)}return h};this.addAsync=function(c,a){var h=c.splice(0,a?a.count||100:100);d.add(h,a);c.length>0&&setTimeout(function(){d.addAsync(c,a)},10)};this.remove=function(c,a,h){for(var f=0,l=0,g=d.items.length;l<g;l++)d.items[l].values()[c]==a&&(n.remove(d.items[l],h),d.items.splice(l,1),g--,f++);return f};this.get=function(c,a){for(var h=[],f=0,l=d.items.length;f<l;f++){var g=d.items[f];g.values()[c]==
a&&h.push(g)}return h.length==0?null:h.length==1?h[0]:h};this.sort=function(c,a){var h=null,f=c.target||c.srcElement,l="",b=false;f===void 0?h=c:(h=ListJsHelpers.getAttribute(f,"rel"),l=ListJsHelpers.getAttribute(f,"sorting"),l=="asc"?(f.setAttribute("sorting","desc"),b=false):(f.setAttribute("sorting","asc"),b=true));a||(a=function(a,c){return g.alphanum(a.values()[h],c.values()[h],b)});d.items.sort(a);n.clear();f=0;for(l=d.items.length;f<l;f++)d.maxVisibleItemsCount>f&&n.add(d.items[f])};var g=
{alphanum:function(c,a,d){typeof c==="undefined"&&(c="");typeof a==="undefined"&&(a="");c=c.toString().replace(/&(lt|gt);/g,function(a,c){return c=="lt"?"<":">"});c=c.replace(/<\/?[^>]+(>|$)/g,"");a=a.toString().replace(/&(lt|gt);/g,function(a,c){return c=="lt"?"<":">"});a=a.replace(/<\/?[^>]+(>|$)/g,"");c=this.chunkify(c);a=this.chunkify(a);for(x=0;c[x]&&a[x];x++)if(c[x]!==a[x]){var f=Number(c[x]),g=Number(a[x]);return d?f==c[x]&&g==a[x]?f-g:c[x]>a[x]?1:-1:f==c[x]&&g==a[x]?g-f:c[x]>a[x]?-1:1}return c.length-
a.length},chunkify:function(c){for(var a=[],d=0,f=-1,g=0,b,e;b=(e=c.charAt(d++)).charCodeAt(0);)b=b==46||b>=48&&b<=57,b!==g&&(a[++f]="",g=b),a[f]+=e;return a}};this.search=function(c,a){var g=[],f=c.target||c.srcElement,c=typeof f!=="undefined"?f.value.toLowerCase():c.toLowerCase(),f=false;typeof a==="undefined"&&(f=true);n.clear();if(c==="")for(var b=0,e=d.items.length;b<e&&b<d.maxVisibleItemsCount;b++)d.items[b].show();else{b=0;for(e=d.items.length;b<e;b++){var k=false,m=d.items[b];f&&(a=m.values());
for(var o in a){var p=a[o].toString().toLowerCase();c!==""&&p.search(c)>-1&&(k=true)}k&&g.push(m);k&&d.maxVisibleItemsCount>g.length&&m.show()}}return g};this.filter=function(c){for(var a=[],b=0,g=d.items.length;b<g;b++){var e=d.items[b];c===false||typeof c==="undefined"?(e.show(),a.push(e)):c(e.values())?(a.push(e),e.show()):e.hide()}return a};this.size=function(){return d.items.length};var p=function(c,a){a.engine=typeof a.engine==="undefined"?"standard":a.engine.toLowerCase();return new d.constructor.prototype.templateEngines[a.engine](c,
a)};(function(c,a){a.list=a.list||k;a.listClass=a.listClass||"list";a.searchClass=a.searchClass||"search";a.sortClass=a.sortClass||"sort";n=new p(d,a);d.list=ListJsHelpers.getByClass(a.listClass,d.listContainer,true);ListJsHelpers.addEvent(ListJsHelpers.getByClass(a.searchClass,d.listContainer),"keyup",d.search);ListJsHelpers.addEvent(ListJsHelpers.getByClass(a.sortClass,d.listContainer),"click",d.sort);if(a.valueNames){var b=o.get(),g=a.valueNames;a.indexAsync?o.indexAsync(b,g):o.index(b,g)}typeof c!==
"undefined"&&d.add(c)})(b,e)}List.prototype.templateEngines={};
List.prototype.templateEngines.standard=function(k,e){function b(){if(n===null)for(var b=d.childNodes,e=0,c=b.length;e<c;e++)if(typeof b[e].data==="undefined"){n=b[e];break}}function m(b){typeof b.elm==="undefined"&&o.create(b)}var d=ListJsHelpers.getByClass(e.listClass,document.getElementById(e.list))[0],n=document.getElementById(e.item),o=this;this.get=function(d,e){b();m(d);for(var c={},a=0,h=e.length;a<h;a++)c[e[a]]=ListJsHelpers.getByClass(e[a],d.elm)[0].innerHTML;return c};this.set=function(b,
d){m(b);for(var c in d){var a=ListJsHelpers.getByClass(c,b.elm,true);if(a)a.innerHTML=d[c]}};this.create=function(d){if(typeof d.elm==="undefined"){b();var e=n.cloneNode(true);e.id="";d.elm=e;o.set(d,d.values())}};this.add=function(b){m(b);d.appendChild(b.elm)};this.remove=function(b){d.removeChild(b.elm)};this.show=function(b){m(b);b.elm.parentNode===null&&o.add(b);d.appendChild(b.elm)};this.hide=function(b){m(b);d.removeChild(b.elm)};this.clear=function(){if(d.hasChildNodes())for(;d.childNodes.length>=
1;)d.removeChild(d.firstChild)}};
var ListJsHelpers={getByClass:function(){return document.getElementsByClassName?function(k,e,b){return b?e.getElementsByClassName(k)[0]:e.getElementsByClassName(k)}:function(k,e,b){var m=[];e==null&&(e=document);tag="*";var e=e.getElementsByTagName(tag),d=e.length,k=RegExp("(^|\\s)"+k+"(\\s|$)");for(i=0,j=0;i<d;i++)if(k.test(e[i].className))if(b)return e[i];else m[j]=e[i],j++;return m}}(),addEvent:function(k,e){if(e.addEventListener)return function(b,e,d){if(b&&!(b instanceof Array)&&!b.length&&!ListJsHelpers.isNodeList(b)||
b===k)b.addEventListener(e,d,false);else if(b&&b[0]!==void 0)for(var n=b.length,o=0;o<n;o++)ListJsHelpers.addEvent(b[o],e,d)};else if(e.attachEvent)return function(b,e,d){if(b&&!(b instanceof Array)&&!b.length&&!ListJsHelpers.isNodeList(b)||b===k)b.attachEvent("on"+e,function(){return d.call(b,k.event)});else if(b&&b[0]!==void 0)for(var n=b.length,o=0;o<n;o++)ListJsHelpers.addEvent(b[o],e,d)}}(this,document),getAttribute:function(k,e){var b=k.getAttribute&&k.getAttribute(e)||null;if(!b)for(var m=
k.attributes.length,d=0;d<m;d++)if(typeof e[d]!=="undefined"&&e[d].nodeName===e)alert(attar[d]),b=e[d].nodeValue;return b},isNodeList:function(k){var e=Object.prototype.toString.call(k);return typeof k==="object"&&/^\[object (HTMLCollection|NodeList|Object)\]$/.test(e)&&(k.length==0||typeof node==="object"&&k[0].nodeType>0)?true:false}};
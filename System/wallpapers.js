var wallpaperPageIndex = 0;
var wallpaperIndex = 0;
var wallpaperPreviews = [];
var wallpaperShowInterval = 60000*10;



function InitializeWallpapers(){
    var background = W.Body.attr("background");
    if (Check(background) && background != "" ){
	W.Body.attr('style', "background-image: url('" + background + "')");
	W.Body.attr('style', "background: none;");
	return false;
    }
    window.wallpaperFrame = document.createElement("div");
    window.wallpaperFrame.setAttribute("id", "HACK_wallpaperFrame");
    window.wallpaperFrame.setAttribute("class", "full-cropped");
    var style = "width: " + window.innerWidth + "px; height: " + window.innerHeight + "px; display: none;";
    window.wallpaperFrame.setAttribute("style", style);
    document.body.appendChild(window.wallpaperFrame);
    window.wallpaperFrame.src = null;
    LoadPreviewsPage();
}

function LoadPreviewsPage()
{
    if (wallpaperPageIndex > 60) return;
      window.clearTimeout(timeout);
      wallpaperPageIndex++;
      wallpaperPreviews = [];
      wallpaperIndex = 0;
      var url = "http://wallpapers.ru/cgi-bin/forum/top.pl?list=6&p=" + wallpaperPageIndex;
      X.GetProxied(escape(url),PreviewsPageLoaded)
      //wallpaperFrame.setAttribute("url", url);
      //wallpaperFrame.setAttribute("class", "content");
      //LoadContentById("#HACK_wallpaperFrame", false, PreviewsPageLoaded, "urlproxy");
      //"text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8"
  }

function tm(contest, id) {
    var wp_link = '/cgi-bin/arty3/forum/show.cgi?m=forum&id=';
    if (contest == '20031' || contest == '20032') {
	wp_link = '/cgi-bin/arty/ai.pl?m=box&a=wp&id=';
    }
    wp_link = "http://wallpapers.ru" + wp_link + id;
    wallpaperPreviews.push(wp_link);
} 

var timeout;

function PreviewsPageLoaded(result)
{
    wallpaperFrame.html(result);
    //wallpaperPreviews = $(".Answer tr td:first a", result);
    var script = wallpaperFrame.get("td div[language='javascript']").html();
    window.eval(script);
    wallpaperTimeout();
  }      

function wallpaperTimeout(){  
    if (!Check(wallpaperPreviews[wallpaperIndex])){
	LoadPreviewsPage();
	return false;
    }    
    window.clearTimeout(timeout);  
    var url = wallpaperPreviews[wallpaperIndex];
    wallpaperIndex++;
    timeout = window.setTimeout(LoadPreviewsPage, wallpaperShowInterval);
    X.GetProxied(escape(url), WallpaperPageLoaded);
    
}

function WallpaperPageLoaded(result)
{
    wallpaperFrame.html(result);
    var src = "http://wallpapers.ru" + wallpaperFrame.get("#img_id").attr("src");
    //var src = GetSimpleHandler(image.attr("src"), "urlproxy");
    wallpaperFrame.src = src;
    W.Body.attr("style", "background-image: url('" + src + "')");
    //wallpaperFrame.html("<img class='wallpaper' src='" + src + "'></img>");
}

W.onload(InitializeWallpapers);
      
      
Controller = {};

Controller.Init = function(){
	protectionBox = DOM("#protectionBox");
	PlayerBox = DOM("#PlayerBox");
	VideoBox = DOM("#VideoBox");
	//PlayerBox.onclick = Controller.ToggleClick;	
	protectionBox.addEventListener ("DOMNodeRemoved", function(){
		PlayerBox.del();
	}, false);		
	if (window.video_params && 	video_params.userid && 	video_params.key){
		var src = PlayerBox.get("@src");
		PlayerBox.show();
		VideoBox = videojs("VideoBox", {"controls": true, "autoplay": false, "preload": "none"}, function(){
				// Player (this) is initialized and ready.
			});
		VideoBox.src(src + "?userid=" + video_params.userid + "&key=" + video_params.key);
		VideoBox.on('fullscreenchange', function(){
			VideoBox.cancelFullScreen();
		});					
		VideoBox.on("play", Controller.PlayClick);
		VideoBox.on("pause", Controller.PauseClick);
		VideoBox.on("error", function(err){
			Controller.StopProtection();
			Controller.ProtectTick = null;
			PlayerBox.del(".playing");
			DOM("#VideoBox").del();
			protectionBox.hide();
			PlayerBox.add(".error");
			PlayerBox.div(".error-box", "Произошла ошибка при воспроизведении видео. Перезагрузите страницу, чтобы продолжить просмотр");
		});
		protectionBox.onclick = Controller.ToggleClick;
		protectionBox.hide();
	}
};

Controller.ToggleClick = function(){
	if (PlayerBox.is(".playing")){
		VideoBox.pause();
	}
	else{					
		VideoBox.play();
	}
}

Controller.PlayClick = function(){
	if (Controller.StartProtection()){
		PlayerBox.add(".playing");
	}
}

Controller.PauseClick = function(){
	Controller.StopProtection();
	PlayerBox.del(".playing");
}

Controller.WTop = 270;
Controller.WBottom = 300;
Controller.WLeft = 100;
Controller.WRight = 300;

Controller.Colors = ['#036', '#593', '#651','#0dd','#ffa','#faf', '#aff', '#aca', '#ccf', '#fff'];

Controller.StartProtection = function(){
	if (!window.protectionBox) PlayerBox.del();
	protectionBox.show();
	if (!protectionBox.get(".watermark")){
		var wm = protectionBox.div(".watermark");
		wm.textContent = Request.Params.userid;
		wm.xpos = 100;
		wm.ypos = 240;
		wm.ticks = 0;
	}
	Controller.protectionInterval = setInterval(Controller.ProtectTick, 100);	
	return true;
}

Controller.StopProtection = function(){
	clearInterval(Controller.protectionInterval);	
	//protectionBox.hide();
}

Controller.ProtectTick = function(){		
	if (!window.protectionBox) PlayerBox.del();
	var wm = protectionBox.get(".watermark");
	if (!wm) PlayerBox.del();
	wm.ticks++;
	if (wm.ticks > 30 + (Math.random() * 20)){
		wm.ticks = 0;
		wm.xpos += 20 - Math.random() * 40;
		wm.style.color = Controller.Colors[parseInt((Math.random() * Controller.Colors.length))];
	}
	if (wm.xpos > Controller.WRight){
		wm.dir = "back";	
	}
	if (wm.xpos < Controller.WLeft){
		wm.dir = "fwd";	
	}
	if (wm.ypos > Controller.WBottom){
		wm.ypos = Controller.WTop;
	}
	if (wm.ypos < Controller.WTop){
		wm.ypos = Controller.WBottom;
	}
	if (wm.dir == "back"){
		wm.xpos--;
		wm.ypos--;			
	}
	else{
		wm.xpos++;
		wm.ypos++;
	}
	wm.style.left = wm.xpos + "px";
	wm.style.top = wm.ypos + "px";
}

WS.DOMload(Controller.Init);
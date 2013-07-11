VideoController = {};

VideoController.Init = function(){
	DOM.all(".player-box").each(function(item){
		VideoController.InitBox(item);
	});
}

VideoController.InitBox = function(PlayerBox){
	var VideoBox = PlayerBox.add("<video class='video-box vjs-default-skin'></video>");
	VideoBox.set("@poster", PlayerBox.get("@poster"));
	if (PlayerBox.get("@type")) VideoBox.set("@type", PlayerBox.get("@type"));
	VideoBox.set("@width", PlayerBox.offsetWidth + "px");
	VideoBox.set("@height", PlayerBox.offsetHeight + "px");
	var protectionBox = PlayerBox.div(".protection-box");
	protectionBox.addEventListener("DOMNodeRemoved", function(){
		PlayerBox.del();
	}, false);
	if (window.video_params && 	video_params.userid && 	video_params.key){
		var src = PlayerBox.get("@src");
		PlayerBox.show();
		VideoBox = videojs(VideoBox, {"controls": true, "autoplay": false, "preload": "none"}, function(){
			var video = PlayerBox.get("video");
			video.set("@width", PlayerBox.offsetWidth);
			video.set("@height", PlayerBox.offsetHeight);
			this.src(src + "?userid=" + video_params.userid + "&key=" + video_params.key);
			this.on('fullscreenchange', function(){
				VideoBox.cancelFullScreen();
			});					
			this.on("play", function(){
				if (PlayerBox.StartProtection()){
					PlayerBox.add(".playing");		
				} 
			});	
			this.on("pause", function(){
				PlayerBox.StopProtection();
				PlayerBox.del(".playing");		
			});
			this.on("error", function(err){
				PlayerBox.StopProtection();
				PlayerBox.ProtectTick = null;
				PlayerBox.del(".playing");
				PlayerBox.get("video").del();
				protectionBox.hide();
				PlayerBox.add(".error");
				PlayerBox.div(".error-box", "Произошла ошибка при воспроизведении видео. Перезагрузите страницу, чтобы продолжить просмотр");
			});
		});
		PlayerBox.WTop = 270;
		PlayerBox.WBottom = 300;
		PlayerBox.WLeft = 100;
		PlayerBox.WRight = 300;
		PlayerBox.StopProtection = function(){
			clearInterval(PlayerBox.protectionInterval);	
			//protectionBox.hide();
		}
		PlayerBox.StartProtection = function(){
			if (!protectionBox || !PlayerBox.get(".protection-box")) PlayerBox.del();
			protectionBox.show();
			if (!protectionBox.get(".watermark")){
				var wm = protectionBox.div(".watermark");
				wm.textContent = video_params.userid;
				wm.xpos = PlayerBox.WTop;
				wm.ypos = PlayerBox.WLeft;
				wm.ticks = 0;
			}
			PlayerBox.protectionInterval = setInterval(PlayerBox.ProtectTick, 100);	
			return true;
		}
		PlayerBox.ProtectTick = function(){		
			if (!protectionBox || !PlayerBox.get(".protection-box")) PlayerBox.del();
			var wm = protectionBox.get(".watermark");
			if (!wm) PlayerBox.del();
			wm.ticks++;
			if (wm.ticks > 30 + (Math.random() * 20)){
				wm.ticks = 0;
				wm.xpos += 20 - Math.random() * 40;
				wm.style.color = VideoController.Colors[parseInt((Math.random() * VideoController.Colors.length))];
			}
			if (wm.xpos > PlayerBox.WRight){
				wm.dir = "back";	
			}
			if (wm.xpos < PlayerBox.WLeft){
				wm.dir = "fwd";	
			}
			if (wm.ypos > PlayerBox.WBottom){
				wm.ypos = PlayerBox.WTop;
			}
			if (wm.ypos < PlayerBox.WTop){
				wm.ypos = PlayerBox.WBottom;
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
		
		protectionBox.onclick = function(){
			if (PlayerBox.is(".playing")){
				VideoBox.pause();
			}
			else{					
				VideoBox.play();
			}
		};
		protectionBox.hide();
	}
};



VideoController.Colors = ['#036', '#593', '#651','#0dd','#ffa','#faf', '#aff', '#aca', '#ccf', '#fff'];




WS.DOMload(VideoController.Init);
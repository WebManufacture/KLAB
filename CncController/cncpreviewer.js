WS.DOMload(function(){
	Preview = DOM("#Prewiewer");
	
	Preview.xScale = 40;
	Preview.yScale = 40;
	
	Preview.height = Prewiewer.width;
	Preview.width = Prewiewer.height;
	Preview.dc = Preview.getContext("2d");
	Preview.dc.fillRect(0, 0, Prewiewer.width, Prewiewer.height)
	
	Channels.on("device.state", function(message, obj){
		Preview.DisplayCurrent(obj);
	});
	
	Preview.DisplayCurrent = function(obj){
		if (!obj){
			obj = {x : lx, y: ly, z: lz};
		}
		var dc = Preview.dc;
		dc.beginPath();
		//dc.moveTo((obj.x - this.startX) / this.xScale + 2, (obj.y - this.startY) / this.yScale + 2);
		dc.rect((obj.x - this.startX) / this.xScale, (obj.y - this.startY) / this.yScale, 2,2);
		dc.lineWidth = 1;
		dc.strokeStyle = "#F0F";
		dc.closePath();
		dc.stroke();
	};
	
	Preview.DisplayPoint = function(obj){
		if (obj){
			var dc = Preview.dc;
			dc.beginPath();
			//dc.moveTo(obj.x / this.xScale, obj.y / this.yScale);
			dc.rect((obj.x - this.startX) / this.xScale, (obj.y - this.startY) / this.yScale, 2,2);
			dc.lineWidth = 1;
			dc.strokeStyle = "#0FF";
			dc.closePath();
			dc.stroke();
		}
	};
	
	Preview.ShowCode = function(code){
		var dc = Preview.dc;
		var lxx = 0;
		var lyy = 0;
		var lzz = 0;
		if (CNC.LastState) {
			var lxx = parseInt(lx);
			var lyy = parseInt(ly);
			var lzz = parseInt(lz);
		}		
		this.startX = 0;
		this.startY = 0;
		if (CNC.currentStats){
			if (CNC.currentStats.sizeX > CNC.currentStats.sizeY){
				this.xScale = CNC.currentStats.sizeX / (Preview.width - 20);
				this.yScale = this.xScale;
			}
			else{
				this.yScale = CNC.currentStats.sizeY / (Preview.height - 20);
				this.xScale = this.yScale;
			}
			this.startX = CNC.currentStats.minX;
			this.startY = CNC.currentStats.minY;
		}
		var cx = lxx / this.xScale;
		var cy = lyy / this.yScale;
		var zg = CNC.Settings.zGValue;
		if (!zg) zg = 1;
		dc.fillRect(0, 0, this.width, this.height);
		dc.beginPath();
		dc.moveTo(cx, cy);
		dc.rect(cx, cy, 10, 10);
		dc.lineWidth = 1;
		dc.strokeStyle = "#F0F";
		dc.closePath();
		dc.stroke();		
		dc.beginPath();
		for (var i = 0; i < CNC.ProgramCode.length && i < 9000; i++) {
			var line = CNC.ProgramCode[i];
			if (!line) {
				continue;
			}
			if (line.command == CNC.GCommands.M || line.command == CNC.GCommands.G){
				var oc = { x: lxx, y: lyy, z: lzz };
				var ac = {x : line.x, y: line.y, z: line.z};
				if (line.command == CNC.GCommands.M){
					ac.x += lxx;
					ac.y += lyy;
					ac.z += lzz;
				}
				if (ac.z > lz + zg) {
					dc.closePath();
					dc.stroke();
					dc.beginPath();
					dc.strokeStyle = "#F00";
				}
				else{
					if (ac.z > lz) {
						dc.closePath();
						dc.stroke();
						dc.beginPath();
						dc.strokeStyle = "#00F";
					}
					else{
						dc.closePath();
						dc.stroke();
						dc.beginPath();
						dc.strokeStyle = "#0F0";
					}
				}
				cx = Math.round((lxx - this.startX) / this.xScale);
				cy = Math.round((lyy - this.startY) / this.yScale);
				dc.moveTo(cx, cy);
				if (line.command == CNC.GCommands.M){
					lxx += line.x;
					lyy += line.y;
					lzz += line.z;
				}
				else{
					lxx = line.x;
					lyy = line.y;
					lzz = line.z;
				}
				cx = Math.round((lxx - this.startX) / this.xScale);
				cy = Math.round((lyy - this.startY) / this.yScale);
				dc.lineTo(cx, cy);
			}
			dc.closePath();
			dc.stroke();
		};
	};
});
SvgCompiler = {};

SvgCompiler.Compile = function (cnc, text, callback) {
	var context = new SvgCodeProcessor(cnc);
	return context.Compile(text, callback);
}

SvgCodeProcessor = function (cnc) {
	this.cnc = cnc;
	this.x = lx;
	this.y = ly;
	this.z = lz;
	this.x = parseInt(this.x);
	this.y = parseInt(this.y);
	this.z = parseInt(this.z);
	this.speed = this.cnc.speed;
};

SvgCodeProcessor.prototype = {
	Compile: function (text, callback) {
		var code = [];
		var svg = DOM.div(".svg-codes");
		svg.innerHTML = text;
		svg = svg.get("svg");
		if (!svg) return;
		svg = WS.ExtendElement(svg);
		var svgWidth = svg.attr("width");
		var svgHeight = svg.attr("height");
		var xRatio = parseFloat(svg.attr("x-ratio"));
		var yRatio = parseFloat(svg.attr("y-ratio"));
		this.speed = parseFloat(svg.attr("speed"));
		if (!xRatio) xRatio = 1;
		if (!yRatio) yRatio = 1;
		this.nx = this.cnc.mmCoefX * xRatio;
		this.ny = this.cnc.mmCoefY * yRatio;
		this.zg = this.cnc.zGValue;
		if (!this.zg) this.zg = 1;
		var paths = svg.all("path,circle,rect");
		var i = 0;
		this.lx = this.x;
		this.ly = this.y;
		this.lz = this.z;
		this.subX = this.lx;
		this.subY = this.ly;
		if (isNaN(this.speed)){
			this.speed = this.defaultSpeed();
		}		
		this.xStart =svg.attr("x-start");
		this.yStart = svg.attr("y-start");
		var startDef = true;
		this.xStart = Math.round(parseFloat(this.xStart) * this.nx);
		if (isNaN(this.xStart)){
			startDef = false;
			this.xStart = this.lx;
		}				
		this.yStart = Math.round(parseFloat(this.yStart) * this.ny);
		if (isNaN(this.yStart)){
			startDef = false;
			this.yStart = this.ly;	
		}
		this.addLine(code, CNC.GCommands.G, this.xStart, this.yStart, this.z);
		for (var j = 0; j < paths.length; j++) {
			var path = WS.ExtendElement(paths[j]);
			if (path.tagName.toLowerCase() == "path") {
				var res = this.processPath(path, paths[j]);
				if (res){
					code = code.concat(res);	
				}
			}			
			//this.followStart(code);
		}
		this.followStart(code);
		return code;
	},
	
	processPath : function(elem){
		var code = [];
		var coords = elem.attr("d");
		if (!coords) {
			return null;
		}
		this.spindleUp(code);
		this.frun = true;
		var regex = "[mlcaMLCA](?:\\s*\\-?\\d+(?:[.]\\d+)?(?:e-\\d)?,\\s*\\-?\\d+(?:[.]\\d+)?(?:e-\\d)?)+|[zZ]";
		this.command = CNC.GCommands.G;
		var matches = coords.match(new RegExp(regex, 'g'));
		for (var k = 0; k < matches.length; k++) {
			var parse = matches[k]; //.match(new RegExp(regex));
			var sc = parse[0];
			if ("MLCZA".indexOf(sc) >= 0){
				this.absolute = true;
				this.command = CNC.GCommands.G;
			}
			if ("mlcza".indexOf(sc) >= 0){
				this.absolute = false;
				this.command = CNC.GCommands.M;
			}
			if (sc == 'Z' || sc == 'z'){
				this.CloseCommand(code);
				continue;
			}			
			parse = parse.substr(1);
			parse = parse.split(' ');
			var pcoords = [];
			for (var pcounter = 0; pcounter < parse.length; pcounter++){
				if (parse != ""){
					if (parse[pcounter].indexOf(",") <= 0){
						continue;
					}
					var coord = parse[pcounter].split(",");
					if (coord.length != 2){
						continue;
					}
					var x = parseFloat(coord[0]);
					var y = parseFloat(coord[1]);
					if (isNaN(x) || isNaN(y)) {
						continue;	
					}
					x = Math.round(x * this.nx);
					y = Math.round(y * this.ny);
					pcoords.push({x : x, y : y});
				}
			}
			if (sc == 'M' || sc == 'm'){
				this.MoveCommand(code, pcoords);
			}
			if (sc == 'L' || sc == 'l'){
				this.LineCommand(code, pcoords);
			}
			if (sc == 'C' || sc == 'c'){
				this.CurveCommand(code, pcoords);
			}			
		}
		return code;
	},
	
	MoveCommand : function(code, coords){
		var coord = coords[0];
		if (this.absolute){
			coord.x += this.xStart;	
			coord.y += this.yStart;	
			coord.z = this.z;
		}
		else{
			coord.z = 0;
		}
		this.spindleUp(code);
		this.addLine(code, this.command, coord.x, coord.y, coord.z);
		this.subX = this.x;
		this.subY = this.y;
		if (coords.length > 1){
			coords.shift();
			LineCommand(code, coords);
		}
	},
	
	LineCommand : function(code, coords){
		this.spindleDown(code);
		for (var pcounter = 0; pcounter < coords.length; pcounter++){
			var coord = coords[pcounter];
			if (this.absolute){
				coord.x += this.xStart;	
				coord.y += this.yStart;	
				coord.z = this.z;
			}
			else{
				coord.z = 0;
			}
			this.addLine(code, this.command, coord.x, coord.y, coord.z);
		}
	},
	
	CurveCommand : function(code, coords){
		var csteps = 10;
		var c0 = { x: this.x, y : this.y };
		var c1 = coords[0];
		var c2 = coords[1];
		var c3 = coords[2];
		if (this.absolute){
			c1.x += this.xStart;	
			c1.y += this.yStart;	
			c2.x += this.xStart;	
			c2.y += this.yStart;	
			c3.x += this.xStart;	
			c3.y += this.yStart;			
		}
		else{
			c1.x += c0.x;	
			c1.y += c0.y;
			c2.x += c0.x;	
			c2.y += c0.y;	
			c3.x += c0.x;	
			c3.y += c0.y;
		}
		this.spindleDown(code);
		for (var i = 1/csteps; i <= 1; i += 1/csteps){
			var o1 = {x : (c1.x - c0.x) * i + c0.x, y : (c1.y - c0.y) * i + c0.y};
			var o2 = {x : (c2.x - c1.x) * i + c1.x, y : (c2.y - c1.y) * i + c1.y};
			var o3 = {x : (c3.x - c2.x) * i + c2.x, y : (c3.y - c2.y) * i + c2.y};
			var t1 = {x : (o2.x - o1.x) * i + o1.x, y : (o2.y - o1.y) * i + o1.y};
			var t2 = {x : (o3.x - o2.x) * i + o2.x, y : (o3.y - o2.y) * i + o2.y};
			var coord = {x : (t2.x - t1.x) * i + t1.x, y : (t2.y - t1.y) * i + t1.y};
			this.addLine(code, CNC.GCommands.G, Math.round(coord.x), Math.round(coord.y), this.z);
		}
	},
	
	CloseCommand : function(code, coords){
		if (this.isSpindleDown()){
			//this.closePath(code);
		}						
		this.spindleUp(code);
	},
	
	closePath : function(code){
		if (this.absolute){
			return this.addLine(code, CNC.GCommands.G, this.subX, this.subY, this.z);
		}
		else{
			return this.addLine(code, CNC.GCommands.M, this.subX - this.x, this.subY - this.y, this.z);
		}
	},
	
	followStart : function(code){
		this.spindleUp(code);
		return this.addLine(code, CNC.GCommands.G, this.xStart, this.yStart, this.z);
	},
	
	spindleUp : function(code){
		if (this.z > this.lz){
			return this.addLine(code, CNC.GCommands.M, 0, 0, (this.lz - this.z) - this.zg);
		}
		return null;
	},
	
	isSpindleDown : function(){
		return this.z > this.lz;
	},
	
	spindleDown : function(code){
		if (this.lz >= this.z){
			return this.addLine(code, CNC.GCommands.M, 0, 0, (this.lz - this.z) + this.zg);
		}
		return null;
	},
	
	addLine : function(code, command, x, y, z){
		var line = code[code.length - 1];
		if (this.frun){
			if (command == CNC.GCommands.M){
				x = x - (this.x - this.xStart);
				y = y - (this.y - this.yStart);
			}
			this.frun = false;
		}
		if (line && line.command == command && line.speed == this.speed){
			if (line.z == z && line.x == x && line.y == y){
				if (command == CNC.GCommands.M){
					line.x += x;
					line.y += y;
					line.z += z;
					this.x += x;
					this.y += y;
					this.z += z;	
				}
				return line;
			}
			if (command == CNC.GCommands.M){
				if (line.x == x && line.y == y) {
					line.z += z;
					this.z += z;	
					return line;
				}
				if (line.x == x && line.z == z) {
					line.y += y;
					this.y += y;	
					return line;
				}
				if (line.z == z && line.y == y) {
					line.x += x;
					this.x += x;	
					return line;
				}
			}
		}
		if (x == 0 && y == 0 && z == 0 && command == CNC.GCommands.M){
			return line;	
		}
		line = { command: command, x: x, y: y, z: z, speed: this.defaultSpeed() };
		if (command == CNC.GCommands.G){
			this.x = line.x;
			this.y = line.y;
			this.z = line.z;
		}
		if (command == CNC.GCommands.M){
			this.x += line.x;
			this.y += line.y;
			this.z += line.z;
		}
		this.speed = line.speed;
		code.push(line);
		return line;
	},
	
	defaultSpeed: function (ord) {
		var c =	this.speed;
		if (!c && ord){
			c = this.cnc[ord.toLowerCase() + "Speed"];
		}
		if (!c){
			c = this.cnc.speed;
		}
		return c;
	}
}

RegisterCompiler('svg', SvgCompiler);
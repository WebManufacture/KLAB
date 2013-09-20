//alert("AAAA!");

Compilers = {};

function RegisterCompiler(type, compiler){
	Compilers[type] = compiler;
}

CNC = {};
CNC.QPrograms = {};

CNC.Init = function (settings) {
	if (!settings) return;
	L.debug = true;
	CNC.log = L.Log;
	CNC.id = settings.id;
	CNC.Settings = settings;
	CNC.startDate = new Date();
	CNC.State = DOM("#StatusBar");
	CNC.State.InnerProperty("X", "#xCoord");
	CNC.State.InnerProperty("Y", "#yCoord");
	CNC.State.InnerProperty("Z", "#zCoord");
	CNC.State.InnerProperty("stateA", "#stateA");
	CNC.State.InnerProperty("stateB", "#stateB");
	CNC.State.AttrInnerProperty("Prog", "#progCommand");
	CNC.State.AttrInnerProperty("Line", "#progLine");
	WS.Body.AttrProperty("state");
	CNC.ProgramRunned = false;
	CNC.DebugMode = false;
	CNC.ProgramCode;
	MessagesChannel = new HttpChannel(new Url(CNC.Settings.MessagesUrl), false);
	MessagesChannel.onRead.subscribe(function (message) {
		if (message.length >= 2) {
			var arg = message[1];
			var message = message[0];
			var path = message.source;
			path = path.split("/");
			var type = path[path.length - 1];
			if (arg) {
				CNC.StateReturned(type, arg);
			}
		}
	});
	MessagesChannel.connectRead();
	CNC.GetCncState();
};



CNC.Commands = ["unknown", "go", "rebase", "stop", "info", "move", "pause", "resume"];
CNC.CommandsShort = ['N', 'G', 'B', 'S', 'I', 'M', 'P', 'R'];
CNC.GCommands = { "G": 1, "S": 3, "B": 2, "I": 4, "M" : 5, "P": 6, 'R': 7, 'X' : 1, 'Y': 1, 'Z': 1 };

CNC.CommandType =
{
    unknown: 0,
    go: 1,
    rebase: 2,
    stop: 3,
    state: 4,
	move: 5,
    pause: 6,
    resume: 7,
    error: 16
}

CNC.ProgramState =
{
    NotStarted: 0,
    Running: 1,
    Paused: 2,
    Completed: 3,
    Aborted: 4
}

/*
public byte command;
public ushort? x;
public ushort? y;
public ushort? z;
public ushort? speed;
public int? programLine;
*/

CNC.GetProgram = function () {
	var url = new Url(CNC.Settings.CodeUrl);
	if (CNC.lastpoll) {
		url.addParam("lastdate", CNC.lastpoll);
	}
	if (CNC.ProgramRunned) {
		url.addParam("wait", "true");
		url.addParam("ping", "true");
	}
	Net.get(url, CNC.StateReturned);
};


CNC.GetCncState = function () {
	Net.get(CNC.Settings.StateUrl, function (result) {
		portState.textContent = result + "";
	});
};

CNC.StateReturned = function (type, message) {
	if (type == "uart.device") {
		CNC.LastState = message;
		CNC.State.X = message.x;
		CNC.State.Y = message.y;
		CNC.State.Z = message.z;
		CNC.State.stateA = message.stateA;
		CNC.State.stateB = message.stateB;
		if (message.xLimit != message.x){
			var sign = message.x < message.xLimit ? " > " : " < ";
			CNC.State.X = message.x + sign + message.xLimit;
		}
		if (message.yLimit != message.y){
			var sign = message.y < message.yLimit ? " > " : " < ";
			CNC.State.Y = message.y + sign + message.yLimit;
		}
		if (message.zLimit != message.z){
			var sign = message.z < message.zLimit ? " > " : " < ";
			CNC.State.Z = message.z + sign + message.zLimit;
		}
		lx = message.x;
		ly = message.y;
		lz = message.z;
		
		Channels.emit("device.state", message);
		
		message.line = parseInt(message.line);
		var state = parseInt(message.state);
		if (!isNaN(message.line)) {
				WS.Body.set("@state", "");
			if (state == 1){
				if (!window.commandRunning) {
					CNC.ProgramRunned = !isNaN(message.line);
					window.commandRunning = true;
				}
				var current = DOM(".prog-line[line='" + (message.line) + "']");
				if (current && !current.is(".finished")) {
					current.add(".current");
				}
			}
			if (state == 2){	
				CNC.log("Device", message);				
				window.commandRunning = false;
				DOM.all(".prog-line.current").del(".current");
				DOM.all(".prog-line.prepared").del(".prepared");
				var finished = DOM(".prog-line[line='" + (message.line) + "']");
				if (finished && !finished.is(".finished")) {
					finished.add(".finished");
					var dte = new Date();
					finished.div(".time-complete", "" + dte.formatTime(true));
					if (window.programStartTime) {
						finished.div(".time-total", " - " + (dte.valueOf() - window.programStartTime.valueOf()));
					}
				}
			}
			if (state == 3){	
				CNC.log("Device", message);				
				window.commandRunning = false;
				DOM.all(".prog-line.current").del(".current");
				DOM.all(".prog-line.prepared").del(".prepared");
				var finished = DOM(".prog-line[line='" + (message.line) + "']");
				var next = DOM(".prog-line[line='" + (message.line + 1) + "']");
				if (finished && !finished.is(".finished")) {
					finished.add(".finished");
					var dte = new Date();
					finished.div(".time-complete", "" + dte.formatTime(true));
					if (window.programStartTime) {
						finished.div(".time-total", " - " + (dte.valueOf() - window.programStartTime.valueOf()));
					}
				}
				if (next) {
					next.add(".prepared");
				}				
			}
			if (state == 4){	
				CNC.log("Device", message);				
				window.commandRunning = false;
				DOM.all(".prog-line.current").del(".current");
				DOM.all(".prog-line.prepared").del(".prepared");
				var finished = DOM(".prog-line[line='" + (message.line) + "']");
				if (finished && !finished.is(".finished")) {
					finished.add(".finished.error");
					var dte = new Date();
					finished.div(".time-complete", "" + dte.formatTime(true));
					if (window.programStartTime) {
						finished.div(".time-total", " - " + (dte.valueOf() - window.programStartTime.valueOf()));
					}
				}	
				WS.Body.set("@state", "Error");
			}
		}
	}
	if (type == "uart.output") {
		CNC.LastCommand = message;
		CNC.ProgramRunned = !isNaN(parseInt(message.line));
		CNC.State.Prog = CNC.Commands[message.command];
		CNC.State.Line = message.line;
		CNC.log("Command", message);
	}
	if (type == "program-state") {
		CNC.ProgramRunned = message.state == "Running";
		if (CNC.ProgramRunned) {
			window.programStartTime = new Date();
			DOM("#CodeStats").div(".start-time", "Start: " + window.programStartTime.formatTime(true));
		}
		if (message.state == "Completed" || message.state == "Aborted") {
			if (window.programStartTime) {
				var f = new Date();
				DOM("#CodeStats").div(".finish-time", "Finish: " + f.formatTime(true));
				DOM("#CodeStats").div(".total-time", "Total: " + (f.valueOf() - window.programStartTime.valueOf()));
				window.programStartTime = null;
			}
		}
		CNC.ProgramState = message.state;
		WS.Body.set("@state", message.state);
		CNC.log("Program", message);
	}
};

CNC.Command = function (str, callback) {
	WS.Body.add(".busy");
	if (typeof (str) != "string") {
		str = JSON.stringify(str);
	}
	Net.add(CNC.Settings.CommandUrl + "?type=single&rnd=" + Math.random(), str, CNC.CommandComplete);
};

CNC.ProgCommand = function (str, callback) {
	WS.Body.add(".busy");
	if (typeof (str) == "string") {
		str = CNC.CommandType[str.toLowerCase()];
		if (str){
			Net.add(CNC.Settings.CommandUrl + "?type=single&rnd=" + Math.random(), JSON.stringify({command: str}), CNC.CommandComplete);
		}
	}
};

CNC.SendProgram = function (str) {
	WS.Body.add(".busy");
	if (typeof (str) == "string") {
		Net.add(CNC.Settings.ProgramUrl + "?type=code&rnd=" + Math.random() + (CNC.DebugMode ? "&debug=true" : ""), str, CNC.CommandComplete);
	}
};

CNC.CommandComplete = function () {
	WS.Body.del(".busy");
};

CNC.Go = function (x, y, z) {
	CNC.Command({ command: 1, x: x, y: y, z: z, speed: CNC.Settings.speed });
};

CNC.Rebase = function (x, y, z) {
	CNC.Command({ command: 2, x: x, y: y, z: z, speed: 0 });
};

CNC.SetDebugMode = function () {
	CNC.DebugMode = !CNC.DebugMode;
	if (CNC.DebugMode) {
		CNC.ProgCommand("pause");
	}
};


CNC.CompileSvg = function (text) {
	var lxx = 0;
	var lyy = 0;
	var lzz = 0;
	var yfactor = 1;
	if (CNC.LastState) {
		var lzz = parseInt(CNC.LastState.z);
		var lxx = parseInt(CNC.LastState.x);
		var lyy = parseInt(CNC.LastState.y);
	}
	var lss = parseInt(DOM("#millingSpeed").value);
	if (isNaN(lss)) {
		lss = 16000;
	}
	var code = [];
	var svg = DOM.div(".svg-codes", text);
	svg = WS.ExtendElement(svg.get("svg"));
	var svgWidth = svg.attr("width");
	var svgHeight = svg.attr("height");
	var nx = 400;
	var ny = 400;
	var paths = svg.all("path,circle,rect");
	var i = 0;
	rbtx = lxx;
	rbty = lyy;
	if (lzz > zup) {
		code.push({ command: 1, x: lxx, y: lyy, z: zup, speed: 2000 });
		lzz = zup;
	}
	for (var j = 0; j < paths.length; j++) {
		var path = WS.ExtendElement(paths[j]);
		if (path.tagName.toLowerCase() == "path") {
			for (var step = zdwn; step <= zdwn; step += 1) {
				var coords = path.attr("d");
				if (!coords) {
					continue;
				}
				var regex = "([mlc ])(-?\\d+(?:[.]\\d+)?),(-?\\d+(?:[.]\\d+)?)";
				var matches = coords.match(new RegExp(regex, 'ig'));
				for (var k = 0; k < matches.length; k++) {
					i++;
					var parse = matches[k].match(new RegExp(regex));
					var line = { command: 1, x: parseFloat(parse[2]), y: parseFloat(parse[3]), z: lzz, speed: lss };
					if (k == 0) {
						line.x = Math.round(rbtx + line.x * nx);
						line.y = Math.round(rbty + line.y * yfactor * ny);
						//code.push({ command : 1, x :  line.x, y : line.y, z : 20000, speed : 3000 });
						//lzz = 20000;
						line.z = lzz;
						line.speed = CNC.Settings.speed;
						//lss = 600;
					}
					else {
						line.x = lxx + Math.round(line.x * nx);
						line.y = lyy + Math.round(line.y * yfactor * ny);
					}
					if (line.z == lzz && line.x == lxx && line.y == lyy) {
						if (k == 0 && lzz < step) {
							code.push({ command: 1, x: lxx, y: lyy, z: step, speed: CNC.Settings.speed });
							lzz = step;
						}
						continue;
					}
					lxx = line.x;
					lyy = line.y;
					/*
if (line.x > lxx){
lxx = line.x;
line.x -= 1600;
}
else{
lxx = line.x;
line.x += 1600;	
}
if (line.y > lyy){
lyy = line.y;
line.y -= 1600;
}
else{
lyy = line.y;
line.y += 1600;	
}*/
					lzz = line.z;
					if (coords.end("z") || coords.end("Z")) {
						
					}
					code.push(line);
					if (k == 0 && lzz < step) {
						code.push({ command: 1, x: lxx, y: lyy, z: step, speed: CNC.Settings.speed });
						lzz = step;
						//lss = 600;
					}
				}
			}
			if (lzz > zup) {
				code.push({ command: 1, x: lxx, y: lyy, z: zup, speed: CNC.Settings.speed });
				lzz = zup;
			}
		}
	}
	if (lzz > zup) {
		code.push({ command: 1, x: lxx, y: lyy, z: zup, speed: CNC.Settings.speed });
		lzz = zup;
	}
	code.push({ command: 1, x: lxx, y: lyy, z: 5000, speed: CNC.Settings.speed });
	return code;
};

CNC.CompileCsv = function (text) {
	var lxx = 0;
	var lyy = 0;
	var lzz = 0;
	if (CNC.LastState) {
		var lzz = parseInt(CNC.LastState.z);
		var lxx = parseInt(CNC.LastState.x);
		var lyy = parseInt(CNC.LastState.y);
	}
	nx = 10;
	ny = 10;
	ps = 0;
	zup = 20000;
	zdwn = 58000;
	rbtx = 0;
	rbty = 0;
	rbtz = 0;
	scx = 1;
	scy = 1;
	scz = 1;
	var lss = parseInt(DOM("#millingSpeed").value);
	if (isNaN(lss)) {
		lss = 16000;
	}
	var code = [];
	text = text.split("\n");
	for (var i = 0; i < text.length; i++) {
		if (text[i].trim().length == 0) break;
		if (text[i].end(";")) {
			text[i] = text[i].substr(0, text[i].length - 1);
		}
		var coords = text[i].split(" ");
		if (coords.length > 0) {
			if (isNaN(parseFloat(coords[0]))) {
				var command = coords[0];
				coords = coords[1].split(",");
				if (command == "PU") {
					if (lzz > zup) {
						code.push({ command: 1, x: lxx, y: lyy, z: zup, speed: CNC.Settings.speed });
						lzz = zup;
					}
				}
				if (command == "PD") {
					if (lzz < zdwn) {
						code.push({ command: 1, x: lxx, y: lyy, z: zdwn, speed: CNC.Settings.speed });
						lzz = zdwn;
					}
				}
				if (command == "SZ") {
					zup = parseParam(coords[0], zup, zup);
					zdwn = parseParam(coords[1], zdwn, zdwn);
					continue;
				}
				if (command == "BASE") {
					rbtx = parseParam(coords[0], rbtx, rbtx);
					rbty = parseParam(coords[1], rbty, rbty);
					rbtz = parseParam(coords[2], rbtz, rbtz);
					continue;
				}
				if (command == "DU") {
					if (coords[0] == 'mm') {
						nx = 400;
						ny = 400;
					}
					if (coords[0] == 'hp') {
						nx = 10;
						ny = 10;
					}
					if (coords[0] == 'steps') {
						nx = 1;
						ny = 1;
					}
					continue;
				}
				if (command == "SCALE") {
					scx = parseParam(coords[0], scx, scx);
					scy = parseParam(coords[1], scy, scy);
					scz = parseParam(coords[2], scz, scz);
					continue;
				}
			}
			else {
				coords = text[i].split(",");
			}
			var line = { command: 1, x: parseParam(coords[ps], lxx, lxx), y: parseParam(coords[ps + 1], lyy, lyy), z: parseParam(coords[ps + 2], lzz, lzz), speed: parseParam(coords[ps + 3], lss, lss) };
			line.x = Math.round(line.x * nx * scx + rbtx);
			line.y = Math.round(line.y * ny * scy + rbty);
			line.z = Math.round(line.z * scz + rbtz);
			lxx = line.x;
			lyy = line.y;
			lzz = line.z;
			lss = line.speed;
			code.push(line);
		}
	}
	code.push({ command: 1, x: lxx, y: lyy, z: zup, speed: CNC.Settings.speed });
	return code;
};

CNC.GetProgram = function(name){
	return CNC.QPrograms[name];
}

CNC.LoadProgram = function(fpath, callback){
	Storage.get("programs/" + fpath + "?" + Math.random(), function(text){
		callback(text, fpath);
	});
};

CNC.QuickCommand = function (txt) {
	txt = CncCompiler.Compile(CNC.Settings, txt, { x: lx, y : ly, z: lz, speed : CNC.Settings.speed });
	if (txt && txt.length > 0){
		CNC.Command(txt[0]);
	}
};

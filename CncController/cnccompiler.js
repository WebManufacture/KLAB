CncCompiler = {};

CncCompiler.Compile = function (cnc, code, callback) {
    var context = new CncCodeProcessor(cnc);
    return context.Compile(code.split("\n"), callback);
}

CncCodeProcessor = function (cnc) {
    this.cnc = cnc;
    this.x = lx;
    this.y = ly;
    this.z = lz;
	this.x = parseInt(this.x);
    this.y = parseInt(this.y);
    this.z = parseInt(this.z);
    this.speed = this.cnc.speed;
};

CncCodeProcessor.prototype = {
    Compile: function (code, callback) {
        var result = [];
        try {
            for (var i = 0; i < code.length; i++) {
                var line = code[i].trim();
                if (line.length == 0) break;
                if (line.start("//") || line.start("#")) continue;
                var txt = line.split(" ");
                var func = CncCompilerCommands[txt[0]];
                if (typeof func == 'function') {
                    var res = func.call(this, this.parseParams(txt), i);
                    if (res) {
                        if (Array.isArray(res)) {
                            result = result.concat(res);
							res = this.FollowPath(res);
                        }
                        else {
                            result.push(res);
							res = this.FollowPath(res);
                        }
						if (res.goto) {
							i = res.goto;
							delete res.goto;
						}
                    }
                }
            }
            return result;
        }
        catch (e) {
            throw e;
        }
    },
	
	FollowPath : function(path){
		if (!path) return null;
		if (Array.isArray(path)){
			for(var i = 0; i < path.length; i++){
				this.FollowPath(path[i]);
			}
			return path[path.length - 1];
		}
		if (path.command == CNC.GCommands.M) {
			if (Number.isFinite(path.x)) {
				this.x += parseInt(path.x);
			}
			if (Number.isFinite(path.y)) {
				this.y += parseInt(path.y);
			}
			if (Number.isFinite(path.z)) {
				this.z += parseInt(path.z);
			}
		}
		if (path.command == CNC.GCommands.G) {
			if (Number.isFinite(path.x)) {
				this.x = parseInt(path.x);
			}
			if (Number.isFinite(path.y)) {
				this.y = parseInt(path.y);
			}
			if (Number.isFinite(path.z)) {
				this.z = parseInt(path.z);
			}
		}
		if (Number.isFinite(path.speed) && path.speed > 0) {
			this.speed = path.speed;
		}
		return path;
	},

    parseParams: function (params) {
		var length = params.length;
		params.namedParams = {};
        for (var i = 1; i < length; i++) {
            var result = this.parseParam(params[i]);
			if (result && result.pname){
				params.namedParams[result.pname] = result;
			}
			else{
				params[i] = result;	
			}
        }
        params.get = function (name, def) {
			if (this.namedParams[name]) return this.namedParams[name];
            for (var i = 1; i < this.length; i++) {
                if (typeof (this[i]) == "string" && this[i].start(name)) {
                    return this[i];
                }
            }
            if (def == undefined) def = null;
            return def;
        }
		params.length = length;
        return params;
    },

    parseParam: function (param, def) {
        if (def == undefined) def = null;
        if (!param || param == "") return def;
        var sign = 0;
		if (param.search(/\[[a-zA-Z0-9_]+\]/) >= 0) {
			var match = param.match(/\[[a-zA-Z0-9_]+\]/)[0];
			var num = match.replace("[", "").replace("]", "");
			param = param.replace(match, this[num]);
			
		}
        if (param.search(/[-+]?[0-9]*\.?[0-9]+/) >= 0) {
            var num = param.match(/[-+]?[0-9]*\.?[0-9]+/)[0];
            if (!num) return def;
        }
        else {
            return param;
        }
        if (param.indexOf(num) > 0) {
            var pname = param.substr(0, param.indexOf(num));
        }
        if (num.start("-")) {
            sign = -1;
        }
        if (num.start("+")) {
            sign = 1;
        }
        var num = parseFloat(num);
        if (isNaN(num)) {
            return def;
        }
        if (param.end('m')) {
            var units = 'mm';
        }
        else {
            var units = 'st';
        }
        return new GParam(num, pname, sign, units);
    },

    convertUnits: function (param, ord) {
        if (param == undefined || param == null || !Number.isFinite(param.value)) return null;
        if (param.units == "mm") {
            var c = this.cnc["mmCoef" + ord.toUpperCase()];
            if (!c) c = this.cnc["mmCoef"];
            if (!c) c = 1;
            param.value *= c;
        }
        return param;
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
    },
	
    GetCircleProg: function (params) {
        var radius = params.get("R", params[1]);
        var r1 = params.get("R1");
        var r2 = params.get("R2");
        var sangle = params.get("SA", params[2]);
        var fangle = params.get("FA", params[3]);
        var steps = params.get("Q", params[4]);
        var speed = params.get("S", params[5]);
        params = params.get("P");
        if (!r1) r1 = radius;
        if (!r2) r2 = radius;
        if (!r1 || !r2) return;
        r1 = r1.clone();
        r2 = r2.clone();
        var res = [];
        if (sangle != null && sangle.value) {
            sangle = sangle.value * Math.PI / 180;
        }
        else {
			if (params && params.contains("m")){
	            sangle = -Math.PI;
			}
			else{
				sangle = 0;
			}
        }
        if (fangle != null && fangle.value) {
            fangle = fangle.value * Math.PI / 180;
        }
        else {
			if (params && params.contains("m")){
	            fangle = Math.PI;
			}
			else{
				fangle = 2 * Math.PI;	
			}
        }
        if (sangle == fangle) return;
        var lr = { x: this.x, y: this.y, z: this.z };
        var xc = "x"; var yc = "y"; var zc = "z";
        if (params && params.contains("xz")) {
            yc = "z";
            zc = "y";
        }
        if (params && params.contains("yz")) {
            xc = "y";
            yc = "z";
            zc = "x";
        }
        r1 = this.convertUnits(r1, xc);
        r2 = this.convertUnits(r2, yc);
        if (params && params.contains("c")) {
            var a = 0;
            var b = 0;
        }
        else {
            var a = -Math.round(r1.value * Math.cos(sangle));
            var b = -Math.round(r2.value * Math.sin(sangle));
        }
		a += this[xc];
        b += this[yc];
        var command = "M";
        if (params && params.contains("a")) {
            var command = "G";
        }
        if (!steps) {
            steps = 32;
        }
		else{
			steps = steps.value;	
		}
        var step = 2*Math.PI / steps;
        if (fangle < sangle) {
            step = -step;
        }
        if (!speed) speed = 0;
        else speed = speed.value;
		for (var angle = sangle; (angle <= fangle && fangle > sangle) || (angle >= fangle && fangle < sangle); angle += step) {
            var xcoord = Math.round(r1.value * Math.cos(angle)) + a;
            var ycoord = Math.round(r2.value * Math.sin(angle)) + b;
            var obj = { command: CNC.GCommands[command], speed: speed };
            if (command == "M") {
                obj[xc] = xcoord - lr[xc];
                obj[yc] = ycoord - lr[yc];
                lr[xc] += obj[xc];
                lr[yc] += obj[yc];
                obj[zc] = 0;
            }
            else {
                obj[xc] = xcoord;
                obj[yc] = ycoord;
                obj[zc] = this[zc];
            }
            res.push(obj);
        }
		if (angle != fangle){
			angle = fangle;	
			var xcoord = Math.round(r1.value * Math.cos(angle)) + a;
			var ycoord = Math.round(r2.value * Math.sin(angle)) + b;
			var obj = { command: CNC.GCommands[command], speed: speed };
			if (command == "M") {
				obj[xc] = xcoord - lr[xc];
				obj[yc] = ycoord - lr[yc];
				lr[xc] += obj[xc];
				lr[yc] += obj[yc];
				obj[zc] = 0;
			}
			else {
				obj[xc] = xcoord;
				obj[yc] = ycoord;
				obj[zc] = this[zc];
			}
			res.push(obj);
		}
        if (params && params.contains("b")) {
            if (params && params.contains("a")) {
                var obj = { command: CNC.GCommands.G };
                obj[xc] = this[xc];
                obj[yc] = this[yc];
                obj[zc] = this[zc];
            }
            else {
                var obj = { command: CNC.GCommands.M };
                obj[xc] = a - lr[xc];
				obj[yc] = b - lr[yc];
				obj[zc] = 0;
            }
            obj.speed = speed;
            res.push(obj);
        }
        return res;
    }
}

GParam = function (num, pname, sign, units) {
    this.value = num;
    this.pname = pname;
    this.sign = sign;
    this.units = units;
}

GParam.prototype = {
    clone: function () {
        return new GParam(this.value, this.pname, this.sign, this.units);
    }
}

CncCompilerCommands = {
    C: function (params) {
        return this.GetCircleProg(params);
    },
    L: function (params, line) {
        var start = params.get("B", params[1]);
        var stop = params.get("E", params[2]);
        var step = params.get("S", params[3]);
        if (!start) return null;
        if (!stop) return null;
        if (step) step = step.value; else step = 1;
        this.counter = this.loopStart = start.value;
        this.loopStop = stop.value;
        this.loopStep = step;
        this.loopLine = line;
        return null;
    },
	LC: function (params, line) {
		var start = this.convertUnits(params.get("B", params[1]));
        var stop = this.convertUnits(params.get("M", params[1]));
        var step = this.convertUnits(params.get("S", params[2]));
        if (stop) stop = stop.value;
		else return null;
		if (start) start = 0;
		else start = 0
        if (step) step = step.value; else step = 1;
        this.loopCoord = this.loopCStart = this.x + start.value;
        this.loopCStop = stop.value;
        this.loopCStep = step;
        this.loopCLine = line;
        return null;
    },
    LF: function (params, line) {
        if (this.counter < this.loopStop) {
            this.counter += this.loopStep;
            return { command: 0, goto: this.loopLine };
        }
        delete this.counter;
        delete this.loopStart;
        delete this.loopStop;
		delete this.loopStep;
        delete this.loopLine;
        return null;
    },
    Z: function (params) {
        var value = params.get("r", params[1]);
        var speed = params.get("S", params[2]);
        value = this.convertUnits(value, "z");
        if (!speed) speed = this.defaultSpeed("Z");
        else speed = speed.value;
        if (value.pname) {
            return { command: CNC.GCommands.M, x: 0, y: 0, z: value.value, speed: speed };
        }
        else {
            return { command: CNC.GCommands.G, x: this.x, y: this.y, z: value.value, speed: speed };
        }
    },
    X: function (params) {
        var value = params.get("r", params[1]);
        var speed = params.get("S", params[2]);
        value = this.convertUnits(value, "x");
        if (!speed) speed = this.defaultSpeed("x");
        else speed = speed.value;
        if (value.pname) {
            return { command: CNC.GCommands.M, x: value.value, y: 0, z: 0, speed: speed };
        }
        else {
            return { command: CNC.GCommands.G, x: value.value, y: this.y, z: this.z, speed: speed };
        }
    },
    Y: function (params) {
        var value = params.get("r", params[1]);
        var speed = params.get("S", params[2]);
        value = this.convertUnits(value, "y");
        if (!speed) speed = this.defaultSpeed("y");
        else speed = speed.value;
        if (value.pname) {
            return { command: CNC.GCommands.M, x: 0, y: value.value, z: 0, speed: speed };
        }
        else {
            return { command: CNC.GCommands.G, x: this.x, y: value.value, z: this.z, speed: speed };
        }
    },
    M: function (params) {
        var x = this.convertUnits(params.get("X", params[1]), 'x');
        var y = this.convertUnits(params.get("Y", params[2]), 'y');
        var z = this.convertUnits(params.get("Z", params[3]), 'z');
        var speed = params.get("S", params[4]);
        if (!speed) speed = this.defaultSpeed();
        else speed = speed.value;
        if (!x) x = 0; else x = x.value;
        if (!y) y = 0; else y = y.value;
        if (!z) z = 0; else z = z.value;
        return { command: CNC.GCommands.M, x: x, y: y, z: z, speed: speed };
    },
    G: function (params) {
        var x = this.convertUnits(params.get("X", params[1]), 'x');
        var y = this.convertUnits(params.get("Y", params[2]), 'y');
        var z = this.convertUnits(params.get("Z", params[3]), 'z');
        var speed = params.get("S", params[4]);
        if (!speed) speed = this.defaultSpeed();
        else speed = speed.value;
        if (!x) x = this.x; else x = x.value;
        if (!y) y = this.y; else y = y.value;
        if (!z) z = this.z; else z = z.value;
        return { command: CNC.GCommands.G, x: x, y: y, z: z, speed: speed };
    },
    B: function (params) {
        var x = this.convertUnits(params.get("X", params[1]), 'x');
        var y = this.convertUnits(params.get("Y", params[2]), 'y');
        var z = this.convertUnits(params.get("Z", params[3]), 'z');
        if (!x) x = this.x; else x = x.value;
        if (!y) y = this.y; else y = y.value;
        if (!z) z = this.z; else z = z.value;
        return { command: CNC.GCommands.B, x: x, y: y, z: z };
    },
	V: function (params) {
		var speed = params.get("S", params[1]);
		return { command: 60, x: 0, y: 0, z: 0, speed : speed.value };
    },	
	VS: function (params) {
		return { command: 61, x: 0, y: 0, z: 0, speed : 1000 };
    },
    P: function (params) {
        return { command: CNC.GCommands.P };
    },
	SavePos: function (params) {
        var posname = params[1];
		if (!posname){
			posname = "defaultPosition";
		}
		if (!this.savedPos){
			this.savedPos = {};
		}
		this.savedPos[posname] = { x: this.x, y: this.y, z: this.z };		
		return null;
    },
	LoadPos: function (params) {
        var posname = params[1];
		if (!posname){
			posname = "defaultPosition";
		}
		if (this.savedPos && this.savedPos[posname]){
			var pos = this.savedPos[posname];
			return { command: CNC.GCommands.G, x: pos.x, y: pos.y, z: pos.z };
		}
		return null;
    },
	Q: function (params) {
		var name = params[1];
		for (var i = 2; i < params.length; i++){
			var value = params[i];
			if (value.value != undefined){
				this["param" + (i-1)] = value.value;
			}
			else{
				this["param" + (i-1)] = value;
			}
		}
		for (var param in params.namedParams){
			this[param] = params.namedParams[param].value;
		}
		var prog = CNC.QPrograms[name];
		if (prog){
			var tmp = { counter : null, loopStart: null, loopStop : null, loopStep: null, loopLine: null, savedPos:null };
			for (var item in tmp){
				if (this[item] != undefined){
					tmp[item] = this[item];
					delete this[item];
				}
				else{
					delete tmp[item];
				}
			}			
			var res = this.Compile(prog.split("\n"));
			for (var item in tmp){
				this[item] = tmp[item];	
			}
			return res;
		}
        return null;
    },
	J: function (params) {
		var name = params[1];
		for (var i = 2; i < params.length; i++){
			var value = params[i];
			if (value.value != undefined){
				this["param" + (i-1)] = value.value;
			}
			else{
				this["param" + (i-1)] = value;
			}
		}
		for (var param in params.namedParams){
			this[param] = params.namedParams[param].value;
		}
		var prog = CNC.QPrograms[name];
		if (prog){
			return this.Compile(prog.split("\n"));
		}
        return null;
    }
}

RegisterCompiler('qcnc', CncCompiler);
RegisterCompiler('cnc', CncCompiler);
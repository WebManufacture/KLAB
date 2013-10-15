ProgramEditor = {};

ProgramEditor.Init = function(win){
	Extend(win, this);
	win.editor = win.get(".program-text");	
};

ProgramEditor.SaveProgram = function(){
	var win = this;
	var text = this.editor.value;
	var lines = text.split("\n");
	if (lines.length > 0 && lines[0].start("#")){
		var fname = lines[0].replace("#", '');
		var ext = fname.split('.');
		if (ext[1]){
			ext = ext[1];	
		}
		else{
			ext = "unknown";
		}
		this.codeType = ext;
		Storage.POST("programs/" + fname, text, function(){
			win.get(".window_title").set(fname);
		});
	}
};

ProgramEditor.LoadProgram = function(fname){
	var win = this;
	Storage.get("programs/" + fname + "?rnd=" + Math.random(), function(result){
		win.editor.value = result;
	});
};

ProgramEditor.Compile = function(){
	var compiler = Compilers[this.codeType];
	if (compiler){
		var text = this.editor.value;
		CNC.ProgramCode = compiler.Compile(CNC.Settings, text, { x: lx, y : ly, z: lz, speed : CNC.Settings.speed });
		PostCompiler.ShowCode(CNC.ProgramCode);
		Preview.ShowCode(CNC.ProgramCode);
	}
};


CControl = {
	OnInit: function(){
		var hrow = this.get("#row1");
		hrow.add(".header");
		var cells = hrow.all(".cell");
		for (var i = 0; i < cells.length; i++){
			cells[i].textContent = i + 1;	
		}
		var cells = this.all(".row:not(.header) .cell");
		for (var i = 0; i < cells.length; i++){
			CControl.InitCell.call(this, cells[i]);	
		}
		
		var cells = this.all(".cell[col='1']");
		for (var i = 1; i < cells.length; i++){
			cells[i].textContent = i;	
		}
	},
	
	InitCell : function(cell){
		var table = this;
		cell.onmouseenter = function(event){
			var hcol = table.get(".row.header .cell[col='" + this.col + "']"); 
			if (hcol){
				table.all(".row.header .cell.current").del(".current");	
				hcol.add(".current");
			}
			if (event.buttons == 1){
				WS.ToggleClass(this,"selected");
			}
		}
		cell.onmousedown = function(){
			WS.ToggleClass(this,"selected");	
		}
	}
}
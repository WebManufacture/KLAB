CManager = {};

CManager.Init = function (table) {
	Extend(table, CManager._Mixin);
	table.Cols = parseInt(table.get("@columns"));
	table.Rows = parseInt(table.get("@rows"));
	table.CellSize = parseInt(table.get("@cellsize"));
	table.IDiv = table.div(".internal");
	var isize = ((table.CellSize) * table.Cols);
	table.IDiv.set("@style", "width : " + isize + "px;");
	table.Fill();
	table.add(".initialized");
	if (table.Controller && typeof table.Controller.OnInit == "function"){
		table.Controller.OnInit.call(table);
	}
};

CManager._Mixin = {
	Fill : function(){
		this.all(".cell").del();
		for (var i = 1; i <= this.Rows; i++){
			var row = this.CreateRow(i);
		}
	},
	
	CreateRow: function(rnum){
		var row = this.IDiv.div(".row");
		row.id = "row" + rnum;
		for (var i = 1; i <= this.Cols; i++){
			var cell = row.div(".cell", "&nbsp;");
			cell.id = "cell" + rnum + "_" + i;
			cell.set("@col", i);
			cell.set("@row", rnum);
			cell.row = rnum;
			cell.col = i;
		}
		return row;
	}
}

C.Add({id: 'CellsManagerContext', Condition: 'ui-processing', Selector:'.cells-manager:not(.initialized)', Process: function(elem){
	CManager.Init(elem);
}});

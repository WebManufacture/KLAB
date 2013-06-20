fias = {
	get : function(query, callback){
		if (typeof query == 'object'){
			if (!query.table) return;
			if (!query.fields) query.fields = "*";
			if (query.where) query.where = " WHERE " + query.where;
			else query.where = '';
			if (query.sort) query.sort = " ORDER BY " + query.sort;
			else query.sort = '';
			query = 'SELECT TOP(100)' + query.fields + ' FROM ' + query.table + query.where	+ query.sort;
		}
		if (query == "") return;
		this.tunnel.POST("", query, callback);
	}
}

WS.DOMload(function(){
	fias.tunnel = new KLabTunnel("http://web-manufacture.net/identification/fias", false);
});
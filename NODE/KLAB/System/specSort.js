
TabIndexer = {};

TabIndexer.GetSource= function(name){
	    //Ира, тут не нужно работать с дом.
	    //Только с массивами! И тут не вижу параметров.
		
		var spec = name;
		var hitCount = {};
		var l=spec.length;
		var i=0;
		
		while(i < l){
			var j=i;
				while(spec[j][0]==spec[j+1][0])
				{
				j++;
							
				}
			var curSymb=spec[i][0];
			hitCount[spec[i][0]]=[i,j];
			i=j+1;
			if (i>=6)break;
		}
	return hitCount;
				
};
	
	//Тут где-то была пропущена скобка }
	
	
/*

	И еще, ребят, давайте учится культурной речи! :)
	В JS не принято вообще пользоватся 
	function tabIndexer() такой формой в крупных проектах (а у нас он крупный! порядка 10 модулей только в нашем случае!)
	
	когда так объявляешь то ф-я объявляется в window. А в window и так всегда порядка 1000 переменных!
	
	поэтому используют так называемые Frame-объекты или Namespaces
	
	Делается это так:
	
	LeftPanel = {}
	
	LeftPanel.Init = function(){
	...
	var src = TabIndexer.GetTabsSource(Names);
	...
	}
	
	Данный пример о левой панели, но!
	Этот вызов предполагает что 
	
	TabIndexer.GetTabsSource(Names)
	
	Ф-я GetTabsSource также находится в своем объекте TabIndexer.

*/
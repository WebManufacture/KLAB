TabIndexer = {};

TabIndexer.GetSource= function(name, nNumber){
	var spec = name;
	var hitCount = {};
	var l = spec.length;
	
	var curSymb=spec[1][0];		//для проверки первой буквы
	var quantity = nNumber;
	hitCount=TabIndexer.PageLet(spec, quantity, l);
//	hitCount=TabIndexer.Alphabet(spec, 0, l, 0, quantity);
	//quantity--;
	//var specPrint = {};
	//for (var q=0; q<=l; q++)
	//{
	//for (var i=0; i<hitCount.length-1; i++)
	//{
	//var hc=hitCount[i];
	//if (hc[0]>=q && hc[1]<=q) var index1=q;
	//else continue;
	
	
	//specPrint[hitCount[i]=[i,
	
	//}
	//q+=quantity;
	//}
	return hitCount;
	
};

TabIndexer.PageLet= function(allNames, quantity, length){
	var spec=allNames;
	var step=(quantity-1);
	var l=length-1;
	var tabName={};
	var let1,let2;
	for (var i=0; i<=l && i<=130; i++){
	
			let1 = spec[i].name[0];
			i += step;
		
			if(i>=l){
					let2=spec[l].name[0];
					tabName[let2 +' - '+ let1]=[i-step,l];
					}
			else {
				let2=spec[i].name[0];
				tabName[let2 +' - '+ let1]=[i-step,i];
			}
			var check=tabName[let1 +' - '+ let2];
		}
	
	
	return tabName;
};



TabIndexer.Alphabet = function (allNames, index1, index2, letQuant, nNumb)
	{
		var index1=index1;
		var l=index2;
		//var index2;
		var spec=allNames;
		var letterNumber=letQuant;
		var num=nNumb;//не используется
		var hitCount={};
		for (index1; index1 < l;){
			
			var j = index1;
			while(spec[j][letterNumber] == spec[j+1][letterNumber])//сравнение первых букв слов
			{
				
				j++;
				curSymb = spec[j][0];
				
			}
			index2 = j;
			hitCount[spec[index1][0]] = [index1,index2];
			
			
			var lh=TabIndexer.letterHit(spec, index1,index2 );	
			
			index1 = j + 1;	
			if (index1>=l-1) break;
		}
		return hitCount;
		
	};

TabIndexer.letterHit = function(word, index1, index2){
	var lHits = {};
	var stack = word;
	var index1 = index1;
	var index2 = index2;
	var numSymb=0;
	
	for (var i=0; i<word[index1].length; i++){
		if (stack[index1][i]==stack[index1+1][i]){
			var w=stack[index1][i];
			numSymb++;
		}
		else break;
	}
	index1++;
	if (index1>=index2) return stack;
	else TabIndexer.letterHit(word, index1, index2);
	
};

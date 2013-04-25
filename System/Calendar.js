function OnStart(){
   // var v = W.findAll("div.hided");    
   // for (var i = 0; i < v.length; i++){
	//v[i].del();
    
    var m = W.querySelectorAll(".month span");
    for(var i=0; i<=m.length; i++){

	m[i].onclick()= onMonthClick; 
    }
}


OnStart();

function onMonthClick()
{
    if(this.nextSibling.style.display='')
	shiftLeft();
    else
	shiftRight();

}
onMonthClick();

function shiftLeft(){

    
}
shiftLeft();



function shiftRight(){
    
}
shiftRight();

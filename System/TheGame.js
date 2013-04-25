function WrapClosure(obj, func){
	if (typeof(func) == "function"){
		return function(){
			return func.apply(obj, arguments);
		};			
	}	
	if (typeof(func) == "string"){
		return function(){
			return obj[func].apply(obj, arguments);
		};			
	}	
	return null;
};			

HTMLElement.prototype.DefineElementProperty = function(name, innerElement){
	if (!innerElement || !name) return;
	//var elem = this;
	Object.defineProperty(this, name, {
		get: function(){
			if (!innerElement) return null;
			return innerElement.textContent;
		},
		set: function(newValue){
			if (!innerElement) return null;
			if (newValue){
				innerElement.textContent = newValue + "";
			}
			else{
				innerElement.textContent = "";
			}
		}
	});
};

Server = {};

Server.ActionHandler = "GameMessages.txt";

UI = {};

UI.$InitPage = function(){
	
	//Simple HTML to JObjects linker 
	// Эта штука позволяет во многом упростить работу со статическими элементами интерфейса из JS
	// Упрощает чтение кода и не нужно каждый раз писать $('#BlaBla').find('.La-La').text('acascacs');
	// Проще: UI.BlaBla.LaLa = asasklmasclkm;
	
	$("[id]").each(function(){
		UI[this.id] = this;
		var elem = this;
		$(this).find(".inner-property").each(function(){
			if (this.classList.length > 0){
				var propertyName = this.classList[0].replace(/-/g,"");	
				elem.DefineElementProperty(propertyName, this);
			}
		});
	});
	
	$("#MoneyPanel").tooltip({placement:'bottom', trigger: 'hover', html: false});
	UI.BuyVegDialog.all('.veg-line').each(function(elem){
		elem.onclick = function(){
			$('#BuyVegDialog').modal('hide'); PiesController.BuyVeg(this.attr("value"), this);
		}
	});
};

UI.$ShowBuyPlaceDialog = function(){
	//$("#BuyPieceDialog").Show();
};

UI.$BuyPlace = function(number){
	//$("#BuyPieceDialog").Show();
};


MessagesQueue = {
	_handlers : {},
	
	_processMessages : function(result){
		if (result.length > 0){
			try{
				var messages = JSON.parse(result);}
			catch(e){
				return;	
			}
			for (var i = 0; i < messages.length; i++){
				MessagesQueue._handleMessage(messages, i);
			};
			
		}
	},
	
	_handleMessage : function(messages, index){
		var message = messages[index];
		window.setTimeout(function(){
			var handlers = MessagesQueue._handlers[message.type.toLowerCase()];
			if (handlers && handlers.length > 0){
				for (var i = 0; i < handlers.length; i++){
					var handler = handlers[i];
					if (typeof(handler) == "function" && handler(message)){
						messages[index] = null;
						return;
					}
				};							
			}
			handlers = MessagesQueue._handlers["*"];
			if (handlers && handlers.length > 0){
				for (var i = 0; i < handlers.length; i++){
					var handler = handlers[i];
					if (typeof(handler) == "function" && handler(message)){
						messages[index] = null;
						return;
					}
				};							
			}
		}, 200);
	},
	
	Subscribe : function(messageType, handler){		
		if (messageType){
			if (typeof(messageType) != "string") return;
			messageType = messageType.toLowerCase();
			if (!this._handlers[messageType]){
				this._handlers[messageType] = [];
			}
			this._handlers[messageType].push(handler);
		}
		else{
			if (!this._handlers["*"]){
				this._handlers["*"] = [];
			}
			this._handlers["*"].push(handler);
		}
	},
	
	Send : function(url, message){
		message = JSON.stringify(message);
		$.get(url, message, MessagesQueue._processMessages);
	}
	
	
};

function MessagesController(messageType){
	this.messageType = messageType;
	var controller = this;
	MessagesQueue.Subscribe(messageType, WrapClosure(this, "OnMessage"));
	// Чтобы избежать повышения сцепленности нужно не использовать такую форму вызова MessagesQueue.Subscribe
	// Вместо нее можно использовать такую:
	//MessagesQueue.Subscribe(messageType, WrapClosure(this, this.OnMessage));
	// тогда MessagesQueue ничего не нужно знать об объекте.
	// однако в данном случае, это приведет к усложнению линейки классов MessagesController
	// промежуточным выходом может стать такая ф-я:
	// function(message) { controller.OnMessage(message); };
}

MessagesController.prototype = {
	OnMessage : function(message){
		
	}
}


MoneyController = new MessagesController("Money");

MoneyController.Init = function(){
	
};

MoneyController.OnMessage = function(message){
	UI.MoneyPanel.moneyCount = message.count;
	UI.MoneyPanel.attr("title", UI.MoneyPanel.textContent);
};	

PiesController = new MessagesController("Pies");

PiesController.Init = function(){
	
};

PiesController.BuyPie = function(size){
	if (!size) return;
	MessagesQueue.Send(Server.ActionHandler, {type: "pies", action: "create", size : size });
	UI.PiesList.attr("data-size", size);
	UI.PiesList.add(".loading");
	UI.PiesList.show();
	UI.BuyPieLink.hide();
};


PiesController.BuyVeg = function(num, veg){
	if (!num) return;
	//MessagesQueue.Send(Server.ActionHandler, {type: "pies", action: "create", size : size });
	var selVeg = UI.PiesList.get(".selected");
	selVeg.del(".empty");
	selVeg.attr("style", veg.attr("style"));
};

PiesController.GetPie = function(pieNum){
	var pie = DOM.div(".pie.empty");
	pie.id = 'pie' + pieNum;
	pie.Num = pieNum;
	pie.onclick = PiesController.PieClick;
	return pie;
};

PiesController.PieClick = function(){
	UI.PiesList.all(".selected").del(".selected");
	this.add(".selected");
	$("#BuyVegDialog").modal('show');
};

PiesController.OnMessage = function(message){
	UI.PiesList.del(".loading");	
	if (!message.type.contains("error")){
		for (var i = 1; i <= message.pies; i++){
			UI.PiesList.add(PiesController.GetPie(i));
		}
	}
};

$(UI.$InitPage);

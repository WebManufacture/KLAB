var url = require('url');
var crypto = require('crypto');

ObjectID = require('mongodb').ObjectID;

module.exports = function(config, router, logger){
	log = logger;
	return AuthRouter;
};


module.exports.Auth = Auth = {	
	RetreiveUser : function(request, callback) {
		var key = request.getHeader("session-key");
		if (!key) return null;		
		db.collection('users').findOne({ sessionKey: key }, function(err, user){
			if (err){
				log.error(err, "/Auth");
				callback(null);
				return;
			};
			if (!user){
				callback(null);
				return;
			};
		
			var date = new Date();
			date = date.getTime();
			date = Math.floor(date/60000) * 60000;
			Auth.UpdateData(user, date);
			callback(user);
		});
	},		

	AuthByKey : function(key, user, date){
		if (key == user.sessionKey){
			if(user.lastAuthTime < date){
				Auth.RemoveSession(user);
				return false;
			};
			Auth.UpdateData(user, date);
			return true;
		};
		return false;
	},
	
	AuthByHash : function(userHash, user, date){
		var hashAlg = crypto.createHash('sha1');
		hashAlg.update(result.pass  + ' ' + date);
		var hashString = hashAlg.digest('hex');
		
		if (userHash == hashString){
			if(user.lastAuthTime >= date){
				Auth.UpdateData(user, date);
				return true;
			};
			user.sessionKey = "";
			for (var i = 0; i < 120; i++){
				user.sessionKey += Math.floor(Math.random(16)).toString(16);
			}
			Auth.UpdateData(user, date, user.sessionKey);
			return true;					
		};
		return false;
	},
	
	RemoveSession : function(user){
		db.collection('users').update({_id: user['_id']}, {$set: {sessionKey: null}});
	},
	
	
	UpdateData : function(user, date, sessionKey){
		var	obj = {$set: {lastAuthTime: date}};
		if (sessionKey){
			obj.sessionKey = sessionKey;
		};
		db.collection('users').update({_id: user['_id']}, obj);
	},
};

AuthRouter = {
	GET : function(context){
		var url = context.url;
		var login = url.query.login;
		var hash = url.query.hash;
		var key = url.query.key;
		
		db.collection('users').findOne({ login: login }, function(err, user){
			if (err){
				log.error(err, "/Auth");
				context.finish(500, err);
				return;
			};
			if (!user){
				context.finish(403, "User not found!");
				return;
			};
			
			var date = new Date();
			date = date.getTime();
			date = Math.floor(date/60000) * 60000;
			
			if (key){
				if (Auth.AuthByKey(key, user, date)){
					context.finish(200, "sessionkeyString");
				}
				else{
					context.finish(403, "Invalid session key!");	
				};
				return true;
			};
			
			if (userHash){
				if (Auth.AuthByHash(hash, user, date)){
					context.finish(200, user.sessionKey);
				}
				else{
					context.finish(403, "Invalid hash!");				
				};
			};			
			context.finish(403, "Invalid auth params");
			return;
		});
	}
};
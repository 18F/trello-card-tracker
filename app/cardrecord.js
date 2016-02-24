var TrelloSuper = require("./helpers.js");
var util = require('util');
var instadate = require("instadate");
var moment = require("moment");
var yaml = require('js-yaml');

function CardRecorder(yaml_file, board){
	TrelloSuper.call(this, yaml_file, board);
	this.Stages = this.getPreAward();
	classThis = this;
}

util.inherits(CardRecorder, TrelloSuper);

var method = CardRecorder.prototype;

method.run = function(){
	classThis = this;
	classThis.t.get('/1/boards/'+this.board+'/cards', {actions: ["createCard", "updateCard"]}, function(err, cards){
		if (err) {throw err};
		_un.each(cards, function(card){
			classThis.deleteCurrentComment(card["id"]);
			var now = moment();
			hasBeenUpdated = _un.findWhere(card["actions"], {type:"updateCard"});
			if ((now.diff(moment(card.actions[0].date), 'hours') < 24 ) || (!hasBeenUpdated)){
				console.log("recent");
				// classThis.findLastMoves(card["id"]);
			} else {
				console.log("new phase");
				 Q.all([classThis.getListNameByID(card["idList"]), classThis.findLastMoves(card["id"]), classThis.getLastList(card.actions[0]["id"])])
				 .then(function(values){
					 var phase = values[2];
				 	classThis.compileCommentArtifact(card["id"], values, phase);
				 });
			}
		});
	});
}

method.compileCommentArtifact = function(cardID, asyncValues, phase){
	console.log(asyncValues);
	var listName = asyncValues[0];
		var stage = _un.findWhere(classThis.Stages, {name: listName});
		var expectedTime = stage["expected_time"];
		var frmDate = asyncValues[1][0];
		var toDate = asyncValues[1][1];
		var diffArray = classThis.calculateDateDifference(expectedTime, frmDate, toDate);
		var differenceFromExpected = diffArray[0]
		var timeTaken = diffArray[1];
		var comment = classThis.buildComment(differenceFromExpected, expectedTime, frmDate, toDate, phase, timeTaken);
		console.log(comment);
		classThis.addComment(comment, cardID);

};


method.getLastList = function(updateListID){
	var deferred = Q.defer();
	this.t.get('/1/actions/'+updateListID, function(err, action){
		if(err) {deferred.reject(new Error(err));};
		console.log("get last list");
		console.log(action["data"]["listBefore"]);
		deferred.resolve(action["data"]["listBefore"]["name"]);
	});
	return deferred.promise;
}

method.deleteCurrentComment = function(cardID){
	classThis = this;
	this.t.get('/1/cards/'+cardID+'/actions', {filter:'commentCard'}, function(err, comments){
		_un.each(comments,function(c){
			if (c.data.text.indexOf("**Current Stage:**") != -1){
				var currentCommentID = c["id"];
			}
			if(currentCommentID){
				classThis.t.delete('/1/cards/'+cardID+'/actions/'+currentCommentID+'/comments', function(err, data){
					if (err) throw err;
				});
			}
		});
	});
}

method.addComment = function(message, cardID){
	this.t.post("1/cards/"+cardID+"/actions/comments", {text: message}, function(err, data){
		if (err) {throw err};
		// 	console.log("ordering");
	 });
}

method.calculateDateDifference = function(expected, lastMove, recentMove){
	var fromDate = new Date(lastMove);
	var toDate = new Date(recentMove);
	var diffDays = instadate.differenceInWorkDays(fromDate, toDate);
	return [diffDays - expected, diffDays]
}



method.findLastMoves = function(cardID){
	var deferred = Q.defer();
	this.t.get("/1/cards/"+cardID+"/actions", {"filter": ["updateCard","createCard"]}, function(err, actions){
		if(err) {deferred.reject(new Error(err));};
		updatedCards = _un.where(actions, {type: 'updateCard'});
		if (updatedCards > 1){
			var fromAction = updatedCards[1];
			var toAction = updateCards[0];
		} else {
			var fromAction = _un.findWhere(actions, {type:"createCard"});
			var toAction = _un.findWhere(actions, {type:"updateCard"});
		}
		deferred.resolve([fromAction["date"], toAction["date"]]); // From to To Date
	});
 return deferred.promise;
}


method.buildComment = function(dateDiff, expected, lastMove, recentMove, lastList, actual){
	fromDate = moment(lastMove).format("L");
	toDate = moment(recentMove).format("L");
	formatDiff = (dateDiff < 0)? "**"+dateDiff+" days**" :"`+"+dateDiff+" days`"
	msg = "**{l} Stage:** {d}. *{f} - {t}*.\n Expected days: {e} days. Actual Days spent: {a}."
		.supplant({l: lastList, d: formatDiff, e: expected, a: actual, f: fromDate, t: toDate });
	return msg;
}


module.exports = CardRecorder;

var TrelloSuper = require("./helpers.js");
var util = require('util');
var instadate = require("instadate");
var moment = require("moment");
var yaml = require('js-yaml');

function CardRecorder(yaml_file, board){
	TrelloSuper.call(this, yaml_file, board);
}

util.inherits(CardRecorder, TrelloSuper);

var method = CardRecorder.prototype;

method.run = function(){
	this.t.get('/1/boards/'+this.board+'/cards', {actions: ["createCard", "updateCard"]}, function(err, cards){
		if (err) {throw err};
		_un.each(cards, function(card){
			this.deleteCurrentComment(card["id"]);
			var now = moment();
			if (now.diff(moment(card.actions[0].date), 'hours') < 24 ){
				this.findLastMoves(card["id"]).then();
			} else {

			}
		});
	});
}

method.deleteCurrentComment = function(cardID){
	classThis = this;
	this.t.get('/1/cards/'+cardID+'/actions', {filter:'commentCard'}, function(err, comments){
		_un.each(comments,function(c){
			if (c.data.text.indexOf("**Current Stage:**") != -1){
				var currentCommentID = c["id"];
			}
		});
		if(currentCommentID){
			classThis.t.delete('/1/cards/'+cardID+'/actions/'+currentCommentID+'/comments', function(err, data){
				if (err) throw err;
			});
		}
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

// method.buildCurrentComment = function(){
//
// }

method.buildComment = function(dateDiff, expected, lastMove, recentMove, lastList, actual){
	fromDate = moment(lastMove).format("L");
	toDate = moment(recentMove).format("L");
	formatDiff = (dateDiff < 0)? "**"+dateDiff+" days**" :"`+"+dateDiff+" days`"
	msg = "**{l} Stage:** {d}. *{f} - {t}*.\n Expected days: {e} days. Actual Days spent: {a}."
		.supplant({l: lastList, d: formatDiff, e: expected, a: actual, f: fromDate, t: toDate });
	return msg;
}


module.exports = CardRecorder;

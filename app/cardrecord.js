var TrelloSuper = require("./helpers.js");
var util = require('util');
var instadate = require("instadate");
var moment = require("moment");
var yaml = require('js-yaml');

var classThis;
function CardRecorder(yaml_file, board){
	TrelloSuper.call(this, yaml_file, board);
	this.Stages = this.getPreAward();
	classThis = this;
}

util.inherits(CardRecorder, TrelloSuper);

var method = CardRecorder.prototype;

method.run = function(callback){
	this.getUpdateCards().then(function(cards){
		_un.each(cards, function(card) {
			classThis.deleteCurrentComment(card["id"]).then(function(d){
				var now = moment();
				var daysSinceUpdate = now.diff(moment(card.actions[0].date), 'days');
				hasMoved = classThis.hasMovedCheck(card["actions"]);
				if (hasMoved && daysSinceUpdate < 1) {
					console.log("Write New Phase: "+card["name"]);
					var lastPhase = classThis.getLastList(card.actions[0]);
					classThis.compileCommentArtifact(card["id"], lastPhase, lastPhase, card.actions[1].date, card.actions[0].date, callback, true);
				} else {
					console.log("Write Current Phase: "+card["name"]);
					classThis.getListNameByID(card["idList"]).then(function(listName){
							classThis.compileCommentArtifact(card["id"], listName, "Current", card.actions[0].date, now.format(), callback, true);
					});
				}
			});
		});
	});
}

method.getUpdateCards = function(callback){
	var deferred = Q.defer();
	classThis.t.get('/1/boards/'+this.board+'/cards', {actions: ["createCard", "updateCard"]}, function(err, cards){
		if (err) {
			return deferred.reject(err);
		}
		deferred.resolve(cards);
	});
	return deferred.promise;
};

method.deleteCurrentComment = function(cardID){
	var deferred = Q.defer();
	var currentCommentID = "";
	classThis.t.get('/1/cards/'+cardID+'/actions', {filter:'commentCard'}, function(err, comments){
		if(err) {
			return deferred.reject(new Error(err));
		}

		_un.each(comments,function(c){
			if (c.data.text.indexOf("**Current Stage:**") !== -1){
				currentCommentID = c["id"];
			}
		});

		if(currentCommentID != ""){
			classThis.t.del('/1/actions/'+currentCommentID, function(err, data){
				if(err) {
					deferred.reject(new Error(err));
				}
				return deferred.resolve(data);
			});
		} else {
			return deferred.resolve("no current comment");
		}
	});
	return deferred.promise;
}

method.hasMovedCheck = function(actionList){
	var updated = false;
	var updates = _un.where(actionList, {type:"updateCard"});
	if(updates.length > 0){
		moves = _un.filter(updates, function(a){ return 'listBefore' in a.data});
		if(moves.length > 0){
			updated = true;
		}
	}
	return updated;
}

method.getLastList = function(cardAction){
		return(cardAction["data"]["listBefore"]["name"]);
}

//Run function to build a comment
method.compileCommentArtifact = function(cardID, dateList, nameList, fromDate, toDate, callback, addComment){
		var stage = _un.findWhere(classThis.Stages, {name: dateList});
		var expectedTime = stage["expected_time"];
		var diffArray = this.calculateDateDifference(expectedTime, fromDate, toDate);
		var differenceFromExpected = diffArray[0];
		var timeTaken = diffArray[1];
		var comment = this.buildComment(differenceFromExpected, expectedTime, fromDate, toDate, nameList, timeTaken);
		if(addComment) {
			this.addComment(comment, cardID).then(callback);
		} else {
			callback(comment);
		};
}

method.calculateDateDifference = function(expected, lastMove, recentMove){
	var fromDate = new Date(lastMove);
	var toDate = new Date(recentMove);
	var diffDays = instadate.differenceInWorkDays(fromDate, toDate);
	return [diffDays - expected, diffDays];
}

method.buildComment = function(dateDiff, expected, lastMove, recentMove, lastList, actual){
	formatDiff = (dateDiff < 0)? "**"+dateDiff+" days**" :"`+"+dateDiff+" days`"
	msg = "**{l} Stage:** {d}. *{f} - {t}*.\n Expected days: {e} days. Actual Days spent: {a}."
		.supplant({l: lastList, d: formatDiff, e: expected, a: actual, f: moment(lastMove).format("L"), t: moment(recentMove).format("L")});
	return msg;
}

method.addComment = function(message, cardID){
	var deferred = Q.defer();
	this.t.post("1/cards/"+cardID+"/actions/comments", {text: message}, function(err, data){
		if (err) {
			return deferred.reject(err);
		}
		deferred.resolve(data);
	 });
	 return deferred.promise;
}

module.exports = CardRecorder;

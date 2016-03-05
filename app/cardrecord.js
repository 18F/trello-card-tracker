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
	this.getUpdateCards(function(card){
		classThis.deleteCurrentComment(card["id"]).done(function(d){
			var now = moment();
			var daysSinceUpdate = now.diff(moment(card.actions[0].date), 'days');
			hasMoved = classThis.hasMovedCheck(card["actions"]);
			if ((daysSinceUpdate > 0 ) || (!hasMoved)){
				console.log("Write Current Comment: "+card["name"]);
				classThis.getListNameByID(card["idList"])
					.then(function(listName){
						classThis.compileCommentArtifact(card["id"], listName, "Current", card.actions[0].date, now.format());
					});
			} else {
				console.log("Write New Phase: "+card["name"]);
				 Q.all([classThis.getListNameByID(card["idList"]), classThis.getLastList(card.actions[0]["id"])])
				 .then(function(lists){
					 var listName = lists[0];
					 var lastPhase = lists[1];
					classThis.compileCommentArtifact(card["id"], listName, lastPhase, lists, card.actions[1].date, card.actions[0].date);
				 });
			}
		});
	});
}

method.getUpdateCards = function(callback){
	classThis.t.get('/1/boards/'+this.board+'/cards', {actions: ["createCard", "updateCard"]}, function(err, cards){
		if (err) {throw err}
		_un.each(cards, function(card){
			callback(card);
		});
	});
}

method.deleteCurrentComment = function(cardID){
	var deferred = Q.defer();
	var currentCommentID = "";
	classThis.t.get('/1/cards/'+cardID+'/actions', {filter:'commentCard'}, function(err, comments){
		if(err) {deferred.reject(new Error(err));};
		_un.each(comments,function(c){
			if (c.data.text.indexOf("**Current Stage:**") !== -1){
				currentCommentID = c["id"];
			}
		});
		if(currentCommentID != ""){
			classThis.t.del('/1/actions/'+currentCommentID, function(err, data){
				if(err) { console.log(err);
					deferred.reject(new Error(err))};
				deferred.resolve(data);
			});
		} else {
			deferred.resolve("no current comment");
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


method.getLastList = function(updateActionID){
	var deferred = Q.defer();
	this.t.get('/1/actions/'+updateActionID, function(err, action){
		if(err) {deferred.reject(new Error(err))};
		deferred.resolve(action["data"]["listBefore"]["name"]);
	});
	return deferred.promise;
}

//Run function to build a comment
method.compileCommentArtifact = function(cardID, listName, phase, fromDate, toDate){
		var stage = _un.findWhere(classThis.Stages, {name: listName});
		var expectedTime = stage["expected_time"];
		var diffArray = classThis.calculateDateDifference(expectedTime, fromDate, toDate);
		var differenceFromExpected = diffArray[0];
		var timeTaken = diffArray[1];
		var comment = classThis.buildComment(differenceFromExpected, expectedTime, fromDate, toDate, phase, timeTaken);
		classThis.addComment(comment, cardID);
};

method.calculateDateDifference = function(expected, lastMove, recentMove){
	var fromDate = new Date(lastMove);
	var toDate = new Date(recentMove);
	var diffDays = instadate.differenceInWorkDays(fromDate, toDate);
	return [diffDays - expected, diffDays]
}

method.buildComment = function(dateDiff, expected, lastMove, recentMove, lastList, actual){
	formatDiff = (dateDiff < 0)? "**"+dateDiff+" days**" :"`+"+dateDiff+" days`"
	msg = "**{l} Stage:** {d}. *{f} - {t}*.\n Expected days: {e} days. Actual Days spent: {a}."
		.supplant({l: lastList, d: formatDiff, e: expected, a: actual, f: moment(lastMove).format("L"), t: moment(recentMove).format("L")});
	return msg;
}

method.addComment = function(message, cardID){
	this.t.post("1/cards/"+cardID+"/actions/comments", {text: message}, function(err, data){
		if (err) {throw err}
	 });
}

module.exports = CardRecorder;

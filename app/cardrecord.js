"use strict";
var TrelloSuper = require("./helpers.js");
var util = require('util');
var instadate = require("instadate");
var moment = require("moment");
var yaml = require('js-yaml');

class CardRecorder extends TrelloSuper{

	// var Stages = this.getPreAward();

	run(callback){
		this.getUpdateCards().then(function(cards){
			_un.each(cards, function(card) {
				this.deleteCurrentComment(card["id"]).then(function(d){
					var now = moment();
					var daysSinceUpdate = now.diff(moment(card.actions[0].date), 'days');
					hasMoved = this.hasMovedCheck(card["actions"]);
					if (hasMoved && daysSinceUpdate < 1) {
						console.log("Write New Phase: "+card["name"]);
						var lastPhase = this.getLastList(card.actions[0]);
						this.compileCommentArtifact(card["id"], lastPhase, lastPhase, card.actions[1].date, card.actions[0].date, true, callback);
					} else {
						console.log("Write Current Phase: "+card["name"]);
						this.getListNameByID(card["idList"]).then(function(listName){
								this.compileCommentArtifact(card["id"], listName, "Current", card.actions[0].date, now.format(), true, callback);
						});
					}
				});
			});
		});
	}

	getUpdateCards(callback){
  	var deferred = Q.defer();
  	this.t.get('/1/boards/'+this.board+'/cards', {actions: ["createCard", "updateCard"]}, function(err, cards){
  		if (err) {
  			return deferred.reject(err);
  		}
  		deferred.resolve(cards);
  	});
  	return deferred.promise;
  }

	deleteCurrentComment(cardID){
		var deferred = Q.defer();
		var currentCommentID = "";
		this.t.get('/1/cards/'+cardID+'/actions', {filter:'commentCard'}, function(err, comments){
			if(err) {
				return deferred.reject(new Error(err));
			}

			_un.each(comments,function(c){
				if (c.data.text.indexOf("**Current Stage:**") !== -1){
					currentCommentID = c["id"];
				}
			});

			if(currentCommentID != ""){
				this.t.del('/1/actions/'+currentCommentID, function(err, data){
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

	hasMovedCheck(actionList){
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

	getLastList(cardAction){
			return(cardAction["data"]["listBefore"]["name"]);
	}

  //Run function to build a comment
	compileCommentArtifact(cardID, dateList, nameList, fromDate, toDate, addCommentOpt, callback){
			var stage = _un.findWhere(this.Stages, {name: dateList});
			var expectedTime = stage["expected_time"];
			var diffArray = this.calculateDateDifference(expectedTime, fromDate, toDate);
			var differenceFromExpected = diffArray[0];
			var timeTaken = diffArray[1];
			var comment = this.buildComment(differenceFromExpected, expectedTime, fromDate, toDate, nameList, timeTaken);
			if(addCommentOpt) {
				this.addComment(comment, cardID).then(callback);
			} else {
				callback(comment);
			};
	}

	calculateDateDifference(expected, lastMove, recentMove){
		var fromDate = new Date(lastMove);
		var toDate = new Date(recentMove);
		var diffDays = instadate.differenceInWorkDays(fromDate, toDate);
		return [diffDays - expected, diffDays];
	}

	buildComment(dateDiff, expected, lastMove, recentMove, lastList, actual){
		formatDiff = (dateDiff < 0)? "**"+dateDiff+" days**" :"`+"+dateDiff+" days`"
		var fromDate = moment(lastMove).format("L");
		var toDate = moment(recentMove).format("L");
		return `**${lastList} Stage:** ${formatDiff}. *${fromDate} - ${toDate}*.\n Expected days: ${expected} days. Actual Days spent: ${actual}.`;
	}

	addComment(message, cardID){
		var deferred = Q.defer();
		this.t.post("1/cards/"+cardID+"/actions/comments", {text: message}, function(err, data){
			if (err) {
				return deferred.reject(err);
			}
			deferred.resolve(data);
		 });
		 return deferred.promise;
	}
}

module.exports = CardRecorder;

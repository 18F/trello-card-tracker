"use strict";

var instadate = require("instadate");
var yaml = require('js-yaml');
var moment = require("moment");
var fedHolidays = require('@18f/us-federal-holidays');
var Q = require('q');

var d = new Date();
var holidays = fedHolidays.allForYear(d.getFullYear());

var MyTrello = require("./my-trello.js");


class CardRecorder extends MyTrello {
    constructor(yaml_file, board) {
        super(yaml_file, board);
        this.stages = this.getPreAward();
    }

    run() {
        var self = this;
        var deferred = Q.defer();
        this.getUpdateCards().then(function(cards) {
            cards.forEach(function(card){
                var comments = card.actions.filter(function(action){
                  return action.type == 'commentCard';
                });
                self.deleteCurrentComment(comments).then(function(resp) {
                    var updateActions = card.actions.filter(function(action){
                      return action.type == 'updateCard';
                    });
                    var createAction = card.actions.filter(function(action){
                      return action.type =='createCard';
                    });
                    var now = moment();
                    var hasMoved = false;
                    var daysSinceUpdate = false;
                    if(updateActions.length > 0){
                      hasMoved = self.hasMovedCheck(updateActions);
                      daysSinceUpdate = now.diff(moment(updateActions[0].date), 'days');
                    }
                    var totDays = (comments.length > 0)? self.calcTotalDays(comments, now) : 0;
                    var lastMove = self.findLastMoveDateFromComments({commentList: comments, "actionList": updateActions, "createActionDate": createAction.date});
                    if (hasMoved && daysSinceUpdate < 1) {
                        var lastPhase = self.getLastList(hasMoved[0]);
                        self.compileCommentArtifact(
                            card.id,
                            lastPhase,
                            lastPhase,
                            lastMove,
                            updateActions[0].date,
                            true,
                            totDays
                        )
                        .then(deferred.resolve);
                    } else {
                        console.log("Write Current Phase: " + card.name);
                        self.getListNameByID(card.idList).then(function(listName) {
                            self.compileCommentArtifact(
                                card.id,
                                listName,
                                "Current",
                                lastMove,
                                now.format(),
                                true,
                                totDays
                            )
                        })
                        .then(deferred.resolve);
                    }
                });
            });
        })
        // .fail(function(err){console.log(err.stack)});
        return deferred.promise;
    }

    getUpdateCards() {
        var deferred = Q.defer();
        var url = '/1/boards/' + this.board + '/cards';

        this.t.get(url, { actions: ["createCard", "updateCard", "commentCard"] }, function(err, cards) {
            if (err) return deferred.reject(err);
            deferred.resolve(cards);
        });

        return deferred.promise;
    }

    deleteCurrentComment(comments) {
        var deferred = Q.defer(),
        currentCommentID = "",
        self = this;

        comments.forEach(function(c) {
            if (c.data.text.indexOf("**Current Stage:**") !== -1) {
                currentCommentID = c.id;
            }
        });

        if (currentCommentID !== "") {
            self.t.del('/1/actions/' + currentCommentID, function(err, data) {
                if (err) deferred.reject(new Error(err));
                deferred.resolve({"currentCommentDeleted": true});
            });
        } else {
            deferred.resolve({"currentCommentDeleted": false});
        }

        return deferred.promise;
    }

    checkCommentsForDates(commentList, latest){
      var myRegex = /(\d\d\/\d\d\/201\d) - \d\d\/\d\d\/201\d/; //Find the first date in the comment string
      if(!latest){
        // Reverse order to get first comment but create a shallow copy to not break integration
        commentList = commentList.slice(0).reverse();
      }
      var correctComment = commentList.find(function(comment){
          var match = myRegex.exec(comment.data.text);
          return match ? true : false;
      });
      if(correctComment){
        var commentDateMatch = myRegex.exec(correctComment.data.text);
        var commentDate = commentDateMatch[1];
        var commMoment = moment(commentDate, "MM/DD/YYYY").toISOString();
        return commMoment;
      } else {
        return false;
      }
    }

    findLastMoveDateFromComments(opts){
      var actionList = opts.actionList;
      var cardCreationDate = opts.cardCreationDate;
      var commentList = opts.commentList;
      var correctComment = false;
      if(commentList){
        var correctComment = this.checkCommentsForDates(commentList, true);
      }
      if(correctComment){
        return correctComment;
      } else if(actionList) {
        if(actionList.length > 1){
        return actionList[0].date;
        }
      } else {
        if(opts.cardCreationDate){
          return cardCreationDate;
        } else {
          return moment("01/01/2016", "MM/DD/YYYY").toISOString();
        }
      }
    }

    hasMovedCheck(actionList) {
        var updated = false;
        var moves = actionList.filter(function(a) {
            return 'listBefore' in a.data;
        });
        if (moves.length) updated = moves;
        return updated;
    }

    getLastList(cardAction) {
        return cardAction.data.listBefore.name;
    }

    calcTotalDays(commentList, nowMoment){
        var firstDate = this.checkCommentsForDates(commentList, false);
        if(firstDate){
          var dayDif = this.calculateDateDifference(10, firstDate, nowMoment)
          //expected not actually needed, in the future could say total days expected
          return dayDif[1];
        } else {
          return 0;
        }

    }

    compileCommentArtifact(cardID, dateList, nameList, fromDate, toDate, addCommentOpt, totDays) {
        var deferred = Q.defer();
        var stage = this.stages.find(function(stage){
          return stage.name == dateList;
        });
        var expectedTime = stage.expected_time;
        var diffArray = this.calculateDateDifference(expectedTime, fromDate, toDate);
        var differenceFromExpected = diffArray[0];
        var timeTaken = diffArray[1];
        var comment = this.buildComment(differenceFromExpected, expectedTime, fromDate, toDate, nameList, timeTaken, totDays);
        if (addCommentOpt) {
            this.addComment(comment, cardID).then(function(resp){deferred.resolve(resp)});
        } else {
            deferred.resolve(comment);
        }
        return deferred.promise;
    }

    findHolidaysBetweenDates(fromDate, toDate){
      var count = 0;
      holidays.forEach(function(holiday){
        if(moment(holiday.date.toISOString(), ["YYYY-M-D", "YYYY-MM-DD", "YYYY-MM-D", "YYYY-M-DD"]).isBetween(fromDate, toDate, 'day')){
          count++;
        }
      });
      return count;
    }

    calculateDateDifference(expected, lastMove, recentMove) {
        var fromDate = new Date(lastMove);
        var toDate = new Date(recentMove);
        var diffDays = instadate.differenceInWorkDays(fromDate, toDate);
        var diffDays = diffDays - this.findHolidaysBetweenDates(fromDate, toDate);
        return [diffDays - expected, diffDays];
    }

    buildComment(dateDiff, expected, lastMove, recentMove, lastList, actual, totalDays) {
        var formatDiff = (dateDiff < 0) ? "**" + dateDiff + " days**" : "`+" + dateDiff + " days`";
        var fromDate = moment(lastMove).format("L");
        var toDate = moment(recentMove).format("L");
        return `**${lastList} Stage:** ${formatDiff}. *${fromDate} - ${toDate}*.\n Expected days: ${expected} days. Actual Days spent: ${actual}. **Total Project Days: ${totalDays}**`;
    }

    addComment(message, cardID) {
        var deferred = Q.defer();
        var url = "1/cards/" + cardID + "/actions/comments";

        this.t.post(url, { text: message }, function(err, data) {
            if (err) return deferred.reject(err);
            deferred.resolve(data);
        });

        return deferred.promise;
    }
}


module.exports = CardRecorder;

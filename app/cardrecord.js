"use strict";
var yaml = require('js-yaml');
var Q = require('q');
var moment = require("moment");

var DateCommentHelpers = require("./date-comment-helpers.js");
var DCH = new DateCommentHelpers();
var MyTrello = require("./my-trello.js");

class CardRecorder extends MyTrello {
    constructor(yaml_file, board) {
        super(yaml_file, board);
        this.stages = this.getPreAward();
    }

    run() {
        var self = this,
            deferred = Q.defer();

        self.getCards().then(function(cards) {
          Q.all(cards.map(function(card) {
            return self.cardRecordFunctions(card);
          })).then(deferred.resolve)
        }).catch(function(err) {
          deferred.reject(err);
        })

        return deferred.promise;
      //.fail(function(err){console.log(err.stack)});
    }

    getCards() {
        var deferred = Q.defer();
        var url = '/1/boards/' + this.board + '/cards';

        this.t.get(url, { actions: ["createCard", "updateCard", "commentCard"] }, function(err, cards) {
            if (err) return deferred.reject(err);
            deferred.resolve(cards);
        });

        return deferred.promise;
    }

    cardRecordFunctions(card){
      var self = this,
          deferred = Q.defer();
      var cardActions = self.cardFilters(card.actions, [{"name": "comments", "type": "commentCard"}, {"name": "updates", "type": "updateCard"}, {"name": "created", "type": "createCard"}]);
      self.deleteCurrentComment(cardActions.comments)
      .then(function(resp) {
          var now = moment();
          var hasMoved = false;
          var daysSinceUpdate = false;
          if(cardActions.updates.length > 0){
            hasMoved = DCH.hasMovedCheck(cardActions.updates);
            daysSinceUpdate = now.diff(moment(cardActions.updates[0].date), 'days');
          }
          var totDays = (cardActions.comments.length > 0)? DCH.calcTotalDays(cardActions.comments, now) : 0;
          var prevMove = DCH.findPrevMoveDateFromComments({commentList: cardActions.comments, "actionList": cardActions.updates, "createActionDate": cardActions.created.date});
          self.inFinalList(card.idList)
          .then(function(finalList){
            self.decideCommentType(card,
              finalList,
              daysSinceUpdate,
              hasMoved,
              prevMove,
              cardActions.updates,
              totDays,
              now)
            .then(function(resp){deferred.resolve(resp);})
            .catch(deferred.reject)
          })
          // .catch(function(err){console.log(err.stack);
          // deferred.reject(err);});
      });
    return deferred.promise;
    }

    cardFilters(cardActions, actionTypeArray){
      var actions = {};
      actionTypeArray.forEach(function(actionType){
        actions[actionType.name] = cardActions.filter(function(action){
          return action.type == actionType.type;
        });
      });
      return actions;
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

    inFinalList(listID){
      var deferred = Q.defer();
      var self = this;
      self.getListNameByID(listID).then(function(listName){
          var lastList = false;
          var lastStage = self.stages[self.stages.length - 1].name;
        if (listName == lastStage){
          lastList = true;
        }
        deferred.resolve(lastList);
      });
      return deferred.promise;
    }

    getPreviousList(cardAction) {
        return cardAction.data.listBefore.name;
    }

    decideCommentType(card, finalList, daysSinceUpdate, hasMoved, prevMove, updateActions, totalDays, nowMoment){
      var self = this;
      var deferred = Q.defer();
      if (finalList && daysSinceUpdate > 1){
        deferred.resolve({"final phase": true});
      } else if (hasMoved && daysSinceUpdate < 1) {
        console.log("Write New Phase: " + card.name);
          var prevPhase = self.getPreviousList(hasMoved[0]);
          self.compileCommentArtifact(
              card.id,
              prevPhase,
              prevPhase,
              prevMove,
              updateActions[0].date,
              true,
              totalDays
          )
          .then(function(resp){deferred.resolve(resp);});
      } else {
          console.log("Write Current Phase: " + card.name);
          self.getListNameByID(card.idList).then(function(listName) {
              self.compileCommentArtifact(
                  card.id,
                  listName,
                  "Current",
                  prevMove,
                  nowMoment.format(),
                  true,
                  totalDays
              )
          })
          .then(function(resp){deferred.resolve(resp);});
      }
      return deferred.promise;
    }

    compileCommentArtifact(cardID, dateList, nameList, fromDate, toDate, addCommentOpt, totDays) {
        var deferred = Q.defer();
        var stage = this.stages.find(function(stage){
          return stage.name == dateList;
        });
        var expectedTime = stage.expected_time;
        var diffArray = DCH.calculateDateDifference(expectedTime, fromDate, toDate);
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

    buildComment(dateDiff, expected, prevMove, recentMove, lastList, actual, totalDays) {
        var formatDiff = (dateDiff < 0) ? "**" + dateDiff + " days**" : "`+" + dateDiff + " days`";
        var fromDate = moment(prevMove).format("L");
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

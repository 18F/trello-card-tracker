"use strict";

var instadate = require("instadate");
var yaml = require('js-yaml');
var moment = require("moment");
var Q = require('q');
var _ = require("underscore");

var MyTrello = require("./my-trello.js");
require('./utils.js');


class CardRecorder extends MyTrello {
    constructor(yaml_file, board) {
        super(yaml_file, board);
        this.stages = this.getPreAward();
    }

    run(callback) {
        var self = this;

        this.getUpdateCards().then(function(cards) {
            _.each(cards, function(card) {
                self.deleteCurrentComment(card.id).then(function(d) {
                    var now = moment();
                    var daysSinceUpdate = now.diff(moment(card.actions[0].date), 'days');
                    var hasMoved = self.hasMovedCheck(card.actions);

                    if (hasMoved && daysSinceUpdate < 1) {
                        console.log("Write New Phase: " + card.name);
                        var lastPhase = self.getLastList(card.actions[0]);
                        self.compileCommentArtifact(
                            card.id,
                            lastPhase,
                            lastPhase,
                            card.actions[1].date,
                            card.actions[0].date,
                            true,
                            callback
                        );
                    } else {
                        console.log("Write Current Phase: " + card.name);
                        self.getListNameByID(card.idList).then(function(listName) {
                            self.compileCommentArtifact(
                                card.id,
                                listName,
                                "Current",
                                card.actions[0].date,
                                now.format(),
                                true,
                                callback
                            );
                        });
                    }
                });
            });
        });
    }

    getUpdateCards(callback) {
        var deferred = Q.defer();
        var url = '/1/boards/' + this.board + '/cards';

        this.t.get(url, { actions: ["createCard", "updateCard"] }, function(err, cards) {
            if (err) return deferred.reject(err);
            deferred.resolve(cards);
        });

        return deferred.promise;
    }

    deleteCurrentComment(cardID) {
        var deferred = Q.defer();

        var currentCommentID = "",
            url = '/1/cards/' + cardID + '/actions',
            self = this;

        this.t.get(url, { filter: 'commentCard' }, function(err, comments) {
            if (err) return deferred.reject(new Error(err));

            _.each(comments, function(c) {
                if (c.data.text.indexOf("**Current Stage:**") !== -1) {
                    currentCommentID = c.id;
                }
            });

            if (currentCommentID !== "") {
                self.t.del('/1/actions/' + currentCommentID, function(err, data) {
                    if (err) deferred.reject(new Error(err));
                    return deferred.resolve(data);
                });
            } else {
                return deferred.resolve("no current comment");
            }
        });

        return deferred.promise;
    }

    hasMovedCheck(actionList) {
        var updated = false;
        var updates = _.where(actionList, { type: "updateCard" });
        if (updates.length > 0) {
            var moves = _.filter(updates, function(a) {
                return 'listBefore' in a.data;
            });
            if (moves.length) updated = true;
        }
        return updated;
    }

    getLastList(cardAction) {
        return cardAction.data.listBefore.name;
    }

    compileCommentArtifact(cardID, dateList, nameList, fromDate, toDate, addCommentOpt, callback) {
        var stage = _.findWhere(this.stages, { name: dateList });
        var expectedTime = stage.expected_time;
        var diffArray = this.calculateDateDifference(expectedTime, fromDate, toDate);
        var differenceFromExpected = diffArray[0];
        var timeTaken = diffArray[1];
        var comment = this.buildComment(differenceFromExpected, expectedTime, fromDate, toDate, nameList, timeTaken);
        
        if (addCommentOpt) {
            this.addComment(comment, cardID).then(callback);
        } else {
            callback(comment);
        }
    }

    calculateDateDifference(expected, lastMove, recentMove) {
        var fromDate = new Date(lastMove);
        var toDate = new Date(recentMove);
        var diffDays = instadate.differenceInWorkDays(fromDate, toDate);
        return [diffDays - expected, diffDays];
    }

    buildComment(dateDiff, expected, lastMove, recentMove, lastList, actual) {
        var formatDiff = (dateDiff < 0) ? "**" + dateDiff + " days**" : "`+" + dateDiff + " days`";
        var msg = "**{l} Stage:** {d}. *{f} - {t}*.\n Expected days: {e} days. Actual Days spent: {a}.".supplant({
            l: lastList,
            d: formatDiff,
            e: expected,
            a: actual,
            f: moment(lastMove).format("L"),
            t: moment(recentMove).format("L")
        });
        return msg;
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

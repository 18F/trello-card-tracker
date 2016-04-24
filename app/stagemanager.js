"use strict";

var Q = require('q');
var _ = require("underscore");
var util = require('util');

var MyTrello = require("./my-trello.js");


class StageManager extends MyTrello {
    constructor(yaml_file, board) {
        super(yaml_file, board);
        this.stages = this.getPreAward();
    }

    run() {
        var deferred = Q.defer();

        this.getStageandBoard()
            .then(this.checkLists)
            .then(this.makeAdditionalLists)
            .then(this.getStageandBoard().then(this.closeUnusedStages))
            .then(this.getStageandBoard().then(this.orderLists))
            .then(function() { deferred.resolve("complete"); })
            .catch(function(e) { deferred.reject(e); });

        return deferred.promise;
    }

    getStageandBoard() {
        var deferred = Q.defer();
        var self = this;

        this.t.get(this.lists_url, function(err, data) {
        if (err) deferred.reject(new Error(err));
            deferred.resolve([self.stages, data]);
        });

        return deferred.promise;
    }

    checkLists(data) {
        var checked = [];
        var lists = _.pluck(data[1], 'name');

        _.each(data[0], function(stage) {
            checked.push({
                stage: stage.name,
                built: _.contains(lists, stage.name)
            });
        });

        return checked;
    }

    makeAdditionalLists(checkedList) {
        var deferred = Q.defer();

        var all = [],
            newLists = [],
            self = this;

        _.each(checkedList, function(list, i) {
            var listDefer = Q.defer();
            all.push(listDefer.promise);

            if (!list.built) {
                var postList = {
                    name: list.stage,
                    idBoard: self.board,
                    pos: i + 1
                };
                self.t.post("1/lists", postList, function(err, data) {
                    if (err) listDefer.reject(err);
                    newLists.push(data);
                    listDefer.resolve();
                });
            }
        });

        Q.all(all).then(function() {
            deferred.resolve(newLists);
        }).catch(function(e) {
            deferred.reject(e);
        });

        return deferred.promise;
    }

    closeUnusedStages(data) {
      var deferred = Q.defer();
        var stages = _.pluck(data[0], 'name'),
            self = this;

        _.each(data[1], function(trelloList) {
            if (!(_.contains(stages, trelloList.name))) {
                self.getListCards(trelloList.id)
                .then(function(d) {
                    self.closeList(d, trelloList.id).then(deferred.resolve);
                })
                .catch(deferred.reject);

            };
        });
      return deferred.promise;
    }

    getListCards(trelloID) {
        var deferred = Q.defer();
        this.t.get("/1/lists/" + trelloID + "/cards", function(err, data) {
          if (err) return deferred.reject(err);
          deferred.resolve(data);
        });
        return deferred.promise;
    }

    closeList(listData, trelloListID) {
        var deferred = Q.defer();
        if (!listData.length || listData.length) {
            var url = "/1/list/" + trelloListID + "/closed";
            this.t.put(url, { value: true }, function(err, data) {
              if (err) return deferred.reject(err);
              deferred.resolve(data);
            });
        }
        return deferred.promise;
    }

    orderLists(data) {
        var position = 0,
            self = this;

        _.each(data[0], function(stage, i) {
            var appropriateList = _.findWhere(data[1], { name: stage.name });
            if (appropriateList) {
                var url = "1/lists/" + appropriateList.id + "/pos";
                self.t.put(url, { value: position }, function(e, data) {
                    if (e) throw e;
                });
                position++;
            }
        });
    }
}


module.exports = StageManager;

"use strict";

var Q = require('q');
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
        var lists = data[1].map(value => value['name']);

        data[0].forEach(function(stage) {
            checked.push({
                stage: stage.name,
                built: lists.includes(stage.name)
            });
        });

        return checked;
    }

    makeAdditionalLists(checkedList) {
        var deferred = Q.defer();

        var all = [],
            newLists = [],
            self = this;

        checkedList.forEach(function(list, i) {
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
        var stages = data[0].map(value => value['name']),
            self = this;

        data[1].forEach(function(trelloList) {
            if (!(stages.includes(trelloList.name))) {
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
        data[0].forEach(function(stage, i) {
            var appropriateList = data[1].find(function(list){
              return list.name == stage.name;
            });
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

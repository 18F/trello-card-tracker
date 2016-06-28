"use strict";

var Q = require('q');
var util = require('util');
var MyTrello = require("./my-trello.js");

var self;
class StageManager extends MyTrello {
    constructor(yaml_file, board) {
        super(yaml_file, board);
        this.stages = this.getPreAward();
        self = this;
    }

    run() {
        var deferred = Q.defer();
        var self = this;

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

        self.t.get(self.lists_url, function(err, data) {
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
        var deferred = Q.defer(),
            all = [],
            newLists = [];

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
      var deferred = Q.defer(),
          stages = data[0].map(value => value['name']),
          self = this,
          closing = [];

        data[1].forEach(function(trelloList) {
          var listDefer = Q.defer();
          closing.push(listDefer.promise);
            if (!(stages.includes(trelloList.name))) {
                self.getListCards(trelloList.id)
                .then(function(d) {
                    self.closeList(d, trelloList.id).then(listDefer.resolve);
                })
                .catch(listDefer.reject);
            };
        });

        Q.all(closing).then(function() {
            deferred.resolve();
        })
        .catch(function(e) {
            deferred.reject(e);
        });
        return deferred.promise;
    }

    getListCards(trelloID) {
        var deferred = Q.defer();
        self.t.get("/1/lists/" + trelloID + "/cards", function(err, data) {
          if (err) return deferred.reject(err);
          deferred.resolve(data);
        });
        return deferred.promise;
    }

    closeList(listData, trelloListID) {
        var deferred = Q.defer();
        if (!listData.length || listData.length) {
            var url = "/1/list/" + trelloListID + "/closed";
            self.t.put(url, { value: true }, function(err, data) {
              if (err) return deferred.reject(err);
              deferred.resolve(data);
            });
        }
        return deferred.promise;
    }

    orderLists(data) {
      var deferred = Q.defer(),
          position = 0,
          ordering = [];

        data[0].forEach(function(stage, i) {
          var stageDefer = Q.defer();
          ordering.push(stageDefer.promise);
            var appropriateList = data[1].find(function(list){
              return list.name == stage.name;
            });
            if (appropriateList) {
                var url = "1/lists/" + appropriateList.id + "/pos";
                self.t.put(url, { value: position }, function(err, data) {
                  if (err) stageDefer.reject(err);
                  stageDefer.resolve();
                });
                position++;
            }
        });
        promiseWaterfall(ordering).then(function() {
            deferred.resolve(newLists);
        }).catch(function(e) {
            deferred.reject(e);
        });

        return deferred.promise;
    }
}

function promiseWaterfall(tasks) {
    var finalTaskPromise = tasks.reduce(function(prevTaskPromise, task) {
        return prevTaskPromise.then(task);
    });  // initial value

    return finalTaskPromise;
}


module.exports = StageManager;

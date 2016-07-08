'use strict';

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
      .then(() => { deferred.resolve('complete'); })
      .catch(e => { deferred.reject(e); });

    return deferred.promise;
  }

  getStageandBoard() {
    const deferred = Q.defer();
    const self = this;

        self.t.get(self.lists_url, function(err, data) {
        if (err) deferred.reject(new Error(err));
            deferred.resolve([self.stages, data]);
        });

    return deferred.promise;
  }

  checkLists(data) {
    const checked = [];
    const lists = data[1].map(value => value.name);

    data[0].forEach(stage => {
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
        const postList = {
          name: list.stage,
          idBoard: self.board,
          pos: i + 1
        };
        self.t.post('1/lists', postList, (err, data) => {
          if (err) {
            listDefer.reject(err);
          } else {
            newLists.push(data);
            listDefer.resolve();
          }
        });
      }
    });

        return Q.all(all);
    }

    closeUnusedStages(data) {
      var deferred = Q.defer(),
          stages = data[0].map(value => value['name']),
          closing = [];

        data[1].forEach(function(trelloList) {
            if (!(stages.includes(trelloList.name))) {
              var listDefer = Q.defer();
              closing.push(listDefer.promise);
                self.getListCards(trelloList.id)
                .then(function(d) {
                  return self.closeList(d, trelloList.id);
                })
                .then(listDefer.resolve)
                .catch(listDefer.reject);
            }
        });

        return Q.all(closing);
    }

    getListCards(trelloID) {
        var deferred = Q.defer(),
            self = this;
        self.t.get("/1/lists/" + trelloID + "/cards", function(err, data) {
          if (err) return deferred.reject(err);
          deferred.resolve(data);
        });
        return deferred.promise;
    }

    closeList(listData, trelloListID) {
        var deferred = Q.defer();
        console.log(listData);
        if (!listData.length || listData.length == 0) {
            var url = "/1/list/" + trelloListID + "/closed";
            self.t.put(url, { value: true }, function(err, data) {
              if (err) return deferred.reject(err);
              deferred.resolve(data);
            });
        } else {
          deferred.resolve("no list to close");
        }
        return deferred.promise;
    }

    orderLists(data) {
      var sequencedPromise = Q(),
          position = 0;

      data[0].forEach(function(stage, i) {
        var appropriateList = data[1].find(function(list){
          return list.name == stage.name;
        });
        if (appropriateList) {
          sequencedPromise = sequencedPromise.then(function() {
            var stageDefer = Q.defer();
            var url = "1/lists/" + appropriateList.id + "/pos";
            self.t.put(url, { value: position }, function(err, data) {
              if (err) stageDefer.reject(err);
              stageDefer.resolve();
            });
            position++;
            return stageDefer;
          });
        }
      });
      return sequencedPromise;
    }
}

module.exports = StageManager;

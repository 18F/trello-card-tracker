'use strict';

const Q = require('q');
const MyTrello = require('./my-trello.js');

class StageManager extends MyTrello {
  constructor(yamlFile, board) {
    super(yamlFile, board);
    this.stages = this.getPreAward();
  }

  run() {
    const deferred = Q.defer();

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

    this.t.get(this.lists_url, (err, data) => {
      if (err) {
        deferred.reject(new Error(err));
      } else {
        deferred.resolve([self.stages, data]);
      }
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
    const deferred = Q.defer();

    const all = [];
    const newLists = [];
    const self = this;

    checkedList.forEach((list, i) => {
      const listDefer = Q.defer();
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

    Q.all(all).then(() => {
      deferred.resolve(newLists);
    }).catch(e => {
      deferred.reject(e);
    });

    return deferred.promise;
  }

  closeUnusedStages(data) {
    const deferred = Q.defer();
    const stages = data[0].map(value => value.name);
    const self = this;

    data[1].forEach(trelloList => {
      if (!(stages.includes(trelloList.name))) {
        self.getListCards(trelloList.id)
          .then(d => {
            self.closeList(d, trelloList.id).then(deferred.resolve);
          })
          .catch(deferred.reject);
      }
    });

    return deferred.promise;
  }

  getListCards(trelloID) {
    const deferred = Q.defer();
    this.t.get(`/1/lists/${trelloID}/cards`, (err, data) => {
      if (err) {
        deferred.reject(err);
      } else {
        deferred.resolve(data);
      }
    });
    return deferred.promise;
  }

  closeList(listData, trelloListID) {
    const deferred = Q.defer();
    if (!listData.length || listData.length) {
      const url = `/1/list/${trelloListID}/closed`;
      this.t.put(url, { value: true }, (err, data) => {
        if (err) {
          deferred.reject(err);
        } else {
          deferred.resolve(data);
        }
      });
    }
    return deferred.promise;
  }

  orderLists(data) {
    let position = 0;
    const self = this;

    data[0].forEach(stage => {
      const appropriateList = data[1].find(list => list.name === stage.name);
      if (appropriateList) {
        const url = `1/lists/${appropriateList.id}/pos`;
        self.t.put(url, { value: position }, e => {
          if (e) {
            throw e;
          }
        });
        position++;
      }
    });
  }
}


module.exports = StageManager;

'use strict';

const Q = require('q');
const MyTrello = require('./my-trello.js');
let self;

class StageManager extends MyTrello {
  constructor(yamlFile, board) {
    super(yamlFile, board);
    this.stages = this.getPreAward();
    self = this;
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
    // const self = this;

    self.t.get(self.lists_url, (err, data) => {
      if (err) {
        return deferred.reject(new Error(err));
      }
      return deferred.resolve([self.stages, data]);
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
    const all = [];
    const newLists = [];

    checkedList.forEach((list, i) => {
      if (!list.built) {
        const listDefer = Q.defer();
        all.push(listDefer.promise);

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
    const stages = data[0].map(value => value.name);
    const closing = [];

    data[1].forEach(trelloList => {
      if (!(stages.includes(trelloList.name))) {
        const listDefer = Q.defer();
        closing.push(listDefer.promise);
        self.getListCards(trelloList.id)
          .then(d => self.closeList(d, trelloList.id))
          .then(listDefer.resolve)
          .catch(listDefer.reject);
      }
    });

    return Q.all(closing);
  }

  getListCards(trelloID) {
    const deferred = Q.defer();
    self.t.get(`/1/lists/${trelloID}/cards`, (err, data) => {
      if (err) {
        return deferred.reject(err);
      }
      return deferred.resolve(data);
    });
    return deferred.promise;
  }

  closeList(listData, trelloListID) {
    const deferred = Q.defer();
    console.log(listData);
    if (!listData.length || listData.length === 0) {
      const url = `/1/list/${trelloListID}/closed`;
      self.t.put(url, { value: true }, (err, data) => {
        if (err) {
          return deferred.reject(err);
        }
        return deferred.resolve(data);
      });
    } else {
      deferred.resolve('no list to close');
    }
    return deferred.promise;
  }

  orderLists(data) {
    let sequencedPromise = new Q();
    let position = 0;

    data[0].forEach(stage => {
      const appropriateList = data[1].find(list =>
        list.name === stage.name
      );
      if (appropriateList) {
        sequencedPromise = sequencedPromise.then(() => {
          const stageDefer = Q.defer();
          const url = `1/lists/${appropriateList.id}/pos`;
          self.t.put(url, { value: position }, err => {
            if (err) {
              return stageDefer.reject(err);
            }
            return stageDefer.resolve();
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

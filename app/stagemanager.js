'use strict';

const Q = require('q');
const MyTrello = require('./my-trello.js');
let self;

/**
  The StageManager class handles the initial setup
  of a board for use as an ADS BPA tracker, based
  on the configuration YAML file.
*/
class StageManager extends MyTrello {

  /**
    Create a StageManager instance.
    @param  {string} yamlFile - The path to the YAML config file.
    @param  {string} board - Trello board ID of the board to use.
  */
  constructor(yamlFile, board) {
    super(yamlFile, board);
    this.stages = this.getPreAward();
    self = this;
  }

  /**
    Run the stage manager
    @return {Promise<string|Error>} A promise that resolves with
      the string "complete" or rejects with an error.
  */
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

  /**
    Get the pre-award stages from configuration and the associated
    lists from Trello.
    @return {Promise<Array|Error>} A promise that resolves with an
      array containing the configured stages as its first element
      and the Trello lists as its second element, or rejects with
      an error.
  */
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

  /**
    Gets an array of list objects based on the configuration,
    indicating whether the config list is present in Trello.
    @param {Array} data - The resolved value from
      [getStageandBoard]{@link StageManager#getStageandBoard}.
    @return {Array} An array of list objects, each with two
      properties: stage (the pre-award stage name) and build
      (a boolean indicating whether a list by the same name
      exists in Trello).
  */
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

  /**
    Create any missing Trello lists, based on the results
    of [checkLists]{@link StageManager#checkLists}.
    @param {Array} checkedList - The array of list objects
      return by [checkLists]{@link StageManager#checkLists}.
    @return {Promise<undefined,Error>} A promise that resolves
      with no value if all of the missing lists were created,
      or rejects with an error.
  */
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

  /**
    Close Trello lists that do not correspond to a configured
    pre-award stage.
    @param {Array} data - The resolved value from
      [getStageandBoard]{@link StageManager#getStageandBoard}.
    @return {Promise<undefined|Error>} A promise that resolves
      with no value if all of the extraneous lists are closed,
      or rejects with an error.
  */
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

  /**
    Get the cards from a Trello list by the list ID.
    @param {string} trelloID - The ID of the Trello list
      to get cards from.
    @return {Promise<Array|Error>} A promise that resolves with
      an array of Trello card objects or rejects with an error.
  */
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

  /**
    Close a Trello list by list ID, if it has no cards.
    @param {Array} listData - The list of cards contained
      in the list, from [getListCards]{@link StageManager#getListCards}.
    @param {string} trelloListID - The ID of the list to close.
    @return {Promise<Object|string|Error>} A promise that resolves
      with the object resulting from closing the list or a string
      message indicating that the list did not need to be closed
      (e.g., the list has cards); or rejects with an error.
  */
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

  /**
    Put Trello lists in order according to their order in
    the configuration file.
    @param {Array} data - The resolved value from
      [getStageandBoard]{@link StageManager#getStageandBoard}.
    @return {Promise<undefined|Error>} A promise that resolves
      with no value if everything goes okay, or rejects with
      an error.
  */
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

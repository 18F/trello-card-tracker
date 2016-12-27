'use strict';

const Q = require('q');
const moment = require('moment');

const DateCommentHelpers = require('./date-comment-helpers.js');
const DCH = new DateCommentHelpers();
const MyTrello = require('./my-trello.js');

class CardRecorder extends MyTrello {
  /**
   * A child  instance of MyTrello Class that creates an instance of the card recorder to track where the trello card has been.
   * @param {String} yamlFile - A file for the number of stages to be referenced for names and lengths of the process.
   * @param {String} board - The ID of the trello board.
   */
  constructor(yamlFile, board) {
    super(yamlFile, board);
    this.stages = this.getPreAward();
  }

  /**
   * Runs the class functions for a given board.
   */
  run() {
    const self = this;
    return self.getCards().then(cards =>
      Q.all(cards.map(card => self.cardRecordFunctions(card)))
    );
  }

  /**
   * Promise function that gets the existing cards from a trello board
   * @return deferred.promise of the cards or a fetch error
   */
  getCards() {
    const deferred = Q.defer();
    const url = `/1/boards/${this.board}/cards`;

    this.t.get(url, { actions: ['createCard', 'updateCard', 'commentCard'] }, (err, cards) => {
      if (err) {
        return deferred.reject(err);
      }
      return deferred.resolve(cards);
    });

    return deferred.promise;
  }

  /**
   * A promise wrapper function to delete comments and then write a new comment on the card
   * @param {Object} card - An object with all the information for a given trello card
   * @return deferred.promise of a response from writing a coment to  a card or rejecting a fetch error
   */
  cardRecordFunctions(card) {
    const self = this;
    const deferred = Q.defer();
    const cardActions = self.cardFilters(card.actions, [{ name: 'comments', type: 'commentCard' }, { name: 'updates', type: 'updateCard' }, { name: 'created', type: 'createCard' }]);
    const now = moment();
    const recentlyMoved = self.checkRecentMove(cardActions.updates, now);
    self.inFinalList(card.idList)
    .then(finalList => {
      if (finalList && !recentlyMoved) {
        deferred.resolve({ 'final phase': true });
      }
      self.deleteCurrentComment(cardActions.comments)
         .then(deletedComment => {
           const commentListName = cardActions.comments[0].data.list.name;
           const commentStats = self.generateNewCommentStats(cardActions.comments, deletedComment.currentCommentDeleted, now, commentListName);
           const comment = self.buildComment(recentlyMoved, commentListName, commentStats);
           self.addComment(comment, card.id)
           .then(resp => {
             deferred.resolve(resp);
           })
           .catch(deferred.reject);
         });
    });
    return deferred.promise;
  }

  /**
   * Sorts the action of a card into another object sorted by action type specified in the actionTypeArray
   * @param {Array} cardActions - An array of the action object that has occurred for the card.
   * @param {Array} actionTypeArray - An array of objects with the keys 'name' and 'type' for each action type to sort
   * @return {Object} an object of the card objects by action type
   */
  cardFilters(cardActions, actionTypeArray) {
    const actions = {};
    actionTypeArray.forEach(actionType => {
      actions[actionType.name] = cardActions.filter(action =>
        action.type === actionType.type
      );
    });
    return actions;
  }

  /**
   * Check if a particular card has moved in the past day
   * @param {Array} updates - An array of objects of when the card's update actions
   * @param {Object} currentTime - A moment object for the current time
   * @return {Boolean} true - if the card has moved within the past day | false if it hasn't moved within the past day
   */
  checkRecentMove(updates, currentTime) {
    let moves = null;
    let daysSinceUpdate = null;
    if (updates.length > 0) {
      moves = DCH.hasMovedCheck(updates);
      let lastUpdate = updates[0].date;
      if (moves.length > 0) {
        lastUpdate = moves[0].date;
      }
      daysSinceUpdate = currentTime.diff(moment(lastUpdate), 'days');
    }
    if (moves && daysSinceUpdate < 1) {
      return true;
    }
    return false;
  }

  /**
   * Check if a particular card is in the last list of a board (i.e. in the final stage)
   * @param {String} listID - An array of objects of when the card's update actions
   * @return {object} deferred.promise of true if is in the last list of the board \ false if not
   */
  inFinalList(listID) {
    const deferred = Q.defer();
    const self = this;
    self.getListNameByID(listID).then(listName => {
      let lastList = false;
      const lastStage = self.stages[self.stages.length - 1].name;
      if (listName === lastStage) {
        lastList = true;
      }
      deferred.resolve(lastList);
    });
    return deferred.promise;
  }

  /**
   * Search an array of comments, find the id of one that says '**Current stage**' and then call Trello to delete that comment
   * @param {Array} comments - An array of objects of the card's comments
   * @return {object} deferred.promise of true if a comment was deleted | false if no comment deleted.
   */
  deleteCurrentComment(comments) {
    const deferred = Q.defer();
    let currentCommentID = '';
    const self = this;

    comments.forEach(c => {
      if (c.data.text.indexOf('**Current Stage:**') !== -1) {
        currentCommentID = c.id;
      }
    });

    if (currentCommentID !== '') {
      self.t.del(`/1/actions/${currentCommentID}`, err => {
        if (err) {
          return deferred.reject(new Error(err));
        }
        return deferred.resolve({ currentCommentDeleted: true });
      });
    } else {
      deferred.resolve({ currentCommentDeleted: false });
    }

    return deferred.promise;
  }

  /**
   * A wrapper function for date calculation functions to figure out how long a card has been in a particular stage
   * @param {Array} comments - An array of objects of the card's comments
   * @param {Boolean} deletedNewComment - whether a current comment was deleted (the card moved within 2 days)
   * @param {Object} currentTime - A moment date object for the current time
   * @param {String} listName - The name of the list that the card is currently in
   * @return {Object} with the keys:
   * 'fromDate' - when the card entered the stage,
   * 'toDate' - Today or yesterday,
   * 'totalDays' - total days the card has existed,
   * 'expectedTime' - how  long we expect the card should be in a stage
   */
  generateNewCommentStats(comments, deletedNewComment, currentTime, listName) {
    const altToDate = DCH.differentToDate(comments, currentTime);
    const fromDate = DCH.generateFromDateForNewComment(deletedNewComment, comments, altToDate);
    const totalDays = (comments.length > 0) ? DCH.calcTotalDays(comments, currentTime) : 0;
    const stage = this.stages.find(s => s.name === listName);
    const diffArray = DCH.calculateDateDifference(stage.expected_time, fromDate, currentTime);
    return { fromDate, toDate: currentTime, totalDays, timeTaken: diffArray[1], expectedTime: stage.expected_time, dateDelta: diffArray[0] };
  }

  /**
   * Using the comment date stats, it interpolates the string of comment text
   * @param {Boolean} recentlyMoved - whether has moved in the past day
   * @param {String} commentListName - The name of the stage that the card is in
   * @param {Object} commentStats - An object of date figures and time spent for the card
   * @return {String} the text of the comment
   */
  buildComment(recentlyMoved, commentListName, commentStats) {
    let listName = 'Current';
    if (recentlyMoved) {
      listName = commentListName;
    }
    const formatDiff = (commentStats.dateDelta < 0) ? `**${commentStats.dateDelta} days**` : `\`+${commentStats.dateDelta} days\``;
    const fromDate = commentStats.fromDate.format('L');
    const toDate = commentStats.toDate.format('L');
    return `**${listName} Stage:** ${formatDiff}. *${fromDate} - ${toDate}*.\n Expected days: ${commentStats.expectedTime} days. Actual Days spent: ${commentStats.timeTaken}. **Total Project Days: ${commentStats.totalDays}**`;
  }

  /**
   * Command line function to build a comment with just the dates (for when things are messed up)
   * @param {String} fromDate - The date the card moved into the stage in 'MM/DD/YYYY'
   * @param {String} toDate - The date the card moved out of the stage in 'MM/DD/YYYY'
   * @param {String} listName - The name of the stage to write
   * @param {String} totalDays - The total days of the cards existence
   * @return {String} the text of the comment
   */
  utilComment(fromDate, toDate, listName, totalDays) {
    const stage = this.stages.find(s => s.name === listName);
    const fromMoment = moment(fromDate);
    const toMoment = moment(toDate);
    const diffArray = DCH.calculateDateDifference(stage.expected_time, fromMoment, toMoment);
    const commentStats = { fromDate: fromMoment, toDate: toMoment, totalDays, expectedTime: stage.expected_time, dateDelta: diffArray[0], timeTaken: diffArray[1] };
    const comment = this.buildComment(true, listName, commentStats);
    console.log(comment);
  }

  /**
   * Post a comment string as a comment to a trello card
   * @param {String} comment - The text of a comment to post
   * @param {String} cardID - The alphanumeric id of the card to post to
   * @return {object} deferred.promise whether the card was posted or the error
   */
  addComment(message, cardID) {
    const deferred = Q.defer();
    const url = `1/cards/${cardID}/actions/comments`;

    this.t.post(url, { text: message }, (err, data) => {
      if (err) {
        return deferred.reject(err);
      }
      return deferred.resolve(data);
    });

    return deferred.promise;
  }
}

module.exports = CardRecorder;

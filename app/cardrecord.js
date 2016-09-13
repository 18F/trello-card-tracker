'use strict';

const Q = require('q');
const moment = require('moment');

const DateCommentHelpers = require('./date-comment-helpers.js');
const DCH = new DateCommentHelpers();
const MyTrello = require('./my-trello.js');

class CardRecorder extends MyTrello {
  constructor(yamlFile, board) {
    super(yamlFile, board);
    this.stages = this.getPreAward();
  }

  run() {
    const self = this;
    return self.getCards().then(cards =>
      Q.all(cards.map(card => self.cardRecordFunctions(card)))
    );
  }

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
      const commentListName = cardActions.comments[0].data.list.name;
      self.deleteCurrentComment(cardActions.comments)
         .then(deletedComment => {
           const commentStats = self.generateNewCommentStats(cardActions.comments, deletedComment.currentCommentDeleted, now, commentListName);
           const comment = self.buildComment(recentlyMoved, commentListName, commentStats);
           self.addComment(comment, card.id)
           .then(resp => { deferred.resolve(resp); })
           .catch(deferred.reject);
         });
    });
    return deferred.promise;
  }

  cardFilters(cardActions, actionTypeArray) {
    const actions = {};
    actionTypeArray.forEach(actionType => {
      actions[actionType.name] = cardActions.filter(action =>
        action.type === actionType.type
      );
    });
    return actions;
  }

  checkRecentMove(updates, currentTime) {
    let moves = false;
    let daysSinceUpdate = false;
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

  generateNewCommentStats(comments, deletedNewComment, currentTime, listName) {
    const altToDate = DCH.differentToDate(comments, currentTime);
    const fromDate = DCH.getNewCommentFromDate(deletedNewComment, comments, altToDate);
    const totalDays = (comments.length > 0) ? DCH.calcTotalDays(comments, currentTime) : 0;
    const stage = this.stages.find(s => s.name === listName);
    const diffArray = DCH.calculateDateDifference(stage.expected_time, fromDate, currentTime);
    console.log(diffArray);
    return { fromDate, toDate: currentTime, totalDays, timeTaken: diffArray[1], expectedTime: stage.expected_time, dateDelta: diffArray[0] };
  }

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

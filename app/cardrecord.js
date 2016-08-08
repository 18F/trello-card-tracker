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

    self.deleteCurrentComment(cardActions.comments)
      .then(() => {
        const now = moment();
        let hasMoved = false;
        let daysSinceUpdate = false;
        if (cardActions.updates.length > 0) {
          hasMoved = DCH.hasMovedCheck(cardActions.updates);
          daysSinceUpdate = now.diff(moment(cardActions.updates[0].date), 'days');
        }
        const totDays = (cardActions.comments.length > 0) ? DCH.calcTotalDays(cardActions.comments, now) : 0;
        const prevMove = DCH.findPrevMoveDateFromComments({ commentList: cardActions.comments, actionList: cardActions.updates, createActionDate: cardActions.created.date });
        self.inFinalList(card.idList)
          .then(finalList => {
            self.decideCommentType(card,
              finalList,
              daysSinceUpdate,
              hasMoved,
              prevMove,
              cardActions,
              totDays,
              now)
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

  getPreviousList(cardAction) {
    return cardAction.data.listBefore.name;
  }

  decideCommentType(card, finalList, daysSinceUpdate, hasMoved, prevMove, cardActions, totalDays, nowMoment) {
    const self = this;
    const deferred = Q.defer();
    if (finalList && daysSinceUpdate > 1) {
      deferred.resolve({ 'final phase': true });
    } else if (hasMoved && daysSinceUpdate < 1) {
      console.log(`Write New Phase: ${card.name}`);
      const prevPhase = self.getPreviousList(hasMoved[0]);
      const endLastPhaseDate = DCH.checkCommentsForDates(cardActions.comments, true, true);
      self.compileCommentArtifact(
              card.id,
              prevPhase,
              prevPhase,
              endLastPhaseDate,
              cardActions.updates[0].date,
              true,
              totalDays
          )
          .then(resp => { deferred.resolve(resp); });
    } else {
      console.log(`Write Current Phase: ${card.name}`);
      self.getListNameByID(card.idList).then(listName => {
        self.compileCommentArtifact(
                  card.id,
                  listName,
                  'Current',
                  prevMove,
                  nowMoment.format(),
                  true,
                  totalDays
              );
      })
      .then(resp => { deferred.resolve(resp); });
    }
    return deferred.promise;
  }

  compileCommentArtifact(cardID, dateList, nameList, fromDate, toDate, addCommentOpt, totDays) {
    const deferred = Q.defer();
    const stage = this.stages.find(s => s.name === dateList);
    const expectedTime = stage.expected_time;
    const diffArray = DCH.calculateDateDifference(expectedTime, fromDate, toDate);
    const differenceFromExpected = diffArray[0];
    const timeTaken = diffArray[1];
    const comment = this.buildComment(differenceFromExpected, expectedTime, fromDate, toDate, nameList, timeTaken, totDays);
    if (addCommentOpt) {
      this.addComment(comment, cardID).then(resp => { deferred.resolve(resp); });
    } else {
      deferred.resolve(comment);
    }
    return deferred.promise;
  }

  buildComment(dateDiff, expected, prevMove, recentMove, lastList, actual, totalDays) {
    const formatDiff = (dateDiff < 0) ? `**${dateDiff} days**` : `\`+${dateDiff} days\``;
    const fromDate = moment(prevMove).format('L');
    const toDate = moment(recentMove).format('L');
    return `**${lastList} Stage:** ${formatDiff}. *${fromDate} - ${toDate}*.\n Expected days: ${expected} days. Actual Days spent: ${actual}. **Total Project Days: ${totalDays}**`;
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

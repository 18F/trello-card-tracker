'use strict';

const fs = require('fs');
const yaml = require('js-yaml');
const Q = require('q');
const MyTrello = require('./my-trello.js');

class CardCreator extends MyTrello {
  constructor(yamlFile, board) {
    super(yamlFile, board);
    this.stages = this.getPreAward();
  }

  createOrders(orderFile) {
    const orders = yaml.safeLoad(fs.readFileSync(orderFile, 'utf8'));
    const promises = [];
    const self = this;

    orders.orders.forEach(order => {
      promises.push(self.createCard(order));
    });

    return Q.all(promises);
  }

  createCard(order) {
    const deferred = Q.defer();

    const description = this.descriptionMaker(order);
    const cardName = `${order.project} - ${order.order}`;
    const self = this;

    Q.all([this.getListIDbyName(order.stage), this.getMember(order.owner)]).then(asyncRes => {
      const listID = asyncRes[0];
      const memberInfo = asyncRes[1];
      const cardInfo = {
        name: cardName,
        desc: description,
        idList: listID,
        due: order.due,
        idMembers: [memberInfo.id]
      };
      self.t.post('1/cards/', cardInfo, (err, data) => {
        if (err) {
          return deferred.reject(new Error(err));
        }
        return deferred.resolve(data);
      });
    });

    return deferred.promise;
  }

  descriptionMaker(order) {
    return `Project: ${order.project}\nAgency: ${order.agency}\nSubAgency: ${order.subagency}\nTrello Board: ${order.trello}`;
  }
}


module.exports = CardCreator;

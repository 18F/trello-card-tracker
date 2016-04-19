"use strict";

var fs = require('fs');
var yaml = require('js-yaml');
var Q = require('q');
var _ = require("underscore");

var MyTrello = require("./my-trello.js");


class CardCreator extends MyTrello {
    constructor(yaml_file, board) {
        super(yaml_file, board);
        this.stages = this.getPreAward();
    }

    createOrders(orderFile) {
        var orders = yaml.safeLoad(fs.readFileSync(orderFile, 'utf8')),
            promises = [],
            self = this;

        _.each(orders.orders, function(order) {
            promises.push(self.createCard(order));
        });

        return Q.all(promises);
    }

    createCard(order) {
        var deferred = Q.defer();

        var description = this.descriptionMaker(order),
            cardName = order.project + " - " + order.order,
            self = this;

        Q.all([this.getListIDbyName(order.stage), this.getMember(order.owner)]).then(function(asyncRes) {
            var listID= asyncRes[0];
            var memberInfo = asyncRes[1];
            var cardInfo = {
                name: cardName,
                desc: description,
                idList: listID,
                due: order.due,
                idMembers: memberInfo.id
            };
            self.t.post('1/cards/', cardInfo, function(err, data) {
              console.log(err);
              console.log(data);
                if (err) return deferred.reject(new Error(err));
                deferred.resolve(data);
            });
        });

        return deferred.promise;
    }

    descriptionMaker(order) {
        return `Project: ${order.project}\nAgency: ${order.agency}\nSubAgency: ${order.subagency}\nTrello Board: ${order.trello}`;
    }
}


module.exports = CardCreator;

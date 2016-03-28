"use strict";
var TrelloSuper = require("./helpers.js");
var util = require('util');
var yaml = require('js-yaml');
var Q = require('q');

class CardCreator extends TrelloSuper{
	createOrders(orderFile){
		var orders = yaml.safeLoad(fs.readFileSync(orderFile, 'utf8'));
		var promises = [ ];
		_un.each(orders.orders, function(order){
			promises.push(this.createCard(order));
		});
		return Q.all(promises);
	}

	createCard(order){
		var deferred = Q.defer();
		var description = this.descriptionMaker(order);
		var cardName = order["project"] +" - "+order["order"];
		var due = null;

		if (order["due"]){
			due = order["due"];
		}

		this.getListIDbyName(order["stage"]).then(function(listID){
			var cardInfo = {"name": cardName,
											"desc": description,
											"idList": listID,
											"due": due
										};
			this.t.post('1/cards/', cardInfo, function(err, data){
				if(err) {
					return deferred.reject(new Error(err));
				}
				deferred.resolve(data);
			});
		});
		return deferred.promise;
	}

	descriptionMaker(order){
		return `Project: ${order.project}\nAgency: ${order.agency}\nSubAgency: ${order.subagency}\nTrello Board: ${order.trello}`;
	}
}

module.exports = CardCreator;

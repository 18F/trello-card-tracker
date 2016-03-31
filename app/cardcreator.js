var TrelloSuper = require("./helpers.js");
var fs = require('fs');
var util = require('util');
var yaml = require('js-yaml');
Q = require('q');

var classThis;
function CardCreator(yaml_file, board){
	TrelloSuper.call(this, yaml_file, board);
		classThis = this;
}

util.inherits(CardCreator, TrelloSuper);

module.exports = CardCreator;

var method = CardCreator.prototype;

method.createOrders = function(orderFile){
	var orders = yaml.safeLoad(fs.readFileSync(orderFile, 'utf8'));
	var promises = [ ];
	_un.each(orders.orders, function(order){
		promises.push(classThis.createCard(order));
	});
	return Q.all(promises);
}

method.createCard = function(order){
	var deferred = Q.defer();
	var description = this.descriptionMaker(order);
	var cardName = order["project"] +" - "+order["order"];
	var due = null;

	if (order["due"]){
		due = order["due"];
	}

	classThis.getListIDbyName(order["stage"]).then(function(listID){
		var cardInfo = {"name": cardName,
										"desc": description,
										"idList": listID,
										"due": due
									};
		classThis.t.post('1/cards/', cardInfo, function(err, data){
			if(err) {
				return deferred.reject(new Error(err));
			}
			deferred.resolve(data);
		});
	});
	return deferred.promise;
}

method.descriptionMaker = function(order){
	return "Project: {p}\nAgency: {a}\nSubAgency: {sub}\nTrello Board: {tb}"
		.supplant({p: order["project"], a: order["agency"], sub: order["subagency"], tb: order["trello"]});
}

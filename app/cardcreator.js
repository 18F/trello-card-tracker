var TrelloSuper = require("./helpers.js");
var util = require('util');
var yaml = require('js-yaml');

function CardCreator(yaml_file, board){
	TrelloSuper.call(this, yaml_file, board);
}

util.inherits(CardCreator, TrelloSuper);

module.exports = CardCreator;

var method = CardCreator.prototype;

method.createOrders = function(orderFile){
	classThis = this;
	var orders = yaml.safeLoad(fs.readFileSync(orderFile, 'utf8'));
	_un.each(orders.orders, function(order){
		classThis.createCard(order);
	});
}

method.createCard = function(order){
	var description = this.descriptionMaker(order);
	var cardName = order["project"] +" - "+order["order"];

	if (order["due"]){
		var due = order["due"];
	} else {
		var due = null;
	}
	classThis = this;
	this.getListIDbyName(order["stage"], function(listID){
		var cardInfo = {"name": cardName,
										"desc": description,
										"idList": listID,
										"due": due
									};
		classThis.t.post('1/cards/', cardInfo, function(err, data){
			if (err) {throw err};
			console.log(data);
		});

	});
}

method.descriptionMaker = function(order){
	return "Project: {p}\nAgency: {a}\nSubAgency: {sub}\nTrello Board: {tb}"
		.supplant({p: order["project"], a: order["agency"], sub: order["subagency"], tb: order["trello"]});
}

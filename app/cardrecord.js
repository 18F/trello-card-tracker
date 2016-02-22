var TrelloSuper = require("./helpers.js");
var util = require('util');
var instadate = require("instadate");
var moment = require("moment");
yaml = require('js-yaml');

function CardRecorder(yaml_file, board){
	TrelloSuper.call(this, yaml_file, board);
}

util.inherits(CardRecorder, TrelloSuper);

var method = CardRecorder.prototype;

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

method.addComment = function(message, cardID){
	this.t.post("1/cards/"+cardID+"/actions/comments", {text: message}, function(err, data){
		if (err) {throw err};
		// 	console.log("ordering");
	 });
}

method.calculateDateDifference = function(expected, lastMove, recentMove){
	var fromDate = new Date(lastMove);
	var toDate = new Date(recentMove);
	var diffDays = instadate.differenceInWorkDays(fromDate, toDate);
	return [diffDays - expected, diffDays]
}


//Need to make a PROMISE
method.findLastMoves = function(cardID){
	this.t.get("/1/cards/"+cardID+"/actions", {"filter": ["updateCard","createCard"]}, function(e, actions){
		if (e) throw e;
		updatedCards = _un.where(actions, {type: 'updateCard'});
		if (updatedCards > 1){
			var fromAction = updatedCards[1];
			var toAction = updateCards[0];
		} else {
			var fromAction = _un.findWhere(actions, {type:"createCard"});
			var toAction = _un.findWhere(actions, {type:"updateCard"});
		}
		return [fromAction["date"], toAction["date"]]; // From to To Date
	});

}

method.buildComment= function(dateDiff, expected, lastMove, recentMove, lastList, actual){
	fromDate = moment(lastMove).format("L");
	toDate = moment(recentMove).format("L");
	formatDiff = (dateDiff < 0)? "**"+dateDiff+" days**" :"`+"+dateDiff+" days`"
	msg = "**{l} Stage:** {d}. *{f} - {t}*.\n Expected days: {e} days. Actual Days spent: {a}."
		.supplant({l: lastList, d: formatDiff, e: expected, a: actual, f: fromDate, t: toDate });
	return msg;
}


module.exports = CardRecorder;

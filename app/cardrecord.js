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
	_un.each(orders, this.createCard(order, classThis));
}

method.createCard = function(order, classThis){
	var description = this.descriptionMaker(order);
	var cardName = order["project"] +" - "+order["order"];
	var listID = this.getListID(order["stage"]);
	if (order["due"]){
		var due = order["due"];
	} else {
		var due = null;
	}
	var cardInfo = {"name": cardName,
									"desc": description,
								  "idList": getID,
							  	"due": due
								};
	classThis.post('1/cards/', cardInfo, function(err, data){
		if (err) {throw err};
		console.log(data);
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

method.findLastMove = function(){
	// Look for actions where the data>card>id is the same & the type is update card
	// updatedCards = _un.where(actions,{type: "updateCard", data.card.id: trelloID})
	//if (updateCard.length  > 1){
		//find the second to newest one
	//}	else {
			//cardCreated = _un.findwher(actions, {type:"createCard", data.card.id: trelloID});
			//return cardCreated.date;
	//}

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

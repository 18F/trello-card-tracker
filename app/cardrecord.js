var TrelloSuper = require("./helpers.js");
var util = require('util');
var dateFormat = require('dateformat');
var instadate = require("instadate");

function CardRecorder(yaml_file, board){
	TrelloSuper.call(this, yaml_file, board);
}

util.inherits(CardRecorder, TrelloSuper);

var method = CardRecorder.prototype;

method.createOrders = function(){

}

method.addComment = function(message, cardID){
	this.t.post("1/cards/"+cardID+"/actions/comments", {text: message}, function(e, data){
		if (e) {throw err};
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
	var fromDate = new Date(lastMove);
	var toDate = new Date(recentMove);
	fromDate = dateFormat(fromDate, "mm/dd/yyyy");
	toDate = dateFormat(toDate, "mm/dd/yyyy");
	formatDiff = (dateDiff < 0)? "**"+dateDiff+" days**" :"`+"+dateDiff+" days`"
	msg = "**{l} Stage:** {d}. *{f} - {t}*.\n Expected days: {e} days. Actual Days spent: {a}."
		.supplant({l: lastList, d: formatDiff, e: expected, a: actual, f: fromDate, t: toDate });
	return msg;
}


module.exports = CardRecorder;

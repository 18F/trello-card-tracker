TrelloSuper = require("./helpers.js");
util = require('util');
var dateFormat = require('dateformat');

function CardRecorder(yaml_file, board){
	TrelloSuper.call(this, yaml_file, board);
}

util.inherits(CardRecorder, TrelloSuper);

var method = CardRecorder.prototype;

method.createOrders = function(){

}

method.addComment = function(){

}

method.calculateDateDifference = function(expected, lastMove, recentMove){
	var date1 = new Date(lastMove);
	var date2 = new Date(recentMove);
	var timeDiff = Math.abs(date2.getTime() - date1.getTime());
	var diffDays = Math.ceil(timeDiff / (1000 * 3600 * 24));
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
	var formatLM = new Date(lastMove);
	var formatRC = new Date(recentMove);
	formatLM = dateFormat(formatLM, "mm/dd/yyyy");
	formatRC = dateFormat(formatRC, "mm/dd/yyyy");
	msg = "**{l} PHASE:** {d}. *04/05/2016 - 07/27/2016*.\n Expected days: {e} days. Actual Days spent: {a}."
		.supplant({ e: expected, d: dateDiff, l: formatLM, r: formatRC, a: actual});
	return msg;
}


module.exports = CardRecorder;

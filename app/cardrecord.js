TrelloSuper = require("./helpers.js");
util = require('util');


function CardRecorder(yaml_file, board){
	TrelloSuper.call(this, yaml_file, board);
}

util.inherits(CardRecorder, TrelloSuper);

var method = CardRecorder.prototype;




module.exports = CardRecorder;
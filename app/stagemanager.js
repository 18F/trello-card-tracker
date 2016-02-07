TrelloSuper = require("./helpers.js");
util = require('util');


function StageManager(yaml_file, board){
	TrelloSuper.call(this, yaml_file, board);
}

util.inherits(StageManager, TrelloSuper);

var method = StageManager.prototype;

method.checkLists = function(){
	return "";
};

method.makeAdditionalLists = function(){
	return "";
};

method.deleteUnusedStages = function(){
	return "";
};


module.exports = StageManager;

// Check list ids against lists *** in meantime check names
// var testList = {
//   name: "Kanbanian",
//   idBoard: board,
//   pos: 2
// }

// var testList2 = {
//   name: "Kanbanian-Dos",
//   idBoard: board,
//   pos: 3
// }

// var testList3 = {
//   name: "Kanbanian-three",
//   idBoard: board,
//   pos: 1
// }

// var queue = [testList, testList2, testList3];

// t.get("/1/boards/"+board+"/lists", function(err, data){
//   if (err) throw err;
//   console.log(data);
//   for (i=0; i < queue.length; i++) {
//     t.post("1/lists", queue[i], function(err,data){
//       if (err) throw err;
//       console.log(data);
//     })
//   }
// })

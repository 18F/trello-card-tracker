_un = require("underscore");
TrelloSuper = require("./helpers.js");
util = require('util');


function StageManager(yaml_file, board){
	TrelloSuper.call(this, yaml_file, board);
}

util.inherits(StageManager, TrelloSuper);

var method = StageManager.prototype;

method.checkLists = function(readStages){
var checked = [];
	this.t.get("/1/boards/"+this.board+"/lists", function(err, data){

	  if (err) throw err;
		lists = _un.pluck(data, 'name');
		_un.each(readStages, function(stage){
			checked.push({"stage": stage["name"], "built": _un.contains(lists, stage["name"])});
		});
		return checked;
		// console.log(checked);
	});
	// return;
};

method.makeAdditionalLists = function(checkedList){
	var classThis = this;
	_un.each(checkedList, function(list, i){
		if (!list["built"]){
			var postList = {name: list["stage"], idBoard: classThis.board, pos: i+1};
			console.log(postList);
			classThis.t.post("1/lists", postList, function(err,data){
				if (err) throw err;
				console.log(data);
			});
		}
	});
};

method.deleteUnusedStages = function(){
	classThis = this;
	stages = _un.pluck(classThis.relevantStage, 'name');
	classThis.t.get("/1/boards/"+classThis.board+"/lists", function(err, data){
		if (err) throw err;
		_un.each(data, function(trelloList){
			if (!(_un.contains(stages, trelloList["name"]))){
				classThis.t.get("/1/lists/"+trelloList["id"]+"/cards", function(err, listData){
					if (err) throw err;
					// console.log(listData);
					if (listData.length === 0){
						classThis.t.put("/1/list/"+trelloList["id"]+"/closed", {value: true}, function(e, success){
							console.log(success);
						})
					}
				});

			}
		});

		return;

	});
};

method.run = function(){
	this.stages = this.readYaml();
	this.relevantStage = this.stages.stages[0].substages;
	this.checkedList = this.checkLists(this.relevantStage);
	// this.checkedList = [ { stage: 'IAA', built: false },
  // { stage: 'Workshop Prep', built: false },
  // { stage: 'Workshop', built: false },
  // { stage: 'RFP Writing', built: false },
  // { stage: 'CO Review', built: false },
  // { stage: 'Client Review', built: false },
  // { stage: 'Award Finalized', built: false },
  // { stage: 'Solicitation', built: false },
  // { stage: 'Vendor Review', built: false } ];
	this.makeAdditionalLists(this.checkedList);
	// console.log(checked);
	this.deleteUnusedStages();
}


module.exports = StageManager;

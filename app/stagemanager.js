_un = require("underscore");
TrelloSuper = require("./helpers.js");
util = require('util');
Q = require('q');


class StageManager extends TrelloSuper{
	constructor(){
		this.Stages = this.getPreAward();
	}

	run(){
		var deferred = Q.defer();
		this.getStageandBoard()
		.then(this.checkLists)
	  .then(this.makeAdditionalLists)
		.then(this.getStageandBoard().then(this.closeUnusedStages))
		.then(this.getStageandBoard().then(this.orderLists))
		.then(function() { deferred.resolve("complete") })
		.catch(function(e) {
			deferred.reject(e);
	  });

		return deferred.promise;
	}

	getStageandBoard(){
		var deferred = Q.defer();
		this.t.get(this.lists_url, function(err, data){
			if(err) {deferred.reject(new Error(err));};
			deferred.resolve([classThis.Stages, data]);
		});
		return deferred.promise;
	}

	checkLists(data){ //PASS STAGES ASYNC
		var checked = [];
		lists = _un.pluck(data[1], 'name');
		_un.each(data[0], function(stage){
			checked.push({"stage": stage["name"], "built": _un.contains(lists, stage["name"])});
		});
		return checked;
	}

	makeAdditionalLists(checkedList){
		var deferred = Q.defer();
		var all = [ ];
		var newLists = [ ];

		_un.each(checkedList, function(list, i){
			var listDefer = Q.defer();
			all.push(listDefer.promise);
			if (!list["built"]){
				var postList = {name: list["stage"], idBoard: this.board, pos: i+1};
				this.t.post("1/lists", postList, function(err,data){
					if (err) {
						listDefer.reject(err);
					}
					newLists.push(data);
					listDefer.resolve();
				});
			}
		});

		Q.all(all).then(function() {
			deferred.resolve(newLists);
		}).catch(function(e) {
			deferred.reject(e);
		})

		return deferred.promise;
	}

	closeUnusedStages(data, callback){
		stages = _un.pluck(data[0], 'name'); //Grab stage names
		// For each list
		_un.each(data[1], function(trelloList){
			if (!(_un.contains(stages, trelloList["name"]))){
				this.getListCards(trelloList["id"], function(d){
					this.closeList(d, trelloList["id"], callback)
				});
			};
		});
		return;
	}

	getListCards(trelloID, callback){
		this.t.get("/1/lists/"+trelloID+"/cards", function(err, data){
			if(err) throw err;
			callback(data);
		});
	}

	closeList(listData, trelloID, callback){
		if (listData.length === 0){
			this.t.put("/1/list/"+trelloID+"/closed", {value: true}, function(e, success){
				if (e) {throw e};
				callback(success);
			});
		}
	}

	orderLists(data){
		var position = 0;
		_un.each(data[0], function(stage, i){
			appropriateList = _un.findWhere(data[1], {name: stage["name"]})
			if(appropriateList) {
				listID = appropriateList["id"];
				this.t.put("1/lists/"+listID+"/pos", {value: position}, function(e, data) {
					if (e) {throw e};
				});
				position++;
			}
		});
	}
}

module.exports = StageManager;

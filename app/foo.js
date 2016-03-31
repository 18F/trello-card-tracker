"use strict";

"use strict";

var Q = require('q');
var _ = require("underscore");
var util = require('util');

var TrelloSuper = require("./helpers.js");
var MyTrello = require("./my-trello.js");


class StageManager extends MyTrello {
    constructor(yaml_file, board) {
        super(yaml_file, board);
        this.stages = this.getPreAward();
    }

    run() {
        var deferred = Q.defer();

        this.getStageandBoard()
            .then(this.checkLists)
            .then(this.makeAdditionalLists)
            .then(this.getStageandBoard().then(this.closeUnusedStages))
            .then(this.getStageandBoard().then(this.orderLists))
            .then(function() { deferred.resolve("complete"); })
            .catch(function(e) { deferred.reject(e); });

        return deferred.promise;
    }

    getStageandBoard() {
        var deferred = Q.defer();
        console.log(this.stages);

        var self = this;

        this.t.get(this.lists_url, function(err, data) {
            if (err) deferred.reject(new Error(err));
            deferred.resolve([self.stages, data]);
        });
        return deferred.promise;    
    }
}


var foo = new StageManager('data/stages.yaml', '56f947c4f4f95b683ab058e5');
console.log(foo.getStageandBoard());



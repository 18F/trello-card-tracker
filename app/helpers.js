// THIS IS NOW A LEGACY FILE
// SEE my-trello.js and util.js FOR REFACTOR
// TODO: REMOVE THIS FILE ONCE ALL SUBCLASSES MIGRATED


var yaml = require('js-yaml');
var fs = require('fs');
var Trello = require("node-trello");


var method = TrelloSuper.prototype;

function TrelloSuper(yaml_file, board) {
    this.yaml_file = yaml_file;
    this.board = board;
    this.t = new Trello(process.env.TRELLO_API_KEY, process.env.TRELLO_API_TOK);
    this.lists_url = "/1/boards/" + board + "/lists";
}

method.readYaml = function() {
    try {
        return yaml.safeLoad(fs.readFileSync(this.yaml_file, 'utf8'));
    } catch (e) {
        return null;
    }
};

method.getPreAward = function() {
    stages = this.readYaml(this.yaml_file);
    return stages ? stages.stages[0].substages : [];
};

method.getListIDbyName = function(name, callback) {
    var deferred = Q.defer();
    var find = Boolean(name);
    this.t.get(this.lists_url, function(e, data) {
        if (e) {
            return deferred.reject(e);
        }
        var list;
        if (find) {
            list = _un.findWhere(data, { "name": name });
        }
        if (!find || !list) { //Add it to the first list if there is not one
            list = data[0];
        }
        deferred.resolve(list.id);
    });

    return deferred.promise;
};

method.getListNameByID = function(listID) {
    var deferred = Q.defer();
    this.t.get('/1/lists/' + listID, function(err, list) {
        if (err) {
            return deferred.reject(new Error(err));
        }
        deferred.resolve(list.name);
    });
    return deferred.promise;
};


String.prototype.supplant = function(o) {
    return this.replace(/{([^{}]*)}/g,
        function(a, b) {
            var r = o[b];
            return typeof r === 'string' || typeof r === 'number' ? r : a;
        }
    );
};


module.exports = TrelloSuper;

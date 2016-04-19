"use strict";

var fs = require('fs');
var yaml = require('js-yaml');
var Trello = require("node-trello");
var Q = require('q');
var _ = require('underscore');

var env = process.env;


class MyTrello {
    constructor(yaml_file, board) {
        this.yaml_file = yaml_file;
        this.board = board;
        this.t = new Trello(env.TRELLO_API_KEY, env.TRELLO_API_TOK);
        this.lists_url = "/1/boards/" + board + "/lists";
    }

    readYaml() {
        try {
            return yaml.safeLoad(fs.readFileSync(this.yaml_file, 'utf8'));
        } catch (e) {
            return null;
        }
    }

    getPreAward() {
        var stages = this.readYaml(this.yaml_file);
        return stages ? stages.stages[0].substages : [];
    }

    getListIDbyName(name, callback) {
        var deferred = Q.defer();
        var find = Boolean(name);

        this.t.get(this.lists_url, function(e, data) {
            if (e) return deferred.reject(e);

            var list;
            if (find) list = _.findWhere(data, { "name": name });
            if (!list) list = data[0];

            deferred.resolve(list.id);
        });

        return deferred.promise;
    }

    getListNameByID(id) {
        var deferred = Q.defer();

        this.t.get('/1/lists/' + id, function(e, list) {
            if (e) return deferred.reject(e);

            deferred.resolve(list.name);
        });

        return deferred.promise;
    }
    getMember(usernameOrID){
      var deferred = Q.defer();

      this.t.get('/1/members/' + usernameOrID, function(e, member) {
          if (e) return deferred.reject(e);

          deferred.resolve(member);
      });

      return deferred.promise;

    }
}


module.exports = MyTrello;

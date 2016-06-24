'use strict';

const fs = require('fs');
const yaml = require('js-yaml');
const Trello = require('node-trello');
const Q = require('q');
const env = process.env;

class MyTrello {
  constructor(yamlFile, board) {
    this.yamlFile = yamlFile;
    this.board = board;
    this.t = new Trello(env.TRELLO_API_KEY, env.TRELLO_API_TOK);
    this.lists_url = `/1/boards/${board}/lists`;
  }

  readYaml() {
    try {
      return yaml.safeLoad(fs.readFileSync(this.yamlFile, 'utf8'));
    } catch (e) {
      return null;
    }
  }

  getPreAward() {
    const stages = this.readYaml(this.yamlFile);
    return stages ? stages.stages[0].substages : [];
  }

  getListIDbyName(name) {
    const deferred = Q.defer();
    const find = Boolean(name);
    this.t.get(this.lists_url, (e, data) => {
      if (e) {
        return deferred.reject(e);
      }

      let list;
      if (find) {
        list = data.find(getList => getList.name === name);
      }
      if (!list) {
        list = data[0];
      }
      return deferred.resolve(list.id);
    });

    return deferred.promise;
  }

  getListNameByID(id) {
    const deferred = Q.defer();

    this.t.get(`/1/lists/${id}`, (e, list) => {
      if (e) {
        deferred.reject(e);
      } else {
        deferred.resolve(list.name);
      }
    });

    return deferred.promise;
  }
  getMember(usernameOrID) {
    const deferred = Q.defer();

    this.t.get(`/1/members/${usernameOrID}`, (e, member) => {
      if (e) {
        deferred.reject(e);
      } else {
        deferred.resolve(member);
      }
    });

    return deferred.promise;
  }
}


module.exports = MyTrello;

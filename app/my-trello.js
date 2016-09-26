'use strict';

const fs = require('fs');
const yaml = require('js-yaml');
const Trello = require('node-trello');
const Q = require('q');
const env = process.env;

/** Class that encapsulates Trello configuration and calls. */
class MyTrello {

  /**
    Create a MyTrello instance.
    @param  {string} yamlFile - The path to the YAML config file.
    @param  {string} board - Trello board ID of the board to use.
  */
  constructor(yamlFile, board) {
    this.yamlFile = yamlFile;
    this.board = board;
    this.t = new Trello(env.TRELLO_API_KEY, env.TRELLO_API_TOK);
    this.lists_url = `/1/boards/${board}/lists`;
  }

  /**
    Attempt to read the YAML file at the path passed into the
    constructor.
    @returns {object} An object of the YAML or null if there is
      any error.
  */
  readYaml() {
    try {
      return yaml.safeLoad(fs.readFileSync(this.yamlFile, 'utf8'));
    } catch (e) {
      return null;
    }
  }

  /**
    Get the pre-award stages from the YAML file.
    @returns {Array} An array of the pre-award stages defined
      in the YAML config file, or an empty array if anything
      goes wrong.
  */
  getPreAward() {
    const stages = this.readYaml(this.yamlFile);
    return stages ? stages.stages[0].substages : [];
  }

  /**
    Get a list ID from its name.
    @param {string} name - The list name.
    @return {Promise<string|Error>} A promise that resolves with
      the list ID or rejects with an error.
  */
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

  /**
    Get a list name from its ID.
    @param {string} id - The list ID.
    @return {Promise<string|Error>} A promise that resolves with
      the list name or rejects with an error.
  */
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

  /**
    Get a member object from either their ID or username.
    @param {string} usernameOrID - The username or ID of the member
      to get.
    @return {Promise<object|Error>} A promise that resolves with
      the member object or rejects with an error.
  */
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

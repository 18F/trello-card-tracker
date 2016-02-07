#!/usr/bin/env node


_un = require("underscore");
// app = require('./app');
var StageManager = require("./app/stagemanager.js");
var TrelloSuper = require("./app/helpers.js");


// var t = new Trello(process.env.TRELLO_API_KEY, process.env.TRELLO_API_TOK);


// select board ***
var board = process.env.TRELLO_BPA_BOARD;

args = process.argv.slice(2);

if (_un.contains(args,"-m")){
  console.log("Invoke Stage Manager");
  stg_mnger = new StageManager('stages.yaml', 1234);


} else if (_un.contains(args,"-c")) {
  console.log("Invoke Card Recorder");
} else{
  console.log("Please supply an argument -m for Stage Manager or -c for card recorder");
}

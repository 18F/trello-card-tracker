#!/usr/bin/env node
_un = require("underscore");
var app = require('./app');
var argv = require('minimist')(process.argv.slice(2));

// select board ***
var board = process.env.TRELLO_BOARD_ID;

// args = process.argv.slice(2);

if ("s" in argv){
  console.log("--Invoke Stage Manager--");
  var file  = (argv["s"]=== true) ? 'stages.yaml' : argv["s"];
  stgManager = new app.StageManager(file, board);
  stgManager.run();
}

if ("c" in argv) {
  console.log("--Invoke Card Recorder--");
  var file  = (argv["c"]=== true) ? 'stages.yaml' : argv["c"];
  var CR = new app.CardRecorder(file, board);
  CR.calculateDateDifference(10, "2016-04-05", "2016-07-27")
}

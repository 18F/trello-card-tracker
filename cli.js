#!/usr/bin/env node
_un = require("underscore");
var app = require('./app');
//

// select board ***
var board = process.env.TRELLO_BPA_BOARD;

args = process.argv.slice(2);

if (_un.contains(args,"-s")){
  console.log("Invoke Stage Manager");
  var file = args[args.indexOf("-s") + 1];
  stgManager = new app.StageManager('stages.yaml', board);

} else if (_un.contains(args,"-c")) {
  console.log("Invoke Card Recorder");
  var file = args[args.indexOf("-c") + 1];
  cardRecorder = new app.CardRecorder('stages.yaml', board);
} else{
  console.log("Please supply an argument -s for Stage Manager or -c for card recorder");
}

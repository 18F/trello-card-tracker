#!/usr/bin/env node
_un = require("underscore");
var app = require('./app');
var argv = require('minimist')(process.argv.slice(2));

// select board ***
var board;
if ("i" in argv){
  board = argv["i"]
} else {
  board = process.env.TRELLO_BOARD_ID;
}


if ("s" in argv){
  console.log("--Invoke Stage Manager--");
  var file  = (argv["s"]=== true) ? 'data/stages.yaml' : argv["s"];
  var SM = new app.StageManager(file, board);
  SM.run().then(console.log("Stage Manager Complete"));
}

if ("r" in argv) {
  console.log("--Invoke Card Recorder--");
  var file  = (argv["r"]=== true) ? 'data/stages.yaml' : argv["r"];
  var CR = new app.CardRecorder(file, board);
  CR.run().then(console.log("CR Complete"));
}

if ("c" in argv) {
  console.log("--Invoke Card Creator--");
  var file  = (argv["c"]=== true) ? 'data/stages.yaml' : argv["c"];
  var CC = new app.CardCreator(file, board);
  CC.createOrders('data/orders.yaml');
}

if ("b" in argv) {
  //Args = Name of list > -d ,fromDate > -f, toDate > -t
  console.log("--Build a Comment--");
  var file  = (argv["b"]=== true) ? 'data/stages.yaml' : argv["d"];
  var CR = new app.CardRecorder(file, board);
  CR.compileCommentArtifact(null, argv.d, argv.d, argv.f, argv.t, false, console.log);
}

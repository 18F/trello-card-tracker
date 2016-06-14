#!/usr/bin/env node
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
  var smFile  = (argv["s"]=== true) ? 'data/stages.yaml' : argv["s"];
  var SM = new app.StageManager(smFile, board);
  SM.run().then(function(resp){console.log("Stage Manager Complete")});
}

if ("r" in argv) {
  console.log("--Invoke Card Recorder--");
  var crFile  = (argv["r"]=== true) ? 'data/stages.yaml' : argv["r"];
  var CR = new app.CardRecorder(crFile, board);
  CR.run().then(function(resp){console.log("--Card Recorder Complete--")});
}

if ("c" in argv) {
  console.log("--Invoke Card Creator--");
  var ccFile  = (argv["c"]=== true) ? 'data/stages.yaml' : argv["c"];
  var orders  = (argv["o"]=== true) ? 'data/orders.yaml' : argv["o"];
  var CC = new app.CardCreator(ccFile, board);
  CC.createOrders(orders).then(function(resp){
    console.log("--Card Creator Complete--");});
}

if ("b" in argv) {
  //Args = Name of list > -d ,fromDate > -f, toDate > -t
  console.log("--Build a Comment--");
  var crCLIFile  = (argv["b"]=== true) ? 'data/stages.yaml' : argv["d"];
  var BuildCR = new app.CardRecorder(crCLIFile, board);
  BuildCR.compileCommentArtifact(null, argv.d, argv.d, argv.f, argv.t, false).then(function(comment){console.log(comment)});
}

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

//Run the CardRecorder class to add date driven comments to trello cards
addCommandPrompt("r", "CardRecorder", function(file, tN){
    var CR = new app.CardRecorder(file, board);
    CR.run().then(function(resp){console.log("--"+tN+" Complete--")});
});

//Run the Stage Manager class to add lists to a board
addCommandPrompt("s", "Stage Manager", function(file, tN){
  var SM = new app.StageManager(file, board);
  SM.run().then(function(resp){console.log("--"+tN+" Complete--")});
});

//Run the Card Creator class to add cards to a board from a file
addCommandPrompt("c", "Card Creator", function(file, tN){
  var orders  = (argv["o"]=== true) ? 'data/orders.yaml' : argv["o"];
  var CC = new app.CardCreator(file, board);
  CC.createOrders(orders).then(function(resp){
    console.log("--"+tN+" Complete--");});
});

//Print out a comment to the command line
if ("b" in argv) {
  //Args = Name of list > -d ,fromDate > -f, toDate > -t
  console.log("--Build a Comment--");
  var crCLIFile  = (argv["b"]=== true) ? 'data/stages.yaml' : argv["b"];
  var BuildCR = new app.CardRecorder(crCLIFile, board);
  BuildCR.compileCommentArtifact(null, argv.d, argv.d, argv.f, argv.t, false).then(function(comment){console.log(comment)});
}

function addCommandPrompt(flag, taskName, callback){
  if (flag in argv){
    console.log("--Invoke "+taskName+"--");
    var file = (argv[flag]=== true) ? 'data/stages.yaml' : argv[flag];
    callback(file, arguments[1]);
  }
}

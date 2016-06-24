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

var cliCommands = [
  {//Run the CardRecorder class to add date driven comments to trello cards
    "flag": "r",
   "task": "CardRecorder",
   "command": function(file, tN){
                var CR = new app.CardRecorder(file, board);
                CR.run()
                  .then(function(resp){console.log("--"+tN+" Complete--")});
              }
  },
  {//Run the Stage Manager class to add lists to a board
    "flag": "s",
   "task": "StageManager",
   "command": function(file, tN){
                var SM = new app.StageManager(file, board);
                SM.run()
                  .then(function(resp){console.log("--"+tN+" Complete--")});
              }
  },
  {//Run the Card Creator class to add cards to a board from a file
    "flag": "c",
   "task": "Card Creator",
   "command": function(file, tN){
                var hasNoOrderFile = (typeof argv.o === "undefined");
                var orders  = (argv.o === true || hasNoOrderFile) ? 'data/orders.yaml' : argv.o;
                var CC = new app.CardCreator(file, board);
                CC.createOrders(orders)
                  .then(function(resp){console.log("--"+tN+" Complete--");});}
    },
    {//Print out a comment to the command line
    //Required Flags: -l ListName, -d Iso string of from date, -t Isostring of to date, -o total days
      "flag": "b",
     "task": "Build Comment",
     "command": function(file, tN){
                  var BuildCR = new app.CardRecorder(file, board);
                  BuildCR.compileCommentArtifact(null, argv.l, argv.d, argv.f, argv.t, false, argv.o)
                  .then(function(comment){console.log(comment)});
                }
    }
];

cliCommands.forEach(function(command){
  addCommandPrompt(command.flag, command.task, command.command);
});

function addCommandPrompt(flag, taskName, callback){
  if (flag in argv){
    console.log("--Invoke "+taskName+"--");
    var file = (argv[flag]=== true) ? 'data/stages.yaml' : argv[flag];
    callback(file, arguments[1]);
  }
}

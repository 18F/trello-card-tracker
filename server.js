#!/usr/bin/env node
var app = require('./app');
var argv = require('minimist')(process.argv.slice(2));
var cron = require('node-schedule');

var board = process.env.TRELLO_BOARD_ID;

console.log("--Start Regular Card Recording Server--");

var j = cron.scheduleJob('0 8 * * *', function(){
  var file  = (argv["f"]) ? argv["f"] : 'data/stages.yaml';
  console.log("Running Card Recorder");
  var CR = new app.CardRecorder(file, board);
  CR.run().then(console.log("Card Recorder Run"));
});

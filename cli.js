#!/usr/bin/env node
const app = require('./app');
const argv = require('minimist')(process.argv.slice(2));

// select board ***
let board;
if ('i' in argv) {
  board = argv.i;
} else {
  board = process.env.TRELLO_BOARD_ID;
}

const cliCommands = [
  {// Run the CardRecorder class to add date driven comments to trello cards
    flag: 'r',
    task: 'CardRecorder',
    command(file, tN) {
      const CR = new app.CardRecorder(file, board);
      CR.run()
                  .then(() => { console.log(`--${tN} Complete--`); });
    }
  },
  {// Run the Stage Manager class to add lists to a board
    flag: 's',
    task: 'StageManager',
    command(file, tN) {
      const SM = new app.StageManager(file, board);
      SM.run()
                  .then(() => { console.log(`--${tN} Complete--`); });
    }
  },
  {// Run the Card Creator class to add cards to a board from a file
    flag: 'c',
    task: 'Card Creator',
    command(file, tN) {
      const hasNoOrderFile = (typeof argv.o === 'undefined');
      const orders = (argv.o === true || hasNoOrderFile) ? 'data/orders.yaml' : argv.o;
      const CC = new app.CardCreator(file, board);
      CC.createOrders(orders)
                  .then(() => { console.log(`--${tN} Complete--`); }); }
  },
  {// Print out a comment to the command line
    // Required Flags: -l list name of what the stage will be called, -d Optional what list to look for number of days
    // -f Isostring of from date, -t Isostring of to date -o total days
    flag: 'b',
    task: 'Build Comment',
    command(file) {
      const BuildCR = new app.CardRecorder(file, board);
      let dateList = argv.l;
      if (argv.d) {
        dateList = argv.d;
      }
      BuildCR.compileCommentArtifact(null, argv.l, dateList, argv.f, argv.t, false, argv.o)
                  .then(comment => { console.log(comment); });
    }
  }
];

function addCommandPrompt(flag, taskName, callback) {
  if (flag in argv) {
    console.log(`--Invoke ${taskName}--`);
    const file = (argv[flag] === true) ? 'data/stages.yaml' : argv[flag];
    callback(file, taskName);
  }
}

cliCommands.forEach(command => {
  addCommandPrompt(command.flag, command.task, command.command);
});

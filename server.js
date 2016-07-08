#!/usr/bin/env node
const app = require('./app');
const argv = require('minimist')(process.argv.slice(2));
const cron = require('node-schedule');

const board = process.env.TRELLO_BOARD_ID;

console.log('--Start Regular Card Recording Server--');

cron.scheduleJob('0 8 * * *', () => {
  const file = (argv.f) ? argv.f : 'data/stages.yaml';
  console.log('Running Card Recorder');
  const CR = new app.CardRecorder(file, board);
  CR.run().then(console.log('Card Recorder Run'));
});

expect = require('chai').expect
_un = require("underscore")
app = require('../app')

module.exports = {
  board: process.env.TRELLO_BPA_TEST_BOARD,
  mockfile: './test/mockfile.yaml',
  board_url: '/1/boards/' + this.board + '/lists',
  stubbed_list: ["Kanbanian", "Kanbanian-Dos"],
  make_lists: [ { stage: 'Kanbanian', built: false }, { stage: 'Kanbanian-Dos', built: false }],
  expectedStageObject: {
    stages: [ {
      name: 'Pre-Award',
      substages: [{name: 'IAA',  expected_time: 5},
        {name: 'Workshop Prep', expected_time: 10}]
    }]},
    ordermockfile: './test/mockorderfile.yaml',
    testCardID: process.env.TRELLO_TEST_CARD,
    mockOrder: {
      id: 1,
      project: "BPA Project",
      order: "Front End",
      agency: "General Services Administration",
      subagency: "OCSIT",
      trello: "https://trello.com/b/nmYlvlhu/bpa-test-dashboard",
      stage: "CO Review",
      open_date: "",
      close_date: "",
      owner: "Randy Hart"
    }
}

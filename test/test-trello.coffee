expect = require('chai').expect
trelloIntg = require('../app/trello-client.js')
var Trello = require("node-trello")
var t = new Trello(process.env.TRELLO_API_KEY, process.env.TRELLO_API_TOK)

stubbed_list = ["Kanbanian", "Kanbanian-Dos"]
mockedStageObject =
  stage:
    [preaward:
      [name: "IAA"
       expected_time: 10,
       name: "Workshop Prep"
       expected_time: 11
    ]

describe 'stageManager', ->
  describe '.readYAML', ->
    it 'maps a yaml to an object with a stages key', ->
      yamlobject = trelloIntg.readYaml(mockStageFile)
      expect(yamlobject).to.equal(mockedStageObject)
    it 'raises an error when a bad there is not a yaml file', ->
      expect(trelloIntg.readYaml('nofile')).to.throw(Error)
    return

  describe '.checkLists', ->
    it 'checks which stages in an object of stages are in a trello board', ->
      expected_object =
        list_1: true
        list_2: false

      result_object = trelloIntg.checkLists(stubbed_list);
      expect(result_object)to.include.members(expected_object);
      return
    return

  describe '.makeAdditionalLists', ->
    it 'makes a new list for those dont exist', ->
      expect(boardLists).to.include.members(stubbed_list)
    return

  describe '.deleteUnusedStages', ->
    it 'deletes lists given a list of ideas where there are no cards'->
      trelloIntg.deleteLists(delete_list)
      remaining_lists = t.get('1/boards/lists', function(err,data) ->
        data
        )
      expect(remaining_lists).to.not.include(delete_list) 
      return
  return

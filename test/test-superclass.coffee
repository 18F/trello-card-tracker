expect = require('chai').expect
_un = require("underscore")
app = require('../app')
helpers = require('./test-helpers.js')
stages = helpers.expectedStageObject.stages[0].substages

stageMgr = new app.StageManager(helpers.mockfile, helpers.board) # The trello super class is not directly accessible

describe 'app.TrelloSuper', ->

  describe.skip '.readYAML()', ->
    it 'maps a yaml to an object with a stages key', ->
      yamlObject = stageMgr.readYaml()
      expect(yamlObject).to.eql(helpers.expectedStageObject)
      return
    return

  describe '.getPreAward()', ->
    it 'will grab the Pre-Award stage from a file', ->
      preaward = stageMgr.getPreAward()
      expect(preaward).to.eql(helpers.expectedStageObject.stages[0].substages)
      return
    return

  describe 'getListIDbyName(ListName)', ->
    it 'will ping Trello to grab a list ID given a list name', (done) ->

      # Calls to trello.get will call the callback with no error and
      # the supplied array as data.
      stub = helpers.trelloStub("get", null, [{ name: "IAA", id: "abc123" }]);

      # Ask for the ID that matches the name from above.
      stageMgr.getListIDbyName "IAA", (id) ->
        expect(id).to.eql("abc123");
        stub.restore()
        done()
      return
    return

  return

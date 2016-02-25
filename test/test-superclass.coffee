expect = require('chai').expect
_un = require("underscore")
app = require('../app')
helpers = require('./test-helpers.js')
stages = helpers.expectedStageObject.stages[0].substages

stageMgr = new app.StageManager(helpers.mockfile, helpers.board) # The trello super class is not directly accessible

describe 'app.TrelloSuper', ->

  describe '.readYAML()', ->
    it 'maps a yaml to an object with a stages key', ->
      yamlObject = stageMgr.readYaml()
      expect(yamlObject).to.eql(helpers.expectedStageObject)
      return
    return

  describe.skip '.getPreAward()', ->
    it 'will grab the Pre-Award stage from a file', ->
      return
    return

  describe.skip 'getListIDbyName(ListName)', ->
    it 'will ping Trello to grab a list ID given a list name', ->
      return
    return

  return

expect = require('chai').expect
_un = require("underscore")
sinon = require('sinon')
require('sinon-as-promised')
trello = require('node-trello')
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

    it 'returns null if the YAML file doesn\'t exist', ->
      sm = new app.StageManager('', helpers.board)
      preaward = sm.readYaml()
      expect(preaward).to.eql null
    return

  describe '.getPreAward()', ->
    it 'will grab the Pre-Award stage from a file', ->
      preaward = stageMgr.getPreAward()
      expect(preaward).to.eql(helpers.expectedStageObject.stages[0].substages)
      return

    it 'returns an empty array if readYAML returns invalid data', ->
      sm = new app.StageManager('', helpers.board)
      preaward = sm.getPreAward()
      expect(preaward).to.eql [ ]
    return

  describe 'getListIDbyName(ListName)', ->
    sandbox = undefined
    stub = undefined
    error = null
    run = 0
    result = [{ id: 'test-list-1', name: 'Test List #1' }, { id: 'test-list-2', name: 'Test List #2' }]

    beforeEach ->
      sandbox = sinon.sandbox.create()
      stub = sandbox.stub(trello.prototype, 'get').withArgs('/1/boards/' + helpers.board + '/lists').yieldsAsync(error, result)
      return

    afterEach ->
      sandbox.restore()
      if ++run == 2 # after end of second run...
        error = new Error('Test Error')
        result = null
      return

    it 'will ping Trello to grab a list ID given a list name', (done) ->
      stageMgr.getListIDbyName(result[1].name).then (id) ->
        expect(id).to.eql(result[1].id);
        done()
        return
      return

    it 'will return the first list ID if no name is specified', (done) ->
      stageMgr.getListIDbyName(null).then (id) ->
        expect(id).to.eql(result[0].id);
        done()
        return
      return

    it 'will survive a Trello error', (done) ->
      stageMgr.getListIDbyName(null).catch (err) ->
        expect(err).to.eql(error);
        done()
        return
      return

    return

  describe 'getListNameByID', ->
    sandbox = undefined
    stub = undefined
    error = null
    result = { name: 'Test List' }
    testListID = 'test-list-id'

    beforeEach ->
      sandbox = sinon.sandbox.create()
      stub = sandbox.stub(trello.prototype, 'get').withArgs('/1/lists/' + testListID).yieldsAsync(error, result)
      return

    afterEach ->
      sandbox.restore()
      error = new Error('Test Error')
      result = null
      return

    it 'will ping Trello to grab a list name given a list ID', (done) ->
      stageMgr.getListNameByID(testListID).then (list) ->
        expect(list).to.eql(result.name);
        done()
        return
      return

    it 'will survive a Trello error', (done) ->
      stageMgr.getListNameByID(testListID).catch (err) ->
        expect(err).to.eql(error);
        done()
        return
      return

    return

  return

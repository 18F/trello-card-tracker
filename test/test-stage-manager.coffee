expect = require('chai').expect
_un = require("underscore")
app = require('../app')
helpers = require('./test-helpers.js')
stages = helpers.expectedStageObject.stages[0].substages

stageMgr = new app.StageManager(helpers.mockfile, helpers.board)

describe 'app.StageManager', ->
  describe '.getStageandBoard', ->
    stub = undefined
    expected = undefined

    before ->
      stubData = { output: "data" };
      stub = helpers.trelloStub("get", null, stubData);
      expected = [helpers.expectedStageObject.stages[0].substages, stubData]

    after ->
      stub.restore()

    it 'gets stages and lists in the trello board', (done) ->
      stageMgr.getStageandBoard().then (data) ->
        expect(data).to.eql expected
        expect(stub.callCount).to.eql 1
        done()
      return
    return

  describe '.checkLists', ->
    expected = undefined

    before ->
      expected = [ ];
      helpers.expectedStageObject.stages[0].substages.forEach (s) ->
        expected.push { stage: s.name, built: null }

    it 'checks which stages in an object of stages are in a trello board', ->
      checkedList = stageMgr.checkLists([helpers.expectedStageObject.stages[0].substages, [{ name:expected[0].stage }]])
      expected[0].built = true;
      expected[1].built = false;
      expect(checkedList).to.eql expected
      return
    return

  describe '.makeAdditionalLists', ->
    stub = undefined
    unbuilt = undefined

    before ->
      stub = helpers.trelloStub("post", null, true);
      unbuilt = helpers.make_lists.filter (l) ->
        return !l.built

    after ->
      stub.restore()

    it 'given a list of objects that include the name of unbuilt lists, it makes additional lists in trello', (done) ->
      stageMgr.makeAdditionalLists(helpers.make_lists).then (data) ->
        expect(data.length).to.eql helpers.make_lists.length
        expect(stub.callCount).to.eql unbuilt.length
        done()
    return

  describe '.orderLists', ->
    it 'reorders the list to match with the order of the stages', ->
      stageMgr.getStageandBoard().then(stageMgr.orderLists)
      stageMgr.t.get helpers.board_url, (err, data) ->
        if err
          throw err
        _un.each helpers.stages, (stage, ind) ->
          trelloList = _un.findWhere(data, {name: helpers.stages["name"]})
          expect(ind).to.eql(trelloList["pos"])
          return
        return
      return
    return

  describe '.closeUnusedStages', ->
    it 'closes a lists given a list if it is not in a stages object where there are no cards', ->
      stageMgr.getStageandBoard().then(stageMgr.closeUnusedStages)
      stageMgr.t.get helpers.board_url, (err, data) ->
        if err
          throw err
        shouldbeClosed = _un.findWhere(data, {name: 'Should be closed board'})
        expect(shouldbeClosed["closed"]).to.be.true
        # console.log data
      return
  return

expect = require('chai').expect
_un = require('underscore')
app = require('../app')
helpers = require('./test-helpers.js')
sinon = require('sinon');
stages = helpers.expectedStageObject.stages[0].substages
trello = require('node-trello')

SM = new app.StageManager(helpers.mockfile, helpers.board)

describe 'app.StageManager', ->
  describe '.getStageandBoard', ->
    sandbox = undefined
    error = null
    expected = undefined

    beforeEach ->
      stubData = { output: 'data' };
      sandbox = sinon.sandbox.create()
      # stub = helpers.trelloStub('get', error, stubData);
      sandbox.stub(trello.prototype, 'get').yieldsAsync(error, stubData)
      expected = [helpers.expectedStageObject.stages[0].substages, stubData]

    afterEach ->
      sandbox.restore()
      error = new Error('Test error')

    it 'gets stages and lists in the trello board', (done) ->
      SM.getStageandBoard().then (data) ->
        expect(data).to.eql expected
        expect(stub.callCount).to.eql 1
        done()
      return

    it 'survives a Trello error', (done) ->
      SM.getStageandBoard().catch ->
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
      checkedList = SM.checkLists([helpers.expectedStageObject.stages[0].substages, [{ name:expected[0].stage }]])
      expected[0].built = true;
      expected[1].built = false;
      expect(checkedList).to.eql expected
      return
    return

  describe '.makeAdditionalLists', ->
    stub = undefined
    error = null
    unbuilt = undefined

    beforeEach ->
      stub = helpers.trelloStub('post', error, true);
      unbuilt = helpers.make_lists.filter (l) ->
        return !l.built
      return

    afterEach ->
      stub.restore()
      error = new Error('Test error')
      return

    it 'given a list of objects that include the name of unbuilt lists, it makes additional lists in trello', (done) ->
      SM.makeAdditionalLists(helpers.make_lists).then (data) ->
        expect(data.length).to.eql helpers.make_lists.length
        expect(stub.callCount).to.eql unbuilt.length
        done()
        return
      return

    it 'survives a Trello error', (done) ->
      SM.makeAdditionalLists(helpers.make_lists).catch (e) ->
        expect(stub.callCount).to.be.most unbuilt.length
        done()
        return
      return

    return

  describe '.closeUnusedStages', ->
    input = undefined
    getListCardsStub = undefined
    closeListStub = undefined

    beforeEach ->
      input = [ [], [{ name: 'List', id: 'abc' }] ]
      getListCardsStub = helpers.trelloStub('get', null, [ ])
      closeListStub = helpers.trelloStub('put', null, null)
      return

    afterEach ->
      getListCardsStub.restore()
      closeListStub.restore()
      return

    it 'gets card info for all lists that are not in the stages', (done) ->
      SM.closeUnusedStages input, ->
        expect(getListCardsStub.callCount).to.eql input[1].length
        done()
        return
      return

    it 'calls close on all lists that are not in stages', (done) ->
      SM.closeUnusedStages input, ->
        expect(closeListStub.callCount).to.eql input[1].length
        done()
        return
      return
    return

  describe '.getListCards', ->
    stub = undefined

    before ->
      stub = helpers.trelloStub('get', null, { })
      return

    after ->
      stub.restore()
      return

    it 'gets a list of cards for a given list ID', (done) ->
      SM.getListCards 'abc123', (data) ->
        expect(stub.callCount).to.eql 1
        done()
        return
      return
    return

  describe 'closeList', ->
    stub = undefined

    before ->
      stub = helpers.trelloStub('put', null, { })
      return

    after ->
      stub.restore()
      return

    it 'asks Trello to close the list', (done) ->
      SM.closeList [], 'abc123', ->
      expect(stub.callCount).to.eql 1
      done()
      return
    return

  describe '.orderLists', ->
    stub = undefined
    stages = [
      { name: 'Stage 1' },
      { name: 'Stage 2' },
      { name: 'Stage 3' }
    ];

    lists = [
      { name: 'Stage 1', id: 'abc123' }
    ];

    before ->
      stub = helpers.trelloStub('put', null, { })
      return

    after ->
      stub.restore()
      return

    it 'updates the positions of appropriate number of lists', (done) ->
      # First argument: all stages
      # Second argument: all lists on the board
      SM.orderLists([stages, lists])
      expect(stub.callCount).to.eql 1
      done()
      return

    return

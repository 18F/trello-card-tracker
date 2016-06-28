expect = require('chai').expect
app = require('../app')
helpers = require('./test-helpers.js')
sinon = require('sinon')
require('sinon-as-promised')
stages = helpers.expectedStageObject.stages[0].substages
trello = require('node-trello')

SM = new app.StageManager(helpers.mockfile, helpers.board)

describe 'app.StageManager', ->
  describe '.run()', ->
    sandbox = undefined
    getStageStub = undefined
    checkListsStub = undefined
    makeAddListStub = undefined
    closeListStub = undefined
    orderListStub = undefined
    boardLists = undefined
    error = null

    beforeEach ->
      sandbox = sinon.sandbox.create()
      getStageStub = sandbox.stub(SM, 'getStageandBoard').resolves([stages, helpers.mockGetBoardList])
      if error
        getStageStub.rejects(error)
      checkListsStub = sandbox.stub(SM, 'checkLists').resolves(helpers.make_lists)
      makeAddListStub = sandbox.stub(SM, 'makeAdditionalLists').resolves({})
      closeListStub = sandbox.stub(SM, 'closeUnusedStages').resolves({})
      orderListStub = sandbox.stub(SM, 'orderLists').resolves({})
      return
    afterEach ->
      sandbox.restore()
      error = new Error('Test Error')
      return

    it 'runs the stage manager class', (done) ->
      SM.run().done (data) ->
        expect(checkListsStub.callCount).to.equal 1
        expect(makeAddListStub.callCount).to.equal 1
        expect(closeListStub.callCount).to.equal 1
        expect(orderListStub.callCount).to.equal 1
        done()
        return
      return

    it 'rejects if there are any errors', (done) ->
      SM.run().catch (e) ->
        expect(e).to.equal error
        done()
        return
      return
    return

  describe '.getStageandBoard', ->
    sandbox = undefined
    error = null
    expected = undefined
    stubData = undefined
    getStub = undefined

    beforeEach ->
      stubData = { output: 'data' };
      sandbox = sinon.sandbox.create()
      # stub = helpers.trelloStub('get', error, stubData);
      getStub = sandbox.stub(trello.prototype, 'get').yieldsAsync(error, stubData)


    afterEach ->
      sandbox.restore()
      error = new Error('Test error')

    it 'gets stages and lists in the trello board', (done) ->
      expected = [helpers.expectedStageObject.stages[0].substages, stubData]
      SM.getStageandBoard().then (data) ->
        expect(data).to.eql expected
        expect(getStub.callCount).to.eql 1
        done()
      return

    it 'survives a Trello error', (done) ->
      SM.getStageandBoard().catch ->
        expect(getStub.callCount).to.eql 1
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
    sandbox = undefined
    # getListCardsStub = undefined
    closeListStub = undefined
    getStub = undefined

    beforeEach ->
      input = [ [], [{ name: 'List', id: 'abc' }] ]
      sandbox = sinon.sandbox.create()
      # getListCardsStub = sandbox.stub(SM, 'getListCards').resolves([]);
      closeListStub = sandbox.stub(SM, 'closeList').resolves({});
      getStub = sandbox.stub(trello.prototype, 'get').yieldsAsync(null, [])
      return

    afterEach ->
      sandbox.restore()
      return

    it.skip 'gets card info for all lists that are not in the stages', (done) ->
      SM.closeUnusedStages(input).then ->
        expect(getListCardsStub.callCount).to.eql input[1].length
        done()
        return
      return

    it.skip 'calls close on all lists that are not in stages', (done) ->
      SM.closeUnusedStages(input).then ->
        expect(closeListStub.callCount).to.eql input[1].length
        done()
        return
      return
    return

  describe '.getListCards(listID)', ->
    stub = undefined

    before ->
      stub = helpers.trelloStub('get', null, { })
      return

    after ->
      stub.restore()
      return

    it 'gets a list of cards for a given list ID', (done) ->
      SM.getListCards('abc123').then (data) ->
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
      SM.closeList([], 'abc123').then (data) ->
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

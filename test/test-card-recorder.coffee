expect = require('chai').expect
app = require('../app')
helpers = require('./test-helpers.js')
q = require('q')
trello = require('node-trello')
sinon = require('sinon');
moment = require('moment')
require('sinon-as-promised');

CR = new app.CardRecorder(helpers.mockfile, helpers.board)

describe 'app.CardRecorder', ->
  sandbox = undefined
  beforeEach ->
    sandbox = sinon.sandbox.create()
    return

  afterEach ->
    sandbox.restore()
    return

  describe '.run', ->
    getCardsStub = undefined
    cardRecordStub = undefined

    beforeEach ->
      cardRecordStub = sandbox.stub(CR, 'cardRecordFunctions').resolves()
      return

    it 'will card record for every card on the board', (done) ->
      getCardsStub = sandbox.stub(CR, 'getCards').resolves([helpers.mockCommentCardObj])
      CR.run().then (resp) ->
        expect(cardRecordStub.callCount).to.eql 1
        expect(cardRecordStub.calledWith(helpers.mockCommentCardObj)).to.be.ok
        expect(getCardsStub.callCount).to.eql 1
        done()
        return
      return

    it 'survives a getCards error', (done) ->
      error = new Error('foo')
      getCardsStub = sandbox.stub(CR, 'getCards').rejects(error)
      CR.run().catch (err) ->
        expect(getCardsStub.callCount).to.eql 1
        expect(err).to.eql error
        done()
      return
    return

  describe '.getCards()', ->
    stub = undefined
    error = null
    cards = [ 'card1', 'card2', 'card3' ];

    beforeEach ->
      stub = sandbox.stub(trello.prototype, 'get').yieldsAsync(error, cards)
      return

    afterEach ->
      error = new Error('Test Error')
      return

    it 'will ping trello and get the updated actions of a card', (done) ->
      CR.getCards().then (resp) ->
        expect(stub.callCount).to.eql 1
        expect(resp).to.eql cards
        done()
        return
      return

    it 'will survive a trello error', (done) ->
      CR.getCards().catch (err) ->
        expect(stub.callCount).to.eql 1
        expect(err).to.eql error
        done()
        return
      return
    return

  describe '.cardRecordFunctions(card)', ->
    deleteStub = undefined
    hasMovedStub = undefined
    calcTotalStub = undefined
    cardStats = undefined
    finalListStub = undefined
    decideStub = undefined
    cardMock = undefined
    cardActions = undefined
    addCommentStub = undefined
    now = undefined


    beforeEach ->
      now = moment()
      deleteStub = sandbox.stub(CR, 'deleteCurrentComment').resolves({"currentCommentDeleted": true})
      hasMovedStub = sandbox.stub(CR, 'checkRecentMove').returns(true)
      finalListStub = sandbox.stub(CR, 'inFinalList').resolves(false)
      cardActions = helpers.actionListNoMove.concat(helpers.mockCommentCardObj.actions)
      cardMock = {id: 'cccc', idList: 'vvv', name: 'BPA Project - Phase II', actions: cardActions}
      cardActions.forEach (action) ->
        action.date = (new Date(Date.now() - 21600000)).toISOString();
        return
      cardStatsStub = sandbox.stub(CR, 'generateNewCommentStats').returns({ fromDate: moment(cardActions[0].date), toDate: now, totalDays: 10, timeTaken: 8, expectedTime: 2, dateDelta: 6 })


      return


    it 'runs the card record for a single card', (done) ->
      addCommentStub = sandbox.stub(CR, 'addComment').resolves({"comment": true});
      CR.cardRecordFunctions(cardMock).then (resp) ->
        expect(finalListStub.callCount).to.equal 1
        expect(deleteStub.callCount).to.equal 1
        expect(cardStatsStub.callCount).to.equal 1
        expect(addCommentStub.callCount).to.equal 1
        done()
      return

    it 'will survive a trello error', (done) ->
      error = new Error('Test Error');
      addComment = sandbox.stub(CR, 'addComment').rejects(error)
      CR.cardRecordFunctions(cardMock).catch (err) ->
        expect(addCommentStub.callCount).to.eql 1
        expect(err).to.eql error
        done()
        return
      return
    return

  describe '.cardFilters(cardActions, actionTypeArray)', ->
    it 'returns an object of arrays of actions separated by action type for each type specified in the array', ->
      actions = helpers.actionListMove.concat(helpers.mockCommentCardObj.actions)
      cardActionObj = CR.cardFilters(actions, [{"name": "comments", "type": "commentCard"}, {"name": "updates", "type": "updateCard"}, {"name": "created", "type": "createCard"}])
      expect(cardActionObj.updates.length).to.be.equal 2
      expect(cardActionObj.comments.length).to.be.equal 2
      expect(cardActionObj.created.length).to.be.equal 0
      return
    return

  describe '.deleteCurrentComment(comments)', ->
    runs = 0
    delStub = undefined
    currentComments = undefined
    notCurrentComments = undefined
    error = new Error('Test Error')

    beforeEach ->
      currentComments = JSON.parse(JSON.stringify(helpers.mockCommentCardObj.actions))
      notCurrentComments = JSON.parse(JSON.stringify(helpers.mockCommentCardObj.actions))
      notCurrentComments[0].data.text = "This comment is not in the current stage."
      delStub = sandbox.stub(trello.prototype, 'del').withArgs('/1/actions/' + currentComments[0].id).yieldsAsync(null, {})

      runs++
      if runs == 3
        delStub.withArgs('/1/actions/' + currentComments[0].id).yieldsAsync(error, null)
      return


    it 'will delete a comment if a bolded text saying "Current Stage" appears', (done) ->
      CR.deleteCurrentComment(currentComments).then (data) ->
        expect(data).to.eql {"currentCommentDeleted": true};
        expect(delStub.callCount).to.equal 1
        done()
        return
      return

    it 'will not delete a comment that does not have a current stage', (done) ->
      CR.deleteCurrentComment(notCurrentComments).then (data) ->
        expect(data).to.eql {"currentCommentDeleted": false};
        expect(delStub.callCount).to.equal 0
        done()
        return
      return

    it 'will survive a trello error deleting a comment', (done) ->
      CR.deleteCurrentComment(currentComments).catch (err) ->
        expect(err).to.eql error
        done()
        return
      return
    return

  describe '.checkRecentMove(updates, currentTime)', ->
    now = undefined
    before ->
      now = moment()

    it 'returns false if there are no updates ', ->
      recentlyMoved = CR.checkRecentMove([], now)
      expect(recentlyMoved).to.eql false
      return

    it 'returns false if the card has not moved', ->
      recentlyMoved = CR.checkRecentMove(helpers.actionListNoMove, now)
      expect(recentlyMoved).to.eql false
      return

    it 'returns false if the most move was over a day ago', ->
      recentlyMoved = CR.checkRecentMove(helpers.actionListMove, now)
      expect(recentlyMoved).to.eql false
      return

    it 'returns true if the most move was less than a day ago', ->
      updates = JSON.parse(JSON.stringify(helpers.mockCommentCardObj.actions))
      updates[0].date = now
      recentlyMoved = CR.checkRecentMove(updates, now)
      expect(recentlyMoved).to.eql false
      return
    return

  describe '.inFinalList(cardIDList)', ->
    stages = undefined
    stageName = undefined


    it 'returns true if the card is in the last list', (done) ->
      stages = helpers.expectedStageObject.stages[0].substages[1].name
      # lastStage = stages[stages.length -1]
      stageName = sandbox.stub(CR, 'getListNameByID').resolves(stages)
      CR.inFinalList('xxx').then (isInFinalList) ->
        expect(isInFinalList).to.be.true
        done()
      return

    it 'returns false if the card is not in the last list of the board', (done) ->
      stages = helpers.expectedStageObject.stages[0].substages[0].name
      stageName = sandbox.stub(CR, 'getListNameByID').resolves(stages)
      CR.inFinalList('xxx').then (isInFinalList) ->
        expect(isInFinalList).to.be.false
        done()
      return

    it 'survives a trello error', ->
      CR.inFinalList('aaa').catch (err) ->
        expect(err).to.eql error
        done()
      return
    return

  describe '.generateNewCommentStats(comments, deletedNewComment, currentTime, listName)', ->
    now = undefined
    dateDifferenceStub = undefined
    stage = undefined
    stageMock = undefined
    calcTotalMock = undefined

    before ->
      now = moment()
      dateDifferenceStub = sandbox.stub(app.DateCommentHelpers.prototype, 'calculateDateDifference').returns([6, 8])
      calcTotalDays = sandbox.stub(app.DateCommentHelpers.prototype, 'calcTotalDays').returns(10)

    afterEach ->
      sandbox.restore()


    it 'returns an object with all of the dates and time differentials from the DCH object', ->
      commentStats = CR.generateNewCommentStats([], true, now, 'Workshop')
      expected = { fromDate: moment("2016-04-05T10:40:26.100Z"), toDate: now, totalDays: 10, timeTaken: 8, expectedTime: 2, dateDelta: 6 }
      expect(commentStats).to.eq(expected)
      return
    return

  describe '.buildComment(recentlyMoved, commentListName, commentStats)', ->
    it 'constructs a comment string for the last phase', ->
      msg = CR.buildComment(true, 'Workshop', { fromDate: moment("2016-04-05T10:40:26.100Z"), toDate: moment("2016-07-27T10:40:26.100Z"), totalDays: 0, timeTaken: 113, expectedTime: 10, dateDelta: 103 })
      expect(msg).to.eql("**Workshop Stage:** `+103 days`. *04/05/2016 - 07/27/2016*.\n Expected days: 10 days. Actual Days spent: 113. **Total Project Days: 0**")
      return

    it 'constructs a comment string for the current phase', ->
      msg = CR.buildComment(false, 'Workshop', { fromDate: moment("2016-04-05T10:40:26.100Z"), toDate: moment("2016-07-27T10:40:26.100Z"), totalDays: 0, timeTaken: 113, expectedTime: 10, dateDelta: 103 })
      expect(msg).to.eql("**Current Stage:** `+103 days`. *04/05/2016 - 07/27/2016*.\n Expected days: 10 days. Actual Days spent: 113. **Total Project Days: 0**")
      return
    return

  describe '.addComment', ->
    error = null

    beforeEach ->
      postStub = sandbox.stub(trello.prototype, 'post').yieldsAsync(error, helpers.createCommentResp)
      return

    afterEach ->
      error = new Error('Test Error')
      return

    it 'adds a comment to a board', (done) ->
      CR.addComment('test message\n', '3333').then (resp) ->
        expect(resp.data.text).to.eql 'test message\n'
        done()
        return
      return

    it 'survives a trello error', (done) ->
      CR.addComment('test message\n', '3333').catch (err) ->
        expect(err).to.eql error
        done()
        return
      return

    return

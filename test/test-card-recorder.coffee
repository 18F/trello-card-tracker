expect = require('chai').expect
app = require('../app')
helpers = require('./test-helpers.js')
q = require('q')
trello = require('node-trello')
sinon = require('sinon');
moment = require('moment')
require('sinon-as-promised');

# sinon.stub::asyncOutcome = (args, asyncResp) ->
#   @withArgs(args).yieldsAsync(asyncResp)
#   this

CR = new app.CardRecorder(helpers.mockfile, helpers.board)
# CR.Stages = helpers.expectedStageObject

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
    findPrevStub = undefined
    finalListStub = undefined
    decideStub = undefined
    cardMock = undefined
    cardActions = undefined


    beforeEach ->
      deleteStub = sandbox.stub(CR, 'deleteCurrentComment').resolves({"currentCommentDeleted": true})
      hasMovedStub = sandbox.stub(app.DateCommentHelpers.prototype, 'hasMovedCheck').returns(true)
      calcTotalStub = sandbox.stub(app.DateCommentHelpers.prototype, 'calcTotalDays').returns(55)
      finalListStub = sandbox.stub(CR, 'inFinalList').resolves(false);
      cardActions = helpers.actionListNoMove.concat(helpers.mockCommentCardObj.actions)
      cardMock = {id: 'cccc', idList: 'vvv', name: 'BPA Project - Phase II', actions: cardActions}
      cardActions.forEach (action) ->
        action.date = (new Date(Date.now() - 21600000)).toISOString();
        return
      findPrevStub = sandbox.stub(app.DateCommentHelpers.prototype, 'findPrevMoveDateFromComments').returns(cardActions[0].date);
      return


    it 'runs the card record for a single card', (done) ->
      decideStub = sandbox.stub(CR, 'decideCommentType').resolves({"pastDecide": true})
      CR.cardRecordFunctions(cardMock).then (resp) ->
        expect(deleteStub.callCount).to.equal 1
        expect(calcTotalStub.callCount).to.equal 1
        expect(decideStub.callCount).to.equal 1
        expect(finalListStub.callCount).to.equal 1
        done()
      return

    it 'will survive a trello error', (done) ->
      error = new Error('Test Error');
      decideStub = sandbox.stub(CR, 'decideCommentType').rejects(error)
      CR.cardRecordFunctions(cardMock).catch (err) ->
        expect(decideStub.callCount).to.eql 1
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
        expect(err).to.eql error;
        done()
        return
      return
    return

  describe '.getPreviousList(updateActionID)', ->
    it 'will grab the name of the last list a trello card was part of given that the card has moved', ->
      listName = CR.getPreviousList helpers.actionListMove[1]
      expect(listName).to.equal("Old List")
      return

    # get this should be undefined
    it 'will return an error if the action does not have a list before', ->
      expect(->
        CR.ggetPreviousList helpers.actionListMove[0]
      ).to.throw Error
      return
    return

  describe '.decideCommentType(card, finalList, daysSinceUpdate, hasMoved, prevMove, updateActions, totalDays, nowMoment)', ->
    card = undefined
    prevMove = undefined
    updateActions = undefined
    now = undefined
    cardActions = undefined
    compileStub = undefined
    getPreviousStub = undefined
    getListStub = undefined

    beforeEach ->
      now = moment()
      cardActions = helpers.actionListNoMove.concat(helpers.mockCommentCardObj.actions)
      card = {id: 'cccc', idList: 'vvv', name: 'BPA Project - Phase II', actions: cardActions}
      compileStub = sandbox.stub(CR, 'compileCommentArtifact').resolves({"compiled": true})
      getListStub = sandbox.stub(CR, 'getListNameByID').resolves("Stubbed List Name")
      getPreviousStub = sandbox.stub(CR, 'getPreviousList').resolves("Previous List")

    it 'chooses that a comment should be written to last list phase', (done) ->
      CR.decideCommentType(card, true, 10, helpers.actionListMove[1], prevMove, updateActions, 10, now).then (resp) ->
        expect(getPreviousStub.callCount).to.equal 0
        expect(compileStub.callCount).to.equal 0
        expect(getListStub.callCount).to.equal 0
        done()
      return

    it 'chooses that a comment should be written to a new phase', (done) ->
      updateActions = [{"date": now}]
      CR.decideCommentType(card, false, 0, helpers.actionListMove[1], prevMove, updateActions, 10, now).then (resp) ->
        expect(getPreviousStub.callCount).to.equal 1
        expect(compileStub.callCount).to.equal 1
        expect(getListStub.callCount).to.equal 0
        done()
      return

    it 'chooses that a comment should be written to a current phase that has moved because it was updated over a day ago', (done) ->
      CR.decideCommentType(card, false, 4, helpers.actionListMove[1], prevMove, updateActions, 10, now).then (resp) ->
        expect(getPreviousStub.callCount).to.equal 0
        expect(compileStub.callCount).to.equal 1
        expect(getListStub.callCount).to.equal 1
        done()
      return

    it 'chooses that a comment should be written to a current phase that has not moved', (done) ->
      CR.decideCommentType(card, false, 0, false, prevMove, updateActions, 10, now).then (resp) ->
        expect(getPreviousStub.callCount).to.equal 0
        expect(getListStub.callCount).to.equal 1
        expect(compileStub.callCount).to.equal 1
        done()
      return
    return

  describe '.compileCommentArtifact(cardID, dateList, nameList, fromDate, toDate, addCommentOpt)', ->
    addComment = undefined

    beforeEach ->
      addComment = sandbox.stub(CR, 'addComment').resolves();
      calcStub = sandbox.stub(app.DateCommentHelpers.prototype, 'calculateDateDifference').returns([103,113]);
      comments = undefined
      return

    it 'will run the date diff functions, build and post a comment', (done) ->
      commentPromise = CR.compileCommentArtifact('xxxx', 'Workshop Prep', 'Workshop Prep', '2016-04-05T10:40:26.100Z', '2016-07-27T10:40:26.100Z', true, 0)
      commentPromise.done (resp) ->
        expect(addComment.calledWith('**Workshop Prep Stage:** `+103 days`. *04/05/2016 - 07/27/2016*.\n Expected days: 10 days. Actual Days spent: 113. **Total Project Days: 0**')).to.be.ok
        expect(addComment.callCount).to.equal 1
        done()
        return
      return

    it 'will run the date diff functions, but not actually create a comment', (done) ->
      CR.compileCommentArtifact('xxxx', 'Workshop Prep', 'Workshop Prep', '2016-04-05T10:40:26.100Z', '2016-07-27T10:40:26.100Z', false, 0).then (comment) ->
        expect(comment).to.eql '**Workshop Prep Stage:** `+103 days`. *04/05/2016 - 07/27/2016*.\n Expected days: 10 days. Actual Days spent: 113. **Total Project Days: 0**'
        expect(addComment.callCount).to.equal 0
        done()
        return
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

  describe '.buildComment', ->
    it 'generates a comment Based off of date entry fields', ->
      msg = CR.buildComment(103, 10, "2016-04-05T10:40:26.100Z", "2016-07-27T10:40:26.100Z", "Workshop", 113, 0)
      expect(msg).to.eql("**Workshop Stage:** `+103 days`. *04/05/2016 - 07/27/2016*.\n Expected days: 10 days. Actual Days spent: 113. **Total Project Days: 0**")
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

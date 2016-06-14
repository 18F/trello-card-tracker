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
      getCardsStub = sandbox.stub(CR, 'getCards').resolves([helpers.mockCommentCardObj])
      return

    it 'will card record for every card on the board', (done) ->
      CR.run().then (resp) ->
        expect(cardRecordStub.callCount).to.eql 1
        expect(getCards.callCount).to.eql 1
        done()
        return
      return
    return

  # describe.skip '.runOLD', ->
  #   getCards = undefined
  #   prevListStub = undefined
  #   findPrevStub = undefined
  #
  #   beforeEach ->
  #     deleteCards = sandbox.stub(CR, 'deleteCurrentComment').resolves({"currentCommentDeleted": true});
  #     sandbox.stub(CR, 'getListNameByID').resolves('list name');
  #     prevListStub = sandbox.stub(CR, 'getLastList').returns("Last List")
  #     compileStub = sandbox.stub(CR, 'compileCommentArtifact').resolves("Compiled Comment");
  #     return
  #
  #   afterEach ->
  #     sandbox.restore()
  #     return
  #
  #   it 'will run the cardRecorder class for a list that has moved recently', (done) ->
  #     # Set the action date to less than a day ago
  #     # to trigger the phase change
  #     cardActions = JSON.parse(JSON.stringify(helpers.actionListMove)) #clone to avoid issues with the tests below
  #     commentActions = JSON.parse(JSON.stringify(helpers.mockCommentCardObj.actions))
  #     cardActions = cardActions.concat(commentActions)
  #     hasMovedStub = sandbox.stub(CR, 'hasMovedCheck').returns(true)
  #     cardActions.forEach (action) ->
  #       action.date = (new Date(Date.now() - 21600000)).toISOString();
  #       return
  #     findPrevStub = sandbox.stub(CR, 'findPrevMoveDateFromComments').returns(cardActions[0].date);
  #     getCards = sandbox.stub(CR, 'getUpdateCards').resolves([{id: 'cccc', idList: 'vvv', name: 'BPA Project - Phase II', actions: cardActions}])
  #     CR.run().then ->
  #       expect(getCards.callCount).to.equal 1
  #       expect(deleteCards.callCount).to.equal 1
  #       expect(compileStub.callCount).to.equal 1
  #       # expect(compileStub.calledWith('cccc', prevListStub, prevListStub, findPrevStub, findPrevStub, true, 55)).to.be.ok
  #       done()
  #       return
  #     return
  #
  #   it 'will run the cardRecorder class for a list that has not moved', (done) ->
  #     cardActions = helpers.actionListNoMove.concat(helpers.mockCommentCardObj.actions)
  #     hasMovedStub = sandbox.stub(CR, 'hasMovedCheck').returns(false)
  #     getCards = sandbox.stub(CR, 'getUpdateCards').resolves([{id: 'cccc', idList: 'vvv', name: 'BPA Project - Phase II', actions: cardActions}])
  #     CR.run().then (resp) ->
  #       expect(deleteCards.callCount).to.equal 1
  #       expect(compileStub.callCount).to.equal 1
  #       done()
  #       return
  #     return
  #   return

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
      deleteCards = sandbox.stub(CR, 'deleteCurrentComment').resolves({"currentCommentDeleted": true})
      hasMovedStub = sandbox.stub(CR, 'hasMovedCheck').returns(true)
      calcTotalStub = sandbox.stub(CR, 'calcTotalDays').returns(55)
      decideStub = sandbox.stub(CR, 'decideCommentType').resolves()
      finalListStub = sandbox.stub(CR, 'inFinalList').resolves(false);
      cardActions = helpers.actionListNoMove.concat(helpers.mockCommentCardObj.actions)
      cardMock = {id: 'cccc', idList: 'vvv', name: 'BPA Project - Phase II', actions: cardActions}
      cardActions.forEach (action) ->
        action.date = (new Date(Date.now() - 21600000)).toISOString();
        return
      findPrevStub = sandbox.stub(CR, 'findPrevMoveDateFromComments').returns(cardActions[0].date);
      return


    it 'runs the card record for a single card', (done) ->
      CR.cardRecordFunctions(cardMock).then (resp) ->
        expect(deleteCards.callCount).to.equal 1
        expect(calcTotalStub.callCount).to.equal 1
        expect(decideStub.callCount).to.equal 1
        expect(finalListStub.callCount).to.equal 1
        done()
      return

    it 'will survive a trello error', (done) ->
      CR.cardRecordFunctions(cardMock).catch (err) ->
        expect(stub.callCount).to.eql 1
        expect(err).to.eql error
        done()
        return
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

  describe '.hasMovedCheck(actionList)', ->
    it 'will return true if a card has a list of acitons that has not moved', ->
      hasMoved = CR.hasMovedCheck(helpers.actionListMove)
      expect(hasMoved).to.eql [helpers.actionListMove[1]]
      return

    it 'will return false if a card has a list of acitons that has not moved', ->
      hasMoved = CR.hasMovedCheck(helpers.actionListNoMove)
      expect(hasMoved).to.be.false
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

  describe '.calcTotalDays(commentList, nowMoment)', ->
    it 'calculates takes a comment list and finds the oldest date and then calculates the total number of business days', ->
      comments = JSON.parse(JSON.stringify(helpers.mockCommentCardObj.actions)) #clone to modify
      oldComment =
        id: '2'
        data: text: '**IAA Stage:** `+19 days`. *01/02/2016 - 03/08/2016*. Expected days: 2 days. Actual Days spent: 21.'
      comments.push oldComment
      fakeNow = moment("2016-10-10")
      totalDays = CR.calcTotalDays(comments, fakeNow)
      expect(totalDays).to.eql 195
      return

    it 'will return 0 if the comment list does not have and "MM/DD/YYYY - MM/DD/YYYY" regular expressions in the text', ->
      comments = JSON.parse(JSON.stringify(helpers.mockCommentCardObj.actions))
      comments[0].data.text = "This comment has no date."
      fakeNow = moment("2016-10-10")
      totalDays = CR.calcTotalDays(comments, fakeNow)
      expect(totalDays).to.eql 0
      return
    return

  describe '.decideCommentType(card, finalList, daysSinceUpdate, hasMoved, prevMove, updateActions, totalDays, nowMoment)', ->

    it 'chooses that a comment should be written to last list phase', (done) ->
      CR.decideCommentType(card, true, 10, true, prevMove, updateActions, 10, nowMoment).then (resp) ->
        # expect
        done()
      return
    it 'chooses that a comment should be written to a new phase', (done) ->
      CR.decideCommentType(card, false, 0, true, prevMove, updateActions, 10, nowMoment).then (resp) ->
        # expect
        done()
      return

    it 'chooses that a comment should be written to a current phase that has moved', (done) ->
      CR.decideCommentType(card, false, 0, true, prevMove, updateActions, 10, nowMoment).then (resp) ->
        # expect
        done()
      return

    it 'chooses that a comment should be written to a current phase that has not moved', (done) ->
      CR.decideCommentType(card, false, 0, true, prevMove, updateActions, 10, nowMoment).then (resp) ->
        # expect
        done()
      return

    it 'survives a trello error', (done) ->
      CR.decideCommentType(card, false, 0, true, prevMove, updateActions, 10, nowMoment).then (resp) ->
        # expect
        done()
      return
    return

  describe '.compileCommentArtifact(cardID, dateList, nameList, fromDate, toDate, addCommentOpt)', ->
    addComment = undefined

    beforeEach ->
      addComment = sandbox.stub(CR, 'addComment').resolves();
      calcStub = sandbox.stub(CR, 'calculateDateDifference').returns([103,113]);
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

  describe 'checkCommentsForDates(commentList, latest)', ->
    beforeEach ->
      localMoment = undefined
      return
    afterEach ->
      localMoment = null
      return

    it 'will check if a comment has a date and return the lastest date from a comment list', ->
      lastMoment = moment("2016-03-21").toISOString(); #to get out of localization of test suite
      prevMove = CR.checkCommentsForDates(helpers.mockCommentCardObj.actions, true)
      expect(prevMove).to.eql lastMoment
      return

    it 'will check if a comment has a date and return the first date from a comment list', ->
      localMoment = moment("2016-01-02").toISOString(); #to get out of localization of test suite
      commentList = JSON.parse(JSON.stringify(helpers.mockCommentCardObj.actions)) #clone to modify
      oldComment =
        id: '2'
        data: text: '**IAA Stage:** `+19 days`. *01/02/2016 - 03/08/2016*. Expected days: 2 days. Actual Days spent: 21.'
      commentList.push oldComment
      prevMove = CR.checkCommentsForDates(commentList, false)
      expect(prevMove).to.eql localMoment
      return

    it 'will return false when there is no comment that matches the date string', ->
      comments = JSON.parse(JSON.stringify(helpers.mockCommentCardObj.actions))
      comments[0].data.text = "This comment has no date."
      prevMove = CR.checkCommentsForDates(comments, true)
      expect(prevMove).to.be.false
      return
    return

  describe 'findPrevMoveDateFromComments(opts)', ->

    it 'will return the date if list of comments includes text with the dates in the MM/DD/YYYY -MM/DD/YYYY format ', ->
      localMoment = moment("2016-03-21").toISOString(); #to get out of localization of test suite
      prevMove = CR.findPrevMoveDateFromComments({"commentList": helpers.mockCommentCardObj.actions, "actionList": helpers.actionListMove, "cardCreationDate": '2016-04-05T10:40:26.100Z'})
      expect(prevMove).to.eql localMoment
      return

    it 'will return the last Action date is there is actionList and there is no date in the commentcard', ->
      comments = JSON.parse(JSON.stringify(helpers.mockCommentCardObj.actions))
      comments[0].data.text = "This comment has no date."
      prevMove = CR.findPrevMoveDateFromComments({"commentList": comments, "actionList": helpers.actionListMove, "cardCreationDate": '2016-04-05T10:40:26.100Z'})
      expect(prevMove).to.eql '2016-02-25T22:00:35.866Z'
      return

    it 'will return the creation date if there is no actionList or no current comment', ->
      comments = JSON.parse(JSON.stringify(helpers.mockCommentCardObj.actions))
      comments[0].data.text = "This comment has no date."
      prevMove = CR.findPrevMoveDateFromComments({"commentList": comments, "cardCreationDate": '2016-04-05T10:40:26.100Z'})
      expect(prevMove).to.eql '2016-04-05T10:40:26.100Z'
      return

    it 'will return "01/01/2016 if there is nothing in the options', ->
      comments = helpers.mockCommentCardObj.actions
      comments[0].data.text = "This comment has no date."
      localMoment = moment("2016-01-01").toISOString()
      prevMove = CR.findPrevMoveDateFromComments({})
      expect(prevMove).to.eql localMoment
      return
    return

  describe '.inFinalList(cardIDList)', ->
    stages = undefined
    stageName = undefined

    it 'returns true if the card is in the last list', (done) ->
      stages = helpers.expectedStageObject.stages[0].substages[1]
      # lastStage = stages[stages.length -1]
      stageName = sandbox.stub(CR, 'getListNameByID').resolves(stages)
      CR.inFinalList('xxx').then (isInFinalList) ->
        expect(isInFinalList).to.be.true
        done()
      return

    it 'returns false if the card is not in the last list of the board', (done) ->
      stages = helpers.expectedStageObject.stages[0].substages[0]
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

  describe '.findHolidaysBetweenDates', ->
    it 'will not find a holiday between dates that do not have a holiday between them', ->
      holidays = CR.findHolidaysBetweenDates(new Date('01-04-2016'), new Date('01-10-2016'))
      expect(holidays).to.eql 0
      return

    it 'will find that there are two holidays between 4/5/16 and 7/27/16', ->
      holidays = CR.findHolidaysBetweenDates(new Date('2016-04-05'), new Date('2016-07-27'))
      expect(holidays).to.eql 2
      return

    return

  describe '.calculateDateDifference', ->
    it 'calculates the difference between when the card was moved and the expected time', ->
      difference = CR.calculateDateDifference(10, "2016-04-05", "2016-07-27")
      expect(difference).to.eql [69,79]
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

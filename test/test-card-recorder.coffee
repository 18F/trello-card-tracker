expect = require('chai').expect
_un = require("underscore")
app = require('../app')
helpers = require('./test-helpers.js')
q = require('q')
trello = require('node-trello')
sinon = require('sinon');
require('sinon-as-promised');

# sinon.stub::asyncOutcome = (args, asyncResp) ->
#   @withArgs(args).yieldsAsync(asyncResp)
#   this

CR = new app.CardRecorder(helpers.mockfile, helpers.board)
# CR.Stages = helpers.expectedStageObject

describe 'app.CardRecorder', ->
  describe '.run', ->
    sandbox = undefined
    deleteCards = undefined
    listStub = undefined
    compileStub = undefined
    getCards = undefined
    lastListStub = undefined

    beforeEach ->
      sandbox = sinon.sandbox.create()
      deleteCards = sandbox.stub(CR, 'deleteCurrentComment').resolves({});
      sandbox.stub(CR, 'getListNameByID').resolves('list name');
      lastListStub = sandbox.stub(CR, 'getLastList')
      compileStub = sandbox.stub(CR, 'compileCommentArtifact').yieldsAsync();
      return

    afterEach ->
      sandbox.restore()
      return

    it 'will run the cardRecorder class for a list that has moved', (done) ->
      # Set the action date to less than a day ago
      # to trigger the phase change
      cardActions = helpers.actionListMove
      cardActions.forEach (action) ->
        action.date = (new Date(Date.now() - 21600000)).toISOString();
        return

      getCards = sandbox.stub(CR, 'getUpdateCards').resolves([{id: 'cccc', idList: 'vvv', actions: cardActions}])
      CR.run ->
        expect(deleteCards.callCount).to.equal 1
        expect(compileStub.callCount).to.equal 1
        done()
        return
      return

    it 'will run the cardRecorder class for a list that has not moved', (done) ->
      getCards = sandbox.stub(CR, 'getUpdateCards').resolves([{id: 'cccc', idList: 'vvv', actions: helpers.actionListNoMove}])
      CR.run ->
        expect(deleteCards.callCount).to.equal 1
        expect(compileStub.callCount).to.equal 1
        done()
        return
      return
    return

  describe '.getUpdateCards(callback)', ->
    sandbox = undefined
    stub = undefined
    error = null
    cards = [ 'card1', 'card2', 'card3' ];

    beforeEach ->
      sandbox = sinon.sandbox.create();
      stub = sandbox.stub(trello.prototype, 'get').yieldsAsync(error, cards)
      return

    afterEach ->
      sandbox.restore()
      error = new Error('Test Error')
      return

    it 'will ping trello and get the updated actions of a card', (done) ->
      CR.getUpdateCards().then (resp) ->
        expect(stub.callCount).to.eql 1
        expect(resp).to.eql cards
        done()
        return
      return

    it 'will survive a trello error', (done) ->
      CR.getUpdateCards().catch (err) ->
        expect(stub.callCount).to.eql 1
        expect(err).to.eql error
        done()
        return
      return
    return

  describe '.deleteCurrentComment(cardID)', ->
    runs = 0
    sandbox = undefined
    getStub = undefined
    delStub = undefined
    error = new Error('Test Error')

    beforeEach ->
      currentComment = JSON.parse(JSON.stringify(helpers.mockCurrentComment))
      currentComment.data.text = "**Current Stage:** This comment says current stage."
      notCurrentComment = JSON.parse(JSON.stringify(helpers.mockCurrentComment))
      notCurrentComment.data.text = "This comment is not in the current stage."
      notCurrentComment.id = 'not-current'
      sandbox = sinon.sandbox.create()
      getStub = sandbox.stub(trello.prototype, 'get').withArgs('/1/cards/380/actions').yieldsAsync(null, [ currentComment ]).withArgs('/1/cards/1000/actions').yieldsAsync(null, [ notCurrentComment ])
      delStub = sandbox.stub(trello.prototype, 'del').withArgs('/1/actions/' + currentComment.id).yieldsAsync(null, {}).withArgs('/1/actions/' + notCurrentComment.id).yieldsAsync(null, "no current comment")

      runs++
      if runs == 3
        getStub.withArgs('/1/cards/380/actions').yieldsAsync(error, null)
      else if runs == 4
        delStub.withArgs('/1/actions/' + currentComment.id).yieldsAsync(error, null)
      return

    afterEach ->
      sandbox.restore()
      return

    it 'will delete a comment if a bolded text saying "Current Stage" appears', (done) ->
      CR.deleteCurrentComment("380").then (data) ->
        expect(data).to.eql {};
        done()
        return
      return

    it 'will not delete a comment that does not have a current stage', (done) ->
      CR.deleteCurrentComment("1000").then (data) ->
        expect(data).to.eql "no current comment";
        done()
        return
      return

    it 'will survive a trello error fetching cards', (done) ->
      CR.deleteCurrentComment("380").catch (err) ->
        expect(err).to.eql error;
        done()
        return
      return

    it 'will survive a trello error deleting a comment', (done) ->
      CR.deleteCurrentComment("380").catch (err) ->
        expect(err).to.eql error;
        done()
        return
      return

    return

  describe '.hasMovedCheck(actionList)', ->
    it 'will return true if a card has a list of acitons that has not moved', ->
      hasMoved = CR.hasMovedCheck(helpers.actionListMove)
      expect(hasMoved).to.be.true
      return

    it 'will return false if a card has a list of acitons that has not moved', ->
      hasMoved = CR.hasMovedCheck(helpers.actionListNoMove)
      expect(hasMoved).to.be.false
      return
    return

  describe '.getLastList(updateActionID)', ->
    it 'will grab the name of the last list a trello card was part of given that the card has moved', ->
      listName = CR.getLastList helpers.actionListMove[1]
      expect(listName).to.equal("Old List")
      return

    # get this should be undefined
    it 'will return an error if the action does not have a list before', ->
      expect(->
        CR.getLastList helpers.actionListMove[0]
      ).to.throw Error
      return
    return

  describe '.compileCommentArtifact', ->
    sandbox = undefined
    addComment = undefined
    beforeEach ->
      sandbox = sinon.sandbox.create()
      addComment = sandbox.stub(CR, 'addComment').resolves();
      calcStub = sandbox.stub(CR, 'calculateDateDifference').returns([103,113]);
      return
    afterEach ->
      sandbox.restore()
      return
    it 'will run the date diff functions, build and post a comment', (done) ->
      CR.compileCommentArtifact 'xxxx', 'Workshop Prep', 'Workshop Prep', '2016-04-05T10:40:26.100Z', '2016-07-27T10:40:26.100Z', true, ->
        expect(addComment.calledWith('**Workshop Prep Stage:** `+103 days`. *04/05/2016 - 07/27/2016*.\n Expected days: 10 days. Actual Days spent: 113.')).to.be.ok
        expect(addComment.callCount).to.equal 1
        done()
        return
      return
    it 'will run the date diff functions, but not actually create a comment', (done) ->
      CR.compileCommentArtifact 'xxxx', 'Workshop Prep', 'Workshop Prep', '2016-04-05T10:40:26.100Z', '2016-07-27T10:40:26.100Z', false, (comment) ->
        expect(comment).to.eql '**Workshop Prep Stage:** `+103 days`. *04/05/2016 - 07/27/2016*.\n Expected days: 10 days. Actual Days spent: 113.'
        expect(addComment.callCount).to.equal 0
        done()
        return
      return
    return

  describe '.findHolidaysBetweenDates', ->
    it 'will not find a holiday between dates that do not have a holiday between them', ->
      holidays = CR.findHolidaysBetweenDates('01-04-2016', '01-10-2016')
      expect(holidays).to.eql 0
      return

    it 'will find that there are two holidays between 4/5/16 and 7/27/16', ->
      holidays = CR.findHolidaysBetweenDates("2016-04-05", "2016-07-27")
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
      msg = CR.buildComment(103, 10, "2016-04-05T10:40:26.100Z", "2016-07-27T10:40:26.100Z", "Workshop", 113)
      expect(msg).to.eql("**Workshop Stage:** `+103 days`. *04/05/2016 - 07/27/2016*.\n Expected days: 10 days. Actual Days spent: 113.")
      return
    return

  describe '.addComment', ->
    sandbox = undefined
    error = null

    beforeEach ->
      sandbox = sinon.sandbox.create().stub(trello.prototype, 'post').yieldsAsync(error, helpers.createCommentResp)
      return

    afterEach ->
      sandbox.restore()
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

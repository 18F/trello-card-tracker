expect = require('chai').expect
_un = require("underscore")
app = require('../app')
helpers = require('./test-helpers.js')
q = require('q')
trello = require("node-trello")
sinon = require("sinon");

# sinon.stub::asyncOutcome = (args, asyncResp) ->
#   @withArgs(args).yieldsAsync(asyncResp)
#   this

CR = new app.CardRecorder(helpers.mockfile, helpers.board)

describe 'app.CardRecorder', ->
  sandbox = undefined
  describe '.getUpdateCards(callback)', ->
    before ->
      sandbox = sinon.sandbox.create();
      sandbox.stub(trello.prototype, 'get').returns(helpers.actionListMove)
      return
    after ->
      sandbox.restore()
      return
    it 'will ping trello and get the updated actions of a card', ->
      CR.getUpdateCards "callback", (resp)->
        expect(resp).to.equal(helpers.actionListMove)
        return
      return
    return

  describe '.deleteCurrentComment(cardID)', ->
    sandbox = undefined
    beforeEach ->
      currentComment = _un.clone(helpers.mockCurrentComment)
      currentComment["text"] = "**Current Stage** This comment says comment stage."
      notCurrentComment = _un.clone(helpers.mockCurrentComment)
      notCurrentComment["text"] = "This comment is not in the current stage."
      sandbox = sinon.sandbox.create()
      sandbox.stub(trello.prototype, 'get').withArgs('380').yieldsAsync([ currentComment ]).withArgs('1000').yieldsAsync([ notCurrentComment ])
      delStub = sandbox.stub(trello.prototype, 'del').withArgs("380").yieldsAsync({}).withArgs("1000").yieldsAsync("no current comment")
      return
    afterEach ->
      sandbox.restore()
      return
    it 'will delete a comment if a bolded text saying "Current Stage" appears', ->
      CR.deleteCurrentComment "380", (data) ->
        expect(data).to.eql({});
        return
      return

    it 'will not delete a comment that does not have a current stage', ->
      CR.deleteCurrentComment "1000", (data) ->
        expect(data).to.eql("no current comment");
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

  describe.skip '.getLastList(updateActionID)', ->
    it 'will grab the name of the last list a trello card was part of given that the card has moved', ->
      listStub = helpers.trelloStub("get", null, helpers.actionListMove[1])
      CR.getListIDbyName "47", (listName)->
        expect(listName).to.eql("Old List")
        listStub.restore()
        return
      return

    it 'will return an error if the action does not have a list before', ->
      listStub = helpers.trelloStub("get", null, helpers.actionListMove[0])
      CR.getListIDbyName "4c", (result)->
        expect(result).to.be.undefined
        listStub.restore()
        return
      return

    return

  describe.skip '.compileCommentArtifact', ->
    it 'will run the date diff functions, build and post a comment', ->
      return
    return

  describe '.calculateDateDifference', ->
    it 'calculates the difference between when the card was moved and the expected time', ->
      difference = CR.calculateDateDifference(10, "2016-04-05", "2016-07-27")
      expect(difference).to.eql [71,81]
      return
    return

  describe '.buildComment', ->
    it 'generates a comment \i87\]ased off of date entry fields', ->
      msg = CR.buildComment(103, 10, "2016-04-05T10:40:26.100Z", "2016-07-27T10:40:26.100Z", "Workshop", 113)
      expect(msg).to.eql("**Workshop Stage:** `+103 days`. *04/05/2016 - 07/27/2016*.\n Expected days: 10 days. Actual Days spent: 113.")
      return
    return

  describe.skip '.addComment', ->
    it 'adds a comment to a board', ->
      commentStub = helpers.trelloStub('get', null, helpers.createCommentResp)
      CR.addComment 'test message\n', cardID, (resp) ->
        expect(resp.data.text).to.equal 'test message\n'
        return
    return

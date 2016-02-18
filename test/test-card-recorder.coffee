expect = require('chai').expect
_un = require("underscore")
app = require('../app')
helpers = require('./test-helpers.js')
q = require('q')

CR = new app.CardRecorder(helpers.ordermockfile, helpers.board)

describe 'CardRecorder', ->
  describe.skip '.createOrders', ->
    it 'will take a yaml file of orders and create cards for every order', ->
      CR.createOrders(mockfile)
      expect(trelloCards).to.include.members(helpers.testCards)
      return
    return

  describe.skip '.addComment', ->
    it 'adds a comment to a board', ->
      CR.addComment("test message", helpers.testCardID)
      expect(trelloTestCard.comment).to.include("test message")
      return
    return

  describe '.calculateDateDifference', ->
    it 'calculates the difference between when the card was moved and the expected time', ->
      difference = CR.calculateDateDifference(10, "2016-04-05", "2016-07-27")
      expect(difference).to.equal(103)
      return
    return

  describe.skip '.findLastMove', ->
    it 'finds when the last time a card was moved and returns a date', ->
      CR.findLastMove(helpers.testCardID).then (lastMove) ->
        expect(lastMove).to.equal '2016-02-16'
        return
      return
    return

  describe.skip '.buildCurrentComment', ->
    it 'adds a comment for the current phase of the project', ->
      return
    return

  describe '.buildComment', ->
    it 'generates a comment \i87\]ased off of date entry fields', ->
      msg = CR.buildComment(103, 10, "2016-07-27T00:40:26.100Z", "2016-04-05T00:40:26.100Z")
      expect(msg).to.equal("**WORKSHOP PHASE:** `+103 DAYS.` *04/05/2016 - 07/27/2016*.\n Expected days: 10 days. Actual Days spent: 113.")
      return
    return

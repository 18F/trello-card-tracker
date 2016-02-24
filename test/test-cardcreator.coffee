expect = require('chai').expect
_un = require("underscore")
app = require('../app')
helpers = require('./test-helpers.js')
q = require('q')

CC = new app.CardCreator(helpers.ordermockfile, helpers.board)

describe 'app.CardCreator', ->
  describe.skip '.createOrders', ->
    it 'will take a yaml file of orders and create cards for every order', ->
      CC.createOrders(mockfile)
      expect(trelloCards).to.include.members(helpers.testCards)
      return
    return

  describe.skip '.createCard', ->
    it 'will create an individual card on trello', ->
      CC.createCard(helpers.mockOrder)
      expect(trelloCards).to.include.members(helpers.testCard)
      return
    return

  describe '.descriptionMaker', ->
    it 'will create a description for a new card given bpa order details object', ->
      description = CC.descriptionMaker(helpers.mockOrder)
      expect(description).to.equal("Project: BPA Project\nAgency: General Services Administration\nSubAgency: OCSIT\nTrello Board: https://trello.com/b/nmYlvlhu/bpa-test-dashboard")
      return
    return

  return

expect = require('chai').expect
_un = require('underscore')
app = require('../app')
helpers = require('./test-helpers.js')
q = require('q')
sinon = require('sinon')
trello = require('node-trello')
CC = new app.CardCreator(helpers.mockfile, helpers.board)

describe 'app.CardCreator', ->
  sandbox = undefined
  before ->
    sandbox = sinon.sandbox.create()
    postStub = sandbox.stub(CC, 'createOrders').yieldsAsync(helpers.testCard)
    return

  after ->
    sandbox.restore()
    err = new Error('Test error')
    return
  describe '.createOrders', ->
    it 'will take a yaml file of orders and create cards for every order', ->
      CC.createOrders helpers.orderMockFile, (resp) ->
        expect(resp).to.equal(helpers.testCard)
        return
      return
    return

  describe '.createCard', ->
    postStub = undefined
    sandbox = undefined
    err = null
    beforeEach ->
      sandbox = sinon.sandbox.create()
      postStub = sandbox.stub(trello.prototype, 'post').yieldsAsync(err, undefined)
      listStub = sandbox.stub(CC, 'getListIDbyName').withArgs("CO Review").yieldsAsync('aaaaaa')
      return
    afterEach ->
      sandbox.restore()
      err = new Error('Test Error')
      return

    it 'will create an individual card on trello', (done) ->
      CC.createCard(helpers.mockOrder).then (resp) ->
        expect(resp).to.equal(helpers.testCard)
        done()
        return
      return

    it 'survives a trello error', (done) ->
      CC.createCard(helpers.mockOrder).catch ->
        expect(postStub.callCount).to.eql 1
        done()
        return
      return
    return

  describe '.descriptionMaker', ->
    it 'will create a description for a new card given bpa order details object', ->
      description = CC.descriptionMaker(helpers.mockOrder)
      expect(description).to.equal("Project: BPA Project\nAgency: General Services Administration\nSubAgency: OCSIT\nTrello Board: https://trello.com/b/xxxx/bpa-dash")
      return
    return

  return

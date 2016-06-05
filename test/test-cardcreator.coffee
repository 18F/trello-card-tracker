expect = require('chai').expect
app = require('../app')
helpers = require('./test-helpers.js')
q = require('q')
sinon = require('sinon')
require('sinon-as-promised')
trello = require('node-trello')
CC = new app.CardCreator(helpers.mockfile, helpers.board)

describe 'app.CardCreator', ->
  sandbox = undefined
  beforeEach ->
    sandbox = sinon.sandbox.create()
    return

  afterEach ->
    sandbox.restore()
    return

  describe '.createOrders', ->
    createCardStub = undefined

    beforeEach ->
      createCardStub = sandbox.stub(CC, 'createCard').resolves()
      return

    it 'will take a yaml file of orders and create cards for every order', (done) ->
      CC.createOrders(helpers.orderMockFile).then (resp) ->
        # This should be called once per order in the mock order file
        expect(createCardStub.callCount).to.eql 1
        done()
        return
      return
    return

  describe '.createCard', ->
    postStub = undefined
    err = null
    beforeEach ->
      postStub = sandbox.stub(trello.prototype, 'post').yieldsAsync(err, helpers.testCard)
      listStub = sandbox.stub(CC, 'getListIDbyName').withArgs("CO Review").resolves('aaaaaa')
      memberStub = sandbox.stub(CC, 'getMember').withArgs("bob-test").resolves({"id": "chilly"})
      return
    afterEach ->
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

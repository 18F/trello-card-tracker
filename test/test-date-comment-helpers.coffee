expect = require('chai').expect
app = require('../app')
helpers = require('./test-helpers.js')
q = require('q')
trello = require('node-trello')
sinon = require('sinon')
moment = require('moment')
require('sinon-as-promised')
DateCommentHelpers = new app.DateCommentHelpers()
d = new Date()
currentYear = d.getFullYear()

describe 'app.DateCommentHelpers', ->
  describe '.hasMovedCheck(actionList)', ->
    it 'will return true if a card has a list of acitons that has not moved', ->
      hasMoved = DateCommentHelpers.hasMovedCheck(helpers.actionListMove)
      expect(hasMoved).to.eql [helpers.actionListMove[1]]
      return

    it 'will return false if a card has a list of acitons that has not moved', ->
      hasMoved = DateCommentHelpers.hasMovedCheck(helpers.actionListNoMove)
      expect(hasMoved).to.be.false
      return
    return

  describe 'checkCommentsForDates(commentList, latest, findEndDate)', ->
    beforeEach ->
      localMoment = undefined
      return
    afterEach ->
      localMoment = null
      return

    it 'will check if a comment has a date and return the first date in the lattest comment from a comment list', ->
      lastMoment = moment(currentYear+'-03-08').toISOString(); #to get out of localization of test suite
      prevMove = DateCommentHelpers.checkCommentsForDates(helpers.mockCommentCardObj.actions, true, false)
      expect(prevMove).to.eql lastMoment
      return

    it 'will check if a comment has a date and return the seconde date in the lattest comment from a comment list', ->
      lastMoment = moment(currentYear+'-03-21').toISOString(); #to get out of localization of test suite
      prevMove = DateCommentHelpers.checkCommentsForDates(helpers.mockCommentCardObj.actions, true, true)
      expect(prevMove).to.eql lastMoment
      return

    it 'will check if a comment has a date and return the first date from a comment list', ->
      localMoment = moment(currentYear+'-01-02').toISOString(); #to get out of localization of test suite
      commentList = JSON.parse(JSON.stringify(helpers.mockCommentCardObj.actions)) #clone to modify
      oldComment =
        id: '2'
        data: text: "**IAA Stage:** `+19 days`. *01/02/#{currentYear} - 03/08/#{currentYear}*. Expected days: 2 days. Actual Days spent: 21."
      commentList.push oldComment
      prevMove = DateCommentHelpers.checkCommentsForDates(commentList, false, false)
      expect(prevMove).to.eql localMoment
      return

    it 'will return false when there is no comment that matches the date string', ->
      comments = JSON.parse(JSON.stringify(helpers.mockCommentCardObj.actions))
      comments[0].data.text = "This comment has no date."
      prevMove = DateCommentHelpers.checkCommentsForDates(comments, true, false)
      expect(prevMove).to.be.false
      return
    return

  describe 'generateFromDateForNewComment(deletedNewComment, comments, altToDate)', ->
    comments = undefined

    before ->
      comments = JSON.parse(JSON.stringify(helpers.mockCommentCardObj.actions)) #clone to modify

    it 'returns the to date of the most recent comment with a MM/DD/YYYY -MM/DD/YYYY date string in it if the to date has been edited', ->
      testMoment = moment(currentYear+'-03-21')
      fromDate = DateCommentHelpers.generateFromDateForNewComment(false, comments, testMoment)
      expect(fromDate.toISOString()).to.eql(testMoment.toISOString())
      return

    it 'returns the from date of the most recent comment with a MM/DD/YYYY -MM/DD/YYYY date string if the card was in the same list for over a day (there was a current comment deleted)', ->
      testMoment = moment(currentYear+'-03-08')
      fromDate = DateCommentHelpers.generateFromDateForNewComment(true, comments, false)
      expect(fromDate.toISOString()).to.eql(testMoment.toISOString())
      return

    it 'returns the to date of the most recent comment with a MM/DD/YYYY -MM/DD/YYYY date string if the card was in the same list for less than a day (there was not a current comment deleted)', ->
      testMoment = moment(currentYear+'-03-21')
      fromDate = DateCommentHelpers.generateFromDateForNewComment(false, comments, false)
      expect(fromDate.toISOString()).to.eql(testMoment.toISOString())
      return
    return

  describe '.differentToDate(comments, currentTime)', ->
    now = undefined
    comments = undefined

    before ->
      now = moment()
      comments = JSON.parse(JSON.stringify(helpers.mockCommentCardObj.actions))

    it 'returns the most recent to date in a comment if it is greater than 2 days', ->
      comments[0].data.text = '**Current Stage:** +19 days. *03/08/2016 - 03/21/2016*. Expected days: 2 days. Actual Days spent: 21.'
      diffToDate = DateCommentHelpers.differentToDate(comments, now)
      expectedDate = moment('2016-03-21').toISOString()
      expect(diffToDate.toISOString()).to.eql expectedDate
      return

    it 'returns false if the most recent to date in a comment is within 2 days of today than today', ->
      nowString = now.format('L')
      comments[0].data.text = "**IAA Stage:** **+19 days**. *01/02/#{currentYear} - #{nowString}*. Expected days: 2 days. Actual Days spent: 21."
      diffToDate = DateCommentHelpers.differentToDate(comments, now)
      expect(diffToDate).to.eql false
      return
    return

  describe '.calcTotalDays(commentList, nowMoment)', ->
    it 'calculates takes a comment list and finds the oldest date and then calculates the total number of business days', ->
      comments = JSON.parse(JSON.stringify(helpers.mockCommentCardObj.actions)) #clone to modify
      oldComment =
        id: '2'
        data: text: "**IAA Stage:** `+19 days`. *01/02/#{currentYear} - 03/08/#{currentYear}*. Expected days: 2 days. Actual Days spent: 21."
      comments.push oldComment
      fakeNow = moment(currentYear+'-10-10')
      totalDays = DateCommentHelpers.calcTotalDays(comments, fakeNow)
      expect(totalDays).to.eql 195
      return

    it 'will return 0 if the comment list does not have and "MM/DD/YYYY - MM/DD/YYYY" regular expressions in the text', ->
      comments = JSON.parse(JSON.stringify(helpers.mockCommentCardObj.actions))
      comments[0].data.text = "This comment has no date."
      fakeNow = moment(currentYear+'-10-10')
      totalDays = DateCommentHelpers.calcTotalDays(comments, fakeNow)
      expect(totalDays).to.eql 0
      return
    return

  describe '.calculateDateDifference', ->
    it 'calculates the difference between when the card was moved and the expected time', ->
      difference = DateCommentHelpers.calculateDateDifference(10, moment(currentYear+'-04-05'), moment(currentYear+'-07-27'))
      expect(difference).to.eql [69,79]
      return
    return

  describe '.findHolidaysBetweenDates', ->
    it 'will not find a holiday between dates that do not have a holiday between them', ->
      holidays = DateCommentHelpers.findHolidaysBetweenDates(new Date('01-04-'+currentYear), new Date('01-10-'+currentYear))
      expect(holidays).to.eql 0
      return

    it 'will find that there are two holidays between 4/5/16 and 7/27/16', ->
      holidays = DateCommentHelpers.findHolidaysBetweenDates(new Date(currentYear+'-04-05'), new Date(currentYear+'-07-27'))
      expect(holidays).to.eql 2
      return
    return
  return

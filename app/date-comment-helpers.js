'use strict';

const instadate = require('instadate');
const moment = require('moment');
const fedHolidays = require('@18f/us-federal-holidays');
const d = new Date();
const holidays = fedHolidays.allForYear(d.getFullYear());

class DateCommentHelpers {
  /**
   * Check if a card has ever moved
   * @param {Array} actionList - an array of action objects for a trello card
   * @returns {Array|Boolean} - Either the actions that represent a card move,
   * or false if the card has not moved
   */
  hasMovedCheck(actionList) {
    let updated = false;
    const moves = actionList.filter(a => 'listBefore' in a.data);
    if (moves.length) {
      updated = moves;
    }
    return updated;
  }

  /**
   * Use regex to find the listed dates in card comment text
   * @param {Array} commentList - an array of action objects, that are
   * specifically comments for a trello card
   * @param {Boolean} latest - Whether you are looking for the date in the latest
   * the earliest comment
   * @param {Boolean} findToDate - Whether you are looking for the from date (false)
   * or the too date
   * @returns {String|Boolean} - The date found in isoFormat,
   * or false if no date found
   */
  checkCommentsForDates(commentList, latest, findToDate) {
    let myRegex = /(\d\d\/\d\d\/201\d) - \d\d\/\d\d\/201\d/; // Find the first date in the comment string
    if (findToDate) {
      myRegex = /\d\d\/\d\d\/201\d - (\d\d\/\d\d\/201\d)/;
    }

    let realList = commentList;
    if (!latest) {
      // Reverse order to get first comment but create a shallow copy to not break integration
      realList = commentList.slice(0).reverse();
    }
    const correctComment = realList.find(comment => {
      const match = myRegex.exec(comment.data.text);
      return !!match;
    });
    if (correctComment) {
      const commentDateMatch = myRegex.exec(correctComment.data.text);
      const commentDate = commentDateMatch[1];
      const isoDate = moment(commentDate, 'MM/DD/YYYY').toISOString();
      return isoDate;
    }
    return false;
  }

  /**
   * if their is an altenative toDate check for that date?
   * @param {Boolean} deletedNewComment - Whether a current comment was deleted
   * @param {Object} comments - Array of card comment objects
   * @param {String} altToDate - A to date that to use instead of one from comments
   * @returns {String} - The date found in isoFormat either from the comments,
   * or the altToDate if used.
   */
  generateFromDateForNewComment(deletedNewComment, comments, altToDate) {
    if (altToDate) {
      return altToDate;
    }
    return moment(this.checkCommentsForDates(comments, true, !deletedNewComment));
  }

  /**
   * Finds a two date if the most recent one is not today/yesterday
   * @param {Array} comment - an array of card object comments
   * @param {Object} currentTime - moment date object for current time
   * @returns {Object|Boolean} - the total number of days that a card has been around
   or false if none found
   */
  differentToDate(comments, currentTime) {
    const mostRecentToDate = this.checkCommentsForDates(comments, true, true);
    const recentToMoment = moment(mostRecentToDate);
    const differenceFromLastComment = currentTime.diff(recentToMoment, 'days');
    if (differenceFromLastComment > 2) {
      return recentToMoment;
    }
    return false; // Default to returning today
  }

  /**
   * Calculates how long a card has been around from earliest comment found
   * @param {Array} commentList - an array of card object comments
   * @param {Object} nowMoment - moment date object for current time
   * @returns {Number} - the total number of days that a card has been around
   */
  calcTotalDays(commentList, nowMoment) {
    const firstDate = this.checkCommentsForDates(commentList, false, false);
    if (firstDate) {
      const dayDif = this.calculateDateDifference(10, moment(firstDate), nowMoment);
        // expected not actually needed, in the future could say total days expected
      return dayDif[1];
    }
    return 0;
  }

  /**
   * finds the number of holidays between 2 dates
   * @param {Number} expected - Number of days that card was supposed to stay in stage
   * @param {Object} fromDate - moment date object from when to start count
   * @param {Object} toDate - moment date object on when to end count
   * @returns {Array} - 2 length array of [the difference between the two dates and the expected,
   * how many business days (less holidays) between the 2 dates)
   */
  calculateDateDifference(expected, fromMomentObj, toMomentObj) {
    let diffDays = instadate.differenceInWorkDays(fromMomentObj.toDate(), toMomentObj.toDate());
    diffDays = diffDays - this.findHolidaysBetweenDates(fromMomentObj.toDate(), toMomentObj.toDate());
    return [diffDays - expected, diffDays];
  }

  /**
   * finds the number of holidays between 2 dates
   * @param {Object} fromDate - moment date object from when to start count
   * @param {Object} toDate - moment date object on when to end count
   * @returns {Number} - Number of federal holidays between dates
   */
  findHolidaysBetweenDates(fromDate, toDate) {
    let count = 0;
    holidays.forEach(holiday => {
      if (moment(holiday.date.toISOString(), ['YYYY-M-D', 'YYYY-MM-DD', 'YYYY-MM-D', 'YYYY-M-DD']).isBetween(fromDate, toDate, 'day')) {
        count++;
      }
    });
    return count;
  }
}

module.exports = DateCommentHelpers;

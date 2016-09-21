'use strict';

const instadate = require('instadate');
const moment = require('moment');
const fedHolidays = require('@18f/us-federal-holidays');
const d = new Date();
const holidays = fedHolidays.allForYear(d.getFullYear());

class DateCommentHelpers {
  hasMovedCheck(actionList) {
    let updated = false;
    const moves = actionList.filter(a => 'listBefore' in a.data);
    if (moves.length) {
      updated = moves;
    }
    return updated;
  }

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

  generateFromDateForNewComment(deletedNewComment, comments, altToDate) {
    if (altToDate) {
      return altToDate;
    }
    return moment(this.checkCommentsForDates(comments, true, !deletedNewComment));
  }

  differentToDate(comments, currentTime) {
    const mostRecentToDate = this.checkCommentsForDates(comments, true, true);
    const recentToMoment = moment(mostRecentToDate);
    const differenceFromLastComment = currentTime.diff(recentToMoment, 'days');
    if (differenceFromLastComment > 2) {
      return recentToMoment;
    }
    return false; // Default to returning today
  }

  calcTotalDays(commentList, nowMoment) {
    const firstDate = this.checkCommentsForDates(commentList, false, false);
    if (firstDate) {
      const dayDif = this.calculateDateDifference(10, moment(firstDate), nowMoment);
        // expected not actually needed, in the future could say total days expected
      return dayDif[1];
    }
    return 0;
  }

  calculateDateDifference(expected, fromMomentObj, toMomentObj) {
    let diffDays = instadate.differenceInWorkDays(fromMomentObj.toDate(), toMomentObj.toDate());
    diffDays = diffDays - this.findHolidaysBetweenDates(fromMomentObj.toDate(), toMomentObj.toDate());
    return [diffDays - expected, diffDays];
  }

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

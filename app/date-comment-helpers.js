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

  checkCommentsForDates(commentList, latest, findEndDate) {
    let myRegex = /(\d\d\/\d\d\/201\d) - \d\d\/\d\d\/201\d/; // Find the first date in the comment string
    if (findEndDate) {
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
      const commMoment = moment(commentDate, 'MM/DD/YYYY').toISOString();
      return commMoment;
    }
    return false;
  }

  findPrevMoveDateFromComments(opts) {
    const actionList = opts.actionList;
    const cardCreationDate = opts.cardCreationDate;
    const commentList = opts.commentList;
    let correctComment = false;
    if (commentList) {
      correctComment = this.checkCommentsForDates(commentList, true, false);
    }
    if (correctComment) {
      return correctComment;
    } else if (actionList) {
      if (actionList.length > 1) {
        return actionList[0].date;
      }
    }

    if (opts.cardCreationDate) {
      return cardCreationDate;
    }

    return moment('01/01/2016', 'MM/DD/YYYY').toISOString();
  }

  calcTotalDays(commentList, nowMoment) {
    const firstDate = this.checkCommentsForDates(commentList, false, false);
    if (firstDate) {
      const dayDif = this.calculateDateDifference(10, firstDate, nowMoment);
        // expected not actually needed, in the future could say total days expected
      return dayDif[1];
    }
    return 0;
  }

  calculateDateDifference(expected, prevMove, recentMove) {
    const fromDate = new Date(prevMove);
    const toDate = new Date(recentMove);
    let diffDays = instadate.differenceInWorkDays(fromDate, toDate);
    diffDays = diffDays - this.findHolidaysBetweenDates(fromDate, toDate);
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

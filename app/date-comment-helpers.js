"use strict";

var instadate = require("instadate");
var moment = require("moment");
var fedHolidays = require('@18f/us-federal-holidays');
var d = new Date();
var holidays = fedHolidays.allForYear(d.getFullYear());

class DateCommentHelpers {
  hasMovedCheck(actionList) {
      var updated = false;
      var moves = actionList.filter(function(a) {
          return 'listBefore' in a.data;
      });
      if (moves.length) updated = moves;
      return updated;
  }

  checkCommentsForDates(commentList, latest){
    var myRegex = /(\d\d\/\d\d\/201\d) - \d\d\/\d\d\/201\d/; //Find the first date in the comment string
    if(!latest){
      // Reverse order to get first comment but create a shallow copy to not break integration
      commentList = commentList.slice(0).reverse();
    }
    var correctComment = commentList.find(function(comment){
        var match = myRegex.exec(comment.data.text);
        return match ? true : false;
    });
    if(correctComment){
      var commentDateMatch = myRegex.exec(correctComment.data.text);
      var commentDate = commentDateMatch[1];
      var commMoment = moment(commentDate, "MM/DD/YYYY").toISOString();
      return commMoment;
    } else {
      return false;
    }
  }

  findPrevMoveDateFromComments(opts){
    var actionList = opts.actionList;
    var cardCreationDate = opts.cardCreationDate;
    var commentList = opts.commentList;
    var correctComment = false;
    if(commentList){
      correctComment = this.checkCommentsForDates(commentList, true);
    }
    if(correctComment){
      return correctComment;
    } else if(actionList) {
      if(actionList.length > 1){
      return actionList[0].date;
      }
    } else {
      if(opts.cardCreationDate){
        return cardCreationDate;
      } else {
        return moment("01/01/2016", "MM/DD/YYYY").toISOString();
      }
    }
  }

  calcTotalDays(commentList, nowMoment){
      var firstDate = this.checkCommentsForDates(commentList, false);
      if(firstDate){
        var dayDif = this.calculateDateDifference(10, firstDate, nowMoment)
        //expected not actually needed, in the future could say total days expected
        return dayDif[1];
      } else {
        return 0;
      }
  }

  calculateDateDifference(expected, prevMove, recentMove) {
      var fromDate = new Date(prevMove);
      var toDate = new Date(recentMove);
      var diffDays = instadate.differenceInWorkDays(fromDate, toDate);
      diffDays = diffDays - this.findHolidaysBetweenDates(fromDate, toDate);
      return [diffDays - expected, diffDays];
  }

  findHolidaysBetweenDates(fromDate, toDate){
    var count = 0;
    holidays.forEach(function(holiday){
      if(moment(holiday.date.toISOString(), ["YYYY-M-D", "YYYY-MM-DD", "YYYY-MM-D", "YYYY-M-DD"]).isBetween(fromDate, toDate, 'day')){
        count++;
      }
    });
    return count;
  }
}

module.exports = DateCommentHelpers;

expect = require('chai').expect
_un = require("underscore")
app = require('../app')
sinon = require("sinon");
trello = require("node-trello");

module.exports = {
  trelloStub: function(fnName, err, callbackData) {
    stub = sinon.stub(trello.prototype, fnName);
    stub.yieldsAsync(err, callbackData);
    return stub;
  },
  waitTicks: function(numberOfTicks, callback) {
    if(numberOfTicks <= 0) {
      return callback();
    }

    process.nextTick(function() {
      module.exports.waitTicks(numberOfTicks - 1, callback);
    });
  },
  board: process.env.TRELLO_BPA_TEST_BOARD,
  mockfile: './test/mockfile.yaml',
  board_url: '/1/boards/' + this.board + '/lists',
  stubbed_list: ["Kanbanian", "Kanbanian-Dos"],
  make_lists: [ { stage: 'Kanbanian', built: false }, { stage: 'Kanbanian-Dos', built: false }],
  expectedStageObject: {
    stages: [ {
      name: 'Pre-Award',
      substages: [{name: 'IAA',  expected_time: 5},
        {name: 'Workshop Prep', expected_time: 10}]
    }]},
  ordermockfile: './test/mockorderfile.yaml',
  testCardID: process.env.TRELLO_TEST_CARD,
  mockOrder: {
    id: 1,
    project: "BPA Project",
    order: "Front End",
    agency: "General Services Administration",
    subagency: "OCSIT",
    trello: "https://trello.com/b/nmYlvlhu/bpa-test-dashboard",
    stage: "CO Review",
    open_date: "",
    close_date: "",
    owner: "Randy Hart"
  },
  mockCurrentComment: {
    id: "0",
    idMemberCreator: "2",
    data: {
      list: {
        name: "List Name",
        id: "3"
      },
      board: {
        shortLink: "xxxx",
        name: "Boad Name",
        id: "5"
      },
      card: {
        shortLink: "aaaaaa",
        idShort: 38,
        name: "Card Name",
        id: "380"
      },
        text: ""
    },
    type: "commentCard",
    date: "2016-02-24T19:52:38.613Z",
    memberCreator: {
      id: "10",
      avatarHash: "100",
      fullName: "Member Full Name",
      initials: "MF",
      username: "mememberFullName"
    }
  },
  actionListNoMove: [{
    id: "4c",
    idMemberCreator: "e3",
    data: {
      list: {name: "IAA", id: "5b"},
      board: { shortLink: "bbbb", name: "Board Name", id: "6b"},
      card: {shortLink: "cccc", idShort: 43, name: "Card Name", id: "7e"},
      old: {
        idMembers: [ ]
      }
    },
    type: "updateCard",
    date: "2016-02-25T22:00:35.866Z",
    memberCreator: {id: "4e", avatarHash: null, fullName: "Member Name", initials: "MN", username: "membername"}
    },
    {
      id: "5d",
      idMemberCreator: "e3",
      data: {
        list: {name: "IAA", id: "5b"},
        board: { shortLink: "bbbb", name: "Board Name",id: "6b"},
        card: {shortLink: "cccc", idShort: 43, name: "Card Name", id: "7e"},
        old: {
        labels: [ ]
        }
      },
      type: "updateCard",
      date: "2016-02-25T22:00:35.866Z",
      memberCreator: {id: "4e", avatarHash: null, fullName: "Member Name", initials: "MN", username: "membername"}
      }],
actionListMove: [{
  id: "4c",
  idMemberCreator: "e3",
  data: {
    list: {name: "IAA", id: "5b"},
    board: { shortLink: "bbbb", name: "Board Name", id: "6b"},
    card: {shortLink: "cccc", idShort: 43, name: "Card Name", id: "7e"},
    old: {
      idMembers: [ ]
    }
  },
  type: "updateCard",
  date: "2016-02-25T22:00:35.866Z",
  memberCreator: {id: "4e", avatarHash: null, fullName: "Member Name", initials: "MN", username: "membername"}
  },
  {
  id: "47",
  idMemberCreator: "e3",
  data: {
    listAfter: {name: "New List", id: "5b"},
    listBefore: {name: "Old List", id: "f4"},
    board: { shortLink: "bbbb", name: "Board Name", id: "6b"},
    card: {shortLink: "cccc", idShort: 43, name: "Card Name", id: "7e"},
  old: {
  idList: "e5"
  }
  },
  type: "updateCard",
  date: "2016-02-25T19:19:06.972Z",
  memberCreator: {id: "4e", avatarHash: null, fullName: "Member Name", initials: "MN", username: "membername"}
}],
createCommentResp: { id: 'cccc',
  idMemberCreator: '4b',
  data:
   { text: 'test message\n',
     textData: { emoji: {} },
     card:
      { id: '3333',
        name: 'Project Card',
        idShort: 43,
        shortLink: 'ccccc' },
     board:
      { id: '3s',
        name: 'Board Name',
        shortLink: 'bbbbb' },
     list: { id: '3b', name: 'List Name' } },
  type: 'commentCard',
  date: '2016-02-26T22:39:32.285Z',
  memberCreator: {id: "4e", avatarHash: null, fullName: "Member Name", initials: "MN", username: "membername"},
  entities:
   [ { type: 'member',
       id: 'asas',
       username: 'membername',
       text: 'Member Name' },
     { type: 'text',
       text: 'on',
       hideIfContext: true,
       idContext: 'asa' },
     { type: 'card',
       hideIfContext: true,
       shortLink: 'ccccc',
       id: 'fd',
       text: 'Card Name' },
     { type: 'comment',
       text: 'test message\n' } ],
  display:
   { translationKey: 'action_comment_on_card',
     entities:
      { contextOn: {},
        card: {},
        comment: {},
        memberCreator: {} } } }

}

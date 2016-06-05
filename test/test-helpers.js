expect = require('chai').expect
app = require('../app')
sinon = require("sinon");
trello = require("node-trello");

module.exports = {
  trelloStub: function(fnName, err, callbackData) {
    stub = sinon.stub(trello.prototype, fnName);
    stub.yieldsAsync(err, callbackData);
    return stub;
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
  mockGetBoardList: [ { id: '77777',
    name: 'Kanbanian',
    closed: false,
    idBoard: 'xxxx',
    pos: 1,
    subscribed: false },
  { id: '8888888',
    name: 'Kanbanian-Dos',
    closed: false,
    idBoard: 'xxxx',
    pos: 2,
    subscribed: false }],
  orderMockFile: './test/mockOrders.yaml',
  testCardID: process.env.TRELLO_TEST_CARD,
  mockOrder: {
    id: 1,
    project: "BPA Project",
    order: "Phase II",
    agency: "General Services Administration",
    subagency: "OCSIT",
    trello: "https://trello.com/b/xxxx/bpa-dash",
    stage: "CO Review",
    open_date: "",
    close_date: "",
    owner: "bob-test",
    due: "Tomorrow"
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
        memberCreator: {} } } },
testCard: { id: 'xxxxx',
  badges:
   { votes: 0,
     viewingMemberVoted: false,
     subscribed: false,
     fogbugz: '',
     checkItems: 0,
     checkItemsChecked: 0,
     comments: 0,
     attachments: 0,
     description: true,
     due: null },
  checkItemStates: [],
  closed: false,
  dateLastActivity: '2016-03-02T16:53:32.017Z',
  desc: 'Project: BPA Project\nAgency: General Services Administration\nSubAgency: OCSIT\nTrello Board: https://trello.com/b/xxxx/bpa-dash',
  descData: { emoji: {} },
  due: null,
  email: 'testuser+xxxxx@boards.trello.com',
  idBoard: 'bbbbbb',
  idChecklists: [],
  idLabels: [],
  idList: 'aaaaaa',
  idMembers: ['chilly'],
  idShort: 45,
  idAttachmentCover: null,
  manualCoverAttachment: false,
  labels: [],
  name: 'BPA Project - Phase II',
  pos: 16384,
  shortUrl: 'https://trello.com/c/xddwxws',
  url: 'https://trello.com/c/xddwxws/34-bpa-project-phase-ii',
  stickers: []
},
  mockCommentCardObj: {
    id: "0",
    badges: {
      votes: 0,
      viewingMemberVoted: false,
      subscribed: true,
      fogbugz: "",
      checkItems: 0,
      checkItemsChecked: 0,
      comments: 4,
      attachments: 0,
      description: true,
      due: null
    },
    checkItemStates: [ ],
    closed: false,
    dateLastActivity: "2016-04-19T22:53:02.061Z",
    desc: "Comment Card Obj ",
    descData: {
      emoji: { }
      },
    due: null,
    email: "cool@boards.trello.com",
    idBoard: "ccc",
    idChecklists: [ ],
    idList: "111",
    idMembers: [
      "ddd",
      "ddd3",
      "efss"
      ],
    idMembersVoted: [ ],
    idShort: 1,
    idAttachmentCover: null,
    manualCoverAttachment: false,
    labels: [ ],
    idLabels: [ ],
    name: "Comment Mock Card",
    pos: 1,
    shortLink: "9322",
    shortUrl: "https://trello.com/c/9322",
    subscribed: true,
    url: "https://trello.com/c/9322/comment-mock-card",
    checklists: [ ],
    members: [
      {
      id: "dddd",
      avatarHash: "dke",
      bio: "",
      bioData: null,
      confirmed: true,
      fullName: "Bob Tester",
      idPremOrgsAdmin: [ ],
      initials: "BT",
      memberType: "normal",
      products: [ ],
      status: "disconnected",
      url: "https://trello.com/bobtester",
      username: "bobtester"
      },
      {
      id: "dddd",
      avatarHash: "dke",
      bio: "",
      bioData: null,
      confirmed: true,
      fullName: "Bob Tester",
      idPremOrgsAdmin: [ ],
      initials: "BT",
      memberType: "normal",
      products: [ ],
      status: "disconnected",
      url: "https://trello.com/bobtester",
      username: "bobtester"
      },
      {
      id: "dddd",
      avatarHash: "dke",
      bio: "",
      bioData: null,
      confirmed: true,
      fullName: "Bob Tester",
      idPremOrgsAdmin: [ ],
      initials: "BT",
      memberType: "normal",
      products: [ ],
      status: "disconnected",
      url: "https://trello.com/bobtester",
      username: "bobtester"
      }
    ],
    actions: [
      {
      id: "2",
      idMemberCreator: "ddd",
      data: {
      list: {
        name: "Test List",
        id: "testlistID"
      },
      board: {
        shortLink: "333",
        name: "Test Board",
        id: "testboardID"
        },
      card: {
        shortLink: "sss",
        idShort: 1,
        name: "Comment Test Card",
        id: "322"
        },
      text: "**Current Stage:** `+19 days`. *03/21/2016 - 03/08/2016*. Expected days: 2 days. Actual Days spent: 21."
      },
      type: "commentCard",
      date: "2016-03-08T22:53:02.063Z",
      memberCreator: {
        id: "asdf9",
        avatarHash: "adafa",
        fullName: "Bob Tester",
        initials: "BT",
        username: "bobtester"
        }
      },
      {
        id: "4",
        idMemberCreator: "ddd",
        data: {
          list: {
          name: "Test List",
          id: "testlistID"
          },
          board: {
          shortLink: "333",
          name: "Test Board",
          id: "testboardID"
          },
          card: {
          shortLink: "0",
          idShort: 1,
          name: "Comment Test Card",
          id: "322"
          },
          text: "This is not a current comment."
        },
        type: "commentCard",
        date: "2016-03-08T22:53:02.063Z",
        memberCreator: {
        id: "asdf9",
        avatarHash: "adafa",
        fullName: "Bob Tester",
        initials: "BT",
        username: "bobtester"
        }
      }

    ]
    }
}

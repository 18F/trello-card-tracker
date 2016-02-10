yaml = require('js-yaml');
fs   = require('fs');
Trello = require("node-trello");


var method = TrelloSuper.prototype;

function TrelloSuper(yaml_file, board) {
    this.yaml_file = yaml_file;
    this.board = board;
    this.t = new Trello(process.env.TRELLO_API_KEY, process.env.TRELLO_API_TOK);
}

method.readYaml = function() {
    try {
    	var doc = yaml.safeLoad(fs.readFileSync(this.yaml_file, 'utf8'));
      return doc;
    	// console.log(doc);
    } catch (e){
      return e;
    	// console.log(e);
    }
};


module.exports = TrelloSuper;

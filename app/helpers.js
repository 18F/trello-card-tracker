yaml = require('js-yaml');
fs   = require('fs');
Trello = require("node-trello");


var method = TrelloSuper.prototype;

function TrelloSuper(yaml_file, board) {
    this.yaml_file = yaml_file;
    this.board = board;
    this.t = new Trello(process.env.TRELLO_API_KEY, process.env.TRELLO_API_TOK);
    this.lists_url = "/1/boards/"+board+"/lists";
}

method.readYaml = function() {
    try {
    	var doc = yaml.safeLoad(fs.readFileSync(this.yaml_file, 'utf8'));
      return doc;
    } catch (e){
      return e;
    }
};

method.getPreAward = function(){
  stages = this.readYaml(this.yaml_file);
  return stages.stages[0].substages;
}

String.prototype.supplant = function (o) {
    return this.replace(/{([^{}]*)}/g,
        function (a, b) {
            var r = o[b];
            return typeof r === 'string' || typeof r === 'number' ? r : a;
        }
    );
};


module.exports = TrelloSuper;

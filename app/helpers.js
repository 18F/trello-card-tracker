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

method.getListIDbyName= function(name, callback){
  var find = true;
  if (!name) {
    var find = false;
  }
  this.t.get(this.lists_url, function(e, data){
    if (e) {throw e};
    if(find){
      var list = _un.findWhere(data, {"name": name});
    }
    if (!find || !list){ //Add it to the first list if there is not one
      var list = data[0];
    }
    callback(list["id"]);
  });
}

method.getListNameByID = function(listID){
  var deferred = Q.defer();
  this.t.get('/1/lists/'+listID, function(err, list){
    if(err) {deferred.reject(new Error(err));};
		deferred.resolve(list["name"]);
  });
  return deferred.promise;
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

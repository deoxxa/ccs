#!/usr/bin/env node

var mongo = require("mongoskin");

var data = mongo.db(process.env.MONGODB).collection("data");

var mr_words_m = function() {
  var category = this.category.title;

  this.title.split(/['"-_\s,\.\(\)\[\]!]/g).filter(function(x) { return typeof x === "string" && x.length; }).map(String.toLowerCase).forEach(function(k) {
    var x = {total: 1};
    x[category] = 1;
    emit(k, x);
  });
};

var mr_words_r = function(k, vs) {
  var res = {};

  vs.forEach(function(v) {
    for (var i in v) {
      res[i] = (res[i] || 0) + v[i];
    }
  });

  return res;
};

data.mapReduce(mr_words_m, mr_words_r, {out: "words", query: {title: {$exists: true}}, verbose: true, jsMode: true}, function(err, res, stats) {
  if (err) {
    return console.log(err);
  }

  console.log(stats);

  process.exit();
});

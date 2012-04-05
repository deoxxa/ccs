#!/usr/bin/env node

function pad(c, n, s) {
  return s + (new Array(Math.max(n + 1 - s.length, 0))).join(c);
}

var async = require("async"),
    mongo = require("mongoskin");

var words = mongo.db(process.env.MONGODB).collection("words");

var title = process.argv[2];

async.map(title.split(/['"-_\s,\.\(\)\[\]!]/g).filter(function(x) { return typeof x === "string" && x.length; }).map(function(x) { return x.toLowerCase(); }), function(word, done) {
  words.findOne({_id: word}, done);
}, function(err, res) {
  if (err) {
    return console.log(err);
  }

  var categories = res.filter(function(v) {
    return !!v;
  }).map(function(v) {
    var res = {};

    for (var i in v.value) {
      res[i] = v.value[i] / v.value.total;
    }

    delete res.total;

    console.log("[" + v._id + "] " + JSON.stringify(v.value));

    return res;
  }).reduce(function(v, c) {
    for (var i in c) {
      v[i] = (v[i] || 0) + c[i];
    }

    return v;
  }, {});

  var list = [];
  for (var i in categories) {
    list.push([i, categories[i]]);
  }

  var total = list.reduce(function(v,c) { v += c[1]; return v; }, 0);
  console.log(total);
  list = list.map(function(e) { e[1] = e[1] / total * 100; return e; });

  console.log("");

  console.log("Certainty | Name");
  console.log(Array(list.reduce(function(v,c) { return Math.max(v, c[0].length); }, 0) + 1).join("-"));
  list.sort(function(a,b) { return b[1] - a[1]; }).forEach(function(e) {
    console.log(pad(" ", 9, (Math.round(e[1]*1000000) / 1000000).toString()) + " | " + e[0]);
  });
});

#!/usr/bin/env node

var mongo = require("mongoskin"),
    async = require("async");

var data = mongo.db(process.env.MONGODB).collection("data");

var jobs = [];

var mr_words_m = function() {
  var category = this.category.title;

  this.title.split(/[-'"_\s,\.\(\)\[\]!]/g).filter(function(s) {
    return typeof s === "string" && s.length;
  }).forEach(function(k) {
    var o = {total: 1};
    o[category] = 1;
    emit(k.toLowerCase(), o);
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

jobs.push({m: mr_words_m, r: mr_words_r, o: "words"});

var mr_types_m = function() {
  var category = this.category.title;

  this.torrent.files.forEach(function(f) {
    var o = {total: 1};
    o[category] = 1;
    emit(f.name.split(/\./g).pop().toLowerCase(), o);
  });
};

var mr_types_r = function(k, vs) {
  var res = {};

  vs.forEach(function(v) {
    for (var i in v) {
      res[i] = (res[i] || 0) + v[i];
    }
  });

  return res;
};

jobs.push({m: mr_types_m, r: mr_types_r, o: "types"});

var mr_sizes_m = function() {
  var category = this.category.title;

  this.torrent.files.forEach(function(f) {
    var o = {total: 1};
    o[category] = 1;
    emit(Math.round(Math.log(f.size)/Math.log(2)), o);
  });
};

var mr_sizes_r = function(k, vs) {
  var res = {};

  vs.forEach(function(v) {
    for (var i in v) {
      res[i] = (res[i] || 0) + v[i];
    }
  });

  return res;
};

jobs.push({m: mr_sizes_m, r: mr_sizes_r, o: "sizes"});

var mr_trackers_m = function() {
  var category = this.category.title;

  this.torrent.trackers.forEach(function(t) {
    var o = {total: 1};
    o[category] = 1;
    emit(t.replace(/^[a-zA-Z]+:\/\/(.+?)([\/:].*)?$/, "$1").toLowerCase().replace(/[^a-z0-9\.-]/g, ""), o);
  });
};

var mr_trackers_r = function(k, vs) {
  var res = {};

  vs.forEach(function(v) {
    for (var i in v) {
      res[i] = (res[i] || 0) + v[i];
    }
  });

  return res;
};

jobs.push({m: mr_trackers_m, r: mr_trackers_r, o: "trackers"});

async.map(jobs, function(job, done) {
  data.mapReduce(job.m, job.r, {out: job.o, query: {title: {$exists: true}, torrent: {$exists: true}}, sort: {id: 1}, verbose: true}, function(err, res, stats) {
    return done(err, stats);
  });
}, function(err, res) {
  if (err) {
    return console.log(err);
  }

  console.log(res);

  process.exit();
});

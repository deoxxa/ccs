#!/usr/bin/env node

var fs = require("fs"),
    async = require("async"),
    mongo = require("mongoskin"),
    crypto = require("crypto"),
    bencode = require("dht-bencode"),
    torrent_util = require("torrent-util");

var db = mongo.db(process.env.MONGODB);

var words = db.collection("words"),
    types = db.collection("types"),
    sizes = db.collection("sizes"),
    trackers = db.collection("trackers");

var get_word_guesses = function(torrent, done) {
  async.map(torrent.name.split(/[-'"_\s,\.\(\)\[\]\!]/g).filter(function(x) { return typeof x === "string" && x.length && !x.match(/^\d+$/); }).map(function(x) { return x.toLowerCase(); }), function(word, done) {
    console.log("Searching word: " + word);
    words.findOne({_id: word}, done);
  }, function(err, res) {
    if (err) {
      console.log(err);
      return done(err);
    }

    var categories = res.filter(function(v) {
      return !!v;
    }).map(function(v) {
      var res = {};

      for (var i in v.value) {
        res[i] = v.value[i] / v.value.total;
      }

      delete res.total;

      return res;
    }).reduce(function(v, c) {
      for (var i in c) {
        v[i] = (v[i] || 0) + c[i];
      }

      return v;
    }, {});

    done(null, categories);
  });
};

var get_type_guesses = function(torrent, done) {
  async.map(torrent.files.map(function(f) { return f.name.split(/\./g).pop().toLowerCase(); }), function(type, done) {
    console.log("Searching type: " + type);
    types.findOne({_id: type}, done);
  }, function(err, res) {
    if (err) {
      console.log(err);
      return done(err);
    }

    var categories = res.filter(function(v) {
      return !!v;
    }).map(function(v) {
      var res = {};

      for (var i in v.value) {
        res[i] = v.value[i] / v.value.total;
      }

      delete res.total;

      return res;
    }).reduce(function(v, c) {
      for (var i in c) {
        v[i] = (v[i] || 0) + c[i];
      }

      return v;
    }, {});

    done(null, categories);
  });
};

var get_size_guesses = function(torrent, done) {
  async.map(torrent.files.map(function(f) { return Math.round(Math.log(f.size)/Math.log(2)); }), function(size, done) {
    console.log("Searching size: " + size);
    sizes.findOne({_id: size}, done);
  }, function(err, res) {
    if (err) {
      console.log(err);
      return done(err);
    }

    var categories = res.filter(function(v) {
      return !!v;
    }).map(function(v) {
      var res = {};

      for (var i in v.value) {
        res[i] = v.value[i] / v.value.total;
      }

      delete res.total;

      return res;
    }).reduce(function(v, c) {
      for (var i in c) {
        v[i] = (v[i] || 0) + c[i];
      }

      return v;
    }, {});

    done(null, categories);
  });
};

var get_tracker_guesses = function(torrent, done) {
  async.map(torrent.trackers.map(function(t) { return t.toLowerCase().replace(/^[a-z]+:\/\/(.+?)([\/:].*)?$/, "$1").replace(/[^a-z0-9\.-]/g, ""); }), function(tracker, done) {
    console.log("Searching tracker: " + tracker);
    trackers.findOne({_id: tracker}, done);
  }, function(err, res) {
    if (err) {
      console.log(err);
      return done(err);
    }

    var categories = res.filter(function(v) {
      return !!v;
    }).map(function(v) {
      var res = {};

      for (var i in v.value) {
        res[i] = v.value[i] / v.value.total;
      }

      delete res.total;

      return res;
    }).reduce(function(v, c) {
      for (var i in c) {
        v[i] = (v[i] || 0) + c[i];
      }

      return v;
    }, {});

    done(null, categories);
  });
};

fs.readFile(process.argv[2], function(err, data) {
  if (err) {
    return console.log(err);
  }

  var decoded;
  try {
    decoded = bencode.bdecode(data);
  } catch (e) {
    return console.log(e);
  }

  torrent = {
    hash: crypto.createHash("sha1").update(bencode.bencode(decoded.info)).digest("hex"),
    name: torrent_util.get_name(decoded),
    size: torrent_util.get_size(decoded),
    comment: torrent_util.get_comment(decoded),
    files: torrent_util.get_files(decoded),
    trackers: torrent_util.get_trackers(decoded),
  };

  async.parallel([get_word_guesses, get_type_guesses, get_size_guesses, get_tracker_guesses].map(function(f) { return f.bind(null, torrent); }), function(err, res) {
    if (err) {
      return console.log(err);
    }

    var guesses = res.reduce(function(v, c) {
      for (var i in c) {
        v[i] = (v[i] || 0) + c[i];
      }

      return v;
    }, {});

    var list = [];
    for (var i in guesses) {
      list.push([i, guesses[i]]);
    }
    list = list.sort(function(a, b) { return b[1] - a[1]; });

    console.log("");

    console.log(list.map(function(e) { return e.join(": "); }).join("\n"));

    process.exit();
  });
});

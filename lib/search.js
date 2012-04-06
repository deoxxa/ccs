#!/usr/bin/env node

var async = require("async"),
    mongo = require("mongoskin"),
    torrent_util = require("torrent-util");

var db = mongo.db(process.env.MONGODB);

var words = db.collection("words"),
    groups = db.collection("groups"),
    types = db.collection("types"),
    sizes = db.collection("sizes"),
    trackers = db.collection("trackers");

var get_word_guesses = function(torrent, done) {
  async.map(torrent.name.split(/[-'"_\s,\.\(\)\[\]\!]/g).filter(function(x) { return typeof x === "string" && x.length && !x.match(/^\d+$/); }).map(function(x) { return x.toLowerCase(); }), function(word, done) {
    words.findOne({_id: word}, done);
  }, function(err, res) {
    if (err) {
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

var get_group_guesses = function(torrent, done) {
  async.map(torrent.name.match(/^\[(.+?)\]/g).filter(function(x) { return typeof x === "string" && x.length && !x.match(/^\d+$/); }).map(function(x) { return x.toLowerCase(); }), function(group, done) {
    groups.findOne({_id: group}, done);
  }, function(err, res) {
    if (err) {
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
    types.findOne({_id: type}, done);
  }, function(err, res) {
    if (err) {
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
    sizes.findOne({_id: size}, done);
  }, function(err, res) {
    if (err) {
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
    trackers.findOne({_id: tracker}, done);
  }, function(err, res) {
    if (err) {
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

module.exports = function(decoded, done) {
  torrent = {
    name: torrent_util.get_name(decoded),
    size: torrent_util.get_size(decoded),
    comment: torrent_util.get_comment(decoded),
    files: torrent_util.get_files(decoded),
    trackers: torrent_util.get_trackers(decoded),
  };

  async.parallel([get_word_guesses, get_group_guesses, get_type_guesses, get_size_guesses, get_tracker_guesses].map(function(f) { return f.bind(null, torrent); }), function(err, res) {
    if (err) {
      return done(err);
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

    return done(null, list);
  });
};

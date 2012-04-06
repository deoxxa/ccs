#!/usr/bin/env node

var fs = require("fs"),
    mongo = require("mongoskin"),
    async = require("async"),
    crypto = require("crypto"),
    request = require("request"),
    bencode = require("dht-bencode"),
    nyaatorrents = require("nyaatorrents"),
    torrent_util = require("torrent-util");

var client = new nyaatorrents.Client("www.nyaa.eu", 80, "/");
var torrents = mongo.db(process.env.MONGODB).collection("data");

var q = async.queue(function(task, done) {
  console.log("Starting on " + task.id);

  torrents.findOne({id: task.id.toString()}, function(err, doc) {
    if (err) { return done(err); }
    if (doc) { return done(); }

    client.details(task.id, function(err, entry) {
      if (err) { return done(err); }
      if (!entry) { return done(); }
      if (!entry.title) { torrents.save({id: task.id.toString()}); return done(); }

      request({uri: "http://www.nyaa.eu/?page=download&tid=" + task.id, encoding: null}, function(err, res, data) {
        if (err) { return done(err); }
        if (res.statusCode !== 200) { return done(); }

        try {
          decoded = bencode.bdecode(data);
        } catch (e) {
          console.log(e);
          return done(e);
        }

        entry.torrent = {
          hash: crypto.createHash("sha1").update(bencode.bencode(decoded.info)).digest("hex"),
          name: torrent_util.get_name(decoded),
          size: torrent_util.get_size(decoded),
          comment: torrent_util.get_comment(decoded),
          files: torrent_util.get_files(decoded),
          trackers: torrent_util.get_trackers(decoded),
        };

        fs.writeFile(__dirname + "/torrents/" + entry.title + ".torrent", data, function(err) {
          if (err) { return done(err); }

          torrents.save(entry, {safe: true}, done);
        });
      });
    });
  });
}, 25);

for (var i=200000;i<210000;++i) {
  q.push({id: i});
}

q.drain = function() {
  setTimeout(process.exit.bind(process), 1000);
};

#!/usr/bin/env node

var fs = require("fs"),
    bencode = require("dht-bencode"),
    search = require("../lib/search");

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

  search(decoded, function(err, list) {
    if (err) {
      return console.log(err);
    }

    console.log(list.map(function(e) { return e.join(": "); }).join("\n"));

    process.exit();
  });
});

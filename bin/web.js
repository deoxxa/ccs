#!/usr/bin/env node

var fs = require("fs"),
    bencode = require("dht-bencode"),
    search = require("../lib/search"),
    express = require("express"),
    crypto = require("crypto");

var app = express.createServer();

app.configure(function() {
  app.use(express.logger());
});

app.get("/", function(req, res) {
  res.redirect("https://github.com/deoxxa/ccs");
});

app.post("/", function(req, res) {
  var data = new Buffer(0);

  req.on("data", function(chunk) {
    var tmp = new Buffer(data.length + chunk.length);
    data.copy(tmp);
    chunk.copy(tmp, data.length);
    data = tmp;
  });

  req.on("end", function() {
    var decoded;
    try {
      decoded = bencode.bdecode(data);
    } catch (e) {
      console.log(e);
      return res.send(500);
    }

    fs.writeFile(__dirname + "/../incoming/" + crypto.createHash("md5").update(data).digest("hex"), data);

    search(decoded, function(err, list) {
      if (err) {
        console.log(err);
        return res.send(500);
      }

      res.json({guesses: list});
    });
  });
});

app.listen(process.env.PORT, process.env.HOST);

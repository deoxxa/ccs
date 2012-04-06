Content Classification System
=============================

![](http://i.imgur.com/sto4h.jpg)

Overview
--------

This is an experiment in classifying content based on unstructured properties
of that content. It requires a set of "seed" data to provide some statistical
information about the distribution of data points over the previously classified
seed data.

How It Works
------------

This system analyses multiple points of data about torrent files. It constructs
lists of words, file size ranges, file types and tracker domains. Each entry in
each of those lists is identified by the value of the data point in question and
contains a list of categories and the number of times that value has been seen
in connection to that category, along with the total number of times it has been
seen.

To find the probable categories of a torrent, these data points are extracted
from a submitted file and compared against the database built from previously
(and probably manually) classified files. The "seen" category counts of the each
point is divided by the total number of times that point has been seen, to put
the value in a range of [0..1]. These values are added up and returned to the
client, with the list sorted in descending order of value.

![](http://i.imgur.com/sUFGG.jpg)

Right. Fine. The gist of it is: find the categories of torrents with similar
characteristics to the one you're looking up and you'll more often than not end
up with the correct result.

Requirements
------------

* [Node.JS](http://nodejs.org/) >= 0.4.12
* [MongoDB](http://mongodb.org/) >= 2.0
* [NPM](http://npmjs.org/) (is included with node these days)

Usage
-----

    git clone git://github.com/deoxxa/ccs.git
    cd ccs
    npm install
    MONGODB=localhost:27017/ccs ./bin/grabber.js
    MONGODB=localhost:27017/css ./bin/mapreduce.js
    MONGODB=localhost:27017/css ./bin/search.js /path/to/a/torrent/file

Oh Hi There, I'm a Web Service
------------------------------

    PORT=3000 MONGODB=localhost:27017/ccs ./bin/web.js &
    curl -X POST http://localhost:3000/ --data-binary @/path/to/a/torrent/file

Oh Hi There, I'm Hosted Online
------------------------------

    curl -X POST http://ccs.fknsrs.biz/ --data-binary @/path/to/a/torrent/file

To Do
-----

* Tuning
* Additional metric identification and implementation
* Distinct metric association/grouping
* Allow manual database confirmations to build the dataset

License
-------

BSD, 3-clause. A copy is included.

Contact
-------

* Email: [deoxxa@fknsrs.biz](mailto:deoxxa@fknsrs.biz)
* Github: [deoxxa](https://github.com/deoxxa)
* Twitter: [deoxxa](http://twitter.com/#!/deoxxa)

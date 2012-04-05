Content Classification System
=============================

![](http://i.imgur.com/sto4h.jpg)

Overview
--------

This is an experiment in classifying content based on unstructured properties
of that content. It requires a set of "seed" data to provide some statistical
information about the distribution of data points over the previously classified
"seed" data.

How It Works
------------

Right now the system operates by analysing the frequency of words in the title
of torrents and the categories assigned to them. It constructs a list of words
and the number of times they have been seen in each category. To guess the
category of an unknown title, it adds up the (normalised) frequencies of use of
each word in the title for each category and presents the result as a list of
probably categories in descending order.

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
    MONGODB=127.0.0.1:27017/ccs ./grabber.js
    MONGODB=127.0.0.1:27017/css ./mapreduce.js
    MONGODB=127.0.0.1:27017/css ./search.js "[Silent-Raws] Queen's Blade ~Rebellion~ - 01 (AT-X 1280x720 x264 AAC).mp4"

License
-------

BSD, 3-clause. A copy is included.

Contact
-------

* Email: [deoxxa@fknsrs.biz](mailto:deoxxa@fknsrs.biz)
* Github: [deoxxa](https://github.com/deoxxa)
* Twitter: [deoxxa](http://twitter.com/#!/deoxxa)

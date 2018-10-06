'use strict';

var express = require('express');
var mongo = require('mongodb');
var mongoose = require('mongoose');
var bodyParser  = require('body-parser');


var cors = require('cors');

var app = express();

// Basic Configuration 
var port = process.env.PORT || 3000;

var ShortUrl = require('./short_url.js');

var options, db;

options = {
  promiseLibrary: require('bluebird')
};
db = mongoose.createConnection(process.env.MONGO_URL, options);
var ShortUrlTable = new ShortUrl(db);

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({
  extended: true
}));

// create application/json parser
var jsonParser = bodyParser.json();

// create application/x-www-form-urlencoded parser
var urlencodedParser = bodyParser.urlencoded({
  extended: true
});

app.use(cors());

/** this project needs to parse POST bodies **/
// you should mount the body-parser here

app.use('/public', express.static(process.cwd() + '/public'));

app.get('/', function(req, res){
  res.sendFile(process.cwd() + '/views/index.html');
});

  
// your first API endpoint...
app.get("/api/hello", function (req, res) {
  res.json({
    greeting: 'hello API'
  });
});

// /api/shorturl/new
app.post('/api/shorturl/new', urlencodedParser, function (req, res) {
  if (!req.body) return res.sendStatus(400);
  var shortUrl = new ShortUrlTable();
  shortUrl.original_url = req.body.url;

  ShortUrlTable.findOne({
    original_url: shortUrl.original_url
  }, function (err, shortLink) {
    if (!err) {
      if (shortLink) {

        res.json({
          original_url: shortLink.original_url,
          short_url: shortLink.short_url
        });
      } else {
        ShortUrlTable.find(function (err, result) {
          if (!err) {
            shortUrl.short_url = result.length + 1;
            shortUrl.save(function (err, savedUrl) {
              if (!err) {
                res.json({
                  original_url: savedUrl.original_url,
                  short_url: savedUrl.short_url
                });
              } else {
                res.json({
                  Error: err.message
                });
              }
            });
          } else {
            res.json({
              Error: err.message
            });
          }
        });
      }
    } else {
      res.json({
        Error: err.message
      });
    }
  });
});

app.get("/api/shorturl/:short_url?", function (req, res) {
  ShortUrlTable.findOne({
    short_url: req.params.short_url
  }, function (err, shortLink) {
    if (!err) {
      if (shortLink) {
        res.redirect(shortLink.original_url)
        // window.location.replace(shortLink.original_url);
      } else {
        res.status(404).send('404 Not found');
      }
    } else {
      res.json({
        Error: err.message
      });
    }
  });
});

// listen for requests :)
var listener = app.listen(process.env.PORT, function () {
  console.log('Your app is listening on port ' + listener.address().port);
});
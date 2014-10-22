'use strict';

var net = require('net');
var msgpack = require('msgpack5')();
var test = require('abstract-skiff-transport/test/all');
var Transport = require('./');

var options = {
  startServer: function(cb) {
    var server = net.createServer(onConnection);
    server.listen(8081, function() {
      cb(null, server);
    });

    server.__connections = [];

    function onConnection(c) {

      c.on('data', function(d) {
        console.log('mock server got data:', d);
      });

      var oldWrite = c.write;
      c.write = function (o) {
        console.log('writing', o);
        oldWrite.apply(c, arguments);
      };

      server.__connections.push(c);

      var encoder = msgpack.encoder();
      var decoder = msgpack.decoder();
      c.__encoder = encoder;
      c.__decoder = decoder;

      encoder.on('data', function(d) {
        console.log('ENCOER DATA:', d);
      });

      encoder.pipe(c).pipe(decoder);

      decoder.on('data', onMessage);

      function onMessage(m) {
        console.log('gotz message:', m);
        if (m.request) {
          m.request.unshift(undefined);
          encoder.write({response: d.request});
        }
      }

      c.once('close', function() {
        var idx = server.__connections.indexOf(c);
        if (idx >= 0) {
          server.__connections.splice(idx, 1);
        }
      });

    }
  },
  stopServer: function(server, cb) {
    server.close(cb);
  },
  broadcast: function(server, args) {
    server.__connections.forEach(function(c) {
      c.__encoder.write({request: args});
    });
  },
  intercept: function(server, cb) {
    server.__connections.forEach(function(c) {
      c__decoder.on('data', onMessage);
    });

    function onMessage(m) {
      var d = JSON.parse(l);
      cb(m.response);
    }
  },
  connect: function() {
    var self = this;

    var c = net.connect(8081);
    var encoder = msgpack.encoder();
    var decoder = msgpack.decoder();
    encoder.pipe(c).pipe(decoder);
    encoder.write({hello: self.listenPeerId});
    decoder.on('data', function() {});

    return c;
  },
  disconnect: function(c) {
    c.end();
  },
  connectURL: 'tcp+msgpack://localhost:8081',
  listenPeerId: 'listenpeerid'
};

test(new Transport(), options);
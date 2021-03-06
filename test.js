'use strict';

var net = require('net');
var msgpack = require('msgpack-stream');
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

      server.__connections.push(c);

      var encoder = msgpack.createEncodeStream();
      var decoder = msgpack.createDecodeStream();
      c.__encoder = encoder;
      c.__decoder = decoder;

      encoder.pipe(c).pipe(decoder);

      decoder.on('data', onMessage);

      function onMessage(m) {
        if (m.request) {
          m.request.unshift(undefined);
          encoder.write({response: m.request});
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
      c.__decoder.on('data', onMessage);
    });

    function onMessage(m) {
      cb(m.response);
    }
  },
  connect: function() {
    var self = this;

    var c = net.connect(8081, cb);
    var encoder = msgpack.createEncodeStream();
    var decoder = msgpack.createDecodeStream();
    encoder.pipe(c).pipe(decoder);
    decoder.on('data', function() {});

    return c;

    function cb(err) {
      encoder.write({hello: {id: self.listenPeerId, meta: {}}});
      console.log('wrote hello');
    }
  },
  disconnect: function(c) {
    c.end();
  },
  connectURL: 'tcp+msgpack://localhost:8081',
  listenPeerId: 'listenpeerid'
};

test(new Transport(), options);
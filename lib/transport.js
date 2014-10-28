'use strict';

var net = require('net');
var inherits = require('util').inherits;
var AbstractTransport = require('abstract-skiff-transport').Transport;
var Connection = require('./connection');

module.exports = SkiffTcpMsgpack;

function SkiffTcpMsgpack() {
  AbstractTransport.call(this);
}

inherits(SkiffTcpMsgpack, AbstractTransport);

var STM = SkiffTcpMsgpack.prototype;

STM._protocolName = function() {
  return 'tcp+msgpack';
};

STM._connect = function _connect(localNodeId, localMeta, remoteAddress, meta) {
  return new Connection(localNodeId, localMeta, remoteAddress, meta);
};

STM._listen = function _listen(localNodeId, address, listener, cb) {
  var self = this;
  var server;
  var closing = false;
  var calledback = false;

  if (!this._server) {

    this._server = server = net.createServer(onConnection);

    server.__connections = [];

    this._server.once('error', onServerError);

    server.on('connection', function(c) {
      if (!closing) {
        server.__connections.push(c);
        c.once('close', function() {
          var idx = server.__connections.indexOf(c);
          if (idx > -1) {
            server.__connections.splice(idx, 1);
          }
        });
      }
    });

    var serverClose = server.close;
    server.close = function close(cb) {
      closing = true;
      serverClose.call(server, closed);
      server.__connections.forEach(function(c) {
        c.end();
      });

      function closed() {
        if (cb) {
          cb();
        }
      }
    };
  }

  server.listen(address.port, address.hostname, callback);

  function onServerError(err) {
    if (err.code == 'EADDRINUSE') {
      callback(err);
    }
    else {
      self.emit('error', err);
    }
  }

  function callback(err) {
    if (!calledback) {
      calledback = true;
      if (cb) {
        cb.apply(null, arguments);
      } else {
        if (err) {
          self.emit('error', err);
        }
      }
      if (! err) {
        self.emit('listening', address);
      }
    }
  }

  function onConnection(conn) {
    if (closing) {
      c.end();
    } else {
      conn.on('error', function() {
        // don't care about error
      });
      var c = new Connection(localNodeId, {}, {}, undefined, conn);
      c.once('hello', onHello);
    }

    function onHello(peer) {
      listener.call(null, peer.id, peer.meta, c);
    }
  }

  return this._server;
};

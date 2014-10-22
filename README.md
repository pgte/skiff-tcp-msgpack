# skiff-tcp-msgpack

[![Dependency Status](https://david-dm.org/pgte/skiff-tcp-msgpack.svg)](https://david-dm.org/pgte/skiff-tcp-msgpack)
[![Build Status](https://travis-ci.org/pgte/skiff-tcp-msgpack.svg?branch=master)](https://travis-ci.org/pgte/skiff-tcp-msgpack)

New-line separated JSON over TCP transport for Skiff.

## Install

```bash
$ npm install skiff-tcp-msgpack --save
```

## Use

```javascript
var Transport = require('skiff-tcp-msgpack');
var transport = new Transport();

var Node = require('skiff');
var node = Node({
  transport: transport,
  // ...
});
```

# License

ISC
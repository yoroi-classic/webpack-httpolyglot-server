var assert = require('node:assert/strict');
var fs = require('fs');
var http = require('http');
var https = require('https');
var path = require('path');
var test = require('node:test');

var createServer = require('../lib/server');

function makeMiddleware(name) {
  return function() {
    return function(req, res, next) {
      req.headers['x-' + name] = '1';
      next();
    };
  };
}

function request(protocol, port, pathname, callback) {
  var client = protocol === 'https' ? https : http;
  var req;
  var settled = false;
  var timer = setTimeout(function() {
    if (req) {
      req.destroy(new Error(protocol + ' request timed out'));
    }
  }, 5000);

  function finish(err, result) {
    if (settled) return;
    settled = true;
    clearTimeout(timer);
    callback(err, result);
  }

  var options = {
    hostname: '127.0.0.1',
    port: port,
    path: pathname,
    method: 'GET',
    agent: false
  };
  if (protocol === 'https') {
    options.ca = fs.readFileSync(path.join(__dirname, '../ssl/ca.crt'));
    options.servername = 'localhost';
  }

  req = client.request(options, function(res) {
    var body = '';
    res.setEncoding('utf8');
    res.on('data', function(chunk) {
      body += chunk;
    });
    res.on('end', function() {
      finish(null, {
        statusCode: res.statusCode,
        body: body
      });
    });
    res.on('error', finish);
  });

  req.on('error', finish);
  req.end();
}

function requestAsync(protocol, port, pathname) {
  return new Promise(function(resolve, reject) {
    request(protocol, port, pathname, function(err, result) {
      if (err) {
        reject(err);
      } else {
        resolve(result);
      }
    });
  });
}

function closeAsync(server) {
  return new Promise(function(resolve, reject) {
    if (!server.listening) {
      resolve();
      return;
    }

    var settled = false;
    var timer = setTimeout(function() {
      if (settled) return;
      settled = true;
      resolve();
    }, 1000);

    server.close(function(err) {
      if (settled) return;
      settled = true;
      clearTimeout(timer);
      if (err) {
        reject(err);
      } else {
        resolve();
      }
    });
    if (typeof server.closeAllConnections === 'function') {
      server.closeAllConnections();
    }
  });
}

function listeningAsync(server) {
  return new Promise(function(resolve, reject) {
    if (server.listening) {
      resolve();
    } else {
      server.once('error', reject);
      server.once('listening', function() {
        server.removeListener('error', reject);
        resolve();
      });
    }
  });
}

test('serves protocol middleware over http and https', async function() {
  var webpackCalls = [];
  var webpackConfig = {
    entry: './fixture-entry.js',
    devMiddleware: {publicPath: '/assets'},
    hotMiddleware: {path: '/hot'}
  };

  var app = createServer(
    webpackConfig,
    function(config) {
      webpackCalls.push(config);
      return {name: 'compiler'};
    },
    makeMiddleware('dev-middleware'),
    makeMiddleware('hot-middleware'),
    {
      host: '127.0.0.1',
      port: 0,
      noLog: true
    }
  );

  try {
    assert(app.server);
    assert.strictEqual(typeof app.server.close, 'function');
    await listeningAsync(app.server);

    assert.strictEqual(webpackCalls.length, 1);
    assert.deepStrictEqual(webpackCalls[0], {entry: './fixture-entry.js'});

    app.get('/protocol-test', function(req, res) {
      res.status(200).send({
        devMiddleware: req.headers['x-dev-middleware'],
        hotMiddleware: req.headers['x-hot-middleware']
      });
    });

    var port = app.server.address().port;
    var httpResult = await requestAsync('http', port, '/protocol-test');
    assert.strictEqual(httpResult.statusCode, 200);
    assert.deepStrictEqual(JSON.parse(httpResult.body), {
      devMiddleware: '1',
      hotMiddleware: '1'
    });

    var httpsResult = await requestAsync('https', port, '/protocol-test');
    assert.strictEqual(httpsResult.statusCode, 200);
    assert.deepStrictEqual(JSON.parse(httpsResult.body), {
      devMiddleware: '1',
      hotMiddleware: '1'
    });
  } finally {
    await closeAsync(app.server);
  }
});

/* global Promise */

var assert = require('assert');
var fs = require('fs');
var http = require('http');
var https = require('https');
var path = require('path');

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
  var options = {
    hostname: '127.0.0.1',
    port: port,
    path: pathname,
    method: 'GET'
  };
  if (protocol === 'https') {
    options.ca = fs.readFileSync(path.join(__dirname, '../ssl/ca.crt'));
    options.servername = 'localhost';
  }

  var req = client.request(options, function(res) {
    var body = '';
    res.setEncoding('utf8');
    res.on('data', function(chunk) {
      body += chunk;
    });
    res.on('end', function() {
      callback(null, {
        statusCode: res.statusCode,
        body: body
      });
    });
    res.on('error', callback);
  });

  req.on('error', callback);
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
    server.close(function(err) {
      if (err) {
        reject(err);
      } else {
        resolve();
      }
    });
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

function main() {
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

  assert(app.server);
  assert.strictEqual(typeof app.server.close, 'function');
  assert.strictEqual(webpackCalls.length, 1);
  assert.deepStrictEqual(webpackCalls[0], {entry: './fixture-entry.js'});

  app.get('/protocol-test', function(req, res) {
    res.status(200).send({
      devMiddleware: req.headers['x-dev-middleware'],
      hotMiddleware: req.headers['x-hot-middleware']
    });
  });

  return listeningAsync(app.server)
    .then(function() {
      var port = app.server.address().port;
      return requestAsync('http', port, '/protocol-test')
        .then(function(httpResult) {
          assert.strictEqual(httpResult.statusCode, 200);
          assert.deepStrictEqual(JSON.parse(httpResult.body), {
            devMiddleware: '1',
            hotMiddleware: '1'
          });

          return requestAsync('https', port, '/protocol-test');
        });
    })
    .then(function(httpsResult) {
      assert.strictEqual(httpsResult.statusCode, 200);
      assert.deepStrictEqual(JSON.parse(httpsResult.body), {
        devMiddleware: '1',
        hotMiddleware: '1'
      });
    })
    .then(function() {
      return closeAsync(app.server);
    })
    .catch(function(err) {
      return closeAsync(app.server).catch(function() {}).then(function() {
        throw err;
      });
    });
}

main().catch(function(err) {
  console.error(err);
  process.exit(1);
});

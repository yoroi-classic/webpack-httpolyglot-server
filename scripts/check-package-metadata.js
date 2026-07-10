'use strict';

var assert = require('node:assert/strict');
var pkg = require('../package.json');

assert.equal(pkg.private, true, 'package must stay private');
assert.equal(pkg.packageManager, 'npm@10.9.7', 'pin npm package manager');
assert.equal(pkg.engines.node, '>=22.13.0 <23', 'pin supported Node 22 LTS');
assert.equal(pkg.engines.npm, '>=10', 'declare supported npm baseline');
assert.equal(pkg.peerDependencies.webpack, '^5.101.0', 'align webpack peer');
assert.notEqual(
  pkg.dependencies['webpack-dev-middleware'],
  '*',
  'avoid wildcard runtime dependency ranges'
);
assert.equal(
  Object.prototype.hasOwnProperty.call(pkg.devDependencies, 'babel-eslint'),
  false,
  'do not use deprecated babel-eslint'
);

console.log('package metadata ok');

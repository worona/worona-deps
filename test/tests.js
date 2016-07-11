var test = require('ava');
var Worona = require('../src').Worona;

var worona;

test.beforeEach(function() {
  worona = new Worona();
});

test('Add package', function(t) {
  var pkg = { some: 'content' };
  worona.addPackage('pkg', pkg);
  t.deepEqual(worona._packages.pkg, pkg);
});

test('Replace package', function(t) {
  var pkg1 = { some: 'content' };
  worona.addPackage('pkg', pkg1);
  var pkg2 = { other: 'content' };
  worona.addPackage('pkg', pkg2);
  t.is(worona._packages.pkg, pkg2);
});

test('Get reducers', function(t) {
  var pkg1 = { reducers: { someRed: 11, default: 1 }};
  var pkg2 = { reducers: { someRed: 22, default: 2 }};
  worona.addPackage('pkg1', pkg1);
  t.deepEqual(worona.getReducers(), { pkg1: 1 });
  worona.addPackage('pkg2', pkg2);
  t.deepEqual(worona.getReducers(), { pkg1: 1, pkg2: 2 });
});

test('Get reducers. Packages without reducers', function(t) {
  var pkg1 = { reducers: { someRed: 11, default: 1 }};
  var pkg2 = {};
  worona.addPackage('pkg1', pkg1);
  t.deepEqual(worona.getReducers(), { pkg1: 1 });
  worona.addPackage('pkg2', pkg2);
  t.deepEqual(worona.getReducers(), { pkg1: 1 });
});

test('Get dependency level 1', function(t) {
  var pkg = { actions: { something: 1 } };
  worona.addPackage('pkg', pkg);
  t.is(worona.dep('pkg', 'actions'), pkg.actions);
});

test('Get dependency level 2', function(t) {
  var pkg = { actions: { something: 1 } };
  worona.addPackage('pkg', pkg);
  t.is(worona.dep('pkg', 'actions', 'something'), pkg.actions.something);
});

test('Get dependency level 3', function(t) {
  var pkg = { actions: { something: { more: 1 } } };
  worona.addPackage('pkg', pkg);
  t.is(worona.dep('pkg', 'actions', 'something', 'more'), pkg.actions.something.more);
});

test('Throw dependency level 0, no package', function(t) {
  t.throws(function() { worona.dep() });
});

test('Throw dependency level 1, no package', function(t) {
  t.throws(function() { worona.dep('pkg') });
});

test('Throw dependency level 2, no package', function(t) {
  t.throws(function() { worona.dep('pkg', 'actions') });
});

test('Throw dependency level 3, no package', function(t) {
  t.throws(function() { worona.dep('pkg', 'actions', 'something') });
});

test('Throw dependency level 2, package', function(t) {
  var pkg = {};
  worona.addPackage('pkg', pkg);
  t.throws(function() { worona.dep('pkg', 'actions') });
});

test('Throw dependency level 3, package', function(t) {
  var pkg = { actions: {} };
  worona.addPackage('pkg', pkg);
  t.throws(function() { worona.dep('pkg', 'actions', 'something') });
});

test('Get sagas', function(t) {
  debugger;
  var pkg = { sagas: { default: {} } };
  worona.addPackage('pkg', pkg);
  t.is(worona.getSagas('pkg'), pkg.sagas.default);
})

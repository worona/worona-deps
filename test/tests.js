var test = require('ava');
var Worona = require('../src').Worona;

var worona;

test.beforeEach(function() {
  worona = new Worona();
});

test.afterEach(function() {
  delete global.window;
});

test('Add package', function(t) {
  var pkg = { name: 'pkg-ext', namespace: 'pkg', some: 'content' };
  worona.addPackage(pkg);
  t.deepEqual(worona._downloaded['pkg-ext'], pkg);
  t.deepEqual(worona._deps['pkg'], pkg);
});

test('Replace package', function(t) {
  var pkg1 = { name: 'pkg1-ext', namespace: 'pkg', some: 'content' };
  worona.addPackage(pkg1);
  var pkg2 = { name: 'pkg2-ext', namespace: 'pkg', some: 'content' };
  worona.addPackage(pkg2);
  t.is(worona._downloaded['pkg1-ext'], pkg1);
  t.is(worona._downloaded['pkg2-ext'], pkg2);
  t.is(worona._deps['pkg'], pkg1);
  worona.activatePackage('pkg2-ext');
  t.is(worona._deps['pkg'], pkg2);
});

test('Get reducers', function(t) {
  var pkg1 = { name: 'pkg1-ext', namespace: 'pkg1', reducers: { someRed: 11, default: () => 1 } };
  var pkg2 = { name: 'pkg2-ext', namespace: 'pkg2', reducers: { someRed: 22, default: () => 2 } };
  worona.addPackage(pkg1);
  t.is(worona.getReducers('pkg1-ext'), 1);
  worona.addPackage(pkg2);
  t.is(worona.getReducers('pkg2-ext'), 2);
});

test('Get reducers. Packages without reducers', function(t) {
  var pkg1 = { name: 'pkg1-ext', namespace: 'pkg1', reducers: { someRed: 11, default: () => 1 } };
  var pkg2 = { name: 'pkg2-ext', namespace: 'pkg2' };
  worona.addPackage(pkg1);
  t.is(worona.getReducers('pkg1-ext'), 1);
  worona.addPackage(pkg2);
  t.is(worona.getReducers('pkg2-ext'), null);
});

test('Get locales. Empty locales', function(t) {
  t.deepEqual(worona.getLocales('test'), []);
});

test('Get locales', function(t) {
  var pkg1 = { name: 'pkg1-ext', namespace: 'pkg1', locales: function(lang) { return lang; } };
  var pkg2 = { name: 'pkg2-ext', namespace: 'pkg2', locales: function(lang) { return lang; } };
  worona.addPackage(pkg1);
  t.deepEqual(worona.getLocales('test'), [pkg1.locales('test')]);
  worona.addPackage(pkg2);
  t.deepEqual(worona.getLocales('test'), [pkg1.locales('test'), pkg2.locales('test')]);
});

test('Get locales. Packages without locales', function(t) {
  var pkg1 = { name: 'pkg1-ext', namespace: 'pkg1', locales: function(lang) { return lang; } };
  var pkg2 = { name: 'pkg2-ext', namespace: 'pkg2' };
  worona.addPackage(pkg1);
  t.deepEqual(worona.getLocales('test'), [pkg1.locales('test')]);
  worona.addPackage(pkg2);
  t.deepEqual(worona.getLocales('test'), [pkg1.locales('test')]);
});

test('Get locale', function(t) {
  var pkg1 = { name: 'pkg1-ext', namespace: 'pkg1', locales: function(lang) { return lang; } };
  var pkg2 = { name: 'pkg2-ext', namespace: 'pkg2', locales: function(lang) { return lang; } };
  worona.addPackage(pkg1);
  t.deepEqual(worona.getLocale('pkg1-ext', 'test'), pkg1.locales('test'));
  worona.addPackage(pkg2);
  t.deepEqual(worona.getLocale('pkg2-ext', 'test'), pkg2.locales('test'));
});

test('Get locale, non existant', function(t) {
  var pkg1 = { name: 'pkg1-ext', namespace: 'pkg1' };
  worona.addPackage(pkg1);
  t.deepEqual(worona.getLocale('pkg1-ext', 'test'), null);
});

test('Get dependency level 1', function(t) {
  var pkg = { name: 'pkg-ext', namespace: 'pkg', actions: { something: 1 } };
  worona.addPackage(pkg);
  t.is(worona.dep('pkg', 'actions'), pkg.actions);
});

test('Get dependency with replacement level 1', function(t) {
  var pkg1 = { name: 'pkg1-ext', namespace: 'pkg', actions: { something: 1 } };
  worona.addPackage(pkg1);
  var pkg2 = { name: 'pkg2-ext', namespace: 'pkg', actions: { something: 1 } };
  worona.addPackage(pkg2);
  t.is(worona.dep('pkg', 'actions'), pkg1.actions);
  worona.activatePackage('pkg2-ext');
  t.is(worona.dep('pkg', 'actions'), pkg2.actions);
});

test('Get dependency level 2', function(t) {
  var pkg = { name: 'pkg-ext', namespace: 'pkg', actions: { something: 1 } };
  worona.addPackage(pkg);
  t.is(worona.dep('pkg', 'actions', 'something'), pkg.actions.something);
});

test('Get dependency level 3', function(t) {
  var pkg = { name: 'pkg-ext', namespace: 'pkg', actions: { something: { more: 1 } } };
  worona.addPackage(pkg);
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
  var pkg = { name: 'pkg-ext', namespace: 'pkg' };
  worona.addPackage(pkg);
  t.throws(function() { worona.dep('pkg', 'actions') });
});

test('Throw dependency level 3, package', function(t) {
  var pkg = { name: 'pkg-ext', namespace: 'pkg', actions: {} };
  worona.addPackage(pkg);
  t.throws(function() { worona.dep('pkg', 'actions', 'something') });
});

test('Get sagas, no sagas', function(t) {
  var pkg = { name: 'pkg-ext', namespace: 'pkg' };
  worona.addPackage(pkg);
  t.false(worona.getSagas('pkg-ext'));
})

test('Get sagas, no default', function(t) {
  var pkg = { name: 'pkg-ext', namespace: 'pkg', sagas: {} };
  worona.addPackage(pkg);
  t.false(worona.getSagas('pkg-ext'));
})

test('Get sagas', function(t) {
  var pkg = { name: 'pkg-ext', namespace: 'pkg', sagas: { default: {} } };
  worona.addPackage(pkg);
  t.is(worona.getSagas('pkg-ext'), pkg.sagas.default);
})

test('Mock dep object', function(t) {
  var deps = {
    libs: { get somelib() { return worona.dep('some', 'fake', 'dep'); } },
    types: {
      get TYPE() { return worona.dep('other', 'fake', 'dep'); },
      get TYPE2() { return worona.dep('other', 'fake', 'dep2'); },
    },
  };

  t.throws(function() { deps.libs.somelib });
  t.throws(function() { deps.libs.somelib });
  t.throws(function() { deps.libs.somelib });

  worona.mock(deps);

  t.notThrows(function() { deps.libs.somelib });
  t.notThrows(function() { deps.libs.somelib });
  t.notThrows(function() { deps.libs.somelib });
});

test('isTest', function(t) {
  t.true(worona.isTest);
  global.window = {}; // Add window to simulate the browser.
  var otherWorona = new Worona(); // Create a new worona to reevaluate isTest.
  t.false(otherWorona.isTest);
});

test('isTest should be true again in the next tests', function(t) {
  t.true(worona.isTest);
});

test('isDev', function(t) {
  t.true(worona.isDev); // True by default
  global.window = { __worona__: { prod: true } }; // Add window to simulate the browser.
  var otherWorona = new Worona(); // Create a new worona to reevaluate isDev.
  t.false(otherWorona.isDev);
});

test('isProd', function(t) {
  t.false(worona.isProd); // False by default
  global.window = { __worona__: { prod: true } }; // Add window to simulate the browser.
  var otherWorona = new Worona(); // Create a new worona to reevaluate isProd.
  t.true(otherWorona.isProd);
});

test('isLocal', function(t) {
  t.true(worona.isLocal); // True by default
  global.window = { __worona__: { remote: true } }; // Add window to simulate the browser.
  var otherWorona = new Worona(); // Create a new worona to reevaluate isLocal.
  t.false(otherWorona.isLocal);
});

test('isRemote', function(t) {
  t.false(worona.isRemote); // False by default
  global.window = { __worona__: { remote: true } }; // Add window to simulate the browser.
  var otherWorona = new Worona(); // Create a new worona to reevaluate isRemote.
  t.true(otherWorona.isRemote);
});

test('isWeb', function(t) {
  t.true(worona.isWeb); // True by default
  global.window = { cordova: {} }; // Add window to simulate the browser.
  var otherWorona = new Worona(); // Create a new worona to reevaluate isWeb.
  t.false(otherWorona.isWeb);
});

test('isCordova', function(t) {
  t.false(worona.isCordova); // False by default
  global.window = { cordova: {} }; // Add window to simulate the browser.
  var otherWorona = new Worona(); // Create a new worona to reevaluate isCordova.
  t.true(otherWorona.isCordova);
});

test('waitForDep', function(t) {
  var pkg = { name: 'pkg-ext', namespace: 'pkg' };
  return worona.waitForDep('pkg').then(....)
});

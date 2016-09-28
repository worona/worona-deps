var test = require('ava');
var Worona = require('../src').Worona;

var worona;

test.beforeEach(function() {
  worona = new Worona();
});

test.afterEach(function() {
  try { delete global.window; } catch (error) {}
});

test('Add package', function(t) {
  var pkg = { name: 'pkg-ext', namespace: 'pkg', some: 'content' };
  worona.packageDownloaded(pkg);
  t.is(worona._downloaded['pkg-ext'], pkg);
  worona.packageActivated('pkg-ext');
  t.is(worona._activated['pkg'], pkg);
});

test('Replace package', function(t) {
  var pkg1 = { name: 'pkg1-ext', namespace: 'pkg', some: 'content' };
  worona.packageDownloaded(pkg1);
  var pkg2 = { name: 'pkg2-ext', namespace: 'pkg', some: 'content' };
  worona.packageDownloaded(pkg2);
  worona.packageActivated('pkg1-ext');
  t.is(worona._activated['pkg'], pkg1);
  worona.packageActivated('pkg2-ext');
  t.is(worona._activated['pkg'], pkg2);
});

test('Get reducers', function(t) {
  var pkg1 = { name: 'pkg1-ext', namespace: 'pkg1', reducers: { someRed: 11, default: () => 1 } };
  var pkg2 = { name: 'pkg2-ext', namespace: 'pkg2', reducers: { someRed: 22, default: () => 2 } };
  worona.packageDownloaded(pkg1);
  t.is(worona.getReducers('pkg1-ext'), 1);
  worona.packageDownloaded(pkg2);
  t.is(worona.getReducers('pkg2-ext'), 2);
});

test('Get reducers. Packages without reducers', function(t) {
  var pkg1 = { name: 'pkg1-ext', namespace: 'pkg1', reducers: { someRed: 11, default: () => 1 } };
  var pkg2 = { name: 'pkg2-ext', namespace: 'pkg2' };
  worona.packageDownloaded(pkg1);
  t.is(worona.getReducers('pkg1-ext'), 1);
  worona.packageDownloaded(pkg2);
  t.is(worona.getReducers('pkg2-ext'), null);
});

test('Get locales. Empty locales', function(t) {
  t.deepEqual(worona.getLocales('test'), []);
});

test('Get locales', function(t) {
  var pkg1 = { name: 'pkg1-ext', namespace: 'pkg1', locales: function(lang) { return lang; } };
  var pkg2 = { name: 'pkg2-ext', namespace: 'pkg2', locales: function(lang) { return lang; } };
  worona.packageDownloaded(pkg1);
  worona.packageActivated('pkg1-ext');
  t.deepEqual(worona.getLocales('test'), [pkg1.locales('test')]);
  worona.packageDownloaded(pkg2);
  worona.packageActivated('pkg2-ext');
  t.deepEqual(worona.getLocales('test'), [pkg1.locales('test'), pkg2.locales('test')]);
});

test('Get locales. Packages without locales', function(t) {
  var pkg1 = { name: 'pkg1-ext', namespace: 'pkg1', locales: function(lang) { return lang; } };
  var pkg2 = { name: 'pkg2-ext', namespace: 'pkg2' };
  worona.packageDownloaded(pkg1);
  worona.packageActivated('pkg1-ext');
  t.deepEqual(worona.getLocales('test'), [pkg1.locales('test')]);
  worona.packageDownloaded(pkg2);
  worona.packageActivated('pkg2-ext');
  t.deepEqual(worona.getLocales('test'), [pkg1.locales('test')]);
});

test('Get locale', function(t) {
  var pkg1 = { name: 'pkg1-ext', namespace: 'pkg1', locales: function(lang) { return lang; } };
  var pkg2 = { name: 'pkg2-ext', namespace: 'pkg2', locales: function(lang) { return lang; } };
  worona.packageDownloaded(pkg1);
  t.deepEqual(worona.getLocale('pkg1-ext', 'test'), pkg1.locales('test'));
  worona.packageDownloaded(pkg2);
  t.deepEqual(worona.getLocale('pkg2-ext', 'test'), pkg2.locales('test'));
});

test('Get locale, non existant', function(t) {
  var pkg1 = { name: 'pkg1-ext', namespace: 'pkg1' };
  worona.packageDownloaded(pkg1);
  t.deepEqual(worona.getLocale('pkg1-ext', 'test'), null);
});

test('Get dependency level 1', function(t) {
  var pkg = { name: 'pkg-ext', namespace: 'pkg', actions: { something: 1 } };
  worona.packageDownloaded(pkg);
  worona.packageActivated('pkg-ext');
  t.is(worona.dep('pkg', 'actions'), pkg.actions);
});

test('Get dependency with replacement level 1', function(t) {
  var pkg1 = { name: 'pkg1-ext', namespace: 'pkg', actions: { something: 1 } };
  worona.packageDownloaded(pkg1);
  worona.packageActivated('pkg1-ext');
  var pkg2 = { name: 'pkg2-ext', namespace: 'pkg', actions: { something: 1 } };
  worona.packageDownloaded(pkg2);
  t.is(worona.dep('pkg', 'actions'), pkg1.actions);
  worona.packageActivated('pkg2-ext');
  t.is(worona.dep('pkg', 'actions'), pkg2.actions);
});

test('Get dependency level 2', function(t) {
  var pkg = { name: 'pkg-ext', namespace: 'pkg', actions: { something: 1 } };
  worona.packageDownloaded(pkg);
  worona.packageActivated('pkg-ext');
  t.is(worona.dep('pkg', 'actions', 'something'), pkg.actions.something);
});

test('Get dependency level 3', function(t) {
  var pkg = { name: 'pkg-ext', namespace: 'pkg', actions: { something: { more: 1 } } };
  worona.packageDownloaded(pkg);
  worona.packageActivated('pkg-ext');
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
  worona.packageDownloaded(pkg);
  t.throws(function() { worona.dep('pkg', 'actions') });
});

test('Throw dependency level 3, package', function(t) {
  var pkg = { name: 'pkg-ext', namespace: 'pkg', actions: {} };
  worona.packageDownloaded(pkg);
  t.throws(function() { worona.dep('pkg', 'actions', 'something') });
});

test('Get sagas, no sagas', function(t) {
  var pkg = { name: 'pkg-ext', namespace: 'pkg' };
  worona.packageDownloaded(pkg);
  t.false(worona.getSagas('pkg-ext'));
})

test('Get sagas, no default', function(t) {
  var pkg = { name: 'pkg-ext', namespace: 'pkg', sagas: {} };
  worona.packageDownloaded(pkg);
  t.false(worona.getSagas('pkg-ext'));
})

test('Get sagas', function(t) {
  var pkg = { name: 'pkg-ext', namespace: 'pkg', sagas: { default: {} } };
  worona.packageDownloaded(pkg);
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

test('waitForDeps - complete before calling', function(t) {
  t.plan(1);
  var pkg = { name: 'pkg-ext', namespace: 'pkg' };
  worona.packageDownloaded(pkg);
  worona.packageActivated('pkg-ext');
  var promise = worona.waitForDeps(['pkg'], 1).then(function(result) {
    t.true(result);
  });
  return promise;
});

test('waitForDeps - complete after calling', function(t) {
  t.plan(1);
  var pkg = { name: 'pkg-ext', namespace: 'pkg' };
  var promise = worona.waitForDeps(['pkg'], 1).then(function(result) {
    t.true(result);
  });
  worona.packageDownloaded(pkg);
  worona.packageActivated('pkg-ext');
  return promise;
});

test('waitForDeps - complete with before and after reverse order', function(t) {
  t.plan(1);
  var pkg1 = { name: 'pkg1-ext', namespace: 'pkg1' };
  var pkg2 = { name: 'pkg2-ext', namespace: 'pkg2' };
  var pkg3 = { name: 'pkg3-ext', namespace: 'pkg3' };
  worona.packageDownloaded(pkg2);
  worona.packageDownloaded(pkg3);
  worona.packageDownloaded(pkg1);
  worona.packageActivated('pkg2-ext');
  worona.packageActivated('pkg3-ext');
  worona.packageActivated('pkg1-ext');
  var promise = worona.waitForDeps(['pkg1', 'pkg2', 'pkg3'], 1).then(function(result) {
    t.true(result);
  });
  return promise;
});

test('waitForDeps - fail with timeout', function(t) {
  t.plan(1);
  var promise = worona.waitForDeps(['pkg'], 1).catch(function(error) {
    t.true(!!error);
  });
  return promise;
});

test('waitForDeps - complete with before and after', function(t) {
  t.plan(1);
  var pkg1 = { name: 'pkg1-ext', namespace: 'pkg1' };
  var pkg2 = { name: 'pkg2-ext', namespace: 'pkg2' };
  var pkg3 = { name: 'pkg3-ext', namespace: 'pkg3' };
  worona.packageDownloaded(pkg1);
  worona.packageActivated('pkg1-ext');
  var promise = worona.waitForDeps(['pkg1', 'pkg2', 'pkg3'], 1)
    .then(function(result) { t.true(result); });
  worona.packageDownloaded(pkg2);
  worona.packageDownloaded(pkg3);
  worona.packageActivated('pkg2-ext');
  worona.packageActivated('pkg3-ext');
  return promise;
});

test('waitForDeps - fail with timeout and only one package', function(t) {
  t.plan(1);
  var pkg3 = { name: 'pkg3-ext', namespace: 'pkg3' };
  worona.packageDownloaded(pkg3);
  var promise = worona.waitForDeps(['pkg3', 'pkg4'], 1).catch(function(error) {
    t.true(!!error);
  });
  return promise;
});

test('waitForDeps - don\'t fail with timeout', function(t) {
  t.plan(1);
  var pkg = { name: 'pkg-ext', namespace: 'pkg' };
  var promise = worona.waitForDeps(['pkg'], 1)
    .then(function(result) { t.true(result); });
  worona.packageDownloaded(pkg);
  worona.packageActivated('pkg-ext');
  return promise;
});

test('waitForDeps - no dependencies', function(t) {
  t.plan(1);
  var promise = worona.waitForDeps([], 1)
    .then(function(result) { t.true(result); });
  return promise;
});

test('waitForDeps - packages depending on other packages', function(t) {
  t.plan(2);
  var pkg1 = { name: 'pkg1-ext', namespace: 'pkg1' };
  var pkg2 = { name: 'pkg2-ext', namespace: 'pkg2' };
  var pkg3 = { name: 'pkg3-ext', namespace: 'pkg3' };
  var dep1 = worona.waitForDeps(['pkg1', 'pkg2', 'pkg3'], 1)
    .then(function(result) { t.true(result); });
  var dep2 = worona.waitForDeps(['pkg1', 'pkg2', 'pkg3'], 1)
    .then(function(result) { t.true(result); });
  worona.packageDownloaded(pkg1);
  worona.packageActivated('pkg1-ext');
  worona.packageDownloaded(pkg2);
  worona.packageActivated('pkg2-ext');
  worona.packageDownloaded(pkg3);
  worona.packageActivated('pkg3-ext');
  return Promise.all([dep2, dep2]);
});

test('packageDevelopment', function(t) {
  var pkg1 = { name: 'pkg1' };
  worona.packageDevelopment(pkg1);
  t.deepEqual(worona._development, ['pkg1']);
  var pkg2 = { name: 'pkg2' };
  worona.packageDevelopment(pkg2);
  t.deepEqual(worona._development, ['pkg1', 'pkg2']);
});

test('getDevelopmentPackages', function(t) {
  var pkg1 = { name: 'pkg1' };
  var pkg2 = { name: 'pkg2' };
  worona.packageDevelopment(pkg1);
  worona.packageDevelopment(pkg2);
  t.deepEqual(worona.getDevelopmentPackages(), ['pkg1', 'pkg2']);
});

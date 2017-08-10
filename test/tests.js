import test from 'ava';
import worona, { Worona } from '../dist';

let woronaTest = null;
test.beforeEach(t => {
  woronaTest = new Worona();
});
test.afterEach(t => {
  woronaTest = null;
});

test('worona is exported fine', t => {
  t.truthy(worona);
  t.deepEqual(worona.packages, {});
});

test('woronaTest is created fine', t => {
  t.truthy(woronaTest);
  t.deepEqual(woronaTest.packages, {});
});

test('packages can be added', t => {
  const fakeModule = { reducers: { one: 1, two: 2 }, actions: { three: 3, four: 4 } };
  woronaTest.addPackage({ namespace: 'fakeModule', module: fakeModule });
  t.is(woronaTest.packages.fakeModule, fakeModule);
});

test('empty packages throw', t => {
  const fakeModule = {};
  t.throws(
    () => woronaTest.addPackage({ namespace: 'fakeModule' }),
    'Package not added because namespace or module is missing.'
  );
  t.throws(
    () => woronaTest.addPackage({ module: fakeModule }),
    'Package not added because namespace or module is missing.'
  );
});

test('dependencies of objects can be retrieved', t => {
  const fakeModule = { reducers: { one: 1, two: 2 }, Theme: 3 };
  woronaTest.addPackage({ namespace: 'fakeModule', module: fakeModule });
  const dep = woronaTest.dep('fakeModule', 'Theme');
  t.is(dep, 3);
});

test('dependencies of properties can be retrieved', t => {
  const fakeModule = { reducers: { one: 1, two: 2 }, actions: { three: 3, four: 4 } };
  woronaTest.addPackage({ namespace: 'fakeModule', module: fakeModule });
  const dep1 = woronaTest.dep('fakeModule', 'reducers', 'one');
  t.is(dep1, 1);
  const dep2 = woronaTest.dep('fakeModule', 'actions', 'four');
  t.is(dep2, 4);
});

test('non-existent dependencies throw', t => {
  t.throws(
    () => woronaTest.dep('fakeModule', 'reducers', 'one'),
    "Error retrieving dependency: 'fakeModule', 'reducers', 'one'."
  );
});

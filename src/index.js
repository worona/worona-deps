var map = require('lodash/map');

var Worona = function() {
  this._downloaded = {}; // Store the downloaded packages using their names.
  this._deps = {}; // Store references to the downloaded packages, using their namespaces.
  this.isTest = typeof window === 'undefined';
  this.isDev = !checkWorona('prod');
  this.isProd = checkWorona('prod');
  this.isLocal = !checkWorona('remote');
  this.isRemote = checkWorona('remote');
  this.isWeb = !checkGlobal('cordova');
  this.isCordova = checkGlobal('cordova');
}

function checkGlobal(variable) {
  if (typeof window !== 'undefined')
    return !!window[variable];
  return false;
}

function checkWorona(variable) {
  if (typeof window !== 'undefined' && typeof window.__worona__ !== 'undefined')
    return !!window.__worona__[variable];
  return false;
}

// Used to add a downloaded package to the system.
Worona.prototype.addPackage = function(pkg) {
  this._downloaded[pkg.name] = pkg;
  if (!this._deps[pkg.namespace]) this._deps[pkg.namespace] = pkg;
};

// Used to activate a package to start using it in the dependencies: worona.dep().
// Please not that if a package is downloaded and no other package with the same namespace is
// activated yet, it will be available using worona.dep() even if you don't use .activatePackage.
// This helps solving activation order and circular dependencies.
Worona.prototype.activatePackage = function(name) {
  var pkg = this._downloaded[name];
  this._deps[pkg.namespace] = pkg;
}

// Used to retrieve the root reducer of a specific namespace.
Worona.prototype.getReducers = function(namespace) {
  return this._deps[namespace].reducers && this._deps[namespace].reducers.default() || null;
}

// Used to retrieve all locales of a specific language.
Worona.prototype.getLocales = function(lng) {
  return map(this._deps, function(pkg) {
    if (pkg.locales)
      return pkg.locales(lng);
  })
  .filter(function(locale) { return !!locale; });
}

// Used to retrieve the locale of a namespace and language.
Worona.prototype.getLocale = function(namespace, lng) {
  return this._deps[namespace] && typeof this._deps[namespace].locales === 'function' ?
    this._deps[namespace].locales(lng) : null;
}

// Used to retrieve the root saga for a namespace.
Worona.prototype.getSagas = function(namespace) {
  if ((typeof this._deps[namespace] !== 'undefined') &&
  (typeof this._deps[namespace].sagas !== 'undefined') &&
  (typeof this._deps[namespace].sagas.default !== 'undefined')) {
    return this._deps[namespace].sagas.default;
  }
  return false;
}

var checkPackage = function(namespace, obj) {
  if (typeof namespace === 'undefined')
    throw new Error('Dependecy failed. You have to specify at least package name');
  else if (typeof obj[namespace] === 'undefined')
    throw new Error('Dependecy failed. ' + namespace + ' is not loaded.');
}

var checkString = function(propName) {
  if (typeof propName !== 'string')
    throw new Error('Dependecy failed. Please use strings to specify dependencies.');
}

var checkProp = function(namespace, obj, propName) {
  if (typeof obj[propName] === 'undefined')
    throw new Error('Dependecy failed. \'' + namespace + '\' exists, but \'' + namespace +
      '.' + propName + '\' doesn\'t.');
}

var nextDep = function(namespace, obj, propName, args) {
  checkString(propName);
  checkProp(namespace, obj, propName);
  if (typeof args[0] === 'undefined') {
    return obj[propName];
  }
  var nextArgs = args.slice(1);
  return nextDep(namespace + '.' + propName, obj[propName], args[0], nextArgs);
}

// Used to get a dependency in Worona. Usage is worona.dep('accounts', 'actions', 'login').
// More examples are in the tests.
Worona.prototype.dep = function() {
  var args = Array.prototype.slice.call(arguments);
  var namespace = args[0];
  var propName = args[1];
  checkString(namespace);
  checkPackage(namespace, this._deps);
  if (typeof propName === 'undefined') {
    return this._deps[namespace];
  }
  var nextArgs = args.slice(2);
  return nextDep(namespace, this._deps[namespace], propName, nextArgs);
}

// Used to mock a dependency when unit testing modules with dependencies. It is as simple as
// doing worona.mock(deps).
Worona.prototype.mock = function(deps) {
  var mockedDeps = {};
  for (var sub in deps) {
    mockedDeps[sub] = {};
    for (var subsub in deps[sub]) {
      mockedDeps[sub][subsub] = function(){};
    }
    deps[sub] = mockedDeps[sub];
  }
  return deps;
}

var worona = new Worona();

if (typeof window !== 'undefined') window.worona = worona;

module.exports = {
  default: worona,
  worona: worona,
  Worona: Worona,
  addPackage: worona.addPackage.bind(worona),
  getReducers: worona.getReducers.bind(worona),
  getLocales: worona.getLocales.bind(worona),
  getLocale: worona.getLocale.bind(worona),
  getSagas: worona.getSagas.bind(worona),
  dep: worona.dep.bind(worona),
  mock: worona.mock,
  isTest: worona.isTest,
  isDev: worona.isDev,
  isProd: worona.isProd,
  isLocal: worona.isLocal,
  isRemote: worona.isRemote,
  isWeb: worona.isWeb,
  isCordova: worona.isCordova,
};

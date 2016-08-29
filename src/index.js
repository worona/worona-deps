var mapValues = require('lodash/mapValues');
var omitBy = require('lodash/omitBy');
var map = require('lodash/map');

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

var Worona = function() {
  this._packages = {};
  this.isTest = typeof window === 'undefined';
  this.isDev = !checkWorona('prod');
  this.isProd = checkWorona('prod');
  this.isLocal = !checkWorona('remote');
  this.isRemote = checkWorona('remote');
  this.isWeb = !checkGlobal('cordova');
  this.isCordova = checkGlobal('cordova');
}

Worona.prototype.addPackage = function(name, pkg) {
  this._packages[name] = pkg;
};

Worona.prototype.getReducers = function(namespace) {
  return this._packages[namespace].reducers && this._packages[namespace].reducers.default() || null;
}

Worona.prototype.getLocales = function(lng) {
  return map(this._packages, function(pkg) {
    if (pkg.locales)
      return pkg.locales(lng);
  })
  .filter(function(locale) { return !!locale; });
}

Worona.prototype.getLocale = function(namespace, lng) {
  return this._packages[namespace] && typeof this._packages[namespace].locales === 'function' ?
    this._packages[namespace].locales(lng) : null;
}

Worona.prototype.getSagas = function(namespace) {
  if ((typeof this._packages[namespace] !== 'undefined') &&
  (typeof this._packages[namespace].sagas !== 'undefined') &&
  (typeof this._packages[namespace].sagas.default !== 'undefined')) {
    return this._packages[namespace].sagas.default;
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

Worona.prototype.dep = function() {
  var args = Array.prototype.slice.call(arguments);
  var namespace = args[0];
  var propName = args[1];
  checkString(namespace);
  checkPackage(namespace, this._packages);
  if (typeof propName === 'undefined') {
    return this._packages[namespace];
  }
  var nextArgs = args.slice(2);
  return nextDep(namespace, this._packages[namespace], propName, nextArgs);
}

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

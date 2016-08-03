var mapValues = require('lodash/mapValues');
var omitBy = require('lodash/omitBy');
var map = require('lodash/map');

function checkWindow(variable) {
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
  this.isWeb = !checkWindow('cordova');
  this.isCordova = checkWindow('cordova');
}

Worona.prototype.addPackage = function(name, pkg) {
  this._packages[name] = pkg;
};

Worona.prototype.getReducers = function() {
  var reducers = mapValues(this._packages, function(pkg) {
    if (pkg.reducers && pkg.reducers.default)
      return pkg.reducers.default();
  });
  return omitBy(reducers, function(reducer) {
    return !reducer;
  });
}

Worona.prototype.getLocales = function(lng) {
  return map(this._packages, function(pkg) {
    if (pkg.locales)
      return pkg.locales(lng);
  })
  .filter(function(locale) { return !!locale; });
}

Worona.prototype.getLocale = function(ns, lng) {
  return this._packages[ns] && typeof this._packages[ns].locales === 'function' ?
    this._packages[ns].locales(lng) : null;
}

Worona.prototype.getSagas = function(pkgName) {
  if ((typeof this._packages[pkgName] !== 'undefined') &&
  (typeof this._packages[pkgName].sagas !== 'undefined') &&
  (typeof this._packages[pkgName].sagas.default !== 'undefined')) {
    return this._packages[pkgName].sagas.default;
  }
  return false;
}

var checkPackage = function(pkgName, obj) {
  if (typeof pkgName === 'undefined')
    throw new Error('Dependecy failed. You have to specify at least package name');
  else if (typeof obj[pkgName] === 'undefined')
    throw new Error('Dependecy failed. ' + pkgName + ' is not loaded.');
}

var checkString = function(propName) {
  if (typeof propName !== 'string')
    throw new Error('Dependecy failed. Please use strings to specify dependencies.');
}

var checkProp = function(pkgName, obj, propName) {
  if (typeof obj[propName] === 'undefined')
    throw new Error('Dependecy failed. \'' + pkgName + '\' exists, but \'' + pkgName +
      '.' + propName + '\' doesn\'t.');
}

var nextDep = function(pkgName, obj, propName, args) {
  checkString(propName);
  checkProp(pkgName, obj, propName);
  if (typeof args[0] === 'undefined') {
    return obj[propName];
  }
  var nextArgs = args.slice(1);
  return nextDep(pkgName + '.' + propName, obj[propName], args[0], nextArgs);
}

Worona.prototype.dep = function() {
  var args = Array.prototype.slice.call(arguments);
  var pkgName = args[0];
  var propName = args[1];
  checkString(pkgName);
  checkPackage(pkgName, this._packages);
  if (typeof propName === 'undefined') {
    return this._packages[pkgName];
  }
  var nextArgs = args.slice(2);
  return nextDep(pkgName, this._packages[pkgName], propName, nextArgs);
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

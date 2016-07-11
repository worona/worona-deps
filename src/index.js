var mapValues = require('lodash/mapValues');
var omitBy = require('lodash/omitBy');

var Worona = function() {
  this._packages = {};
}

Worona.prototype.addPackage = function(name, pkg) {
  this._packages[name] = pkg;
};

Worona.prototype.getReducers = function() {
  var reducers = mapValues(this._packages, function(pkg) {
    if (pkg.reducers && pkg.reducers.default)
      return pkg.reducers.default
  });
  return omitBy(reducers, function(reducer) {
    return !reducer;
  });
}

Worona.prototype.getSagas = function(pkgName) {
  return this._packages[pkgName].sagas.default;
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

var worona = new Worona();

if (typeof window !== 'undefined') window.worona = worona;

module.exports = {
  default: worona,
  worona: worona,
  Worona: Worona,
  addPackage: worona.addPackage.bind(worona),
  getReducers: worona.getReducers.bind(worona),
  getSagas: worona.getSagas.bind(worona),
  dep: worona.dep.bind(worona),
};

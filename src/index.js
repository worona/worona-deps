var mapValues = require('lodash/mapValues');
var omitBy = require('lodash/omitBy');

var Worona = function() {
  this._packages = {};
}

Worona.prototype.addPackage = function(name, pkg) {
  if (typeof this._packages[name] === 'undefined') this._packages[name] = {};
  else for (var prop in this._packages[name]) delete this._packages[name][prop];
  Object.assign(this._packages[name], pkg);
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

Worona.prototype.dep = function(pkg, type, field) {
  if ((typeof pkg === 'undefined') || (typeof type === 'undefined'))
    throw new Error('Dependecy failed. You have to specify at least package name and type. ' +
      'For example, dep(\'accounts\', \'actions\').');
  else if (typeof this._packages[pkg] === 'undefined')
    throw new Error('Dependecy failed. Package "' + pkg + '" not found.');
  else if (typeof this._packages[pkg][type] === 'undefined')
    throw new Error('Dependecy failed. Package "' + pkg +
      '" found, but it doesn\'t contain "' + type + '".');
  else if (typeof field === 'undefined')
    return this._packages[pkg][type];
  else if (typeof this._packages[pkg][type][field] === 'undefined')
    throw new Error('Dependecy failed. Package "' + pkg + '.' + type +
      '" found, but it doesn\'t contain "' + field + '".');
  else
    return this._packages[pkg][type][field];
}

var worona = new Worona();

if (typeof window !== 'undefined') window.worona = worona;

module.exports = {
  default: worona,
  worona: worona,
  Worona: Worona,
};

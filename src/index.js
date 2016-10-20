var map = require('lodash/map');

var Worona = function() {
  this._downloaded = {}; // Store the downloaded packages using their names.
  this._activated = {}; // Store references to the downloaded packages, using their namespaces.
  this._development = []; // Store names of development packages.
  this._depSubscribers = []; // Stores callbacks subscribed to the deps.
  this.isTest = typeof window === 'undefined';
  this.isDev = !checkWorona('prod');
  this.isProd = checkWorona('prod');
  this.isLocal = !checkWorona('remote');
  this.isRemote = checkWorona('remote');
  this.isWeb = !checkGlobal('cordova');
  this.isCordova = checkGlobal('cordova');
  this.isGetDeps = false;
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

// Private method used to add subscribers to the dependencies notifications. It retuns an object with a stop()
// method.
Worona.prototype._addDepSubscriber = function(func) {
  var self = this;
  this._depSubscribers.push(func);
  return {
    stop: function(){
      var index = self._depSubscribers.indexOf(func);
      if (index !== -1) self._depSubscribers.splice(index, 1); },
  };
};

// Private method used to notifiy subscribers of new dependencies added to the system.
Worona.prototype._notifyDepSubscribers = function(namespace) {
  for (var i = this._depSubscribers.length - 1; i >= 0; i--) {
    var func = this._depSubscribers[i];
    func(namespace);
  }
};

// Accepts an array of dependencies and an optional timeout. Returns a promise which resolves
// to true when all the dependencies are met, or rejects with an error if the timeout strikes first.
Worona.prototype.waitForDeps = function(deps, timeout) {
  var self = this;
  return new Promise(function(resolve, reject) {
    var left = deps.slice(0); // Clone array.

    for (var i = left.length - 1; i >= 0; i--) {
      if (!!self._activated[left[i]]) {
        left.splice(i, 1);
      }
    }

    if (left.length !== 0) {
      var subscription = self._addDepSubscriber(function(namespace) {
        var index = left.indexOf(namespace);
        if (index !== -1) {
          left.splice(index, 1); // Remove the item from the array.
          if (left.length === 0) { // No more deps left. Yeah!
            subscription.stop();
            resolve(true);
          }
        }
      });
      if (timeout) {
        setTimeout(function () {
          subscription.stop();
          reject('Dependencies not supplied before timeout (' + timeout + ')');
        }, timeout);
      }
    } else {
      resolve(true);
    }
  });
}

// Used to add a downloaded package to the system.
Worona.prototype.packageDownloaded = function(pkg) {
  this._downloaded[pkg.name] = pkg;
};

// Used to add a development package to the system.
Worona.prototype.packageDevelopment = function(pkg) {
  this._development.push(pkg.name);
  this._downloaded[pkg.name] = pkg;
};

Worona.prototype.getDevelopmentPackages = function() {
  return this._development;
};

// Used to activate a package to start using it in the dependencies: worona.dep().
// Please not that if a package is downloaded and no other package with the same namespace is
// activated yet, it will be available using worona.dep() even if you don't use .packageActivated.
// This helps solving activation order and circular dependencies.
Worona.prototype.packageActivated = function(name) {
  var pkg = this._downloaded[name];
  this._activated[pkg.namespace] = pkg;
  this._notifyDepSubscribers(pkg.namespace);
}

// Used to retrieve the root reducer of a specific namespace.
Worona.prototype.getReducers = function(name) {
  return this._downloaded[name].reducers && this._downloaded[name].reducers.default() || null;
}

// Used to retrieve all locales of a specific language.
Worona.prototype.getLocales = function(lng) {
  return map(this._activated, function(pkg) {
    if (pkg.locales)
      return pkg.locales(lng);
  })
  .filter(function(locale) { return !!locale; });
}

// Used to retrieve the locale of a namespace and language.
Worona.prototype.getLocale = function(ns, lng) {
  return this._activated[ns] && typeof this._activated[ns].locales === 'function' ?
    this._activated[ns].locales(lng) : null;
}

// Used to retrieve the root saga for a namespace.
Worona.prototype.getSagas = function(name) {
  if ((typeof this._downloaded[name] !== 'undefined') &&
  (typeof this._downloaded[name].sagas !== 'undefined') &&
  (typeof this._downloaded[name].sagas.default !== 'undefined')) {
    return this._downloaded[name].sagas.default;
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
  var funcName = args[2];

  // If we are simply retrieving deps, return the namespace.
  if (this.isGetDeps) {
    return namespace;

  // If we are doing a test, retrieve a mock.
  } else if (this.isTest) {
    return (function(type, func) {
      return function() {
        return { type: type, func: func, args: Array.prototype.slice.call(arguments) };
      }
    })(propName, funcName);
  }

  // If we are retrieving a dependency, retrive it from _activated.
  checkString(namespace);
  checkPackage(namespace, this._activated);
  if (typeof propName === 'undefined') {
    return this._activated[namespace];
  }
  var nextArgs = args.slice(2);
  return nextDep(namespace, this._activated[namespace], propName, nextArgs);
}

// Used to get all dependencies from a module.
Worona.prototype.getDeps = function(name) {
  this.isGetDeps = true;
  var deps = this._downloaded[name].deps || {};
  var depsArr = [];
  for (var type in deps) {
    for (var dep in deps[type]) {
      var namespace = deps[type][dep];
      if (depsArr.indexOf(namespace) === -1) depsArr.push(namespace);
    }
  }
  this.isGetDeps = false;
  return depsArr;
}

// Used to mock a dependency when unit testing modules with dependencies. It is as simple as
// doing worona.mock(deps).
Worona.prototype.mock = function(deps) {
  var mockedDeps = {};
  for (var type in deps) {
    mockedDeps[type] = {};
    for (var func in deps[type]) {
      mockedDeps[type][func] = (function(type, func) {
        return function() {
          return { type: type, func: func, args: Array.prototype.slice.call(arguments) };
        }
      })(type, func);
    }
    deps[type] = mockedDeps[type];
  }
  return deps;
}

var worona = new Worona();

if (typeof window !== 'undefined' && !window.worona) { window.worona = worona; };

module.exports = {
  default: worona,
  worona: worona,
  Worona: Worona,
  packageDownloaded: worona.packageDownloaded.bind(worona),
  packageActivated: worona.packageActivated.bind(worona),
  packageDevelopment: worona.packageDevelopment.bind(worona),
  getDevelopmentPackages: worona.getDevelopmentPackages.bind(worona),
  getReducers: worona.getReducers.bind(worona),
  getLocales: worona.getLocales.bind(worona),
  getLocale: worona.getLocale.bind(worona),
  getSagas: worona.getSagas.bind(worona),
  waitForDeps: worona.waitForDeps.bind(worona),
  getDeps: worona.getDeps.bind(worona),
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

// JS snippet that's needed for sakura dynamic-bud entries to work
// Maintains a modules table that can be accessed via global functions _e (export) and _r (require)
(function() {
  var root = this;
  var modules = {/**!-shim-entries-stub-!**/};

  root._e = function(id, module) {
    if (modules.hasOwnProperty(id)) throw '_e() called for existing module ' + id;
    modules[id] = module;
  };

  root._r = function(id) {
    if (!modules.hasOwnProperty(id)) throw '_r() called for nonexistent module ' + id;
    return modules[id];
  };
}).call(this);

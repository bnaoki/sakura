var fs = require('fs');
var path = require('path');
var Module = require('module');
var _ = require('underscore');
var UglifyJS = require('uglify-js');
var BaseBud = require('./base-bud');

// Given a list of input files, expands all direct + transitive dependencies and outputs all files
// in order such that, for any given module, no module will appear before any of its dependents.
var DynamicBud = BaseBud.extend({

  validate: function(attrs, options) {
    var error = DynamicBud.__super__.validate.apply(this, arguments);
    if (error) return error;
    if (!_.isString(attrs.minDestFile)) return 'Invalid or missing value for minDestFile';
    if (!attrs.inputs || !attrs.inputs.length) return 'Missing inputs entry';
  },

  parse: function(resp) {
    // evaluate + replace regex: ignore entries as RegExp objects
    resp.ignores = _.map(resp.ignores, function(path) {
      var match = path.match(/^regex:\/([^\/]*)\/([gim]{0,3})$/);
      return match ? new RegExp(match[1], match[2]) : path;
    });
    return resp;
  },

  print: function() {
    var files = this._expandInputs();
    var rootPath = path.join(process.cwd(), this.get('fileRoot'));

    var content = _.reduce(files, function(memo, file) {

      var fileId = path.relative(rootPath, file).replace(/\.js$/, '');
      var fContent = fs.readFileSync(file, 'utf8');

      // Replace require(...) calls w/ _r(...)
      fContent = fContent.replace(/require\(("([^"]+)"|'([^']+)')\)/g, function(match, p1, p2, p3) {
        var id = p2 || p3; // p2 undefined when p3 matches and vice versa
        if (/^\./.test(id)) {
          p1 = p1.replace(id, path.relative(rootPath, path.resolve(path.dirname(file), id)));
        }
        return '_r('+ p1 + ')';
      });

      // Replace module.exports w/ _e(...)
      fContent = fContent.replace(/module\.exports\s*=\s*(\S+)\s*;/g, '_e(\'' + fileId + '\', $1)');

      // Indent and wrap w/ immediate function
      fContent = fContent.replace(/^(.+)$/gm, '  $1');
      fContent = '(function() {\n' + fContent + '}).call(this);';

      return memo + '\n/*** ' + fileId + ' ***/\n' + fContent + '\n';
    }, '');

    var shimJsCode = '';
    var shim = this.get('shim') || {};
    _.each(shim, function(value, key, list) {
      shimJsCode === '' || (shimJsCode += ', ');
      shimJsCode += "'" + key + "': root['" + value + "']";
    });
    var jsSnippetPath = path.join(__dirname, '..', 'resources', 'sakura-dynamic-snippet.js');
    var jsSnippet = fs.readFileSync(jsSnippetPath, 'utf8');
    jsSnippet = jsSnippet.replace('/**!-shim-entries-stub-!**/', shimJsCode);
    content = jsSnippet + content;
    return content;
  },

  printMin: function(content) {
    if (typeof content === 'undefined') content = this.print();
    var result = UglifyJS.minify(content, {
      fromString: true,
      warnings: false
    });
    return result.code;
  },

  // Returns a list of all direct + transitive dependencies for configured input files. The
  // dependencies are in order such that, for any given module, no module will appear before any of
  // its dependents. Relies on node's Module impl to construct and walk the dependency tree
  _expandInputs: function() {
    var resolved = [];
    var seen = [];
    _.each(this.get('inputs'), function(filename) {
      filename = path.join(process.cwd(), this.get('fileRoot'), filename);

      // HACK: wipe out node's module cache each time to ensure module.children is propogated on
      // require calls
      Module._cache = {};
      var module = new Module(filename, null);
      module.load(filename);

      this._resolveDeps(module, resolved, seen);
    }, this);
    return resolved;
  },

  // Recursive function that walks down module dependency trees and determines the correct order
  // for modules. Throws an error if a circular dependency is detected.
  _resolveDeps: function(module, resolved, seen) {
    var filename = module.filename;

    // skip if module has already been resolved
    if (_.contains(resolved, filename)) return;

    // if it's unresolved and we've already seen it then there's a circular dependency
    if (_.contains(seen, filename)) {
      throw 'Circular dependency detected: ' + filename;
    }

    seen.push(filename);
    var deps = _.reject(module.children, function(dep) {

      // skip if filename matches any of the ignore entries
      var match = _.any(this.get('ignores'), function(ignore) {
        return _.isRegExp(ignore) ? ignore.test(dep.filename) : ignore === dep.filename;
      }, this);
      return match;
    }, this);

    // resolve all dep modules first before adding this module to resolved
    _.each(deps, function(dep) {
      this._resolveDeps(dep, resolved, seen);
    }, this);
    resolved.push(filename);
  }

});

module.exports = DynamicBud;

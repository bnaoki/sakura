var _ = require('underscore');
var execSync = require('execSync');
var UglifyJS = require('uglify-js');
var BaseBud = require('./base-bud');

// Runs the handlebars precompiler (http://handlebarsjs.com/precompilation.html) for the configured
// set of files.
var HandlebarsBud = BaseBud.extend({

  validate: function(attrs, options) {
    var error = HandlebarsBud.__super__.validate.apply(this, arguments);
    if (error) return error;
    if (!_.isString(attrs.minDestFile)) return 'Invalid or missing value for minDestFile';
    if (!attrs.files || !attrs.files.length) return 'Missing files entry';
  },

  print: function() {
    // redirect stderr because execSync appends stderr to stdout
    // TODO: use the handlebars copy in sakura/node_modules in case it's not installed globally
    var cmd = 'handlebars ' + this.get('files').join(' ') + ' 2> /dev/null';
    var result = execSync.exec(cmd);
    if (result.code !== 0) throw 'Handlebars command (below) errored out with exit code ' +
        result.code + '\n' + cmd;
    return result.stdout;
  },

  printMin: function(content) {
    if (typeof content === 'undefined') content = this.print();
    var result = UglifyJS.minify(content, {
      fromString: true,
      warnings: false
    });
    return result.code;
  }

});

module.exports = HandlebarsBud;

var fs = require('fs');
var _ = require('underscore');
var UglifyJS = require('uglify-js');
var BaseBud = require('./base-bud');

// A simple bud that concatenates configured list of files.
var StaticBud = BaseBud.extend({

  validate: function(attrs, options) {
    var error = StaticBud.__super__.validate.apply(this, arguments);
    if (error) return error;
    if (!_.isString(attrs.minDestFile)) return 'Invalid or missing value for minDestFile';
    if (!attrs.files || !attrs.files.length) return 'Missing files entry';
  },

  print: function() {
    var content = _.reduce(this.get('files'), function(memo, file) {
      var fContent = fs.readFileSync(file, 'utf8');
      return memo + '/*** ' + file + ' ***/\n' + fContent + '\n';
    }, '');
    return content;
  },

  printMin: function(content) {
    if (typeof content === 'undefined') content = this.print();
    var result = UglifyJS.minify(content, {
      fromString: true,
      warnings: false,
      output: {
        comments: function(node, comment) {
          return /^\**!/.test(comment.value);
        }
      },
      compress: {
        hoist_funs: false
      }
    });
    return result.code;
  }

});

module.exports = StaticBud;

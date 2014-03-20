var fs = require('fs');
var _ = require('underscore');
var Backbone = require('backbone');

// Base implementation of a Bud. All Bud's should extend this module and a corresponding entry be
// added for in the Buds collection module.
var BaseBud = Backbone.Model.extend({

  validate: function(attrs, options) {
    if (!_.isString(attrs.destFile)) return 'Invalid or missing value for destFile';
  },

  // Process and write out the regular and minified versions for this bud. Skips if the content is
  // the same as what's already written out.
  run: function() {
    var content = this.print();
    var minContent = this.printMin(content);

    // Skip if content is unchanged. Checks the unminified verison only because the minified version
    // can be different per run.
    if (this.isUnchanged(content)) {
      console.log('Skipping (unchanged): ' + this.get('destFile'));
      console.log('Skipping (unchanged): ' + this.get('minDestFile'));
      return;
    }

    // Write out the files. If minContent is undefined, there's no min version so skip
    this.write(content);
    if (typeof minContent !== 'undefined') this.writeMin(minContent);
  },

  // Returns true if content is the same as what's already written out on disk. Can optionally pass
  // in pre-rendered content to avoid unnecessary computation if print had already been called.
  isUnchanged: function(content) {
    if (typeof content === 'undefined') content = this.print();
    var existingContent = fs.existsSync(this.get('destFile')) ?
        fs.readFileSync(this.get('destFile'), 'utf8') :
        null;
    return content === existingContent;
  },

  write: function(content) {
    if (typeof content === 'undefined') content = this.print();
    console.log('\033[32mWriting: ' + this.get('destFile') + '\033[00m');
    fs.writeFileSync(this.get('destFile'), content, 'utf8');
  },

  writeMin: function(minContent) {
    if (typeof minContent === 'undefined') minContent = this.printMin();
    if (typeof minContent === 'undefined') return;
    console.log('\033[32mWriting: ' + this.get('minDestFile') + '\033[00m');
    fs.writeFileSync(this.get('minDestFile'), minContent, 'utf8');
  },

  // Stub. Overwrite this fn in child modules.
  print: function() {
    return undefined;
  },

  // Stub. Overwrite this fn in child modules.
  printMin: function(content) {
    return undefined;
  }

});

module.exports = BaseBud;

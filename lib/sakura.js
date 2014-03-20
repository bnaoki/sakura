var path = require('path');
var argv = require('optimist').argv;
var _ = require('underscore');
var Monitor = require('forever-monitor').Monitor;
var Buds = require('./buds');

var options = {};

// -w, --watch
// Watch will hang the process and rerun whenever there are changes in configured watchDir
options.watch = !!argv.w || !!argv.watch;

// -f, --file <file>
// Path to sakura config file to run. If unspecified, defauls to CWD/sakura.json
options.file = argv.f || argv.file || path.join(process.cwd(), 'sakura.json');

// --single-run <bud-index>
// Bud index position in config. When set, sakura runs for the single corresponding bud at the 
// specified index and skips all other buds.
options.single = argv['single-run'];

// --spin
// Spins the process so that it doesn't exit. Applicable for --single-run only.
options.spin = !!argv.spin;

var config = require(options.file);
var buds = new Buds(config.buds, { parse: true });

// Validate all buds before running
buds.each(function(bud) {
  if (!bud.isValid()) {
    var err = 'Invalid bud config: ' + bud.validationError + '\n' +
        JSON.stringify(bud.attributes, null, 2);
    throw err;
  }
});

if (options.single !== undefined) {
  try {
    if (!_.isNumber(options.single) || buds.length <= options.single) {
      throw 'Invalid index ' + options.single + ' for buds entries of size ' + buds.length;
    }
    buds.at(options.single).run();
  } catch (err) {
    console.log('\033[31m' + err + '\033[00m');
  }

  // If set to spin, prevent the process from exiting. This prevents forever from keep restarting
  if (options.spin) process.stdin.resume();
} else {
  buds.each(function(bud, index) {

    // If set to watch, spawn off new monitor with forever
    if (options.watch && bud.has('watchDir')) {
      var child = new Monitor(__filename, {
        options: ['--single-run', index, '-f', options.file, '--spin'],
        watch: true,
        watchDirectory: bud.get('watchDir')
      });
      child.start();

    // Otherwise just run it once
    } else {
      bud.run();
    }
  });
}

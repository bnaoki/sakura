var Backbone = require('backbone');
var DynamicBud = require('./dynamic-bud');
var StaticBud = require('./static-bud');
var HandlebarsBud = require('./handlebars-bud');

var Buds = Backbone.Collection.extend({

  model: function(attrs, options) {
    switch (attrs._type) {
      case 'dynamic':
        return new DynamicBud(attrs, options);
        break;
      case 'static':
        return new StaticBud(attrs, options);
        break;
      case 'handlebars':
        return new HandlebarsBud(attrs, options);
        break;
      default:
        throw 'Invalid or missing bud type: ' + attrs._type;
    }
  }

});

module.exports = Buds;

var Backbone = require('backbone');
var _ = require('underscore');

var add = function() {
  if(this.limit && this.length > this.limit) {
    var rest = this.removeFirst === 'new' ?
      this.models.slice(0, this.length - this.limit)
    : this.models.slice(this.limit);

    this.remove(rest);
  }
};

module.exports = function(model, limit, options) {
  if(!(model instanceof Backbone.Collection)) throw "must be Backbone collection";

  _.extend(model, {
    removeFirst: 'old',
    // Throttle gives better performance when adding models in batches, but
    // results in asynchronous behavior - limits are enforced earliest 50 ms
    // after a model is added.
    throttle: true
  }, options || {});

  model.limit = limit || 10;

  if([ 'old', 'new' ].indexOf(model.removeFirst) < 0) throw "removeFirst must be 'old or 'new'";

  var _add = model.throttle ?  _.throttle(_.bind(add, model), 50) : _.bind(add, model);
  model.on('reset add', _add);
};

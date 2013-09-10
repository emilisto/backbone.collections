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

module.exports = function(coll, limit, options) {
  if(!coll.add || !coll.on || !coll.remove) throw new Error("must be Backbone collection");

  _.extend(coll, {
    removeFirst: 'old',
    // Throttle gives better performance when adding models in batches, but
    // results in asynchronous behavior - limits are enforced earliest 50 ms
    // after a model is added.
    throttle: true
  }, options || {});

  coll.limit = limit || 10;

  if([ 'old', 'new' ].indexOf(coll.removeFirst) < 0) throw "removeFirst must be 'old or 'new'";

  var _add = coll.throttle ?  _.throttle(_.bind(add, coll), 50) : _.bind(add, coll);
  coll.on('reset add', _add);
};

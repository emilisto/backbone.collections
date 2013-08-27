var Backbone = require('backbone');
var _ = require('underscore');

var collProto = Backbone.Collection.prototype,
    add = collProto.add,
    remove = collProto.remove,
    set = collProto.reset,
    reset = collProto.reset;

// Premise: The same model can't be in two collections
var JointCollection = Backbone.Collection.extend({
  constructor: function(options) {
    collProto.constructor.call(this);
    _.bindAll(this, '_sourceAdded', '_sourceRemoved');

    this._sources = [];
  },

  connect: function(coll) {
    if(this._sources.indexOf(coll) >= 0) throw new Error('collection already connected');

    this._sources.push(coll);
    this.listenTo(coll, 'add', this._sourceAdded);
    this.listenTo(coll, 'remove', this._sourceRemoved);
    coll.each(this._sourceAdded);
  },

  _sourceAdded: function(model) {
    add.call(this, model);
  },
  _sourceRemoved: function(model) {
    remove.call(this, model);
  },

  disconnect: function(coll) {
    if(this._sources.indexOf(coll) < 0) throw new Error('collection is not connected');

    this._sources = _.without(this._sources, coll);
    this.stopListening(coll);
    coll.each(this._sourceRemoved);
  },

  disconnectAll: function() {
    reset.call(this, []);
    this._sources = [];
    this.stopListening();
  },

  fetch: function(options) {
    _.invoke(this._sources, 'fetch', options);
  }

});

var limitCollection = (function() {
  var add = function() {
    if(this.limit && this.length > this.limit) {
      var rest = this.removeFirst === 'new' ?
        this.models.slice(0, this.length - this.limit)
      : this.models.slice(this.limit);

      this.remove(rest);
    }
  };

  return function(model, limit, options) {
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
}());

module.exports = {
  JointCollection: JointCollection,
  limitCollection: limitCollection
};

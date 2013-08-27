var Backbone = require('backbone');
var _ = require('underscore');

var collProto = Backbone.Collection.prototype,
    add = collProto.add,
    remove = collProto.remove,
    set = collProto.reset,
    reset = collProto.reset;

// Premise: The same model can't be in two collections
var Union = Backbone.Collection.extend({
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

module.exports = Union;

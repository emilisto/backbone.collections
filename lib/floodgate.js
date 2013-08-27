var Backbone = require('backbone');
var _ = require('underscore');

var FloodgateCollection = Backbone.Collection.extend({
  constructor: function(coll, options) {
    _.bindAll(this, '_added', '_removed', 'drain', 'expel', 'pending');

    Backbone.Collection.prototype.constructor.call(this);

    this._pending = [];

    this.listenTo(coll, 'add', this._added);
    this.listenTo(coll, 'remove', this._removed)
    this.listenTo(coll, 'reset', this._reseted)
    coll.each(this._added);

  },

  drain: function() {
    this.add(this._pending);
    this._pending = [];
  },

  expel: function() {
    this._pending = _.uniq([].concat(this.models, this._pending));
    this.reset();
  },

  pending: function() {
    return this._pending.length;
  },

  _added: function(model) {
    this._pending.push(model);
    this.trigger('pending', this.pending(), model);
  },

  _removed: function(model) {
    var prevLength = this.pending();
    this._pending = _.without(this._pending, model);
    var newLength = this.pending();

    if(newLength > 0 && newLength < prevLength) {
      this.trigger('pending', model);
    }

    if(this.get(model.id)) this.remove(model);
  },

  _reseted: function() {
    this._pending = [];
    this.reset();
  }

});

module.exports = FloodgateCollection;

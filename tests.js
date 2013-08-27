var Joint = require('./index').Joint
  , limit = require('./index').limit
  , Faucet = require('./index').Faucet
  , Backbone = require('backbone')
  , _ = require('underscore')
  , assert = require('assert')
  , sinon = require('sinon')
;

var C = Backbone.Collection, M = Backbone.Model;

var models = (function() {
  var names = [
    'first', 'second', 'third', 'fourth', 'fifth', 'sixth', 'seventh',
    'eighth', 'ninth', 'tenth'
  ];
  return _.object(_.map(names, function(name, i) {
    return [ name, new M({ id: i + 1 }) ];
  }));
}());

module.exports = {
  'Joint': {
    basics: function() {
      var coll1 = new C();
      var coll2 = new C();

      coll1.add(models['first']);
      coll1.add(models['second']);
      coll2.add(models['third']);

      var jc = new Joint();

      jc.connect(coll1);
      jc.connect(coll2);

      assert(jc.get(1) && jc.get(2) && jc.get(3), 'existing models in source collections should be present');

      coll2.add(models['fourth']);
      assert(jc.get(4), 'adding a model to a source collection should make it present in the Joint');

      jc.disconnect(coll1);
      assert(!jc.get(1) && !jc.get(2), 'disconnecting a source collection should remove all its members from the Joint');

      jc.disconnectAll();
      assert(jc.length === 0, 'disconnectingAll should make the Joint empty');
    },

    fetching: function() {
      var coll1 = new C();
      var coll2 = new C();
      var fetch1 = coll1.fetch = sinon.spy();
      var fetch2 = coll2.fetch = sinon.spy();

      var jc = new Joint();
      jc.connect(coll1);
      jc.connect(coll2);

      jc.fetch();

      assert(fetch1.called && fetch2.called, 'running fetch() on a Joint should run fetch() an all source collections'); 
    }

  },

  limit: function() {
    var CustomCollection = C.extend({
      comparator: function(model) { return -model.id; }
    });

    var coll = new CustomCollection();
    limit(coll, 2, { throttle: false });
    coll.add(models['first']);
    coll.add(models['second']);
    coll.add(models['third']);
    coll.add(models['fourth']);
    assert(!coll.get(1), 'oldest model should have been removed');

    var coll = new CustomCollection();
    limit(coll, 2, { removeFirst: 'new', throttle: false });
    coll.add(models['fourth']);
    coll.add(models['third']);
    coll.add(models['second']);
    coll.add(models['first']);
    assert(!coll.get(4), 'newest model should have been removed');

  },

  Combined: function() {

    var CustomCollection = C.extend({
      comparator: function(model) { return -model.id; }
    });

    var coll1 = new CustomCollection,
        coll2 = new CustomCollection,
        jc = new Joint;

    limit(coll1, 3, { throttle: false });
    limit(coll2, 3, { throttle: false });
    jc.connect(coll1);
    jc.connect(coll2);

    // First two should go once we hit the 3 limit, i.e. 'first' and 'second'
    coll1.add(models['first']);
    coll1.add(models['second']);
    coll1.add(models['third']);
    coll1.add(models['fourth']);
    coll1.add(models['fifth']);

    // First two should go once we hit the 3 limit: i.e. 'sixth' and 'seventh'
    coll2.add(models['sixth']);
    coll2.add(models['seventh']);
    coll2.add(models['eighth']);
    coll2.add(models['ninth']);
    coll2.add(models['tenth']);

    assert(
      _.intersection(jc.pluck('id'), [ 1, 2, 6, 7 ]).length === 0,
      "first two models in each of the source collections shouldn't be in the joint collection"
    );
  },

  Faucet: function() {
    var coll = new C();
    coll.add(models['first']);
    coll.add(models['second']);
    coll.add(models['third']);
    coll.add(models['fourth']);

    var fc = new Faucet(coll);

    assert.equal(fc.length, 0, 'floodgate should be empty until its drained');
    assert.equal(fc.pending(), 4, 'there should be 4 models in the gate');

    fc.drain();
    assert.equal(fc.length, 4, 'floodgate should be empty until its drained');
    assert.equal(fc.pending(), 0, 'there should be 4 models in the gate');

    coll.add(models['fifth']);
    assert.equal(fc.length, 4);
    assert.equal(fc.pending(), 1);

    coll.add('sixth');
    var expected = fc.pending() + fc.length;
    fc.expel();
    assert.equal(fc.pending(), expected, 'existing AND pending models should end up in the gate after expelling');

    coll.reset();
    assert.equal(fc.length + fc.pending(), 0, 'resting should remove all models - existing and pending')

  }

};


var Union = require('./index').Union
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
  'Union': {
    basics: function() {
      var coll1 = new C();
      var coll2 = new C();

      coll1.add(models['first']);
      coll1.add(models['second']);
      coll2.add(models['third']);

      var uc = new Union();

      uc.connect(coll1);
      uc.connect(coll2);

      assert(uc.get(1) && uc.get(2) && uc.get(3), 'existing models in source collections should be present');

      coll2.add(models['fourth']);
      assert(uc.get(4), 'adding a model to a source collection should make it present in the Union');

      uc.disconnect(coll1);
      assert(!uc.get(1) && !uc.get(2), 'disconnecting a source collection should remove all its members from the Union');

      uc.disconnectAll();
      assert(uc.length === 0, 'disconnectingAll should make the Union empty');
    },

    fetching: function() {
      var coll1 = new C();
      var coll2 = new C();
      var fetch1 = coll1.fetch = sinon.spy();
      var fetch2 = coll2.fetch = sinon.spy();

      var uc = new Union();
      uc.connect(coll1);
      uc.connect(coll2);

      uc.fetch();

      assert(fetch1.called && fetch2.called, 'running fetch() on a Union should run fetch() an all source collections'); 
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
        uc = new Union;

    limit(coll1, 3, { throttle: false });
    limit(coll2, 3, { throttle: false });
    uc.connect(coll1);
    uc.connect(coll2);

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
      _.intersection(uc.pluck('id'), [ 1, 2, 6, 7 ]).length === 0,
      "first two models in each of the source collections shouldn't be in the joint collection"
    );
  },

  Faucet: {
    basics: function() {
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

    },
    drainCondition: function() {

      var coll = new C;
      var fc = new Faucet(coll, {
        drainCondition: function(model) {
          return model.id <= 5;
        }
      });

      coll.add([models['first'], models['second']]);
      assert.equal(fc.length, 2, 'models for which the drainCondition is true SHOULD be auto-added');

      coll.add([models['eighth'], models['ninth'], models['tenth']]);
      assert.equal(fc.pending(), 3, 'models for which the drainCondition is false SHOULD NOT be auto-added');
    },
  },

};


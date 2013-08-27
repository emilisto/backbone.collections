var JointCollection = require('./index').JointCollection
  , limitCollection = require('./index').limitCollection
  , Backbone = require('backbone')
  , _ = require('underscore')
  , assert = require('assert')
  , sinon = require('sinon')
;

var C = Backbone.Collection, M = Backbone.Model;

module.exports = {
  'JointCollection': {
    basics: function() {
      var coll1 = new C();
      var coll2 = new C();

      var models = {
        'first'  : new M({ id : 1 }),
        'second' : new M({ id : 2 }),
        'third'  : new M({ id : 3 }),
        'fourth' : new M({ id : 4 }),
        'fifth'  : new M({ id : 5 }),
      };

      coll1.add(models['first']);
      coll1.add(models['second']);
      coll2.add(models['third']);

      var jc = new JointCollection();

      jc.connect(coll1);
      jc.connect(coll2);

      assert(jc.get(1) && jc.get(2) && jc.get(3), 'existing models in source collections should be present');

      coll2.add(models['fourth']);
      assert(jc.get(4), 'adding a model to a source collection should make it present in the JointCollection');

      jc.disconnect(coll1);
      assert(!jc.get(1) && !jc.get(2), 'disconnecting a source collection should remove all its members from the JointCollection');

      jc.disconnectAll();
      assert(jc.length === 0, 'disconnectingAll should make the JointCollection empty');
    },

    fetching: function() {
      var coll1 = new C();
      var coll2 = new C();
      var fetch1 = coll1.fetch = sinon.spy();
      var fetch2 = coll2.fetch = sinon.spy();

      var jc = new JointCollection();
      jc.connect(coll1);
      jc.connect(coll2);

      jc.fetch();

      assert(fetch1.called && fetch2.called, 'running fetch() on a JointCollection should run fetch() an all source collections'); 
    }
  },

  LimitCollection: function() {
    var models = {
      'first'  : new M({ id : 1 }),
      'second' : new M({ id : 2 }),
      'third'  : new M({ id : 3 }),
      'fourth' : new M({ id : 4 }),
      'fifth'  : new M({ id : 5 }),
    };
    var CustomCollection = C.extend({
      comparator: function(model) { return -model.id; }
    });

    var coll = new CustomCollection();
    LimitCollection(coll, 2, { throttle: false });
    coll.add(models['first']);
    coll.add(models['second']);
    coll.add(models['third']);
    coll.add(models['fourth']);
    assert(!coll.get(1), 'oldest model should have been removed');

    var coll = new CustomCollection();
    LimitCollection(coll, 2, { removeFirst: 'new', throttle: false });
    coll.add(models['fourth']);
    coll.add(models['third']);
    coll.add(models['second']);
    coll.add(models['first']);
    assert(!coll.get(4), 'newest model should have been removed');

  },

  Combined: function() {
    var names = [
      'first', 'second', 'third', 'fourth', 'fifth', 'sixth', 'seventh',
      'eighth', 'ninth', 'tenth'
    ];
    var models = _.object(_.map(names, function(name, i) {
      return [ name, new M({ id: i + 1 }) ];
    }));

    var CustomCollection = C.extend({
      comparator: function(model) { return -model.id; }
    });

    var coll1 = new CustomCollection,
        coll2 = new CustomCollection,
        jc = new JointCollection;

    LimitCollection(coll1, 3, { throttle: false });
    LimitCollection(coll2, 3, { throttle: false });
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
  }

};

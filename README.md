# backbone.collections

Collection of various tools I've created for working with Backbone
Collections. Currently including:

- `Joint`: Joining an arbitrary no. of collections into one - adding and
removing models to connected collections will result in them being added
or removed to the `Joint` collection.
- `Faucet`: Put a faucet on a collection: models aren't added until
`drain()` is called. A `pending` event is triggered when new models are
added to the parent collection.
- `limit`: Automatically cap no. of models in a collection

See the tests for usage examples.

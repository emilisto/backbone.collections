# backbone.collections

Collection of various tools I've created for working with Backbone
Collections. Currently including:

- `Union`: A collection that represents the union of an arbitrary number
of _connected_ collections. Adding and removing models in the connected
collections will immediately reflect in the Union collection.
- `Faucet`: Put a faucet on a collection: models aren't added until
`drain()` is called. A `pending` event is triggered when new models are
added to the parent collection.
- `limit`: Automatically cap no. of models in a collection

See the tests for usage examples.

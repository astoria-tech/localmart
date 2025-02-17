/// <reference path="../pb_data/types.d.ts" />
migrate((app) => {
  const collection = app.findCollectionByNameOrId("orders");

  // Update view rule to allow admin users to view all orders and their expanded data
  collection.viewRule = '@request.auth.roles ?= "admin" || user.id = @request.auth.id';

  // Update list rule to allow admin users to list all orders
  collection.listRule = '@request.auth.roles ?= "admin" || user.id = @request.auth.id';

  // Update expand rule to allow admin users to expand all relations
  collection.options = {
    ...collection.options,
    expandRule: '@request.auth.roles ?= "admin" || user.id = @request.auth.id'
  };

  return app.save(collection);
}, (app) => {
  const collection = app.findCollectionByNameOrId("orders");

  // Revert to default rules
  collection.viewRule = 'user.id = @request.auth.id';
  collection.listRule = 'user.id = @request.auth.id';
  collection.options = {
    ...collection.options,
    expandRule: 'user.id = @request.auth.id'
  };

  return app.save(collection);
}); 
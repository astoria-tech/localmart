/// <reference path="../pb_data/types.d.ts" />
migrate((app) => {
  const collection = app.findCollectionByNameOrId("_pb_users_auth_");

  // Update view rule to allow admin users to view all user data
  collection.viewRule = '@request.auth.roles ?= "admin" || @request.auth.id = id';

  // Update list rule to allow admin users to list all users
  collection.listRule = '@request.auth.roles ?= "admin" || @request.auth.id = id';

  return app.save(collection);
}, (app) => {
  const collection = app.findCollectionByNameOrId("_pb_users_auth_");

  // Revert to default rules
  collection.viewRule = '@request.auth.id = id';
  collection.listRule = '@request.auth.id = id';

  return app.save(collection);
}); 
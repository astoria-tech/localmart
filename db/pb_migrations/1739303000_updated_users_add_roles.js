/// <reference path="../pb_data/types.d.ts" />
migrate((app) => {
  const collection = app.findCollectionByNameOrId("_pb_users_auth_");

  // add roles field
  collection.fields.addAt(0, new Field({
    "system": false,
    "id": "roles",
    "name": "roles",
    "type": "select",
    "required": false,
    "presentable": false,
    "unique": false,
    "maxSelect": 3,
    "values": [
      "admin",
      "delivery",
      "vendor"
    ]
  }));

  return app.save(collection);
}, (app) => {
  const collection = app.findCollectionByNameOrId("_pb_users_auth_");

  // remove roles field
  collection.fields.removeById("roles");

  return app.save(collection);
}); 
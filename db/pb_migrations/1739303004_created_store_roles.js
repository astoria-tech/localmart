/// <reference path="../pb_data/types.d.ts" />
migrate((app) => {
  const collection = new Collection({
    "id": "store_roles",
    "name": "store_roles",
    "type": "base",
    "system": false,
    "fields": [
      {
        "id": "user_relation",
        "name": "user",
        "type": "relation",
        "required": true,
        "presentable": false,
        "system": false,
        "cascadeDelete": true,
        "collectionId": "_pb_users_auth_",
        "maxSelect": 1,
        "minSelect": 1
      },
      {
        "id": "store_relation",
        "name": "store",
        "type": "relation",
        "required": true,
        "presentable": false,
        "system": false,
        "cascadeDelete": true,
        "collectionId": "pbc_3800236418",
        "maxSelect": 1,
        "minSelect": 1
      },
      {
        "id": "store_role",
        "name": "role",
        "type": "select",
        "required": true,
        "presentable": false,
        "system": false,
        "values": ["admin", "staff"],
        "maxSelect": 1
      },
      {
        "id": "created",
        "name": "created",
        "type": "autodate",
        "required": false,
        "presentable": false,
        "system": false,
        "hidden": false,
        "onCreate": true,
        "onUpdate": false
      },
      {
        "id": "updated",
        "name": "updated",
        "type": "autodate",
        "required": false,
        "presentable": false,
        "system": false,
        "hidden": false,
        "onCreate": true,
        "onUpdate": true
      }
    ],
    "indexes": ["CREATE UNIQUE INDEX idx_unique_user_store ON store_roles (user, store)"],
    "listRule": "@request.auth.id != ''",
    "viewRule": "@request.auth.id != ''",
    "createRule": "@request.auth.roles.admin = true",
    "updateRule": "@request.auth.roles.admin = true",
    "deleteRule": "@request.auth.roles.admin = true"
  });

  return app.save(collection);
}, (app) => {
  const collection = app.findCollectionByNameOrId("store_roles");
  return app.delete(collection);
}); 
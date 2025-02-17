/// <reference path="../pb_data/types.d.ts" />
migrate((app) => {
  const collection = new Collection({
    "createRule": "@request.auth.id != ''",
    "deleteRule": "@request.auth.id = user.id",
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
        "id": "stripe_customer",
        "name": "stripe_customer_id",
        "type": "text",
        "required": true,
        "presentable": false,
        "system": false,
        "hidden": false
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
    "id": "stripe_customers",
    "indexes": ["CREATE UNIQUE INDEX idx_unique_customer ON stripe_customers (user, stripe_customer_id)"],
    "listRule": "@request.auth.id = user.id",
    "name": "stripe_customers",
    "system": false,
    "type": "base",
    "updateRule": "@request.auth.id = user.id",
    "viewRule": "@request.auth.id = user.id"
  });

  return app.save(collection);
}, (app) => {
  const collection = app.findCollectionByNameOrId("stripe_customers");
  return app.delete(collection);
}) 
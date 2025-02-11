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
        "id": "stripe_payment_method",
        "name": "stripe_payment_method_id",
        "type": "text",
        "required": true,
        "presentable": false,
        "system": false,
        "hidden": false
      },
      {
        "id": "last4",
        "name": "last4",
        "type": "text",
        "required": true,
        "presentable": false,
        "system": false,
        "hidden": false
      },
      {
        "id": "brand",
        "name": "brand",
        "type": "text",
        "required": true,
        "presentable": false,
        "system": false,
        "hidden": false
      },
      {
        "id": "exp_month",
        "name": "exp_month",
        "type": "number",
        "required": true,
        "presentable": false,
        "system": false,
        "hidden": false,
        "min": 1,
        "max": 12,
        "onlyInt": true
      },
      {
        "id": "exp_year",
        "name": "exp_year",
        "type": "number",
        "required": true,
        "presentable": false,
        "system": false,
        "hidden": false,
        "min": 2024,
        "onlyInt": true
      },
      {
        "id": "is_default",
        "name": "is_default",
        "type": "bool",
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
    "id": "payment_methods",
    "indexes": ["CREATE UNIQUE INDEX idx_unique_payment_method ON payment_methods (user, stripe_payment_method_id)"],
    "listRule": "@request.auth.id = user.id",
    "name": "payment_methods",
    "system": false,
    "type": "base",
    "updateRule": "@request.auth.id = user.id",
    "viewRule": "@request.auth.id = user.id"
  });

  return app.save(collection);
}, (app) => {
  const collection = app.findCollectionByNameOrId("payment_methods");
  return app.delete(collection);
}) 
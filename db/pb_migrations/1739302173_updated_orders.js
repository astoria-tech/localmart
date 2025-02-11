/// <reference path="../pb_data/types.d.ts" />
migrate((app) => {
  const collection = app.findCollectionByNameOrId("pbc_3527180448");
  
  // add payment intent field
  collection.fields.addAt(collection.fields.length, new Field({
    "id": "stripe_payment_intent",
    "name": "stripe_payment_intent_id",
    "type": "text",
    "required": false,
    "presentable": false,
    "system": false,
    "hidden": false,
    "autogeneratePattern": "",
    "max": 0,
    "min": 0,
    "pattern": "",
    "primaryKey": false
  }));

  // add payment method relation
  collection.fields.addAt(collection.fields.length, new Field({
    "id": "stripe_payment_method",
    "name": "payment_method",
    "type": "relation",
    "required": false,
    "presentable": false,
    "system": false,
    "hidden": false,
    "collectionId": "payment_methods",
    "cascadeDelete": false,
    "maxSelect": 1,
    "minSelect": 0
  }));

  // add payment status field
  collection.fields.addAt(collection.fields.length, new Field({
    "id": "stripe_payment_status",
    "name": "payment_status",
    "type": "select",
    "required": true,
    "presentable": false,
    "system": false,
    "hidden": false,
    "values": ["pending", "processing", "succeeded", "failed", "refunded"],
    "maxSelect": 1
  }));

  return app.save(collection);
}, (app) => {
  const collection = app.findCollectionByNameOrId("pbc_3527180448");

  // remove fields
  collection.fields.removeById("stripe_payment_intent");
  collection.fields.removeById("stripe_payment_method");
  collection.fields.removeById("stripe_payment_status");

  return app.save(collection);
}) 
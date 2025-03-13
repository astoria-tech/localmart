/// <reference path="../pb_data/types.d.ts" />
migrate((app) => {
  const collection = app.findCollectionByNameOrId("pbc_3527180448");
  
  // add scheduled delivery time start field
  collection.fields.addAt(collection.fields.length, new Field({
    "id": "scheduled_delivery_start",
    "name": "scheduled_delivery_start",
    "type": "date",
    "required": false,
    "presentable": false,
    "system": false,
    "hidden": false,
    "max": "",
    "min": ""
  }));

  // add scheduled delivery time end field
  collection.fields.addAt(collection.fields.length, new Field({
    "id": "scheduled_delivery_end",
    "name": "scheduled_delivery_end",
    "type": "date",
    "required": false,
    "presentable": false,
    "system": false,
    "hidden": false,
    "max": "",
    "min": ""
  }));

  return app.save(collection);
}, (app) => {
  const collection = app.findCollectionByNameOrId("pbc_3527180448");

  // remove fields
  collection.fields.removeById("scheduled_delivery_start");
  collection.fields.removeById("scheduled_delivery_end");

  return app.save(collection);
}) 
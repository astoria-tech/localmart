/// <reference path="../pb_data/types.d.ts" />
migrate((app) => {
  const collection = app.findCollectionByNameOrId("_pb_users_auth_")

  // add field
  collection.fields.addAt(13, new Field({
    "autogeneratePattern": "",
    "hidden": false,
    "id": "number4283914362",
    "max": null,
    "min": null,
    "name": "latitude",
    "onlyInt": false,
    "presentable": false,
    "primaryKey": false,
    "required": false,
    "system": false,
    "type": "number"
  }))

  // add field
  collection.fields.addAt(14, new Field({
    "autogeneratePattern": "",
    "hidden": false,
    "id": "number4283914363",
    "max": null,
    "min": null,
    "name": "longitude",
    "onlyInt": false,
    "presentable": false,
    "primaryKey": false,
    "required": false,
    "system": false,
    "type": "number"
  }))

  return app.save(collection)
}, (app) => {
  const collection = app.findCollectionByNameOrId("_pb_users_auth_")

  // remove field
  collection.fields.removeById("number4283914362")

  // remove field
  collection.fields.removeById("number4283914363")

  return app.save(collection)
}) 
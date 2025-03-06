/// <reference path="../pb_data/types.d.ts" />
migrate((app) => {
  const collection = app.findCollectionByNameOrId("_pb_users_auth_")

  // add field
  collection.fields.addAt(18, new Field({
    "autogeneratePattern": "",
    "hidden": false,
    "id": "text1092145443",
    "max": 0,
    "min": 0,
    "name": "latitude",
    "pattern": "",
    "presentable": false,
    "primaryKey": false,
    "required": false,
    "system": false,
    "type": "text"
  }))

  // add field
  collection.fields.addAt(19, new Field({
    "autogeneratePattern": "",
    "hidden": false,
    "id": "text2246143851",
    "max": 0,
    "min": 0,
    "name": "longitude",
    "pattern": "",
    "presentable": false,
    "primaryKey": false,
    "required": false,
    "system": false,
    "type": "text"
  }))

  // update field
  collection.fields.addAt(13, new Field({
    "hidden": false,
    "id": "number4283914362",
    "max": null,
    "min": null,
    "name": "latitude_num",
    "onlyInt": false,
    "presentable": false,
    "required": false,
    "system": false,
    "type": "number"
  }))

  // update field
  collection.fields.addAt(14, new Field({
    "hidden": false,
    "id": "number4283914363",
    "max": null,
    "min": null,
    "name": "longitude_num",
    "onlyInt": false,
    "presentable": false,
    "required": false,
    "system": false,
    "type": "number"
  }))

  return app.save(collection)
}, (app) => {
  const collection = app.findCollectionByNameOrId("_pb_users_auth_")

  // remove field
  collection.fields.removeById("text1092145443")

  // remove field
  collection.fields.removeById("text2246143851")

  // update field
  collection.fields.addAt(13, new Field({
    "hidden": false,
    "id": "number4283914362",
    "max": null,
    "min": null,
    "name": "latitude",
    "onlyInt": false,
    "presentable": false,
    "required": false,
    "system": false,
    "type": "number"
  }))

  // update field
  collection.fields.addAt(14, new Field({
    "hidden": false,
    "id": "number4283914363",
    "max": null,
    "min": null,
    "name": "longitude",
    "onlyInt": false,
    "presentable": false,
    "required": false,
    "system": false,
    "type": "number"
  }))

  return app.save(collection)
})

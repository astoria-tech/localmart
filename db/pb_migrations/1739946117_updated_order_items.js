/// <reference path="../pb_data/types.d.ts" />
migrate((app) => {
  const collection = app.findCollectionByNameOrId("pbc_2456927940")

  // update collection data
  unmarshal({
    "createRule": "@request.auth.role ?= 'admin' || \norder.user.id = @request.auth.id ||\n(\n  @collection.store_roles.user.id = @request.auth.id &&\n  @collection.store_roles.store.id = store_item.store.id &&\n  @collection.store_roles.role = 'admin'\n)"
  }, collection)

  return app.save(collection)
}, (app) => {
  const collection = app.findCollectionByNameOrId("pbc_2456927940")

  // update collection data
  unmarshal({
    "createRule": ""
  }, collection)

  return app.save(collection)
})

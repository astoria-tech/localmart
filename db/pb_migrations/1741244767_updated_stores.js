/// <reference path="../pb_data/types.d.ts" />
migrate((app) => {
  const collection = app.findCollectionByNameOrId("pbc_3800236418")

  // update collection data
  unmarshal({
    "updateRule": "@request.auth.roles ?~ 'admin' ||\n(\n  @collection.store_roles.user.id = @request.auth.id &&\n  @collection.store_roles.store.id = @request.body.id &&\n  @collection.store_roles.role = 'admin'\n)"
  }, collection)

  return app.save(collection)
}, (app) => {
  const collection = app.findCollectionByNameOrId("pbc_3800236418")

  // update collection data
  unmarshal({
    "updateRule": null
  }, collection)

  return app.save(collection)
})

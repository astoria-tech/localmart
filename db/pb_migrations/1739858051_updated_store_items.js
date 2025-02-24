/// <reference path="../pb_data/types.d.ts" />
migrate((app) => {
  const collection = app.findCollectionByNameOrId("pbc_1842453536")

  // update collection data
  unmarshal({
    "createRule": "@request.auth.roles ?~ 'admin' || (@collection.store_roles.user.id = @request.auth.id && @collection.store_roles.store.id = @request.body.store_item.store.id && @collection.store_roles.role = 'admin')",
    "deleteRule": "@request.auth.roles ?~ 'admin' || (@collection.store_roles.user.id = @request.auth.id && @collection.store_roles.store.id = @request.body.store_item.store.id && @collection.store_roles.role = 'admin')"
  }, collection)

  return app.save(collection)
}, (app) => {
  const collection = app.findCollectionByNameOrId("pbc_1842453536")

  // update collection data
  unmarshal({
    "createRule": null,
    "deleteRule": null
  }, collection)

  return app.save(collection)
})

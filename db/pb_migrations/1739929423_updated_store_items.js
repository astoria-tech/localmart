/// <reference path="../pb_data/types.d.ts" />
migrate((app) => {
  const collection = app.findCollectionByNameOrId("pbc_1842453536")

  // update collection data
  unmarshal({
    "createRule": "@request.auth.roles ?~ 'admin' ||\n(\n  @collection.store_roles.user.id = @request.auth.id &&\n  @collection.store_roles.store.id = store.id &&\n  @collection.store_roles.role = 'admin'\n)",
    "deleteRule": "@request.auth.roles ?~ 'admin' ||\n(\n  @collection.store_roles.user.id = @request.auth.id &&\n  @collection.store_roles.store.id = store.id &&\n  @collection.store_roles.role = 'admin'\n)",
    "updateRule": "@request.auth.roles ?~ 'admin' ||\n(\n  @collection.store_roles.user.id = @request.auth.id &&\n  @collection.store_roles.store.id = store.id &&\n  @collection.store_roles.role = 'admin'\n)"
  }, collection)

  return app.save(collection)
}, (app) => {
  const collection = app.findCollectionByNameOrId("pbc_1842453536")

  // update collection data
  unmarshal({
    "createRule": "@request.auth.roles ?~ 'admin' ||\n(\n  @collection.store_roles.user.id = @request.auth.id &&\n  @collection.store_roles.store.id = @request.body.store_item.store.id &&\n  @collection.store_roles.role = 'admin'\n)",
    "deleteRule": "@request.auth.roles ?~ 'admin' ||\n(\n  @collection.store_roles.user.id = @request.auth.id &&\n  @collection.store_roles.store.id = @request.body.store_item.store.id &&\n  @collection.store_roles.role = 'admin'\n)",
    "updateRule": "@request.auth.roles ?~ 'admin' ||\n(\n  @collection.store_roles.user.id = @request.auth.id &&\n  @collection.store_roles.store.id = @request.body.store_item.store.id &&\n  @collection.store_roles.role = 'admin'\n)"
  }, collection)

  return app.save(collection)
})

/// <reference path="../pb_data/types.d.ts" />
migrate((app) => {
  const collection = app.findCollectionByNameOrId("pbc_3527180448")

  // update collection data
  unmarshal({
    "listRule": "@request.auth.roles ?~ 'admin' || (\n  @collection.store_roles.user.id = @request.auth.id &&\n  @collection.store_roles.store.id = @request.body.items.store.id &&\n  @collection.store_roles.role = 'admin'\n)",
    "viewRule": "@request.auth.roles ?~ 'admin' || (\n  @collection.store_roles.user.id = @request.auth.id &&\n  @collection.store_roles.store.id = @request.body.items.store.id &&\n  @collection.store_roles.role = 'admin'\n)"
  }, collection)

  return app.save(collection)
}, (app) => {
  const collection = app.findCollectionByNameOrId("pbc_3527180448")

  // update collection data
  unmarshal({
    "listRule": "@request.auth.roles ?~ 'admin' || (\n  @collection.store_roles.user.id = @request.auth.id &&\n  @collection.store_roles.store.id = @request.body.store_item.store.id &&\n  @collection.store_roles.role = 'admin'\n)",
    "viewRule": "@request.auth.roles ?~ 'admin' || (\n  @collection.store_roles.user.id = @request.auth.id &&\n  @collection.store_roles.store.id = @request.body.store_item.store.id &&\n  @collection.store_roles.role = 'admin'\n)"
  }, collection)

  return app.save(collection)
})

/// <reference path="../pb_data/types.d.ts" />
migrate((app) => {
  const collection = app.findCollectionByNameOrId("pbc_2456927940")

  // update collection data
  unmarshal({
    "createRule": "@request.auth.role ?= 'admin' || @request.body.order.user.id = @request.auth.id",
    "deleteRule": null,
    "listRule": "@request.auth.role ?= 'admin' || @request.body.order.user.id = @request.auth.id",
    "updateRule": null,
    "viewRule": "@request.auth.role ?= 'admin' || @request.body.order.user.id = @request.auth.id"
  }, collection)

  return app.save(collection)
}, (app) => {
  const collection = app.findCollectionByNameOrId("pbc_2456927940")

  // update collection data
  unmarshal({
    "createRule": "@request.auth.roles ?~ 'admin'",
    "deleteRule": "@request.auth.roles ?~ 'admin'",
    "listRule": "@request.auth.roles ?~ 'admin'",
    "updateRule": "@request.auth.roles ?~ 'admin'",
    "viewRule": "@request.auth.roles ?~ 'admin'"
  }, collection)

  return app.save(collection)
})

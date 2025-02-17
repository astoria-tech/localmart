/// <reference path="../pb_data/types.d.ts" />
migrate((app) => {
  const collection = app.findCollectionByNameOrId("_pb_users_auth_")

  // update collection data
  unmarshal({
    "listRule": "@request.auth.roles ?~ \"admin\" || @request.auth.id = id",
    "viewRule": "@request.auth.roles ?~ \"admin\" || @request.auth.id = id"
  }, collection)

  return app.save(collection)
}, (app) => {
  const collection = app.findCollectionByNameOrId("_pb_users_auth_")

  // update collection data
  unmarshal({
    "listRule": "@request.auth.roles ?= \"admin\" || @request.auth.id = id",
    "viewRule": "@request.auth.roles ?= \"admin\" || @request.auth.id = id"
  }, collection)

  return app.save(collection)
})

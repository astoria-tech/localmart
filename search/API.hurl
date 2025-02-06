# Search API Documentation

# Search documents
# Test successful search
GET http://localhost:4100/api/search?query=test&index=products
Accept: application/json

HTTP 200
[Asserts]
header "Content-Type" == "application/json; charset=utf-8"
jsonpath "$.hits" exists
jsonpath "$.processingTimeMs" exists

# Test search error (missing parameters)
GET http://localhost:4100/api/search
Accept: application/json

HTTP 400
[Asserts]
header "Content-Type" == "application/json; charset=utf-8"
jsonpath "$.errors" exists

# Add documents to search index
# Test successful document addition
POST http://localhost:4100/api/documents
Content-Type: application/json
{
    "index": "products",
    "documents": [
        {
            "id": "1001",
            "name": "foobar product",
            "description": "description 1"
        },
        {
            "id": "1002",
            "name": "warbar product",
            "description": "description 2"
        }
    ]
}

HTTP 202
[Asserts]
header "Content-Type" == "application/json; charset=utf-8"
jsonpath "$.message" == "Documents are being processed"
jsonpath "$.task" exists

# Test document addition error
POST http://localhost:4100/api/documents
Content-Type: application/json
{
    "index": "invalid"
}

HTTP 422
[Asserts]
header "Content-Type" == "application/json; charset=utf-8"
jsonpath "$.error" exists

# Hydrate search index
# Test successful hydration
GET http://localhost:4100/api/hydrate
Accept: application/json

HTTP 202
[Asserts]
header "Content-Type" == "application/json; charset=utf-8"
jsonpath "$.message" == "Documents are being processed"
jsonpath "$.task" exists

# Test hydration error
GET http://localhost:4100/api/hydrate?force_error=true
Accept: application/json

HTTP 422
[Asserts]
header "Content-Type" == "application/json; charset=utf-8"
jsonpath "$.error" exists

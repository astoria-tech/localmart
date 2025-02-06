# Search

To start your Phoenix server:

  * Run `mix setup` to install and setup dependencies
  * Start Phoenix endpoint with `mix phx.server` or inside IEx with `iex -S mix phx.server`

Now you can visit [`localhost:4000`](http://localhost:4000) from your browser.

## API Testing with Hurl

### Installation

To install Hurl on macOS using Homebrew:

```bash
brew install hurl
```

### Running API Tests

The API tests are defined in `search/API.hurl`. To run the tests:

```bash
hurl --test API.hurl
```

### Available API Endpoints

#### Search Documents
- **GET** `/api/search?query={query}&index={index}`
  - Parameters:
    - `query`: Search term
    - `index`: Index to search in (e.g., "products")
  - Returns: Search results with hits and processing time

#### Add Documents
- **POST** `/api/documents`
  - Body: JSON object containing:
    - `index`: Index name
    - `documents`: Array of documents with `id`, `name`, and `description`
  - Returns: Processing confirmation and task ID

#### Hydrate Index
- **GET** `/api/hydrate`
  - Triggers index hydration
  - Returns: Processing confirmation and task ID

## Learn more

  * Official website: https://www.phoenixframework.org/
  * Guides: https://hexdocs.pm/phoenix/overview.html
  * Docs: https://hexdocs.pm/phoenix
  * Forum: https://elixirforum.com/c/phoenix-forum
  * Source: https://github.com/phoenixframework/phoenix

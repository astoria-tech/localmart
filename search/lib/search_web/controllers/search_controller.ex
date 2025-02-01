defmodule SearchWeb.SearchController do
  use SearchWeb, :controller

  alias Search.Meili

  def search(conn, %{"query" => query, "index" => index} = _params) do
    case Meili.search_document(index, query, 0) do
      {:ok, results} ->
        conn
        |> put_status(:ok)
        |> json(results)

      {:error, reason} ->
        conn
        |> put_status(:unprocessable_entity)
        |> json(%{error: reason})
    end
  end

  def create(conn, %{"documents" => documents, "index" => index}) do
    case Meili.add_documents_to_search_index(index, documents) do
      {:ok, task} ->
        conn
        |> put_status(:accepted)
        |> json(%{message: "Documents are being processed", task: task})

      {:error, error} ->
        conn
        |> put_status(:unprocessable_entity)
        |> json(%{error: error})
    end
  end
end

defimpl Jason.Encoder, for: Meilisearch.Search do
  def encode(value, opts) do
    value
    |> Map.from_struct()
    |> Map.take([:hits, :processingTimeMs])
    |> Jason.Encode.map(opts)
  end
end

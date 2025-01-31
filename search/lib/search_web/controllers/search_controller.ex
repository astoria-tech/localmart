defmodule SearchWeb.SearchController do
  use SearchWeb, :controller

  alias Search.Meilisearch

  def search(conn, %{"query" => query} = params) do
    case Meilisearch.search(query) do
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

  def create(conn, %{"documents" => documents}) do
    case Meilisearch.add_documents_to_search_index(documents) do
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

  def hydrate(conn, _params) do
    case Meilisearch.hydrate() do
      {:ok, task} ->
        conn
        |> put_status(:accepted)
        |> json(%{message: "Documents are being processed", task: task})

      {:error, reason} ->
        conn
        |> put_status(:unprocessable_entity)
        |> json(%{error: reason})
    end
  end
end

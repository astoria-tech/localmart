defmodule SearchWeb.SearchController do
  use SearchWeb, :controller

  alias Search.Meili

  def search(conn, %{"query" => query} = _params) do
    case Meili.search(query) do
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

  def hydrate(conn, _params) do
    case Meili.hydrate() do
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

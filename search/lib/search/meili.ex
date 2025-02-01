defmodule Search.Meili do
  @moduledoc """
  This module provides functions to interact with MeiliSearch.
  """

  def search(query) do
    meili_host = config(:host)

    case Req.get!("#{meili_host}/indexes/movies/search", params: %{q: query}) do
      %{status: 200, body: body} ->
        {:ok, body}

      %{status: status, body: body} ->
        {:ok, {status, body}}

      {:error, error} ->
        error
    end
  end

  def load_more(query, offset) do
    meili_host = config(:host)

    case Req.get!("#{meili_host}/indexes/movies/search", params: %{q: query, offset: offset}) do
      %{status: 200, body: body} ->
        {:ok, body}

      %{status: status, body: body} ->
        {:ok, {status, body}}

      {:error, error} ->
        error
    end
  end

  def create_search_index(index) do
    :public_search
    |> Meilisearch.client()
    |> Meilisearch.Index.create(%{uid: index, primaryKey: "id"})
  end

  def add_documents_to_search_index(index, documents) do
    :public_search
    |> Meilisearch.client()
    |> Meilisearch.Document.create_or_replace(index, documents)
  end

  def search_document(index, query) do
    :public_search
    |> Meilisearch.client()
    |> Meilisearch.Search.search(index, %{q: query})
  end

  def hydrate do
    data_path = Path.join(:code.priv_dir(:search), "../data/movies.json")

    with {:ok, content} <- File.read(data_path),
         {:ok, movies} <- Jason.decode(content),
         {:ok, _} <- create_search_index("movies"),
         {:ok, task} <- add_documents_to_search_index("movies", movies) do
      {:ok, task |> Map.from_struct()}
    else
      {:error, reason} -> {:error, reason}
    end
  end

  defp config(key) do
    Application.get_env(:search, :meilisearch)[key]
  end
end

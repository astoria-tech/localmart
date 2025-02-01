defmodule Search.Meili do
  @moduledoc """
  This module provides functions to interact with MeiliSearch.
  """

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

  def search_document(index, query, offset \\ 0) do
    :public_search
    |> Meilisearch.client()
    |> Meilisearch.Search.search(index, %{q: query, offset: offset})
  end

  def hydrate do
    data_path = Path.join(:code.priv_dir(:search), "../data/movies.json")

    with {:ok, content} <- File.read(data_path),
         {:ok, movies} <- Jason.decode(content),
         {:ok, _} <- create_search_index("movies"),
         {:ok, task} <- add_documents_to_search_index("movies", movies) do
      {:ok, task}
    else
      {:error, reason} -> {:error, reason}
    end
  end
end

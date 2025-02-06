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
    with products = Search.Inventory.Generator.products(:list, 1000),
         {:ok, _} <- create_search_index("products"),
         {:ok, task} <- add_documents_to_search_index("products", products) do
      {:ok, task}
    else
      {:error, reason} -> {:error, reason}
    end
  end
end

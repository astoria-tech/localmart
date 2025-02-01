defmodule Search.Task do
  use GenServer
  require Logger

  def start_link(opts) do
    GenServer.start_link(__MODULE__, opts, name: __MODULE__)
  end

  @impl true
  def init(state) do
    Logger.info("Starting Search.Task")

    # Create the movies search index
    case Search.Meili.create_search_index("movies") do
      {:ok, _} -> Logger.info("Movies search index created successfully")
      {:error, error} -> Logger.error("Failed to create movies search index: #{inspect(error)}")
    end

    {:ok, state}
  end

  # Add your task-specific functions here
  @impl true
  def handle_info(:work, state) do
    # Add your periodic work here
    {:noreply, state}
  end
end

defmodule Search.Task do
  use GenServer
  require Logger

  def start_link(opts) do
    GenServer.start_link(__MODULE__, opts, name: __MODULE__)
  end

  @impl true
  def init(state) do
    Logger.info("Starting Search.Task")

    # Create the products search index
    case Search.Meili.create_search_index("products") do
      {:ok, _} -> Logger.info("Products search index created successfully")
      {:error, error} -> Logger.error("Failed to create products search index: #{inspect(error)}")
    end

    # Hydrate the search index
    case Search.Meili.hydrate() do
      {:ok, task} ->
        Logger.info("Products search index hydrated successfully")
        Logger.info("Hydration task: #{inspect(task)}")

      {:error, error} ->
        Logger.error("Failed to hydrate products search index: #{inspect(error)}")
    end

    {:ok, state}
  end

  # Add your task-specific functions here
  @impl true
  def handle_info(:hydrate, state) do
    Search.Meili.hydrate()

    {:noreply, state}
  end
end

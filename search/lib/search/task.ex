defmodule Search.Task do
  use GenServer
  require Logger

  @movies_db "https://raw.githubusercontent.com/Allyedge/movies/main/data/movies.json"

  def start_link(opts) do
    GenServer.start_link(__MODULE__, opts, name: __MODULE__)
  end

  @impl true
  def init(state) do
    Logger.info("Starting Search.Task")

    # Ensure data directory exists and download movies data
    download_movies_data()

    # Create the movies search index
    case Search.Meili.create_search_index("movies") do
      {:ok, _} -> Logger.info("Movies search index created successfully")
      {:error, error} -> Logger.error("Failed to create movies search index: #{inspect(error)}")
    end

    # Hydrate the search index
    case Search.Meili.hydrate() do
      {:ok, task} ->
        Logger.info("Movies search index hydrated successfully")
        Logger.info("Hydration task: #{inspect(task)}")

      {:error, error} ->
        Logger.error("Failed to hydrate movies search index: #{inspect(error)}")
    end

    {:ok, state}
  end

  # Add your task-specific functions here
  @impl true
  def handle_info(:hydrate, state) do
    download_movies_data()

    {:noreply, state}
  end

  ## Private functions

  defp download_movies_data do
    data_dir = Path.join(:code.priv_dir(:search), "../data")
    File.mkdir_p!(data_dir)
    target_path = Path.join(data_dir, "movies.json")

    Logger.info("Downloading movies data to #{target_path}")

    case Req.get!(@movies_db) do
      %{status: 200, body: body} ->
        File.write!(target_path, body)
        Logger.info("Successfully downloaded movies data")
        {:ok, target_path}

      response ->
        Logger.error("Failed to download movies data: #{inspect(response)}")
        {:error, :download_failed}
    end
  end
end

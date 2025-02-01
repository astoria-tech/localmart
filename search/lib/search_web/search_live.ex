defmodule SearchWeb.SearchLive do
  use SearchWeb, :live_view

  @impl true
  def mount(_params, _session, socket) do
    {:ok, socket}

    {:ok, results} = Search.Meili.search("")

    {:ok,
     socket
     |> assign(:form, %{})
     |> assign(:results, results["hits"])
     |> assign(:processing_time, results["processing_time"])}
  end

  @impl true
  def handle_event("search", %{"search" => search}, socket) do
    {:ok, results} = Search.Meili.search(search)

    {:noreply,
     socket
     |> assign(:results, results["hits"])
     |> assign(:processing_time, results["processing_time"])}
  end

  def handle_event("load", _params, socket) do
    {:ok, results} =
      Search.Meili.load_more(socket.assigns.form["search"], length(socket.assigns.results))

    {:noreply,
     socket
     |> assign(:results, socket.assigns.results ++ results["hits"])
     |> assign(:processing_time, results["processing_time"])}
  end

  @impl true
  def render(assigns) do
    ~H"""
    <.header>
      <div class="flex space-x-4 self-center items-center">
        <h1>
          Movies
        </h1>

        <h1 class="text-sm text-green-500">
          {@processing_time}ms
        </h1>
      </div>
    </.header>

    <br />

    <.simple_form for={@form} phx-change="search">
      <.input name="search" value="" placeholder="Search a movie..." />
    </.simple_form>

    <div id="infinite-scroll" class="flex flex-col space-y-8 items-center" phx-hook="InfiniteScroll">
      <.table id="results" rows={@results}>
        <:col :let={result} label="ID">{result["id"]}</:col>
        <:col :let={result} label="Title">{result["title"]}</:col>
        <:col :let={result} label="Overview">
          <p class="w-64">{result["overview"]}</p>
        </:col>
        <:col :let={result} label="Image"><img class="h-full" src={result["poster"]} /></:col>
      </.table>
    </div>
    """
  end
end

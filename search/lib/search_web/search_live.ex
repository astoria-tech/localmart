defmodule SearchWeb.SearchLive do
  use SearchWeb, :live_view

  @impl true
  def mount(_params, _session, socket) do
    {:ok, results} = Search.Meili.search_document("products", "", 0)

    {:ok,
     socket
     |> assign(:form, %{})
     |> assign(:results, results.hits)
     |> assign(:processing_time, results.processingTimeMs)}
  end

  @impl true
  def handle_event("search", %{"search" => query}, socket) do
    {:ok, results} = Search.Meili.search_document("products", query, 0)

    {:noreply,
     socket
     |> assign(:results, results.hits)
     |> assign(:processing_time, results.processingTimeMs)}
  end

  def handle_event("load", _params, socket) do
    offset = length(socket.assigns.results)

    {:ok, results} =
      Search.Meili.search_document("products", socket.assigns.form["search"], offset)

    {:noreply,
     socket
     |> assign(:results, socket.assigns.results ++ results.hits)
     |> assign(:processing_time, results.processingTimeMs)}
  end

  @impl true
  def render(assigns) do
    ~H"""
    <.header>
      <div class="flex space-x-4 self-center items-center">
        <h1>
          Products Search
        </h1>

        <h1 class="text-sm text-green-500">
          {@processing_time}ms
        </h1>
      </div>
    </.header>

    <br />

    <.simple_form for={@form} phx-change="search">
      <.input name="search" value="" placeholder="Search a product..." />
    </.simple_form>

    <div id="infinite-scroll" class="flex flex-col space-y-8 items-center" phx-hook="InfiniteScroll">
      <.table id="results" rows={@results}>
        <:col :let={result} label="ID">{result["id"]}</:col>
        <:col :let={result} label="Title">{result["name"]}</:col>
        <:col :let={result} label="Overview">
          <p class="w-64">{result["description"]}</p>
        </:col>
        <:col :let={result} label="Image"><img class="h-full" src={result["imageUrl"]} /></:col>
      </.table>
    </div>
    """
  end
end

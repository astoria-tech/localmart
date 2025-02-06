defmodule SearchWeb.FallbackController do
  use SearchWeb, :controller

  def call(conn, {:error, :missing_parameters}) do
    conn
    |> put_status(:bad_request)
    |> json(%{error: "Missing parameters"})
  end

  def call(conn, {:error, reason}) do
    conn
    |> put_status(:unprocessable_entity)
    |> json(%{error: reason})
  end
end

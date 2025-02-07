defmodule Search.Inventory.Generator do
  @moduledoc """
  This module provides functions to generate synthetic data for products
  ## Usage:
   Generate products and write to a file
   File.write!("store_products.json, Search.Inventory.Generator.generate_products(:json, 1000))
  """

  @coffee_types %{
    arabica: %{
      origins:
        ~w(Ethiopian Colombian Brazilian Guatemalan Costa\ Rican Kenyan Honduran Peruvian Mexican Jamaican),
      varieties: ~w(Typica Bourbon Caturra Catuai Geisha Pacamara SL28 Mundo\ Novo Maragogipe),
      roasts: ~w(Light Medium Medium-Dark Dark Italian French Full-City),
      attributes: ~w(Bright Fruity Floral Sweet Balanced Complex Smooth Chocolatey Nutty Citrusy),
      price_range: %{min: 12, max: 45}
    },
    robusta: %{
      origins:
        ~w(Vietnamese Indonesian Indian Ugandan Thai Malaysian Filipino Cameroonian Ghanaian Ivorian),
      varieties: ~w(Nganda Erecta Quillou Congensis Laurentii Nana Liberica),
      roasts: ~w(Medium Dark Extra-Dark Italian French Double-Roasted),
      attributes: ~w(Strong Bold Earthy Intense Full-bodied Woody Powerful Deep Rich Smoky),
      price_range: %{min: 8, max: 30}
    }
  }

  @processing_methods ~w(Washed Natural Honey Semi-washed Wet-hulled)
  @packaging_types ~w(Whole\ Bean Ground Fine\ Ground Coarse\ Ground)

  def products(type, count \\ 1000)

  def products(:list, count) do
    Enum.map(1..count, &generate_product/1)
  end

  def products(:json, count) do
    products = Enum.map(1..count, &generate_product/1)
    Jason.encode!(%{products: products}, pretty: true)
  end

  defp generate_product(id) do
    # Randomly select either Arabica or Robusta
    bean_type = Enum.random([:arabica, :robusta])
    coffee_data = @coffee_types[bean_type]

    origin = Enum.random(coffee_data.origins)
    variety = Enum.random(coffee_data.varieties)
    roast = Enum.random(coffee_data.roasts)
    attribute = Enum.random(coffee_data.attributes)
    processing = Enum.random(@processing_methods)
    packaging = Enum.random(@packaging_types)

    %{
      id: id,
      name: "#{origin} #{variety} Coffee",
      description:
        "#{attribute} #{bean_type} coffee from #{origin}, #{roast} roast. #{processing} processed and available in #{packaging}.",
      tags: generate_tags(bean_type),
      imageUrl: "https://picsum.photos/seed/coffee/100",
      quantity: random_int(10, 500),
      price: random_price(coffee_data.price_range.min, coffee_data.price_range.max),
      rating: random_rating(),
      attributes: %{
        origin: origin,
        variety: variety,
        roast_level: roast,
        processing_method: processing,
        packaging_type: packaging,
        bean_type: bean_type |> Atom.to_string() |> String.capitalize()
      }
    }
  end

  defp generate_tags(bean_type) do
    base_tag = bean_type |> Atom.to_string() |> String.capitalize()

    extra_tags =
      Enum.filter(~w(premium specialty single-origin organic fair-trade), fn _ ->
        :rand.uniform(2) == 1
      end)

    [base_tag | extra_tags]
  end

  defp random_int(min, max) do
    :rand.uniform(max - min + 1) + min - 1
  end

  defp random_price(min, max) do
    price = :rand.uniform() * (max - min) + min
    Float.round(price, 2)
  end

  defp random_rating do
    rating = :rand.uniform() * 5
    Float.round(rating, 1)
  end
end

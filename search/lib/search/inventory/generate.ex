defmodule Search.Inventory.Generator do
  @moduledoc """
  This module provides functions to generate synthetic data for products
  ## Usage:
  ## Generate products and write to a file
  ## File.write!("store_products.json, Search.Inventory.Generator.generate_products(:json, 1000))
  """

  @product_types %{
    electronics: %{
      products:
        ~w(Smartphone Laptop Tablet Smartwatch WirelessEarbuds BluetoothSpeaker GamingConsole DigitalCamera PowerBank SmartTV Monitor Router Keyboard Mouse Webcam Microphone Printer ExternalHardDrive GraphicsCard Processor),
      brands: ~w(Apple Samsung Sony LG Dell HP Lenovo Asus Acer Microsoft),
      adjectives:
        ~w(Premium Ultra Pro Elite Advanced Smart Professional Gaming Wireless Portable),
      price_range: %{min: 50, max: 100}
    },
    fashion: %{
      products:
        ~w(TShirt Jeans Dress Jacket Sweater Shorts Skirt Coat Blazer Hoodie Shoes Boots Sneakers Hat Scarf Gloves Socks Belt Wallet Bag),
      brands: ~w(Nike Adidas Zara H&M Levis Gucci Puma UnderArmour CalvinKlein RalphLauren),
      adjectives:
        ~w(Casual Elegant Classic Modern Vintage Trendy Stylish Comfortable Luxurious Athletic),
      price_range: %{min: 20, max: 80}
    },
    beauty: %{
      products:
        ~w(Perfume Moisturizer Shampoo Conditioner FaceCream Lipstick Mascara Foundation Serum Sunscreen FaceMask BodyLotion HairOil NailPolish EyeShadow Blush Toner Cleanser Deodorant HairSpray),
      brands: ~w(LOreal MAC Maybelline Nivea Dove Neutrogena EsteeLauder Revlon Olay Garnier),
      adjectives:
        ~w(Natural Organic Hydrating Nourishing AntiAging Refreshing Gentle Intensive Pure Essential),
      price_range: %{min: 10, max: 60}
    },
    home: %{
      products:
        ~w(Chair Table Lamp Mirror Rug Pillow Blanket Vase Clock PictureFrame Curtains Shelf StorageBox TrashCan Fan Blender Toaster CoffeeMaker VacuumCleaner AirPurifier),
      brands:
        ~w(IKEA Ashley PotteryBarn Crate&Barrel WestElm HomeGoods Wayfair Target Philips Dyson),
      adjectives:
        ~w(Modern Traditional Contemporary Rustic Minimalist Elegant Functional Decorative Practical Compact),
      price_range: %{min: 15, max: 90}
    }
  }

  @features %{
    electronics:
      ~w(High-resolution\ display Long\ battery\ life Fast\ processor Wireless\ connectivity Touch\ screen HD\ camera Water\ resistant Noise\ cancellation Voice\ control Fast\ charging),
    fashion:
      ~w(Premium\ material Comfortable\ fit Durable\ construction Stylish\ design Breathable\ fabric Easy\ care All-season Versatile\ style Perfect\ fit Quality\ stitching),
    beauty:
      ~w(Long-lasting Dermatologist\ tested Non-comedogenic Paraben-free Fragrance-free Hypoallergenic Cruelty-free Natural\ ingredients Quick-absorbing Anti-oxidant\ rich),
    home:
      ~w(Easy\ assembly Space-saving\ design Durable\ construction Easy\ to\ clean Versatile\ use Modern\ design Energy\ efficient Premium\ quality Ergonomic\ design Multi-functional)
  }

  def products(type, count \\ 1000)

  def products(:list, count) do
    Enum.map(1..count, &generate_product/1)
  end

  def products(:json, count) do
    products = Enum.map(1..count, &generate_product/1)
    Jason.encode!(%{products: products}, pretty: true)
  end

  defp generate_product(id) do
    category = @product_types |> Map.keys() |> Enum.random()
    category_data = @product_types[category]

    product_type = Enum.random(category_data.products)
    brand = Enum.random(category_data.brands)
    adjective = Enum.random(category_data.adjectives)
    feature = Enum.random(@features[category])
    price_range = category_data.price_range

    %{
      id: id,
      name: "#{brand} #{adjective} #{product_type}",
      description:
        "#{feature}. High-quality #{String.downcase(product_type)} from #{brand} with premium features and elegant design.",
      tags: generate_tags(category, product_type),
      imageUrl: "https://placehold.co/100",
      quantity: random_int(10, 500),
      price: random_price(price_range.min, price_range.max),
      rating: random_rating()
    }
  end

  defp generate_tags(category, product) do
    base_tags = [Atom.to_string(category), String.downcase(product)]

    extra_tags =
      Enum.reduce(~w(trending bestseller new-arrival), [], fn tag, acc ->
        if :rand.uniform(2) == 1, do: [tag | acc], else: acc
      end)

    base_tags ++ extra_tags
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

'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/auth';
import { useCart } from '../../contexts/cart';
import { toast } from 'react-hot-toast';
import { FaInstagram, FaFacebook, FaXTwitter } from 'react-icons/fa6';
import { SiBluesky } from 'react-icons/si';

interface Store {
  id: string;
  name: string;
  street_1: string;
  street_2?: string;
  city: string;
  state: string;
  zip_code: string;
  instagram?: string;
  facebook?: string;
  twitter?: string;
}

interface StoreItem {
  id: string;
  name: string;
  price: number;
  imageUrl?: string;
}

export default function StoreContent({ storeId }: { storeId: string }) {
  const { addItem } = useCart();
  const [store, setStore] = useState<Store | null>(null);
  const [items, setItems] = useState<StoreItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { items: cartItems } = useCart();

  // Check if cart has items from a different store
  const hasItemsFromDifferentStore = cartItems.length > 0 && cartItems[0].store !== storeId;
  const currentCartStoreName = hasItemsFromDifferentStore ? store?.name : null;

  useEffect(() => {
    const fetchStoreAndItems = async () => {
      try {
        // Fetch store details
        const storeResponse = await fetch(`http://localhost:8000/api/v0/stores/${storeId}`);
        if (!storeResponse.ok) {
          throw new Error('Failed to fetch store');
        }
        const storeData = await storeResponse.json();
        setStore(storeData);

        // Fetch store items
        const itemsResponse = await fetch(`http://localhost:8000/api/v0/stores/${storeId}/items`);
        if (!itemsResponse.ok) {
          throw new Error('Failed to fetch store items');
        }
        const itemsData = await itemsResponse.json();
        
        // Add mock image URLs to items
        const itemsWithImages = itemsData.map((item: StoreItem) => ({
          ...item,
          imageUrl: `https://picsum.photos/seed/${item.id}/400/300`
        }));
        
        setItems(itemsWithImages);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to fetch store data');
      } finally {
        setLoading(false);
      }
    };

    fetchStoreAndItems();
  }, [storeId]);

  if (loading) {
    return (
      <main className="min-h-[calc(100vh-64px)] bg-[#F5F2EB] pt-16">
        <div className="container mx-auto px-4">
          <div className="animate-pulse">
            <div className="h-32 bg-white/50 rounded-lg mb-8"></div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <div key={i} className="h-64 bg-white/50 rounded-lg"></div>
              ))}
            </div>
          </div>
        </div>
      </main>
    );
  }

  if (error || !store) {
    return (
      <main className="min-h-[calc(100vh-64px)] bg-[#F5F2EB] pt-16">
        <div className="container mx-auto px-4">
          <div className="text-center">
            <h2 className="text-2xl font-bold text-[#2D3748]">Error</h2>
            <p className="mt-2 text-[#4A5568]">{error || 'Store not found'}</p>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-[calc(100vh-64px)] bg-[#F5F2EB]">
      {/* Hero Section */}
      <div className="bg-white/50 backdrop-blur-sm border-b pt-16">
        <div className="container mx-auto px-4 py-12">
          <div className="max-w-4xl mx-auto text-center">
            <h1 className="text-4xl font-bold text-[#2D3748] mb-4">{store.name}</h1>
            <p className="text-lg text-[#4A5568] mb-4">
              {store.street_1}
              {store.street_2 && `, ${store.street_2}`}
              <br />
              {store.city}, {store.state} {store.zip_code}
            </p>
            <div className="flex justify-center gap-6 mt-4">
              <a
                href="https://instagram.com/kinshipcoffee"
                target="_blank"
                rel="noopener noreferrer"
                className="text-[#4A5568] hover:text-[#2A9D8F] transition-colors"
                aria-label="Instagram"
              >
                <FaInstagram className="w-7 h-7" />
              </a>
              <a
                href="https://facebook.com/kinshipcoffee"
                target="_blank"
                rel="noopener noreferrer"
                className="text-[#4A5568] hover:text-[#2A9D8F] transition-colors"
                aria-label="Facebook"
              >
                <FaFacebook className="w-7 h-7" />
              </a>
              <a
                href="https://x.com/kinshipcoffee"
                target="_blank"
                rel="noopener noreferrer"
                className="text-[#4A5568] hover:text-[#2A9D8F] transition-colors"
                aria-label="X (formerly Twitter)"
              >
                <FaXTwitter className="w-7 h-7" />
              </a>
              <a
                href="https://bsky.app/profile/kinshipcoffee.bsky.social"
                target="_blank"
                rel="noopener noreferrer"
                className="text-[#4A5568] hover:text-[#2A9D8F] transition-colors"
                aria-label="Bluesky Social"
              >
                <SiBluesky className="w-7 h-7" />
              </a>
            </div>
          </div>
        </div>
      </div>

      {/* Items Grid */}
      <div className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
          {items.map((item) => (
            <div
              key={item.id}
              className="bg-white/80 backdrop-blur-sm rounded-lg shadow-sm hover:shadow-md transition-all duration-200 p-4 hover:bg-white overflow-hidden"
            >
              <div className="aspect-w-4 aspect-h-3 mb-3 rounded-md overflow-hidden">
                <img
                  src={item.imageUrl}
                  alt={item.name}
                  className="w-full h-full object-cover transform hover:scale-105 transition-transform duration-200"
                />
              </div>
              <h3 className="text-base font-semibold text-[#2D3748] mb-1">{item.name}</h3>
              <p className="text-[#4A5568] mb-3">${item.price.toFixed(2)}</p>
              <button
                onClick={() => {
                  addItem({
                    ...item,
                    store: storeId
                  });
                  if (!hasItemsFromDifferentStore) {
                    toast.success('Added to cart');
                  }
                }}
                className="w-full bg-[#2A9D8F] text-white py-2 px-4 rounded-md hover:bg-[#40B4A6] active:bg-[#1E7268] transition-colors duration-200"
              >
                Add to Cart
              </button>
            </div>
          ))}
        </div>
      </div>
    </main>
  );
} 
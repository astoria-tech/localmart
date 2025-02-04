'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/auth';
import { useCart } from '../../contexts/cart';
import { toast } from 'react-hot-toast';

interface Store {
  id: string;
  name: string;
  street_1: string;
  street_2?: string;
  city: string;
  state: string;
}

interface StoreItem {
  id: string;
  name: string;
  price: number;
}

export default function StoreContent({ storeId }: { storeId: string }) {
  const [store, setStore] = useState<Store | null>(null);
  const [items, setItems] = useState<StoreItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { addItem } = useCart();

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
        setItems(itemsData);
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
      <div className="min-h-[calc(100vh-64px)] bg-gray-50 pt-16">
        <div className="container mx-auto px-4">
          <div className="animate-pulse">
            <div className="h-32 bg-gray-200 rounded-lg mb-8"></div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <div key={i} className="h-64 bg-gray-200 rounded-lg"></div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error || !store) {
    return (
      <div className="min-h-[calc(100vh-64px)] bg-gray-50 pt-16">
        <div className="container mx-auto px-4">
          <div className="text-center">
            <h2 className="text-2xl font-bold text-gray-900">Error</h2>
            <p className="mt-2 text-gray-600">{error || 'Store not found'}</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <main className="flex-1 bg-gray-50">
      {/* Hero Section */}
      <div className="bg-white border-b pt-16">
        <div className="container mx-auto px-4 py-12">
          <div className="max-w-4xl mx-auto text-center">
            <h1 className="text-4xl font-bold text-gray-900 mb-4">{store.name}</h1>
            <p className="text-lg text-gray-600">
              {store.street_1}
              {store.street_2 && `, ${store.street_2}`}
              <br />
              {store.city}, {store.state}
            </p>
          </div>
        </div>
      </div>

      {/* Items Grid */}
      <div className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {items.map((item) => (
            <div
              key={item.id}
              className="bg-white rounded-lg shadow-sm hover:shadow-md transition-shadow duration-200 p-6"
            >
              <h3 className="text-lg font-semibold text-gray-900 mb-2">{item.name}</h3>
              <p className="text-gray-600 mb-4">${item.price.toFixed(2)}</p>
              <button
                onClick={() => {
                  addItem(item);
                  toast.success('Added to cart');
                }}
                className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 transition-colors duration-200"
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
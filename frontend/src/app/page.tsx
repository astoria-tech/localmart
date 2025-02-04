'use client';

import { useState, useEffect } from 'react';
import { useAuth } from './contexts/auth';
import Link from 'next/link';

interface Store {
  id: string;
  name: string;
  street_1: string;
  street_2?: string;
  city: string;
  state: string;
}

export default function Page() {
  const [stores, setStores] = useState<Store[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchStores = async () => {
      try {
        // Use environment variable with fallback for client-side fetching
        const baseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
        const response = await fetch(`${baseUrl}/api/v0/stores`);
        if (!response.ok) {
          throw new Error('Failed to fetch stores');
        }
        const data = await response.json();
        setStores(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to fetch stores');
      } finally {
        setLoading(false);
      }
    };

    fetchStores();
  }, []);

  if (loading) {
    return (
      <main className="min-h-[calc(100vh-64px)] bg-gray-50 pt-16">
        <div className="container mx-auto px-4">
          <div className="animate-pulse">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <div key={i} className="h-64 bg-gray-200 rounded-lg"></div>
              ))}
            </div>
          </div>
        </div>
      </main>
    );
  }

  if (error) {
    return (
      <main className="min-h-[calc(100vh-64px)] bg-gray-50 pt-16">
        <div className="container mx-auto px-4">
          <div className="text-center">
            <h2 className="text-2xl font-bold text-gray-900">Error</h2>
            <p className="mt-2 text-gray-600">{error}</p>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-[calc(100vh-64px)] bg-gray-50">
      {/* Hero Section */}
      <div className="bg-white border-b pt-16">
        <div className="container mx-auto px-4 py-12">
          <div className="max-w-4xl mx-auto text-center">
            <h1 className="text-4xl font-bold text-gray-900 mb-4">localmart</h1>
            <p className="text-lg text-gray-600">
              Shop from your favorite local stores with same-day delivery
            </p>
          </div>
        </div>
      </div>

      {/* Stores Grid */}
      <div className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {stores.map((store) => (
            <Link
              key={store.id}
              href={`/store/${store.id}`}
              className="block bg-white rounded-lg shadow-sm hover:shadow-md transition-shadow duration-200 p-6"
            >
              <h2 className="text-xl font-semibold text-gray-900 mb-2">{store.name}</h2>
              <p className="text-gray-600">
                {store.street_1}
                {store.street_2 && `, ${store.street_2}`}
                <br />
                {store.city}, {store.state}
              </p>
            </Link>
          ))}
        </div>
      </div>
    </main>
  );
}

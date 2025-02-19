'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { BuildingStorefrontIcon } from '@heroicons/react/24/outline';
import { SearchProvider } from '@/app/contexts/search';
import { Search } from '@/components/Search';
import { useFeatureFlag } from '@/app/contexts/featureFlags';

interface Store {
  id: string;
  name: string;
  street_1: string;
  street_2?: string;
  city: string;
  state: string;
  zip_code: string;
}

export default function Page() {
  const [stores, setStores] = useState<Store[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const productSearchEnabled = useFeatureFlag('product_search');

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
      <main className="min-h-[calc(100vh-64px)] bg-[#F5F2EB] pt-16">
        <div className="container mx-auto px-4">
          <div className="animate-pulse">
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

  if (error) {
    return (
      <main className="min-h-[calc(100vh-64px)] bg-[#F5F2EB] pt-16">
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
    <main className="min-h-[calc(100vh-64px)] bg-[#F5F2EB]">
      {/* Hero Section */}
      <div className="bg-white/50 backdrop-blur-sm border-b pt-16">
        <div className="container mx-auto px-4 py-12">
          <div className="max-w-4xl mx-auto text-center">
            <div className="flex items-center justify-center gap-3 mb-6">
              <BuildingStorefrontIcon className="h-12 w-12 text-[#2A9D8F]" />
              <h1 className="text-4xl font-bold text-[#2D3748] font-display">localmart</h1>
            </div>
            <p className="text-lg text-[#4A5568]">
              Shop local, same-day delivery.
            </p>
            <SearchProvider>
                { productSearchEnabled && <Search />}
            </SearchProvider>
          </div>
        </div>
      </div>

      {/* Stores Grid */}
      <div className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {stores.map((store) => (
            <Link
              key={store.id}
              href={`/store/${store.id}`}
              className="bg-white/80 backdrop-blur-sm rounded-lg p-6 hover:bg-white transition-all duration-200 group"
            >
              <div className="flex gap-4">
                <div className="w-24 h-24 rounded-lg overflow-hidden flex-shrink-0">
                  <img
                    src={`https://picsum.photos/seed/${store.id}/200/200`}
                    alt={store.name}
                    className="w-full h-full object-cover transform group-hover:scale-105 transition-transform duration-200"
                  />
                </div>
                <div>
                  <h2 className="text-xl font-semibold text-[#2D3748] mb-2">{store.name}</h2>
                  <p className="text-[#4A5568]">
                    {store.street_1}
                    {store.street_2 && `, ${store.street_2}`}
                    <br />
                    {store.city}, {store.state} {store.zip_code}
                  </p>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </main>
  );
}

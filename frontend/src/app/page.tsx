'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { BuildingStorefrontIcon, PlusIcon } from '@heroicons/react/24/outline';
import { SearchProvider } from '@/app/contexts/search';
import { Search } from '@/components/Search';
import { useFeatureFlag } from '@/app/contexts/featureFlags';
import { useCart } from '@/app/contexts/cart';
import { toast } from 'react-hot-toast';

interface Store {
  id: string;
  name: string;
  street_1: string;
  street_2?: string;
  city: string;
  state: string;
  zip_code: string;
  items?: StoreItem[];
}

interface StoreItem {
  id: string;
  name: string;
  price: number;
  imageUrl?: string;
}

export default function Page() {
  const [stores, setStores] = useState<Store[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const productSearchEnabled = useFeatureFlag('product_search');
  const { addItem, items: cartItems } = useCart();

  useEffect(() => {
    const fetchStores = async () => {
      try {
        const baseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
        // Fetch stores
        const storesResponse = await fetch(`${baseUrl}/api/v0/stores`);
        if (!storesResponse.ok) {
          throw new Error('Failed to fetch stores');
        }
        const storesData = await storesResponse.json();
        
        // Fetch items for each store
        const storesWithItems = await Promise.all(
          storesData.map(async (store: Store) => {
            const itemsResponse = await fetch(`${baseUrl}/api/v0/stores/${store.id}/items`);
            if (itemsResponse.ok) {
              const items = await itemsResponse.json();
              // Add mock image URLs to items
              const itemsWithImages = items.map((item: StoreItem) => ({
                ...item,
                imageUrl: `https://picsum.photos/seed/${item.id}/400/300`
              }));
              return { ...store, items: itemsWithImages };
            }
            return store;
          })
        );
        
        setStores(storesWithItems);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to fetch stores');
      } finally {
        setLoading(false);
      }
    };

    fetchStores();
  }, []);

  const handleAddToCart = (storeId: string, item: StoreItem) => {
    const hasItemsFromDifferentStore = cartItems.length > 0 && cartItems[0].store !== storeId;
    
    if (hasItemsFromDifferentStore) {
      toast.error('You can only add items from one store at a time');
      return;
    }

    addItem({
      ...item,
      store: storeId
    });
    toast.success('Added to cart');
  };

  if (loading) {
    return (
      <main className="min-h-[calc(100vh-64px)] bg-[#F5F2EB] pt-16">
        <div className="container mx-auto px-4">
          <div className="animate-pulse space-y-8">
            {/* Hero section skeleton */}
            <div className="h-64 bg-white/50 rounded-lg"></div>
            {/* Featured stores skeleton */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-48 bg-white/50 rounded-lg"></div>
              ))}
            </div>
            {/* Items grid skeleton */}
            <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-4">
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
      <div className="bg-gradient-to-b from-[#2A9D8F]/20 to-transparent pt-36 pb-14 relative overflow-hidden">
        {/* Decorative Background Pattern */}
        <div className="absolute inset-0 opacity-[0.15]" style={{ 
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='52' height='26' viewBox='0 0 52 26' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='%232A9D8F' fill-rule='evenodd'%3E%3Cg fill-rule='nonzero'%3E%3Cpath d='M10 10c0-2.21-1.79-4-4-4-3.314 0-6-2.686-6-6h2c0 2.21 1.79 4 4 4 3.314 0 6 2.686 6 6 0 2.21 1.79 4 4 4 3.314 0 6 2.686 6 6 0 2.21 1.79 4 4 4v2c-3.314 0-6-2.686-6-6 0-2.21-1.79-4-4-4-3.314 0-6-2.686-6-6zm25.464-1.95l8.486 8.486-1.414 1.414-8.486-8.486 1.414-1.414z' /%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
          backgroundSize: '52px 26px'
        }} />
        
        {/* Gradient Overlay */}
        <div className="absolute inset-0 bg-gradient-to-r from-[#2A9D8F]/10 via-transparent to-[#2A9D8F]/5" />
        
        <div className="container mx-auto px-4 relative">
          <div className="flex justify-between items-start">
            {/* Region Select */}
            <div className="bg-white/95 backdrop-blur-sm rounded-xl p-5 shadow-lg ring-1 ring-[#2A9D8F]/20">
              <label htmlFor="region-select" className="block text-base font-semibold text-[#2D3748] mb-2.5">
                Neighborhood
              </label>
              <select
                id="region-select"
                className="w-56 rounded-lg border-2 border-[#2A9D8F]/30 bg-white py-2.5 px-4 text-base shadow-sm 
                  focus:border-[#2A9D8F] focus:outline-none focus:ring-2 focus:ring-[#2A9D8F]/20 
                  text-[#2D3748] font-medium hover:border-[#2A9D8F]/50 transition-colors"
                defaultValue="astoria"
              >
                <option value="astoria">Astoria</option>
              </select>
            </div>

            {/* Main Hero Content */}
            <div className="max-w-xl text-right">
              <div className="flex items-center justify-end gap-3 mb-6">
                <h1 className="text-5xl font-bold text-[#2D3748] font-display">localmart</h1>
                <BuildingStorefrontIcon className="h-14 w-14 text-[#2A9D8F]" />
              </div>
              <p className="text-xl text-[#4A5568] mb-10 leading-relaxed">
                Shop local. Same-day delivery.
                <br />
                From your favorite neighborhood stores.
              </p>
              <SearchProvider>
                {productSearchEnabled && <Search />}
              </SearchProvider>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content Container */}
      <div className="container mx-auto px-4 -mt-8">
        {/* Local Stores Section - Commented Out
        <div className="bg-[#FFFFFF]/90 backdrop-blur-sm rounded-2xl shadow-sm ring-1 ring-black/5 p-8 mb-8">
          <h2 className="text-3xl font-bold text-[#2D3748] mb-8">Local Stores</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {stores.map((store) => (
              <Link
                key={store.id}
                href={`/store/${store.id}`}
                className="group relative bg-[#F8F6F0] rounded-xl p-6 hover:bg-[#F5F2EB] transition-all duration-200 ring-1 ring-black/5 hover:ring-[#2A9D8F]/10"
              >
                <div className="flex gap-4">
                  <div className="w-28 h-28 rounded-lg overflow-hidden flex-shrink-0 ring-1 ring-black/10">
                    <img
                      src={`https://picsum.photos/seed/${store.id}/200/200`}
                      alt={store.name}
                      className="w-full h-full object-cover transform group-hover:scale-105 transition-transform duration-200"
                    />
                  </div>
                  <div>
                    <h3 className="text-xl font-semibold text-[#2D3748] mb-2 group-hover:text-[#2A9D8F] transition-colors">
                      {store.name}
                    </h3>
                    <p className="text-[#4A5568] text-sm mb-3">
                      {store.street_1}
                      {store.street_2 && `, ${store.street_2}`}
                      <br />
                      {store.city}, {store.state} {store.zip_code}
                    </p>
                    <p className="text-[#2A9D8F] text-sm font-medium flex items-center gap-1">
                      View store
                      <span className="transform group-hover:translate-x-1 transition-transform duration-200">→</span>
                    </p>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
        */}

        {/* Popular Items Sections */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {stores.map((store, storeIndex) => store.items && store.items.length > 0 && (
            <div key={store.id} className="bg-[#FAF9F6]/80 backdrop-blur-sm rounded-2xl shadow-sm ring-1 ring-black/5 p-8">
              <div className="flex items-center justify-between mb-8">
                <Link
                  href={`/store/${store.id}`}
                  className="group"
                >
                  <h2 className="text-2xl font-bold text-[#2D3748] group-hover:text-[#2A9D8F] transition-colors">{store.name}</h2>
                </Link>
                <Link
                  href={`/store/${store.id}`}
                  className="text-[#2A9D8F] hover:text-[#40B4A6] transition-colors text-sm font-medium flex items-center gap-1 group"
                >
                  See all
                  <span className="transform group-hover:translate-x-1 transition-transform duration-200">→</span>
                </Link>
              </div>
              <div className="grid grid-cols-3 gap-4">
                {store.items.slice(0, 3).map((item) => (
                  <div
                    key={item.id}
                    className="group relative bg-[#FFFFFF]/95 rounded-xl shadow-sm hover:shadow-md transition-all duration-200 overflow-hidden ring-1 ring-black/5 hover:ring-[#2A9D8F]/10"
                  >
                    <Link href={`/store/${store.id}`}>
                      <div className="aspect-w-4 aspect-h-3">
                        <img
                          src={item.imageUrl}
                          alt={item.name}
                          className="w-full h-full object-cover transform group-hover:scale-105 transition-transform duration-200"
                        />
                      </div>
                    </Link>
                    <div className="p-4">
                      <Link href={`/store/${store.id}`}>
                        <h3 className="text-sm font-semibold text-[#2D3748] mb-1 group-hover:text-[#2A9D8F] transition-colors line-clamp-2">
                          {item.name}
                        </h3>
                      </Link>
                      <div className="flex items-center justify-between mt-2">
                        <p className="text-[#4A5568] font-medium">${item.price.toFixed(2)}</p>
                        <button
                          onClick={(e) => {
                            e.preventDefault();
                            handleAddToCart(store.id, item);
                          }}
                          className="p-2 text-[#2A9D8F] hover:text-white hover:bg-[#2A9D8F] rounded-full transition-colors group/btn"
                          aria-label={`Add ${item.name} to cart`}
                        >
                          <PlusIcon className="w-5 h-5" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </main>
  );
}

'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { BuildingStorefrontIcon, PlusIcon, ShoppingCartIcon, StarIcon } from '@heroicons/react/24/outline';
import { SearchProvider } from '@/app/contexts/search';
import { Search } from '@/components/Search';
import { useFeatureFlag } from '@/app/contexts/featureFlags';
import { useCart } from '@/app/contexts/cart';
import { toast } from 'react-hot-toast';
import { storesApi, Store, StoreItem } from '@/api';

export default function Page() {
  const [stores, setStores] = useState<Store[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const productSearchEnabled = useFeatureFlag('product_search');
  const { addItem, items: cartItems } = useCart();

  useEffect(() => {
    const fetchStores = async () => {
      try {
        const storesWithItems = await storesApi.getAllStoresWithItems();
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
            {/* Promo banner skeleton */}
            <div className="h-24 bg-white/50 rounded-lg"></div>
            {/* Items flow skeleton */}
            <div className="flex flex-wrap gap-3">
              {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
                <div key={i} className="h-64 w-[calc(50%-6px)] sm:w-[calc(33.333%-8px)] md:w-[calc(25%-9px)] lg:w-[calc(20%-10px)] xl:w-[calc(16.666%-10px)] bg-white/50 rounded-lg"></div>
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

  // Get all items from all stores
  const allItems = stores.reduce((acc, store) => {
    if (store.items && store.items.length > 0) {
      // Take up to 6 items from each store and add store info to each item
      const storeItems = store.items.slice(0, 6).map(item => ({
        ...item,
        storeName: store.name,
        storeId: store.id
      }));
      return [...acc, ...storeItems];
    }
    return acc;
  }, [] as (StoreItem & { storeName: string; storeId: string })[]);

  return (
    <main className="min-h-[calc(100vh-64px)] bg-[#F5F2EB]">
      {/* Hero Section */}
      <div className="bg-gradient-to-b from-[#2A9D8F]/20 to-transparent pt-24 pb-10 relative overflow-hidden">
        {/* Decorative Background Pattern */}
        <div className="absolute inset-0 opacity-[0.15]" style={{ 
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='52' height='26' viewBox='0 0 52 26' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='%232A9D8F' fill-rule='evenodd'%3E%3Cg fill-rule='nonzero'%3E%3Cpath d='M10 10c0-2.21-1.79-4-4-4-3.314 0-6-2.686-6-6h2c0 2.21 1.79 4 4 4 3.314 0 6 2.686 6 6 0 2.21 1.79 4 4 4 3.314 0 6 2.686 6 6 0 2.21 1.79 4 4 4v2c-3.314 0-6-2.686-6-6 0-2.21-1.79-4-4-4-3.314 0-6-2.686-6-6zm25.464-1.95l8.486 8.486-1.414 1.414-8.486-8.486 1.414-1.414z' /%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
          backgroundSize: '52px 26px'
        }} />
        
        {/* Gradient Overlay */}
        <div className="absolute inset-0 bg-gradient-to-r from-[#2A9D8F]/10 via-transparent to-[#2A9D8F]/5" />
        
        <div className="container mx-auto px-4 relative">
          <div className="flex flex-col md:flex-row justify-between items-center">
            {/* Region Select */}
            <div className="bg-white/95 backdrop-blur-sm rounded-xl p-4 shadow-lg ring-1 ring-[#2A9D8F]/20 mb-6 md:mb-0">
              <label htmlFor="region-select" className="block text-base font-semibold text-[#2D3748] mb-2">
                Neighborhood
              </label>
              <select
                id="region-select"
                className="w-56 rounded-lg border-2 border-[#2A9D8F]/30 bg-white py-2 px-4 text-base shadow-sm 
                  focus:border-[#2A9D8F] focus:outline-none focus:ring-2 focus:ring-[#2A9D8F]/20 
                  text-[#2D3748] font-medium hover:border-[#2A9D8F]/50 transition-colors"
                defaultValue="astoria"
              >
                <option value="astoria">Astoria</option>
              </select>
            </div>

            {/* Main Hero Content */}
            <div className="max-w-xl text-center md:text-right">
              <div className="flex items-center justify-center md:justify-end gap-3 mb-4">
                <h1 className="text-4xl font-bold text-[#2D3748] font-display">localmart</h1>
                <BuildingStorefrontIcon className="h-12 w-12 text-[#2A9D8F]" />
              </div>
              <p className="text-lg text-[#4A5568] mb-6 leading-relaxed">
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
      <div className="container mx-auto px-4 -mt-4">
        {/* Promotional Banner */}
        <div className="bg-gradient-to-r from-[#2A9D8F]/20 via-[#2A9D8F]/10 to-[#2A9D8F]/5 rounded-xl overflow-hidden shadow-sm relative mb-8">
          {/* Decorative Elements */}
          <div className="absolute top-0 right-0 w-32 h-32 bg-[#2A9D8F]/10 rounded-full -translate-y-1/2 translate-x-1/2"></div>
          <div className="absolute bottom-0 left-0 w-24 h-24 bg-[#2A9D8F]/10 rounded-full translate-y-1/2 -translate-x-1/2"></div>
          
          <div className="relative p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0 mr-6 hidden md:block">
                <div className="bg-white/80 backdrop-blur-sm p-3 rounded-full shadow-sm">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-[#2A9D8F]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                  </svg>
                </div>
              </div>
              <div className="max-w-xl">
                <h3 className="text-xl font-bold text-[#2D3748] mb-2">Free Delivery on Your First Order</h3>
                <p className="text-[#4A5568]">Use code <span className="inline-block bg-white/70 backdrop-blur-sm px-2 py-0.5 rounded font-semibold text-[#2A9D8F] shadow-sm">FIRSTORDER</span> at checkout</p>
              </div>
            </div>
          </div>
        </div>

        {/* Section Header */}
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-[#2D3748]">Shop Local Favorites</h2>
          <Link
            href="/stores"
            className="text-[#2A9D8F] hover:text-[#40B4A6] transition-colors text-sm font-medium flex items-center gap-1 group"
          >
            View all stores
            <span className="transform group-hover:translate-x-1 transition-transform duration-200">→</span>
          </Link>
        </div>

        {/* Continuous Product Flow Layout */}
        <div className="flex flex-wrap gap-3 mb-12">
          {allItems.map((item) => (
            <div
              key={`${item.storeId}-${item.id}`}
              className="group bg-white rounded-lg shadow-sm hover:shadow-md transition-all duration-200 overflow-hidden border border-gray-100 hover:border-[#2A9D8F]/20 w-[calc(50%-6px)] sm:w-[calc(33.333%-8px)] md:w-[calc(25%-9px)] lg:w-[calc(20%-10px)] xl:w-[calc(16.666%-10px)]"
            >
              <Link href={`/store/${item.storeId}`} className="block">
                <div className="aspect-w-1 aspect-h-1 bg-gray-50">
                  <img
                    src={item.imageUrl}
                    alt={item.name}
                    className="w-full h-full object-cover transform group-hover:scale-105 transition-transform duration-200"
                  />
                </div>
              </Link>
              <div className="p-3">
                <Link href={`/store/${item.storeId}`} className="block">
                  <div className="mb-1">
                    <span className="text-xs font-medium text-[#2A9D8F] bg-[#2A9D8F]/10 px-2 py-0.5 rounded">
                      {item.storeName}
                    </span>
                  </div>
                  <h3 className="text-sm font-medium text-[#2D3748] group-hover:text-[#2A9D8F] transition-colors line-clamp-2 min-h-[2.5rem]">
                    {item.name}
                  </h3>
                </Link>
                
                {/* Rating Stars */}
                <div className="flex items-center mt-1 mb-1">
                  <div className="flex items-center">
                    {[...Array(5)].map((_, i) => (
                      <StarIcon key={i} className={`h-3 w-3 ${i < 4 ? "text-yellow-400 fill-yellow-400" : "text-gray-300"}`} />
                    ))}
                  </div>
                  <span className="text-xs text-gray-500 ml-1">({Math.floor(Math.random() * 100) + 10})</span>
                </div>
                
                <div className="flex items-center justify-between mt-2">
                  <p className="text-[#2A9D8F] font-semibold">${item.price.toFixed(2)}</p>
                  <button
                    onClick={(e) => {
                      e.preventDefault();
                      handleAddToCart(item.storeId, item);
                    }}
                    className="p-1.5 text-[#2A9D8F] hover:text-white hover:bg-[#2A9D8F] rounded-full transition-colors group/btn"
                    aria-label={`Add ${item.name} to cart`}
                  >
                    <ShoppingCartIcon className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </main>
  );
}

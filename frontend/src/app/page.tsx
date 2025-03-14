'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { BuildingStorefrontIcon, ClockIcon, HomeIcon, ShoppingCartIcon, StarIcon, InformationCircleIcon } from '@heroicons/react/24/outline';
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
  const [showTooltip, setShowTooltip] = useState(false);
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
            {/* Info section skeleton */}
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
      {/* Unified Hero Section with Info */}
      <div className="bg-gradient-to-b from-[#2A9D8F]/20 to-transparent pt-24 pb-6 relative overflow-hidden">
        {/* Decorative Background Pattern */}
        <div className="absolute inset-0 opacity-[0.15]" style={{ 
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='52' height='26' viewBox='0 0 52 26' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='%232A9D8F' fill-rule='evenodd'%3E%3Cg fill-rule='nonzero'%3E%3Cpath d='M10 10c0-2.21-1.79-4-4-4-3.314 0-6-2.686-6-6h2c0 2.21 1.79 4 4 4 3.314 0 6 2.686 6 6 0 2.21 1.79 4 4 4 3.314 0 6 2.686 6 6 0 2.21 1.79 4 4 4v2c-3.314 0-6-2.686-6-6 0-2.21-1.79-4-4-4-3.314 0-6-2.686-6-6zm25.464-1.95l8.486 8.486-1.414 1.414-8.486-8.486 1.414-1.414z' /%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
          backgroundSize: '52px 26px'
        }} />
        
        {/* Gradient Overlay */}
        <div className="absolute inset-0 bg-gradient-to-r from-[#2A9D8F]/10 via-transparent to-[#2A9D8F]/5" />
        
        <div className="container mx-auto px-4 relative">
          {/* Top Section */}
          <div className="flex flex-col md:flex-row justify-between items-center mb-8">
            {/* Region Select */}
            <div className="bg-white/95 backdrop-blur-sm rounded-xl p-4 shadow-sm ring-1 ring-[#2A9D8F]/20 mb-6 md:mb-0 w-full md:w-auto">
              <div className="flex items-center mb-2">
                <label htmlFor="region-select" className="block text-base font-semibold text-[#2D3748]">
                  Neighborhood
                </label>
                <div className="relative ml-2">
                  <InformationCircleIcon 
                    className="h-5 w-5 text-[#2A9D8F] cursor-help" 
                    onMouseEnter={() => setShowTooltip(true)}
                    onMouseLeave={() => setShowTooltip(false)}
                  />
                  {showTooltip && (
                    <div className="absolute z-50 w-64 px-4 py-3 text-sm text-white bg-[#2D3748] rounded-lg shadow-lg left-6 top-0 ml-1">
                      <p>We're currently only serving Astoria (because we live here!) 🏡</p>
                      <div className="absolute w-3 h-3 bg-[#2D3748] transform rotate-45 -left-1.5 top-1/2 -mt-1.5"></div>
                    </div>
                  )}
                </div>
              </div>
              <select
                id="region-select"
                className="w-full md:w-56 rounded-lg border-2 border-[#2A9D8F]/30 bg-white py-2 px-4 text-base shadow-sm 
                  focus:border-[#2A9D8F] focus:outline-none focus:ring-2 focus:ring-[#2A9D8F]/20 
                  text-[#2D3748] font-medium hover:border-[#2A9D8F]/50 transition-colors"
                defaultValue="astoria"
              >
                <option value="astoria">Astoria</option>
              </select>
            </div>

            {/* Main Hero Content */}
            <div className="max-w-xl text-center md:text-right">
              <div className="flex items-center justify-center md:justify-end gap-3 mb-3">
                <h1 className="text-4xl font-bold text-[#2D3748] font-display">localmart</h1>
                <BuildingStorefrontIcon className="h-10 w-10 text-[#2A9D8F]" />
              </div>
              <p className="text-lg text-[#4A5568] leading-relaxed">
                Shop local. Same-day delivery.
                <br />
                From your favorite neighborhood stores.
              </p>
              <div className="mt-4">
                <SearchProvider>
                  {productSearchEnabled && <Search />}
                </SearchProvider>
              </div>
            </div>
          </div>
          
          {/* Info Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            {/* Delivery Information Card */}
            <div className="bg-white/90 backdrop-blur-sm rounded-lg shadow-sm border border-[#2A9D8F]/10 overflow-hidden">
              <div className="flex items-center bg-[#2A9D8F]/10 px-4 py-2">
                <ClockIcon className="h-5 w-5 text-[#2A9D8F] mr-2" />
                <h4 className="text-base font-semibold text-[#2D3748]">How Delivery Works</h4>
              </div>
              <div className="p-4">
                <ul className="space-y-2">
                  <li className="flex items-start">
                    <div className="flex-shrink-0 mr-2 mt-1">
                      <div className="h-1.5 w-1.5 rounded-full bg-[#2A9D8F]"></div>
                    </div>
                    <p className="text-sm text-[#4A5568]">Order before 3PM for same-day delivery. Later orders delivered next day.</p>
                  </li>
                  <li className="flex items-start">
                    <div className="flex-shrink-0 mr-2 mt-1">
                      <div className="h-1.5 w-1.5 rounded-full bg-[#2A9D8F]"></div>
                    </div>
                    <p className="text-sm text-[#4A5568]">All deliveries are scheduled in 1-hour windows.</p>
                  </li>
                </ul>
              </div>
            </div>
            
            {/* Local Stores Card */}
            <div className="bg-white/90 backdrop-blur-sm rounded-lg shadow-sm border border-[#2A9D8F]/10 overflow-hidden">
              <div className="flex items-center bg-[#2A9D8F]/10 px-4 py-2">
                <HomeIcon className="h-5 w-5 text-[#2A9D8F] mr-2" />
                <h4 className="text-base font-semibold text-[#2D3748]">Local Stores Only</h4>
              </div>
              <div className="p-4">
                <p className="text-sm text-[#4A5568]">We only list items from local businesses in your neighborhood.</p>
                <p className="text-sm text-[#4A5568] mt-2 font-medium">No chains allowed.</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content Container */}
      <div className="container mx-auto px-4 py-6">
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

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
      {/* Hero Section - More compact */}
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
        {/* Promotional Banner - Moved above store items */}
        <div className="bg-gradient-to-r from-[#2A9D8F]/20 to-[#2A9D8F]/5 rounded-xl p-6 mb-8">
          <div className="flex flex-col md:flex-row items-center justify-between">
            <div className="mb-4 md:mb-0">
              <h3 className="text-xl font-bold text-[#2D3748] mb-2">Free Delivery on Your First Order</h3>
              <p className="text-[#4A5568]">Use code <span className="font-semibold">FIRSTORDER</span> at checkout</p>
            </div>
            <button className="bg-[#2A9D8F] hover:bg-[#40B4A6] text-white px-6 py-2 rounded-lg transition-colors shadow-sm">
              Shop Now
            </button>
          </div>
        </div>

        {/* Store Sections - Compact Grid Layout */}
        {stores.map((store, storeIndex) => store.items && store.items.length > 0 && (
          <div key={store.id} className="mb-8">
            <div className="flex items-center justify-between mb-4">
              <Link
                href={`/store/${store.id}`}
                className="group flex items-center"
              >
                <h2 className="text-xl font-bold text-[#2D3748] group-hover:text-[#2A9D8F] transition-colors">{store.name}</h2>
                <span className="ml-2 px-2 py-0.5 bg-[#2A9D8F]/10 rounded text-xs text-[#2A9D8F] font-medium">Local Favorite</span>
              </Link>
              <Link
                href={`/store/${store.id}`}
                className="text-[#2A9D8F] hover:text-[#40B4A6] transition-colors text-sm font-medium flex items-center gap-1 group"
              >
                See all
                <span className="transform group-hover:translate-x-1 transition-transform duration-200">→</span>
              </Link>
            </div>
            
            {/* Compact Product Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3">
              {store.items.slice(0, 6).map((item) => (
                <div
                  key={item.id}
                  className="group bg-white rounded-lg shadow-sm hover:shadow-md transition-all duration-200 overflow-hidden border border-gray-100 hover:border-[#2A9D8F]/20"
                >
                  <Link href={`/store/${store.id}`} className="block">
                    <div className="aspect-w-1 aspect-h-1 bg-gray-50">
                      <img
                        src={item.imageUrl}
                        alt={item.name}
                        className="w-full h-full object-cover transform group-hover:scale-105 transition-transform duration-200"
                      />
                    </div>
                  </Link>
                  <div className="p-3">
                    <Link href={`/store/${store.id}`} className="block">
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
                          handleAddToCart(store.id, item);
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
        ))}
      </div>
    </main>
  );
}

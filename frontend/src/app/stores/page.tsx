'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { 
  BuildingStorefrontIcon, 
  ClockIcon, 
  MapPinIcon, 
  ArrowRightIcon,
  ShoppingBagIcon
} from '@heroicons/react/24/outline';
import { FaInstagram, FaFacebook, FaXTwitter } from 'react-icons/fa6';
import { storesApi, Store } from '@/api';

export default function StoresPage() {
  const [stores, setStores] = useState<Store[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchStores = async () => {
      try {
        const allStores = await storesApi.getAllStores();
        setStores(allStores);
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
          <div className="animate-pulse space-y-8">
            <div className="h-24 bg-white/50 rounded-lg"></div>
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-40 bg-white/50 rounded-lg"></div>
            ))}
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
      {/* Header */}
      <div className="bg-gradient-to-b from-[#2A9D8F]/20 to-transparent pt-24 pb-10 relative overflow-hidden">
        {/* Decorative Background Pattern */}
        <div className="absolute inset-0 opacity-[0.15]" style={{ 
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='52' height='26' viewBox='0 0 52 26' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='%232A9D8F' fill-rule='evenodd'%3E%3Cg fill-rule='nonzero'%3E%3Cpath d='M10 10c0-2.21-1.79-4-4-4-3.314 0-6-2.686-6-6h2c0 2.21 1.79 4 4 4 3.314 0 6 2.686 6 6 0 2.21 1.79 4 4 4 3.314 0 6 2.686 6 6 0 2.21 1.79 4 4 4v2c-3.314 0-6-2.686-6-6 0-2.21-1.79-4-4-4-3.314 0-6-2.686-6-6zm25.464-1.95l8.486 8.486-1.414 1.414-8.486-8.486 1.414-1.414z' /%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
          backgroundSize: '52px 26px'
        }} />
        
        {/* Gradient Overlay */}
        <div className="absolute inset-0 bg-gradient-to-r from-[#2A9D8F]/10 via-transparent to-[#2A9D8F]/5" />
        
        <div className="container mx-auto px-4 relative">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl md:text-4xl font-bold text-[#2D3748] mb-2">Local Stores</h1>
              <p className="text-[#4A5568]">Discover neighborhood favorites with same-day delivery</p>
            </div>
            <BuildingStorefrontIcon className="h-12 w-12 text-[#2A9D8F] hidden md:block" />
          </div>
        </div>
      </div>

      {/* Stores List */}
      <div className="container mx-auto px-4 py-8">
        <div className="space-y-6">
          {stores.map((store) => (
            <Link 
              key={store.id} 
              href={`/store/${store.id}`}
              className="block group"
            >
              <div className="bg-white/80 backdrop-blur-sm rounded-lg shadow-sm hover:shadow-md transition-all duration-200 overflow-hidden border border-gray-100 hover:border-[#2A9D8F]/20">
                <div className="p-6">
                  <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">
                    {/* Store Info */}
                    <div className="flex-1">
                      <div className="flex items-center gap-3">
                        <h2 className="text-xl font-bold text-[#2D3748] group-hover:text-[#2A9D8F] transition-colors">{store.name}</h2>
                        <span className="px-2 py-0.5 bg-[#2A9D8F]/10 rounded text-xs text-[#2A9D8F] font-medium">Local Favorite</span>
                      </div>
                      <p className="text-[#4A5568] text-sm mt-1">Local market & grocery</p>
                      
                      <div className="flex flex-wrap gap-6 mt-4">
                        {/* Hours */}
                        <div className="flex items-center gap-2 text-[#4A5568]">
                          <div className="p-1.5 bg-[#2A9D8F]/10 rounded-lg">
                            <ClockIcon className="w-4 h-4 text-[#2A9D8F]" />
                          </div>
                          <div>
                            <p className="text-xs">Mon-Fri 8am-9pm</p>
                            <p className="text-xs">Sat-Sun 9am-8pm</p>
                          </div>
                        </div>

                        {/* Location */}
                        <div className="flex items-center gap-2 text-[#4A5568]">
                          <div className="p-1.5 bg-[#2A9D8F]/10 rounded-lg">
                            <MapPinIcon className="w-4 h-4 text-[#2A9D8F]" />
                          </div>
                          <div>
                            <p className="text-xs">{store.street_1}</p>
                            <p className="text-xs">{store.city}, {store.state} {store.zip_code}</p>
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    {/* Social Links & Action */}
                    <div className="flex flex-col items-end gap-4">
                      <div className="flex gap-2">
                        {store.instagram && (
                          <a
                            href={`https://instagram.com/${store.instagram}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-[#4A5568] hover:text-[#2A9D8F] transition-colors bg-white/50 backdrop-blur-sm p-1.5 rounded-full shadow-sm hover:shadow"
                            aria-label="Instagram"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <FaInstagram className="w-4 h-4" />
                          </a>
                        )}
                        {store.facebook && (
                          <a
                            href={`https://facebook.com/${store.facebook}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-[#4A5568] hover:text-[#2A9D8F] transition-colors bg-white/50 backdrop-blur-sm p-1.5 rounded-full shadow-sm hover:shadow"
                            aria-label="Facebook"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <FaFacebook className="w-4 h-4" />
                          </a>
                        )}
                        {store.twitter && (
                          <a
                            href={`https://x.com/${store.twitter}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-[#4A5568] hover:text-[#2A9D8F] transition-colors bg-white/50 backdrop-blur-sm p-1.5 rounded-full shadow-sm hover:shadow"
                            aria-label="X (formerly Twitter)"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <FaXTwitter className="w-4 h-4" />
                          </a>
                        )}
                      </div>
                      
                      <div className="flex items-center gap-1 text-[#2A9D8F] group-hover:text-[#40B4A6] transition-colors text-sm font-medium">
                        <ShoppingBagIcon className="w-4 h-4" />
                        <span>Shop Now</span>
                        <ArrowRightIcon className="w-3 h-3 transform group-hover:translate-x-1 transition-transform duration-200" />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </main>
  );
} 
'use client';

import { useState, useEffect } from 'react';
import { useCart } from '@/app/contexts/cart';
import { toast } from 'react-hot-toast';
import { FaInstagram, FaFacebook, FaXTwitter } from 'react-icons/fa6';
import { SiBluesky } from 'react-icons/si';
import { ClockIcon, MapPinIcon, ChartBarIcon, ShoppingBagIcon, ShoppingCartIcon } from '@heroicons/react/24/outline';
import { config } from '@/config';
import { useStoreRoles } from '@/app/hooks/useStoreRoles';
import Link from 'next/link';
import { storesApi, Store, StoreItem } from '@/api';

export default function StoreContent({ storeId }: { storeId: string }) {
  const { addItem } = useCart();
  const { isAdmin } = useStoreRoles(storeId);
  const [store, setStore] = useState<Store | null>(null);
  const [items, setItems] = useState<StoreItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { items: cartItems } = useCart();

  // Check if cart has items from a different store
  const hasItemsFromDifferentStore = cartItems.length > 0 && cartItems[0].store !== storeId;

  useEffect(() => {
    const fetchStoreAndItems = async () => {
      try {
        const storeWithItems = await storesApi.getStoreWithItems(storeId);
        setStore(storeWithItems);
        setItems(storeWithItems.items);
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
      <main className="min-h-[calc(100vh-64px)] bg-[#F5F2EB]">
        <div className="pt-16 container mx-auto px-4">
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
      <main className="min-h-[calc(100vh-64px)] bg-[#F5F2EB]">
        <div className="pt-16 container mx-auto px-4">
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
      <div className="bg-gradient-to-r from-[#2A9D8F]/15 to-[#2A9D8F]/5 border-b shadow-sm pt-16">
        <div className="h-auto min-h-40 relative overflow-hidden">
          {/* Decorative Background Pattern - Replacing the missing pattern-bg.png */}
          <div className="absolute inset-0 opacity-[0.15]" style={{ 
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='52' height='26' viewBox='0 0 52 26' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='%232A9D8F' fill-rule='evenodd'%3E%3Cg fill-rule='nonzero'%3E%3Cpath d='M10 10c0-2.21-1.79-4-4-4-3.314 0-6-2.686-6-6h2c0 2.21 1.79 4 4 4 3.314 0 6 2.686 6 6 0 2.21 1.79 4 4 4 3.314 0 6 2.686 6 6 0 2.21 1.79 4 4 4v2c-3.314 0-6-2.686-6-6 0-2.21-1.79-4-4-4-3.314 0-6-2.686-6-6zm25.464-1.95l8.486 8.486-1.414 1.414-8.486-8.486 1.414-1.414z' /%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
            backgroundSize: '52px 26px'
          }} />
          
          {/* Gradient Overlay */}
          <div className="absolute inset-0 bg-gradient-to-r from-[#2A9D8F]/10 via-transparent to-[#2A9D8F]/10" />
          
          <div className="container mx-auto px-4 h-full relative z-10">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between h-full py-8 pt-10">
              {/* Store Name and Type */}
              <div className="relative">
                <h1 className="text-3xl md:text-4xl font-bold text-[#2D3748] mb-2 transition-colors">{store.name}</h1>
                <p className="text-[#4A5568] text-sm md:text-base">Local market & grocery</p>
                
                {/* Vendor Links */}
                {isAdmin && (
                  <div className="flex items-center gap-4 mt-3">
                    <Link
                      href={`/store/${storeId}/dashboard`}
                      className="text-sm text-[#2A9D8F] hover:text-[#40B4A6] transition-colors flex items-center gap-1 bg-white/50 backdrop-blur-sm px-3 py-1.5 rounded-md shadow-sm hover:shadow"
                    >
                      <ChartBarIcon className="w-4 h-4" />
                      <span>View Orders</span>
                    </Link>
                    <Link
                      href={`/store/${storeId}/inventory`}
                      className="text-sm text-[#2A9D8F] hover:text-[#40B4A6] transition-colors flex items-center gap-1 bg-white/50 backdrop-blur-sm px-3 py-1.5 rounded-md shadow-sm hover:shadow"
                    >
                      <ShoppingBagIcon className="w-4 h-4" />
                      <span>Manage Inventory</span>
                    </Link>
                  </div>
                )}
                
                {/* Social Links */}
                <div className="flex gap-3 mt-4">
                  <a
                    href="https://instagram.com/kinshipcoffee"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-[#4A5568] hover:text-[#2A9D8F] transition-colors bg-white/50 backdrop-blur-sm p-2 rounded-full shadow-sm hover:shadow"
                    aria-label="Instagram"
                  >
                    <FaInstagram className="w-5 h-5" />
                  </a>
                  <a
                    href="https://facebook.com/kinshipcoffee"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-[#4A5568] hover:text-[#2A9D8F] transition-colors bg-white/50 backdrop-blur-sm p-2 rounded-full shadow-sm hover:shadow"
                    aria-label="Facebook"
                  >
                    <FaFacebook className="w-5 h-5" />
                  </a>
                  <a
                    href="https://x.com/kinshipcoffee"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-[#4A5568] hover:text-[#2A9D8F] transition-colors bg-white/50 backdrop-blur-sm p-2 rounded-full shadow-sm hover:shadow"
                    aria-label="X (formerly Twitter)"
                  >
                    <FaXTwitter className="w-5 h-5" />
                  </a>
                  <a
                    href="https://bsky.app/profile/kinshipcoffee.bsky.social"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-[#4A5568] hover:text-[#2A9D8F] transition-colors bg-white/50 backdrop-blur-sm p-2 rounded-full shadow-sm hover:shadow"
                    aria-label="Bluesky Social"
                  >
                    <SiBluesky className="w-5 h-5" />
                  </a>
                </div>
              </div>

              {/* Store Info */}
              <div className="flex flex-col gap-4 mt-6 md:mt-0 bg-white/60 backdrop-blur-sm p-4 rounded-lg shadow-sm">
                {/* Hours */}
                <div className="flex items-center gap-3 text-[#4A5568]">
                  <div className="p-2 bg-[#2A9D8F]/10 rounded-lg">
                    <ClockIcon className="w-5 h-5 text-[#2A9D8F]" />
                  </div>
                  <div>
                    <p className="font-medium text-[#2D3748] text-sm mb-1">Hours</p>
                    <p className="text-sm">Mon-Fri 8am-9pm</p>
                    <p className="text-sm">Sat-Sun 9am-8pm</p>
                  </div>
                </div>

                {/* Location */}
                <div className="flex items-center gap-3 text-[#4A5568]">
                  <div className="p-2 bg-[#2A9D8F]/10 rounded-lg">
                    <MapPinIcon className="w-5 h-5 text-[#2A9D8F]" />
                  </div>
                  <div>
                    <p className="font-medium text-[#2D3748] text-sm mb-1">Location</p>
                    <p className="text-sm">{store.street_1}</p>
                    <p className="text-sm">{store.city}, {store.state} {store.zip_code}</p>
                  </div>
                </div>
              </div>
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
              className="group bg-white rounded-lg shadow-sm hover:shadow-md transition-all duration-200 overflow-hidden border border-gray-100 hover:border-[#2A9D8F]/20"
            >
              <div className="aspect-w-1 aspect-h-1 bg-gray-50">
                <img
                  src={item.imageUrl}
                  alt={item.name}
                  className="w-full h-full object-cover transform group-hover:scale-105 transition-transform duration-200"
                />
              </div>
              <div className="p-3">
                <h3 className="text-sm font-medium text-[#2D3748] group-hover:text-[#2A9D8F] transition-colors line-clamp-2 min-h-[2.5rem] mb-2">
                  {item.name}
                </h3>
                <div className="flex items-center justify-between">
                  <p className="text-[#2A9D8F] font-semibold">${item.price.toFixed(2)}</p>
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

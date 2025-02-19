'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/app/contexts/auth';
import { config } from '@/config';
import { formatCurrency } from '@/utils/currency';
import { MapPinIcon, BuildingStorefrontIcon, XMarkIcon, ClockIcon } from '@heroicons/react/24/outline';
import { useRouter, useParams } from 'next/navigation';

interface OrderItem {
  id: string;
  name: string;
  quantity: number;
  price: number;
}

interface Store {
  store: {
    id: string;
    name: string;
  };
  items: OrderItem[];
}

interface Order {
  id: string;
  created: string;
  status: string;
  payment_status: string;
  delivery_fee: number;
  total_amount: number;
  tax_amount: number;
  delivery_address?: {
    street_address: string[];
    city: string;
    state: string;
    zip_code: string;
  };
  customer_phone?: string;
  stores: Store[];
}

const formatDateTime = (isoString: string) => {
  const utcDate = new Date(isoString + 'Z');
  return new Intl.DateTimeFormat('en-US', {
    dateStyle: 'medium',
    timeStyle: 'short',
    timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
  }).format(utcDate);
};

export default function OrderViewPage() {
  const { user } = useAuth();
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const params = useParams();
  const orderId = params?.id as string;

  useEffect(() => {
    const fetchOrder = async () => {
      if (!user?.token || !orderId) return;

      try {
        const response = await fetch(`${config.apiUrl}/api/v0/orders`, {
          headers: {
            'Authorization': `Bearer ${user.token}`,
          },
        });

        if (!response.ok) {
          throw new Error('Failed to fetch orders');
        }

        const orders = await response.json();
        const order = orders.find((o: Order) => o.id === orderId);
        
        if (!order) {
          throw new Error('Order not found');
        }

        setOrder(order);
      } catch (error) {
        console.error('Error fetching order:', error);
      } finally {
        setLoading(false);
      }
    };

    if (user) {
      fetchOrder();
    }
  }, [user, orderId]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-800'
      case 'confirmed':
        return 'bg-blue-100 text-blue-800'
      case 'picked_up':
        return 'bg-purple-100 text-purple-800'
      case 'delivered':
        return 'bg-green-100 text-green-800'
      case 'cancelled':
        return 'bg-red-100 text-red-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  const getStatusLabel = (status: string) => {
    return status.charAt(0).toUpperCase() + status.slice(1).replace('_', ' ')
  }

  const getPaymentStatusColor = (status: string) => {
    switch (status) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-800'
      case 'processing':
        return 'bg-blue-100 text-blue-800'
      case 'succeeded':
        return 'bg-green-100 text-green-800'
      case 'failed':
        return 'bg-red-100 text-red-800'
      case 'refunded':
        return 'bg-gray-100 text-gray-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  const getPaymentStatusLabel = (status: string) => {
    const labels: { [key: string]: string } = {
      pending: 'Payment Pending',
      processing: 'Processing Payment',
      succeeded: 'Payment Successful',
      failed: 'Payment Failed',
      refunded: 'Payment Refunded'
    }
    return labels[status] || status.charAt(0).toUpperCase() + status.slice(1)
  }

  if (loading || !order) {
    return (
      <div className="min-h-screen bg-[#F5F2EB] pt-24">
        <div className="container mx-auto px-4">
          <div className="animate-pulse">
            <div className="h-8 bg-white/50 rounded w-1/4 mb-8"></div>
            <div className="space-y-4">
              <div className="h-64 bg-white/50 rounded-lg"></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F5F2EB] pt-24 relative">
      {/* Mock Map Background */}
      <div className="absolute inset-0 pt-24 bg-gray-200">
        <img 
          src="https://api.mapbox.com/styles/v1/mapbox/streets-v11/static/pin-s+2A9D8F(-73.9229,40.7594),pin-s+E76F51(-73.9265,40.7614)/-73.9247,40.7604,14/800x600@2x?access_token=YOUR_MAPBOX_TOKEN" 
          alt="Map showing delivery route"
          className="w-full h-full object-cover"
        />
      </div>

      {/* Floating Order Panel */}
      <div className="absolute left-8 top-32 w-full max-w-lg bg-white/95 backdrop-blur-sm rounded-lg shadow-xl">
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h1 className="text-2xl font-bold text-[#2D3748]">
              Order #{order.id.slice(-6)}
            </h1>
            <button
              onClick={() => router.back()}
              className="p-2 text-[#4A5568] hover:text-[#2D3748] rounded-full hover:bg-[#2A9D8F]/5"
            >
              <XMarkIcon className="w-6 h-6" />
            </button>
          </div>

          <div className="space-y-6">
            {/* Status and Time */}
            <div className="flex items-center gap-2">
              <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(order.status)}`}>
                {getStatusLabel(order.status)}
              </span>
              <span className={`px-2 py-1 rounded-full text-xs font-medium ${getPaymentStatusColor(order.payment_status)}`}>
                {getPaymentStatusLabel(order.payment_status)}
              </span>
              <div className="flex items-center gap-1 text-sm text-[#4A5568]">
                <ClockIcon className="w-4 h-4" />
                <time dateTime={order.created}>{formatDateTime(order.created)}</time>
              </div>
            </div>

            {/* Delivery Address */}
            <div>
              <h2 className="font-medium text-[#2D3748] mb-2">Delivery Address</h2>
              <div className="flex items-start gap-2 text-sm text-[#4A5568]">
                <MapPinIcon className="w-4 h-4 mt-0.5 flex-shrink-0" />
                <div>
                  {order.delivery_address ? (
                    <>
                      <p>{order.delivery_address.street_address.filter(Boolean).join(', ')}</p>
                      <p>{order.delivery_address.city}, {order.delivery_address.state} {order.delivery_address.zip_code}</p>
                    </>
                  ) : (
                    <p className="italic">No address available</p>
                  )}
                </div>
              </div>
            </div>

            {/* Order Items */}
            <div className="space-y-4">
              {order.stores.map((store) => (
                <div key={store.store.id}>
                  <div className="flex items-center gap-2 mb-2">
                    <BuildingStorefrontIcon className="w-4 h-4 text-[#2A9D8F]" />
                    <h2 className="font-medium text-[#2D3748]">{store.store.name}</h2>
                  </div>
                  <div className="bg-white/50 rounded-lg p-3">
                    {store.items.map((item) => (
                      <div key={item.id} className="flex justify-between py-1 text-sm">
                        <div className="flex gap-2">
                          <span className="text-[#4A5568] font-medium">{item.quantity}×</span>
                          <span className="text-[#2D3748]">{item.name}</span>
                        </div>
                        <span className="text-[#4A5568]">{formatCurrency(item.price * item.quantity)}</span>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>

            {/* Price Breakdown */}
            <div className="space-y-2 text-sm border-t border-[#2A9D8F]/10 pt-4">
              <div className="flex justify-between items-center">
                <span className="text-[#4A5568]">Subtotal</span>
                <span className="text-[#2D3748]">{formatCurrency(order.stores.reduce((acc, store) => 
                  acc + store.items.reduce((itemAcc, item) => itemAcc + (item.price * item.quantity), 0), 0
                ))}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-[#4A5568]">Tax</span>
                <span className="text-[#2D3748]">{formatCurrency(order.tax_amount || 0)}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-[#4A5568]">Delivery Fee</span>
                <span className="text-[#2D3748]">{formatCurrency(order.delivery_fee)}</span>
              </div>
              <div className="flex justify-between items-center pt-2 border-t border-[#2A9D8F]/10 font-medium">
                <span className="text-[#2D3748]">Total</span>
                <span className="text-[#2D3748]">{formatCurrency(order.total_amount)}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 
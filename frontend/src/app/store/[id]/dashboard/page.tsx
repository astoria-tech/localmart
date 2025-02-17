'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/app/contexts/auth';
import { useStoreRoles } from '@/app/hooks/useStoreRoles';
import { toast } from 'react-hot-toast';
import { config } from '@/config';
import { useRouter } from 'next/navigation';
import { use } from 'react';

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
  customer_name: string;
  customer_phone?: string;
  delivery_address: {
    street_address: string[];
    city: string;
    state: string;
    zip_code: string;
    country: string;
  } | null;
  stores: Store[];
}

const statusColors = {
  pending: 'bg-yellow-100 text-yellow-800',
  confirmed: 'bg-blue-100 text-blue-800',
  picked_up: 'bg-purple-100 text-purple-800',
  delivered: 'bg-green-100 text-green-800',
  cancelled: 'bg-red-100 text-red-800'
};

const statusLabels = {
  pending: 'Pending',
  confirmed: 'Confirmed',
  picked_up: 'Picked Up',
  delivered: 'Delivered',
  cancelled: 'Cancelled'
};

const paymentStatusColors = {
  pending: 'bg-yellow-100 text-yellow-800',
  processing: 'bg-blue-100 text-blue-800',
  succeeded: 'bg-green-100 text-green-800',
  failed: 'bg-red-100 text-red-800',
  refunded: 'bg-gray-100 text-gray-800'
};

const paymentStatusLabels = {
  pending: 'Payment Pending',
  processing: 'Processing',
  succeeded: 'Paid',
  failed: 'Failed',
  refunded: 'Refunded'
};

function formatDateTime(isoString: string) {
  return new Date(isoString).toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: 'numeric',
    hour12: true
  });
}

export default function StoreDashboard({ params }: { params: Promise<{ id: string }> }) {
  const { id: storeId } = use(params);
  const { user } = useAuth();
  const { isAdmin, loading: rolesLoading } = useStoreRoles(storeId);
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => {
    // Only redirect if we're done loading roles, have a user, and we're not an admin
    if (!rolesLoading && user && !isAdmin) {
      router.push(`/store/${storeId}`);
      toast.error("You don't have permission to access this page");
    }
  }, [isAdmin, rolesLoading, router, storeId, user]);

  useEffect(() => {
    const fetchOrders = async () => {
      if (!user?.token || rolesLoading) return; // Don't fetch if still loading roles

      try {
        const response = await fetch(`${config.apiUrl}/api/v0/stores/${storeId}/orders`, {
          headers: {
            'Authorization': `Bearer ${user.token}`,
          },
        });

        if (!response.ok) {
          throw new Error('Failed to fetch orders');
        }

        const data = await response.json();
        setOrders(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to fetch orders');
      } finally {
        setLoading(false);
      }
    };

    if (isAdmin) {
      fetchOrders();
    }
  }, [user, storeId, isAdmin, rolesLoading]);

  const updateOrderStatus = async (orderId: string, newStatus: string) => {
    try {
      const response = await fetch(`${config.apiUrl}/api/v0/orders/${orderId}/status`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${user?.token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ status: newStatus })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || 'Failed to update order status');
      }

      setOrders(currentOrders =>
        currentOrders.map(order =>
          order.id === orderId
            ? { ...order, status: newStatus }
            : order
        )
      );

      toast.success('Order status updated');
    } catch (err) {
      console.error('Status update error:', err);
      toast.error('Failed to update order status');
    }
  };

  if (rolesLoading || loading) {
    return (
      <main className="min-h-screen bg-[#F5F2EB] pt-24">
        <div className="container mx-auto px-4">
          <div className="animate-pulse">
            <div className="h-8 bg-white/50 rounded w-1/4 mb-8"></div>
            <div className="space-y-4">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-16 bg-white/50 rounded-lg"></div>
              ))}
            </div>
          </div>
        </div>
      </main>
    );
  }

  if (error) {
    return (
      <main className="min-h-screen bg-[#F5F2EB] pt-24">
        <div className="container mx-auto px-4">
          <div className="text-center">
            <h2 className="text-2xl font-bold text-[#2D3748]">Error</h2>
            <p className="mt-2 text-[#4A5568]">{error}</p>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#F5F2EB] pt-24">
      <div className="container mx-auto px-4">
        <h1 className="text-3xl font-bold text-[#2D3748] mb-8">Store Orders Dashboard</h1>
        
        <div className="bg-white/80 backdrop-blur-sm rounded-lg shadow-sm overflow-hidden">
          <table className="min-w-full divide-y divide-[#2A9D8F]/10">
            <thead className="bg-[#2A9D8F]/5">
              <tr>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-[#2D3748] uppercase tracking-wider">
                  Order ID
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-[#2D3748] uppercase tracking-wider">
                  Date & Time
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-[#2D3748] uppercase tracking-wider">
                  Customer
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-[#2D3748] uppercase tracking-wider">
                  Phone
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-[#2D3748] uppercase tracking-wider">
                  Delivery Address
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-[#2D3748] uppercase tracking-wider">
                  Status
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-[#2D3748] uppercase tracking-wider">
                  Payment
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-[#2D3748] uppercase tracking-wider">
                  Items
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-[#2D3748] uppercase tracking-wider">
                  Total
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#2A9D8F]/10">
              {orders.map((order) => (
                <tr key={order.id}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-[#2D3748]">
                    #{order.id.slice(-6)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-[#4A5568]">
                    {formatDateTime(order.created)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-[#2D3748]">
                    {order.customer_name}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-[#4A5568]">
                    {order.customer_phone || '-'}
                  </td>
                  <td className="px-6 py-4 text-sm text-[#4A5568]">
                    {order.delivery_address ? (
                      <>
                        <div>
                          {order.delivery_address.street_address.filter(Boolean).join(', ')}
                        </div>
                        <div>
                          {order.delivery_address.city}, {order.delivery_address.state} {order.delivery_address.zip_code}
                        </div>
                      </>
                    ) : (
                      <span className="text-gray-400 italic">No address available</span>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center gap-2">
                      <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${statusColors[order.status as keyof typeof statusColors]}`}>
                        {statusLabels[order.status as keyof typeof statusLabels]}
                      </span>
                      <select
                        value={order.status}
                        onChange={(e) => updateOrderStatus(order.id, e.target.value)}
                        className="text-sm border-[#2A9D8F]/20 rounded-md focus:ring-[#2A9D8F] focus:border-[#2A9D8F]"
                      >
                        {Object.entries(statusLabels).map(([value, label]) => (
                          <option key={value} value={value}>{label}</option>
                        ))}
                      </select>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${paymentStatusColors[order.payment_status as keyof typeof paymentStatusColors]}`}>
                      {paymentStatusLabels[order.payment_status as keyof typeof paymentStatusLabels]}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-sm text-[#4A5568]">
                      {order.stores.map((store) => (
                        <div key={store.store.id} className="mb-2 last:mb-0">
                          {store.items.map((item) => (
                            <div key={item.id} className="ml-4">
                              {item.quantity}x {item.name} (${item.price.toFixed(2)})
                            </div>
                          ))}
                        </div>
                      ))}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-[#2D3748]">
                    ${order.total_amount.toFixed(2)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </main>
  );
} 
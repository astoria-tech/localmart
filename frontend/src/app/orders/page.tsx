'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/app/contexts/auth';
import { toast } from 'react-hot-toast';
import { config } from '@/config';
import { CurrencyDollarIcon, ShoppingBagIcon, ClockIcon, ChartBarIcon } from '@heroicons/react/24/outline';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend } from 'recharts';

interface OrderItem {
  id: string;
  name: string;
  quantity: number;
  price: number;
  store: {
    id: string;
    name: string;
  };
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
  stores: Array<{
    store: {
      id: string;
      name: string;
    };
    items: OrderItem[];
  }>;
}

interface DailyCount {
  date: string;
  timestamp: number;
  [storeId: string]: string | number; // Allow string indexes for store IDs
}

const statusColors = {
  pending: 'bg-yellow-100 text-yellow-800',
  confirmed: 'bg-blue-100 text-blue-800',
  picked_up: 'bg-purple-100 text-purple-800',
  delivered: 'bg-green-100 text-green-800',
  cancelled: 'bg-red-100 text-red-800',
};

const statusLabels = {
  pending: 'Pending',
  confirmed: 'Confirmed',
  picked_up: 'Picked Up',
  delivered: 'Delivered',
  cancelled: 'Cancelled',
};

const paymentStatusColors = {
  pending: 'bg-yellow-100 text-yellow-800',
  processing: 'bg-blue-100 text-blue-800',
  succeeded: 'bg-green-100 text-green-800',
  failed: 'bg-red-100 text-red-800',
  refunded: 'bg-gray-100 text-gray-800',
};

const paymentStatusLabels = {
  pending: 'Pending',
  processing: 'Processing',
  succeeded: 'Succeeded',
  failed: 'Failed',
  refunded: 'Refunded',
};

const formatDateTime = (isoString: string) => {
  // Parse the UTC time string and create a Date object
  const utcDate = new Date(isoString + 'Z'); // Ensure UTC interpretation by appending Z
  
  // Format in local timezone
  return new Intl.DateTimeFormat('en-US', {
    dateStyle: 'medium',
    timeStyle: 'short',
    timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
  }).format(utcDate);
};

function calculateMetrics(orders: Order[]) {
  const totalOrders = orders.length;
  const totalRevenue = orders.reduce((sum, order) => sum + order.total_amount, 0);
  const pendingOrders = orders.filter(order => order.status === 'pending').length;
  const avgOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0;

  return {
    totalOrders,
    totalRevenue,
    pendingOrders,
    avgOrderValue
  };
}

function calculateDailyOrderCounts(orders: Order[]) {
  // Get date range for last 30 days
  const today = new Date();
  const thirtyDaysAgo = new Date(today);
  thirtyDaysAgo.setDate(today.getDate() - 29); // 30 days including today

  // Create array of last 30 days
  const days = Array.from({ length: 30 }, (_, i) => {
    const date = new Date(thirtyDaysAgo);
    date.setDate(thirtyDaysAgo.getDate() + i);
    return date;
  });

  // Get unique stores from all orders
  const storeIds = new Set<string>();
  const storeNames = new Map<string, string>();
  orders.forEach(order => {
    order.stores.forEach(store => {
      storeIds.add(store.store.id);
      storeNames.set(store.store.id, store.store.name);
    });
  });

  // Initialize counts for each day with store-specific counts
  const dailyCounts: DailyCount[] = days.map(date => {
    const baseCount = {
      date: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
      timestamp: date.getTime()
    };

    // Add a count property for each store, initialized to 0
    const storeCounts: { [key: string]: number } = {};
    storeIds.forEach(storeId => {
      storeCounts[storeId] = 0;
    });

    return {
      ...baseCount,
      ...storeCounts
    };
  });

  // Count orders for each day and store
  orders.forEach(order => {
    const orderDate = new Date(order.created);
    const orderDateStr = orderDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    const dayData = dailyCounts.find(d => d.date === orderDateStr);
    
    if (dayData) {
      order.stores.forEach(store => {
        const currentCount = dayData[store.store.id] as number;
        dayData[store.store.id] = currentCount + 1;
      });
    }
  });

  // Convert storeIds to array for consistent ordering
  const storeIdsArray = Array.from(storeIds);

  return {
    data: dailyCounts,
    stores: storeIdsArray.map(id => ({
      id,
      name: storeNames.get(id) || 'Unknown Store'
    }))
  };
}

// Add color generation function
function getStoreColor(index: number, opacity: number = 0.9) {
  const hue = (166 + index * 30) % 360;
  return `hsla(${hue}, 85%, 35%, ${opacity})`;
}

export default function OrdersDashboard() {
  const { user } = useAuth();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const metrics = calculateMetrics(orders);

  useEffect(() => {
    const fetchOrders = async () => {
      try {
        const response = await fetch(`${config.apiUrl}/api/v0/orders`, {
          headers: {
            'Authorization': `Bearer ${user?.token}`,
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

    if (user) {
      fetchOrders();
    }
  }, [user]);

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

  if (loading) {
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
        {/* Header Section */}
        <div className="mb-12">
          <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-8">
            <div>
              <h1 className="text-4xl font-bold text-[#2D3748] mb-2">Orders Dashboard</h1>
              <p className="text-lg text-[#4A5568]">All Orders Overview</p>
            </div>

            {/* Metrics Grid */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              {/* Pending Orders */}
              <div className="bg-white/80 backdrop-blur-sm rounded-lg p-4 shadow-sm">
                <div className="flex items-center gap-3 mb-2">
                  <div className="p-2 bg-[#2A9D8F]/10 rounded-lg">
                    <ClockIcon className="w-5 h-5 text-[#2A9D8F]" />
                  </div>
                  <h3 className="text-sm font-medium text-[#4A5568]">Pending Orders</h3>
                </div>
                <p className="text-2xl font-bold text-[#2D3748]">{metrics.pendingOrders}</p>
              </div>

              {/* Total Orders */}
              <div className="bg-white/80 backdrop-blur-sm rounded-lg p-4 shadow-sm">
                <div className="flex items-center gap-3 mb-2">
                  <div className="p-2 bg-[#2A9D8F]/10 rounded-lg">
                    <ShoppingBagIcon className="w-5 h-5 text-[#2A9D8F]" />
                  </div>
                  <h3 className="text-sm font-medium text-[#4A5568]">Total Orders</h3>
                </div>
                <p className="text-2xl font-bold text-[#2D3748]">{metrics.totalOrders}</p>
              </div>

              {/* Average Order Value */}
              <div className="bg-white/80 backdrop-blur-sm rounded-lg p-4 shadow-sm">
                <div className="flex items-center gap-3 mb-2">
                  <div className="p-2 bg-[#2A9D8F]/10 rounded-lg">
                    <ChartBarIcon className="w-5 h-5 text-[#2A9D8F]" />
                  </div>
                  <h3 className="text-sm font-medium text-[#4A5568]">Avg. Order Value</h3>
                </div>
                <p className="text-2xl font-bold text-[#2D3748]">${metrics.avgOrderValue.toFixed(2)}</p>
              </div>

              {/* Total Revenue */}
              <div className="bg-white/80 backdrop-blur-sm rounded-lg p-4 shadow-sm">
                <div className="flex items-center gap-3 mb-2">
                  <div className="p-2 bg-[#2A9D8F]/10 rounded-lg">
                    <CurrencyDollarIcon className="w-5 h-5 text-[#2A9D8F]" />
                  </div>
                  <h3 className="text-sm font-medium text-[#4A5568]">Total Revenue</h3>
                </div>
                <p className="text-2xl font-bold text-[#2D3748]">${metrics.totalRevenue.toFixed(2)}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Orders Chart */}
        <div className="mb-12">
          <div className="bg-white/80 backdrop-blur-sm rounded-lg p-6 shadow-sm">
            <h2 className="text-xl font-bold text-[#2D3748] mb-6">Daily Orders by Store (Last 30 Days)</h2>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart 
                  data={calculateDailyOrderCounts(orders).data} 
                  margin={{ top: 10, right: 10, left: 0, bottom: 20 }}
                >
                  <XAxis 
                    dataKey="date" 
                    angle={-45}
                    textAnchor="end"
                    height={70}
                    tick={{ fill: '#4A5568', fontSize: 11 }}
                    interval={1}
                  />
                  <YAxis 
                    allowDecimals={false}
                    tick={{ fill: '#4A5568', fontSize: 12 }}
                  />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: 'rgba(255, 255, 255, 0.9)',
                      borderColor: '#2A9D8F',
                      borderRadius: '0.5rem'
                    }}
                    cursor={{ fill: 'rgba(42, 157, 143, 0.1)' }}
                  />
                  <Legend />
                  {calculateDailyOrderCounts(orders).stores.map((store, index) => (
                    <Bar 
                      key={store.id}
                      dataKey={store.id}
                      name={store.name}
                      stackId="stores"
                      fill={getStoreColor(index)}
                      radius={[index === 0 ? 4 : 0, index === 0 ? 4 : 0, 0, 0]}
                    />
                  ))}
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        {/* Orders Table */}
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
              {orders.map((order) => {
                // Get the first store's index for coloring
                const storeIndex = calculateDailyOrderCounts(orders).stores
                  .findIndex(s => s.id === order.stores[0]?.store.id);

                return (
                  <tr 
                    key={order.id}
                    style={{ backgroundColor: getStoreColor(storeIndex, 0.15) }}
                    className="transition-colors hover:bg-white/60"
                  >
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
                            <div className="font-medium text-[#2D3748]">{store.store.name}</div>
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
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </main>
  );
}
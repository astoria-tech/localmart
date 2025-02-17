'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/app/contexts/auth';
import { useStoreRoles } from '@/app/hooks/useStoreRoles';
import { toast } from 'react-hot-toast';
import { config } from '@/config';
import { useRouter } from 'next/navigation';
import { use } from 'react';
import { CurrencyDollarIcon, ShoppingBagIcon, ClockIcon, ChartBarIcon } from '@heroicons/react/24/outline';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';

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

  // Initialize counts for each day
  const dailyCounts = days.map(date => ({
    date: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
    count: 0,
    timestamp: date.getTime() // for sorting
  }));

  // Count orders for each day
  orders.forEach(order => {
    const orderDate = new Date(order.created);
    const orderDateStr = orderDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    const dayData = dailyCounts.find(d => d.date === orderDateStr);
    if (dayData) {
      dayData.count++;
    }
  });

  return dailyCounts;
}

export default function StoreDashboard({ params }: { params: Promise<{ id: string }> }) {
  const { id: storeId } = use(params);
  const { user } = useAuth();
  const { isAdmin, loading: rolesLoading } = useStoreRoles(storeId);
  const [orders, setOrders] = useState<Order[]>([]);
  const [filteredOrders, setFilteredOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [store, setStore] = useState<{ name: string } | null>(null);
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const router = useRouter();

  const metrics = calculateMetrics(orders);

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

  // Fetch store details
  useEffect(() => {
    const fetchStore = async () => {
      try {
        const response = await fetch(`${config.apiUrl}/api/v0/stores/${storeId}`);
        if (!response.ok) {
          throw new Error('Failed to fetch store details');
        }
        const data = await response.json();
        setStore(data);
      } catch (err) {
        console.error('Error fetching store:', err);
        setError(err instanceof Error ? err.message : 'Failed to fetch store details');
      }
    };

    fetchStore();
  }, [storeId]);

  // Filter orders when status filter or search term changes
  useEffect(() => {
    let result = [...orders];
    
    // Apply status filter
    if (statusFilter !== 'all') {
      result = result.filter(order => order.status === statusFilter);
    }
    
    // Apply search filter (on order ID or customer name)
    if (searchTerm) {
      const lowercaseSearch = searchTerm.toLowerCase();
      result = result.filter(order => 
        order.id.toLowerCase().includes(lowercaseSearch) ||
        order.customer_name.toLowerCase().includes(lowercaseSearch)
      );
    }
    
    setFilteredOrders(result);
  }, [orders, statusFilter, searchTerm]);

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
        {/* Header Section */}
        <div className="mb-12">
          <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-8">
            <div>
              {store && (
                <h1 className="text-4xl font-bold text-[#2D3748] mb-2">{store.name}</h1>
              )}
              <p className="text-lg text-[#4A5568]">Vendor Dashboard</p>
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
            <h2 className="text-xl font-bold text-[#2D3748] mb-6">Daily Orders (Last 30 Days)</h2>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={calculateDailyOrderCounts(orders)} margin={{ top: 10, right: 10, left: 0, bottom: 20 }}>
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
                    labelFormatter={(label) => `Orders on ${label}`}
                  />
                  <Bar 
                    dataKey="count" 
                    fill="#2A9D8F"
                    radius={[4, 4, 0, 0]}
                    name="Orders"
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        {/* Filters Section */}
        <div className="mb-8 flex flex-col sm:flex-row gap-4 items-start sm:items-center">
          <h2 className="text-2xl font-bold text-[#2D3748]">Orders</h2>
          <div className="flex-1 flex flex-col sm:flex-row gap-4">
            <div className="flex-1 max-w-xs">
              <input
                type="text"
                placeholder="Search orders..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full px-4 py-2 rounded-lg border border-[#2A9D8F]/20 bg-white focus:ring-2 focus:ring-[#2A9D8F] focus:border-transparent"
              />
            </div>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-4 py-2 rounded-lg border border-[#2A9D8F]/20 bg-white focus:ring-2 focus:ring-[#2A9D8F] focus:border-transparent"
            >
              <option value="all">All Statuses</option>
              {Object.entries(statusLabels).map(([value, label]) => (
                <option key={value} value={value}>{label}</option>
              ))}
            </select>
          </div>
        </div>
        
        {/* Results Summary */}
        <div className="mb-4 text-sm text-[#4A5568]">
          Showing {filteredOrders.length} {filteredOrders.length === 1 ? 'order' : 'orders'}
          {statusFilter !== 'all' && ` with status "${statusLabels[statusFilter as keyof typeof statusLabels]}"`}
          {searchTerm && ` matching "${searchTerm}"`}
        </div>

        {/* Table */}
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
              {filteredOrders.map((order) => (
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
                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${statusColors[order.status as keyof typeof statusColors]}`}>
                      {statusLabels[order.status as keyof typeof statusLabels]}
                    </span>
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
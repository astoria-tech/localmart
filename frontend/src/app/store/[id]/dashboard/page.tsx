'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/app/contexts/auth';
import { useStoreRoles } from '@/app/hooks/useStoreRoles';
import { toast } from 'react-hot-toast';
import { config } from '@/config';
import { useRouter } from 'next/navigation';
import { use } from 'react';
import { CurrencyDollarIcon, ShoppingBagIcon, ClockIcon, ChartBarIcon, MapPinIcon } from '@heroicons/react/24/outline';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import Link from 'next/link';
import { storesApi, ordersApi, Order } from '@/api';

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

interface DailyCount {
  date: string;
  timestamp: number;
  [itemName: string]: string | number; // Allow string indexes for item names
}

const statusColors = {
  pending: 'bg-yellow-100 text-yellow-800',
  confirmed: 'bg-blue-100 text-blue-800',
  picked_up: 'bg-purple-100 text-purple-800',
  delivered: 'bg-green-100 text-green-800',
  cancelled: 'bg-red-100 text-red-800'
};

const statusLabels = {
  pending: 'Pickup Pending',
  confirmed: 'Pickup Confirmed',
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
  try {
    // Replace space with 'T' to make it a valid ISO string if needed
    const fixedIsoString = isoString.replace(' ', 'T');
    
    // Ensure UTC interpretation by appending Z if not present
    const utcString = fixedIsoString.endsWith('Z') ? fixedIsoString : fixedIsoString + 'Z';
    
    const date = new Date(utcString);
    
    return date.toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: 'numeric',
      minute: 'numeric',
      hour12: true,
      timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone
    });
  } catch (error) {
    console.error('Error formatting date:', error);
    return isoString;
  }
}

function calculateMetrics(orders: Order[]) {
  const totalOrders = orders.length;
  const totalRevenue = orders.reduce((sum, order) => sum + order.total_amount, 0);
  const pendingOrders = orders.filter(order => order.status === 'pending').length;
  const avgOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0;

  // Calculate items per order
  const totalItems = orders.reduce((sum, order) => {
    return sum + order.stores[0]?.items.reduce((itemSum, item) => itemSum + item.quantity, 0) || 0;
  }, 0);
  const avgItemsPerOrder = totalOrders > 0 ? totalItems / totalOrders : 0;

  // Calculate popular items
  const itemCounts: { [key: string]: { count: number; revenue: number; name: string } } = {};
  orders.forEach(order => {
    order.stores[0]?.items.forEach(item => {
      if (!itemCounts[item.name]) {
        itemCounts[item.name] = { count: 0, revenue: 0, name: item.name };
      }
      itemCounts[item.name].count += item.quantity;
      itemCounts[item.name].revenue += item.price * item.quantity;
    });
  });

  const popularItems = Object.entries(itemCounts)
    .map(([name, data]) => ({ id: name, ...data }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 5);

  // Calculate week-over-week growth
  const now = new Date();
  const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  const twoWeeksAgo = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000);

  const thisWeekRevenue = orders
    .filter(order => new Date(order.created) >= oneWeekAgo)
    .reduce((sum, order) => sum + order.total_amount, 0);

  const lastWeekRevenue = orders
    .filter(order => {
      const date = new Date(order.created);
      return date >= twoWeeksAgo && date < oneWeekAgo;
    })
    .reduce((sum, order) => sum + order.total_amount, 0);

  const weekOverWeekGrowth = lastWeekRevenue > 0 
    ? ((thisWeekRevenue - lastWeekRevenue) / lastWeekRevenue) * 100 
    : 0;

  return {
    totalOrders,
    totalRevenue,
    pendingOrders,
    avgOrderValue,
    avgItemsPerOrder,
    popularItems,
    weekOverWeekGrowth,
    thisWeekRevenue,
    lastWeekRevenue
  };
}

function getStoreColor(index: number, opacity: number = 0.8) {
  const hue = (166 + index * 30) % 360;
  return `hsla(${hue}, 85%, 35%, ${opacity})`;
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

  // Get unique items from all orders
  const uniqueItems = new Set<string>();
  orders.forEach(order => {
    order.stores[0]?.items.forEach(item => {
      uniqueItems.add(item.name);
    });
  });

  // Initialize counts for each day
  const dailyCounts: DailyCount[] = days.map(date => {
    const baseCount = {
      date: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
      timestamp: date.getTime()
    };

    // Add a count property for each unique item, initialized to 0
    const itemCounts: { [key: string]: number } = {};
    uniqueItems.forEach(itemName => {
      itemCounts[itemName] = 0;
    });

    return {
      ...baseCount,
      ...itemCounts
    };
  });

  // Count items for each day
  orders.forEach(order => {
    const orderDate = new Date(order.created);
    const orderDateStr = orderDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    const dayData = dailyCounts.find(d => d.date === orderDateStr);
    
    if (dayData) {
      order.stores[0]?.items.forEach(item => {
        dayData[item.name] = (dayData[item.name] as number || 0) + item.quantity;
      });
    }
  });

  // Sort dailyCounts by timestamp to ensure chronological order
  dailyCounts.sort((a, b) => a.timestamp - b.timestamp);

  return {
    data: dailyCounts,
    items: Array.from(uniqueItems)
  };
}

// Helper function to safely format dates
const safeFormatTime = (dateString: string) => {
  try {
    // Replace space with 'T' to make it a valid ISO string if needed
    const fixedDateString = dateString.replace(' ', 'T');
    
    // Ensure UTC interpretation by appending Z if not present
    const utcString = fixedDateString.endsWith('Z') ? fixedDateString : fixedDateString + 'Z';
    
    return new Date(utcString).toLocaleTimeString([], {
      hour: '2-digit', 
      minute: '2-digit',
      timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone
    });
  } catch (error) {
    console.error('Error formatting date:', error);
    return dateString;
  }
};

// Function to determine if a date is today
const isToday = (dateString: string) => {
  try {
    // Replace space with 'T' to make it a valid ISO string if needed
    const fixedDateString = dateString.replace(' ', 'T');
    
    // Ensure UTC interpretation by appending Z if not present
    const utcString = fixedDateString.endsWith('Z') ? fixedDateString : fixedDateString + 'Z';
    
    const date = new Date(utcString);
    const today = new Date();
    
    return date.getDate() === today.getDate() &&
      date.getMonth() === today.getMonth() &&
      date.getFullYear() === today.getFullYear();
  } catch (error) {
    console.error('Error checking if date is today:', error);
    return false;
  }
};

// Function to determine if a date is tomorrow
const isTomorrow = (dateString: string) => {
  try {
    // Replace space with 'T' to make it a valid ISO string if needed
    const fixedDateString = dateString.replace(' ', 'T');
    
    // Ensure UTC interpretation by appending Z if not present
    const utcString = fixedDateString.endsWith('Z') ? fixedDateString : fixedDateString + 'Z';
    
    const date = new Date(utcString);
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    return date.getDate() === tomorrow.getDate() &&
      date.getMonth() === tomorrow.getMonth() &&
      date.getFullYear() === tomorrow.getFullYear();
  } catch (error) {
    console.error('Error checking if date is tomorrow:', error);
    return false;
  }
};

export default function StoreDashboard({ params }: { params: Promise<{ id: string }> }) {
  const { id: storeId } = use(params);
  const { user } = useAuth();
  const { isAdmin, loading: rolesLoading } = useStoreRoles(storeId);
  const [orders, setOrders] = useState<Order[]>([]);
  const [filteredOrders, setFilteredOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [store, setStore] = useState<{ name: string, latitude?: number, longitude?: number } | null>(null);
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [selectedStatuses, setSelectedStatuses] = useState<Set<string>>(new Set(Object.keys(statusLabels)));
  const [searchTerm, setSearchTerm] = useState('');
  const [geocoding, setGeocoding] = useState(false);
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
      if (!user?.token) return;

      try {
        const orders = await storesApi.getStoreOrders(user.token, storeId);
        setOrders(orders);
      } catch (error) {
        console.error('Error fetching orders:', error);
        setError(error instanceof Error ? error.message : 'Failed to fetch orders');
      }
    };

    const fetchStore = async () => {
      try {
        const store = await storesApi.getStore(storeId);
        setStore(store);
      } catch (error) {
        console.error('Error fetching store:', error);
        setError(error instanceof Error ? error.message : 'Failed to fetch store');
      } finally {
        setLoading(false);
      }
    };

    if (isAdmin) {
      fetchOrders();
      fetchStore();
    }
  }, [storeId, isAdmin, user]);

  // Toggle status filter
  const toggleStatus = (status: string) => {
    setSelectedStatuses(prev => {
      const newSet = new Set(prev);
      if (newSet.has(status)) {
        newSet.delete(status);
      } else {
        newSet.add(status);
      }
      return newSet;
    });
  };

  // Select/deselect all statuses
  const toggleAll = (select: boolean) => {
    setSelectedStatuses(new Set(select ? Object.keys(statusLabels) : []));
  };

  // Update filter effect
  useEffect(() => {
    let result = [...orders];
    
    // Apply status filter
    if (selectedStatuses.size < Object.keys(statusLabels).length) {
      result = result.filter(order => selectedStatuses.has(order.status));
    }
    
    // Apply search filter (on order ID or customer name)
    if (searchTerm) {
      const lowercaseSearch = searchTerm.toLowerCase();
      result = result.filter(order => 
        order.id.toLowerCase().includes(lowercaseSearch) ||
        order.delivery_address?.customer_name?.toLowerCase().includes(lowercaseSearch) || false
      );
    }
    
    setFilteredOrders(result);
  }, [orders, selectedStatuses, searchTerm]);

  const handleGeocodeAddress = async () => {
    if (!user?.token) return;
    
    setGeocoding(true);
    try {
      const updatedStore = await storesApi.geocodeStoreAddress(user.token, storeId);
      setStore(prev => ({
        ...prev!,
        latitude: updatedStore.latitude,
        longitude: updatedStore.longitude
      }));
      toast.success('Store address geocoded successfully');
    } catch (error) {
      console.error('Error geocoding store address:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to geocode store address');
    } finally {
      setGeocoding(false);
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
        {/* Header Section */}
        <div className="mb-12">
          <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-8">
            <div>
              {store && (
                <Link href={`/store/${storeId}`}>
                  <h1 className="text-4xl font-bold text-[#2D3748] mb-2 hover:text-[#2A9D8F] transition-colors">{store.name}</h1>
                </Link>
              )}
              <div className="flex items-center gap-4">
                <p className="text-lg text-[#4A5568]">Vendor Dashboard</p>
                <Link
                  href={`/store/${storeId}/inventory`}
                  className="text-[#2A9D8F] hover:text-[#40B4A6] transition-colors text-sm flex items-center gap-1"
                >
                  <span>Manage Inventory</span>
                  <ChartBarIcon className="w-4 h-4" />
                </Link>
                <button
                  onClick={handleGeocodeAddress}
                  disabled={geocoding}
                  className="text-[#2A9D8F] hover:text-[#40B4A6] transition-colors text-sm flex items-center gap-1 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <span>{geocoding ? 'Geocoding...' : 'Update Store Coordinates'}</span>
                  <MapPinIcon className="w-4 h-4" />
                </button>
              </div>
              {store?.latitude && store?.longitude && (
                <p className="text-sm text-[#4A5568] mt-1">
                  Store coordinates: {Number(store.latitude).toFixed(6)}, {Number(store.longitude).toFixed(6)}
                </p>
              )}
            </div>

            {/* Key Metrics Grid */}
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

        {/* New Insights Sections */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-12">
          {/* Popular Items */}
          <div className="bg-white/80 backdrop-blur-sm rounded-lg p-6 shadow-sm">
            <h2 className="text-xl font-bold text-[#2D3748] mb-4">Top Selling Items</h2>
            <div className="divide-y divide-[#2A9D8F]/10">
              {metrics.popularItems.map((item, index) => (
                <div key={item.id} className="py-4 first:pt-0 last:pb-0">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <span className="text-lg font-bold text-[#2A9D8F]">#{index + 1}</span>
                      <div>
                        <p className="font-medium text-[#2D3748]">{item.name}</p>
                        <p className="text-sm text-[#4A5568]">{item.count} units sold</p>
                      </div>
                    </div>
                    <p className="font-medium text-[#2D3748]">${item.revenue.toFixed(2)}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Daily Orders Chart */}
          <div className="bg-white/80 backdrop-blur-sm rounded-lg p-6 shadow-sm">
            <h2 className="text-xl font-bold text-[#2D3748] mb-6">Daily Orders (Last 30 Days)</h2>
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
                  {calculateDailyOrderCounts(orders).items.map((itemName, index) => (
                    <Bar 
                      key={itemName}
                      dataKey={itemName}
                      name={itemName}
                      stackId="items"
                      fill={getStoreColor(index)}
                    />
                  ))}
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        {/* Orders Table Title */}
        <h2 className="text-2xl font-bold text-[#2D3748] mb-6">All Orders</h2>

        {/* Filters Section */}
        <div className="mb-8">
          <div className="bg-white/80 backdrop-blur-sm rounded-lg p-6 shadow-sm">
            <div className="flex flex-col sm:flex-row gap-6">
              {/* Status Filter */}
              <div className="flex-1">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-sm font-medium text-[#2D3748]">Filter by Status</h3>
                  <div className="flex gap-3">
                    <button
                      onClick={() => toggleAll(true)}
                      className="text-xs text-[#2A9D8F] hover:text-[#40B4A6] transition-colors"
                    >
                      Select All
                    </button>
                    <button
                      onClick={() => toggleAll(false)}
                      className="text-xs text-[#2A9D8F] hover:text-[#40B4A6] transition-colors"
                    >
                      Clear All
                    </button>
                  </div>
                </div>
                <div className="flex flex-wrap gap-3">
                  {Object.entries(statusLabels).map(([value, label]) => (
                    <label
                      key={value}
                      className={`
                        flex items-center gap-2 px-3 py-2 rounded-lg border cursor-pointer transition-all
                        ${selectedStatuses.has(value) 
                          ? 'border-[#2A9D8F] bg-[#2A9D8F]/5 text-[#2D3748]' 
                          : 'border-[#2A9D8F]/20 bg-white/50 text-[#4A5568]'
                        }
                        hover:border-[#2A9D8F] hover:bg-[#2A9D8F]/5
                      `}
                    >
                      <input
                        type="checkbox"
                        checked={selectedStatuses.has(value)}
                        onChange={() => toggleStatus(value)}
                        className="h-4 w-4 rounded border-[#2A9D8F]/20 text-[#2A9D8F] focus:ring-[#2A9D8F]"
                      />
                      <span className="text-sm whitespace-nowrap">{label}</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Search */}
              <div className="sm:w-72">
                <h3 className="text-sm font-medium text-[#2D3748] mb-3">Search Orders</h3>
                <input
                  type="text"
                  placeholder="Search by order ID or customer..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full px-4 py-2 rounded-lg border border-[#2A9D8F]/20 bg-white focus:ring-2 focus:ring-[#2A9D8F] focus:border-transparent"
                />
              </div>
            </div>
          </div>
        </div>
        
        {/* Results Summary */}
        <div className="mb-4 text-sm text-[#4A5568]">
          Showing {filteredOrders.length} {filteredOrders.length === 1 ? 'order' : 'orders'}
          {selectedStatuses.size < Object.keys(statusLabels).length && 
            ` with status${selectedStatuses.size === 1 ? '' : 'es'}: ${Array.from(selectedStatuses).map(s => statusLabels[s as keyof typeof statusLabels]).join(', ')}`}
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
                  Scheduled Delivery
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
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-[#4A5568]">
                    {order.scheduled_delivery_start && order.scheduled_delivery_end ? (
                      <div className="flex items-center gap-1">
                        {isToday(order.scheduled_delivery_start) ? (
                          <span className="px-1.5 py-0.5 bg-green-100 text-green-800 rounded-full text-xs font-medium">Same Day</span>
                        ) : isTomorrow(order.scheduled_delivery_start) ? (
                          <span className="px-1.5 py-0.5 bg-blue-100 text-blue-800 rounded-full text-xs font-medium">Next Day</span>
                        ) : null}
                        <span>
                          {safeFormatTime(order.scheduled_delivery_start)} - {safeFormatTime(order.scheduled_delivery_end)}
                        </span>
                      </div>
                    ) : (
                      '-'
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-[#2D3748]">
                    {order.delivery_address?.customer_name || '-'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-[#4A5568]">
                    {order.delivery_address?.customer_phone || '-'}
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
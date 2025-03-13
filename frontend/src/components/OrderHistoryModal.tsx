'use client';

import { Dialog, Transition } from '@headlessui/react'
import { Fragment, useState, useEffect } from 'react'
import { formatCurrency } from '@/utils/currency'
import { ClockIcon, CalendarIcon } from '@heroicons/react/24/outline'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/app/contexts/auth'
import { toast } from 'react-hot-toast'
import { ordersApi, Order } from '@/api'

interface OrderHistoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  orders: Order[];
}

const formatDateTime = (isoString: string) => {
  try {
    // Replace space with 'T' to make it a valid ISO string if needed
    const fixedIsoString = isoString.replace(' ', 'T');
    
    // Ensure UTC interpretation by appending Z if not present
    const utcString = fixedIsoString.endsWith('Z') ? fixedIsoString : fixedIsoString + 'Z';
    
    // Parse the UTC time string and create a Date object
    const date = new Date(utcString);
    
    // Format in local timezone
    return new Intl.DateTimeFormat('en-US', {
      dateStyle: 'medium',
      timeStyle: 'short',
      timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    }).format(date);
  } catch (error) {
    console.error('Error formatting date:', error);
    return isoString; // Return the original string if formatting fails
  }
};

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

export default function OrderHistoryModal({ isOpen, onClose, orders }: OrderHistoryModalProps) {
  const router = useRouter();
  const { user } = useAuth();
  const [userOrders, setUserOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchOrders = async () => {
      if (!user?.token) return;

      try {
        const data = await ordersApi.getUserOrders(user.token);
        setUserOrders(data);
      } catch (error) {
        console.error('Error fetching orders:', error);
        toast.error('Failed to load orders');
      } finally {
        setLoading(false);
      }
    };

    if (isOpen && user) {
      fetchOrders();
    }
  }, [isOpen, user]);

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

  const handleOrderClick = (orderId: string) => {
    onClose();
    router.push(`/orders/${orderId}`);
  };

  return (
    <Transition appear show={isOpen} as={Fragment}>
      <Dialog as="div" className="relative z-50" onClose={onClose}>
        <Transition.Child
          as={Fragment}
          enter="ease-out duration-300"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-200"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-[#2D3748] bg-opacity-75 backdrop-blur-sm" />
        </Transition.Child>

        <div className="fixed inset-0 overflow-y-auto">
          <div className="flex min-h-full items-center justify-center p-4 text-center">
            <Transition.Child
              as={Fragment}
              enter="ease-out duration-300"
              enterFrom="opacity-0 scale-95"
              enterTo="opacity-100 scale-100"
              leave="ease-in duration-200"
              leaveFrom="opacity-100 scale-100"
              leaveTo="opacity-0 scale-95"
            >
              <Dialog.Panel className="w-full max-w-3xl transform overflow-hidden rounded-2xl bg-[#F5F2EB] p-6 text-left align-middle shadow-xl transition-all">
                <Dialog.Title
                  as="h3"
                  className="text-2xl font-bold text-[#2D3748] mb-6"
                >
                  Your Orders
                </Dialog.Title>

                {loading ? (
                  <div className="space-y-4">
                    {[1, 2, 3].map((i) => (
                      <div key={i} className="animate-pulse">
                        <div className="h-32 bg-white/50 rounded-lg"></div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="space-y-4">
                    {userOrders.map((order) => (
                      <div
                        key={order.id}
                        onClick={() => handleOrderClick(order.id)}
                        className="bg-white/80 backdrop-blur-sm rounded-lg p-6 hover:shadow-md transition-all cursor-pointer"
                      >
                        <div className="flex items-center justify-between">
                          <div>
                            <div className="flex items-center gap-2">
                              <p className="font-medium text-[#2D3748]">Order #{order.id.slice(-6)}</p>
                              <span
                                className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(order.status)}`}
                              >
                                {getStatusLabel(order.status)}
                              </span>
                              <span
                                className={`px-2 py-1 rounded-full text-xs font-medium ${getPaymentStatusColor(order.payment_status)}`}
                              >
                                {getPaymentStatusLabel(order.payment_status)}
                              </span>
                            </div>
                            <div className="flex items-center gap-2 mt-1 text-sm text-[#4A5568]">
                              <ClockIcon className="w-4 h-4" />
                              <time dateTime={order.created}>
                                {formatDateTime(order.created)}
                              </time>
                            </div>
                            {order.scheduled_delivery_start && order.scheduled_delivery_end && (
                              <div className="flex items-center gap-2 mt-1 text-sm text-[#4A5568]">
                                <CalendarIcon className="w-4 h-4" />
                                <div className="flex items-center gap-1">
                                  <span>Scheduled:</span>
                                  {isToday(order.scheduled_delivery_start) ? (
                                    <span className="px-1.5 py-0.5 bg-green-100 text-green-800 rounded-full text-xs font-medium">Same Day</span>
                                  ) : isTomorrow(order.scheduled_delivery_start) ? (
                                    <span className="px-1.5 py-0.5 bg-blue-100 text-blue-800 rounded-full text-xs font-medium">Next Day</span>
                                  ) : null}
                                  <span>
                                    {safeFormatTime(order.scheduled_delivery_start)} - {safeFormatTime(order.scheduled_delivery_end)}
                                  </span>
                                </div>
                              </div>
                            )}
                          </div>
                          <div className="text-right">
                            <p className="text-sm text-[#4A5568]">Total</p>
                            <p className="font-medium text-[#2D3748]">{formatCurrency(order.total_amount)}</p>
                          </div>
                        </div>
                        <div className="mt-2 text-sm text-[#4A5568]">
                          {order.stores.map((store) => (
                            <div key={store.store.id} className="flex items-center gap-1">
                              <span className="font-medium">{store.store.name}</span>
                              <span>•</span>
                              <span>{store.items.length} {store.items.length === 1 ? 'item' : 'items'}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}

                    {userOrders.length === 0 && (
                      <div className="text-center py-8 text-[#4A5568]">
                        <p>No orders found</p>
                      </div>
                    )}
                  </div>
                )}

                <div className="mt-6">
                  <button
                    type="button"
                    className="w-full flex justify-center py-3 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-[#2A9D8F] hover:bg-[#40B4A6] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#2A9D8F]"
                    onClick={onClose}
                  >
                    Close
                  </button>
                </div>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition>
  )
} 
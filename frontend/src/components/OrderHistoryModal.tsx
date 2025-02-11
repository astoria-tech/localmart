'use client';

import { Dialog, Transition } from '@headlessui/react'
import { Fragment } from 'react'
import { formatCurrency } from '@/utils/currency'
import { ClockIcon, MapPinIcon, BuildingStorefrontIcon } from '@heroicons/react/24/outline'

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

interface OrderHistoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  orders: Order[];
}

export default function OrderHistoryModal({ isOpen, onClose, orders }: OrderHistoryModalProps) {
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
                  Order History
                </Dialog.Title>

                <div className="space-y-6">
                  {orders.map((order) => (
                    <div
                      key={order.id}
                      className="bg-white/80 backdrop-blur-sm rounded-lg p-6 hover:shadow-md transition-shadow"
                    >
                      {/* Order Header */}
                      <div className="flex justify-between items-start border-b border-[#2A9D8F]/10 pb-4 mb-4">
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
                        </div>
                      </div>

                      {/* Delivery Address Section */}
                      <div className="mb-4">
                        <h4 className="font-medium text-[#2D3748] mb-2">Delivery Address</h4>
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

                      {/* Order Items by Store */}
                      <div className="space-y-4 border-t border-[#2A9D8F]/10 pt-4">
                        {order.stores.map((store) => (
                          <div key={store.store.id}>
                            <div className="flex items-center gap-2 mb-2">
                              <BuildingStorefrontIcon className="w-4 h-4 text-[#2A9D8F]" />
                              <h4 className="font-medium text-[#2D3748]">{store.store.name}</h4>
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
                      <div className="mt-4 space-y-2 text-sm border-t border-[#2A9D8F]/10 pt-4">
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
                  ))}

                  {orders.length === 0 && (
                    <div className="text-center py-8 text-[#4A5568]">
                      <p>No orders found</p>
                    </div>
                  )}
                </div>

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
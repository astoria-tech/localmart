'use client';

import { Fragment, useState, useEffect } from 'react';
import { Dialog, Transition, RadioGroup } from '@headlessui/react';
import { XMarkIcon, CheckCircleIcon } from '@heroicons/react/24/outline';
import { useCart } from '@/app/contexts/cart';
import { useAuth } from '@/app/contexts/auth';
import { toast } from 'react-hot-toast';
import { useRouter } from 'next/navigation';
import { storesApi, paymentApi, authApi, ordersApi, SavedCard, Store } from '@/api';

interface CheckoutModalProps {
  isOpen: boolean;
  onClose: (success?: boolean) => void;
  store: Store | null;
  savedCards: SavedCard[];
  selectedCardId: string;
  items: any[];
}

// Define delivery time slots between 4pm and 7pm
const DELIVERY_TIME_SLOTS = [
  { id: '1600-1700', label: '4:00 PM - 5:00 PM' },
  { id: '1700-1800', label: '5:00 PM - 6:00 PM' },
  { id: '1800-1900', label: '6:00 PM - 7:00 PM' }
];

export default function CheckoutModal({ 
  isOpen, 
  onClose, 
  store, 
  savedCards, 
  selectedCardId,
  items 
}: CheckoutModalProps) {
  const { clearCart } = useCart();
  const { user } = useAuth();
  const router = useRouter();
  const [isCheckingOut, setIsCheckingOut] = useState(false);
  const [selectedTimeSlot, setSelectedTimeSlot] = useState(DELIVERY_TIME_SLOTS[0].id);
  const [orderSummary, setOrderSummary] = useState<{
    subtotalAmount: number;
    taxAmount: number;
    deliveryFee: number;
    totalAmount: number;
  }>({
    subtotalAmount: 0,
    taxAmount: 0,
    deliveryFee: 0,
    totalAmount: 0
  });

  // Determine if delivery is for today or tomorrow
  const now = new Date();
  const isDeliveryToday = now.getHours() < 15; // Before 3 PM
  const deliveryDate = new Date(now);
  if (!isDeliveryToday) {
    deliveryDate.setDate(deliveryDate.getDate() + 1);
  }
  
  // Format the delivery date for display
  const formattedDeliveryDate = deliveryDate.toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric'
  });

  // Calculate order summary when items change
  useEffect(() => {
    if (items.length > 0) {
      const subtotalAmount = items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
      const taxRate = 0.08875; // Example tax rate (8.875%)
      const taxAmount = subtotalAmount * taxRate;
      const deliveryFee = 5.99; // Example delivery fee
      const totalAmount = subtotalAmount + taxAmount + deliveryFee;

      setOrderSummary({
        subtotalAmount,
        taxAmount,
        deliveryFee,
        totalAmount
      });
    }
  }, [items]);

  const handleCheckout = async () => {
    if (!user || !store || !selectedCardId) return;

    setIsCheckingOut(true);
    try {
      // Get user's profile for delivery address
      const profile = await authApi.getProfile(user.token);

      // Validate delivery address
      if (!profile.street_1 || !profile.city || !profile.state || !profile.zip) {
        toast.error('Please complete your delivery address in your profile');
        onClose();
        router.push('/profile');
        return;
      }

      // Parse the selected time slot to create ISO date strings
      const [startHour, endHour] = selectedTimeSlot.split('-');
      const startDate = new Date(deliveryDate);
      const endDate = new Date(deliveryDate);
      
      startDate.setHours(parseInt(startHour.substring(0, 2)), parseInt(startHour.substring(2)), 0);
      endDate.setHours(parseInt(endHour.substring(0, 2)), parseInt(endHour.substring(2)), 0);

      // Create the order
      const order = await ordersApi.createOrder(user.token, {
        token: user.token,
        user_id: user.id,
        store_id: store.id,
        payment_method_id: selectedCardId,
        items: items.map(item => ({
          store_item_id: item.id,
          quantity: item.quantity,
          price: item.price
        })),
        subtotal_amount: orderSummary.subtotalAmount,
        tax_amount: orderSummary.taxAmount,
        delivery_fee: orderSummary.deliveryFee,
        total_amount: orderSummary.totalAmount,
        scheduled_delivery_start: startDate.toISOString(),
        scheduled_delivery_end: endDate.toISOString(),
        delivery_address: {
          street_address: [profile.street_1].concat(profile.street_2 ? [profile.street_2] : []),
          city: profile.city,
          state: profile.state,
          zip_code: profile.zip,
          country: 'US'
        }
      });

      toast.success('Order placed successfully!');
      clearCart();
      onClose(true);
      router.push(`/orders/${order.order_id}`);
    } catch (error) {
      console.error('Error creating order:', error);
      toast.error('Failed to place order');
      onClose(false);
    } finally {
      setIsCheckingOut(false);
    }
  };

  return (
    <Transition.Root show={isOpen} as={Fragment}>
      <Dialog 
        as="div" 
        className="relative z-50" 
        onClose={() => onClose(false)}
      >
        <Transition.Child
          as={Fragment}
          enter="ease-out duration-300"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-200"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-[#2D3748] bg-opacity-75 transition-opacity backdrop-blur-sm" />
        </Transition.Child>

        <div className="fixed inset-0 z-10 overflow-y-auto">
          <div className="flex min-h-full items-end justify-center p-4 text-center sm:items-center sm:p-0">
            <Transition.Child
              as={Fragment}
              enter="ease-out duration-300"
              enterFrom="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95"
              enterTo="opacity-100 translate-y-0 sm:scale-100"
              leave="ease-in duration-200"
              leaveFrom="opacity-100 translate-y-0 sm:scale-100"
              leaveTo="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95"
            >
              <Dialog.Panel className="relative transform overflow-hidden rounded-lg bg-[#F5F2EB] px-4 pb-4 pt-5 text-left shadow-xl transition-all sm:my-8 sm:w-full sm:max-w-lg sm:p-6">
                <div className="absolute right-0 top-0 hidden pr-4 pt-4 sm:block">
                  <button
                    type="button"
                    className="rounded-md bg-[#F5F2EB] text-[#4A5568] hover:text-[#2D3748] focus:outline-none"
                    onClick={() => onClose(false)}
                  >
                    <span className="sr-only">Close</span>
                    <XMarkIcon className="h-6 w-6" aria-hidden="true" />
                  </button>
                </div>
                
                <div className="sm:flex sm:items-start">
                  <div className="mt-3 text-center sm:ml-4 sm:mt-0 sm:text-left w-full">
                    <Dialog.Title as="h3" className="heading-medium text-[#2D3748]">
                      Complete Your Order
                    </Dialog.Title>
                    
                    {store && (
                      <p className="mt-1 text-[#4A5568] text-sm">
                        from {store.name}
                      </p>
                    )}

                    <div className="mt-6 space-y-6">
                      {/* Order Summary */}
                      <div className="bg-white/80 backdrop-blur-sm rounded-lg p-4 space-y-2">
                        <h4 className="font-medium text-[#2D3748]">Order Summary</h4>
                        <div className="space-y-2 mt-2">
                          {items.map((item) => (
                            <div key={item.id} className="flex justify-between text-sm">
                              <span>{item.name} × {item.quantity}</span>
                              <span>${(item.price * item.quantity).toFixed(2)}</span>
                            </div>
                          ))}
                          <div className="pt-2 border-t border-[#2A9D8F]/10">
                            <div className="flex justify-between text-sm text-[#4A5568]">
                              <span>Subtotal</span>
                              <span>${orderSummary.subtotalAmount.toFixed(2)}</span>
                            </div>
                            <div className="flex justify-between text-sm text-[#4A5568]">
                              <span>Tax (8.875%)</span>
                              <span>${orderSummary.taxAmount.toFixed(2)}</span>
                            </div>
                            <div className="flex justify-between text-sm text-[#4A5568]">
                              <span>Delivery Fee</span>
                              <span>${orderSummary.deliveryFee.toFixed(2)}</span>
                            </div>
                            <div className="flex justify-between text-base font-medium text-[#2D3748] pt-2 border-t border-[#2A9D8F]/10 mt-2">
                              <span>Total</span>
                              <span>${orderSummary.totalAmount.toFixed(2)}</span>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Payment Method */}
                      <div className="bg-white/80 backdrop-blur-sm rounded-lg p-4">
                        <h4 className="font-medium text-[#2D3748]">Payment Method</h4>
                        {savedCards.length > 0 ? (
                          <div className="mt-2">
                            {savedCards.find(card => card.id === selectedCardId) && (
                              <div className="flex items-center space-x-2 text-sm text-[#4A5568]">
                                <span>
                                  {savedCards.find(card => card.id === selectedCardId)?.brand.charAt(0).toUpperCase()}
                                  {savedCards.find(card => card.id === selectedCardId)?.brand.slice(1)} •••• 
                                  {savedCards.find(card => card.id === selectedCardId)?.last4}
                                </span>
                              </div>
                            )}
                          </div>
                        ) : (
                          <p className="mt-2 text-sm text-yellow-800 bg-yellow-50 p-2 rounded">
                            Please add a payment method in your profile before checking out.
                          </p>
                        )}
                      </div>

                      {/* Delivery Time Selection */}
                      <div className="bg-white/80 backdrop-blur-sm rounded-lg p-4">
                        <h4 className="font-medium text-[#2D3748] mb-2">Schedule Delivery Time</h4>
                        
                        <div className="mb-3">
                          <div className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${isDeliveryToday ? 'bg-green-100 text-green-800' : 'bg-blue-100 text-blue-800'}`}>
                            <span className="mr-1">{isDeliveryToday ? 'Same Day' : 'Next Day'}</span>
                            <span>•</span>
                            <span className="ml-1">{formattedDeliveryDate}</span>
                          </div>
                          <p className="text-xs text-[#4A5568] mt-1">
                            {isDeliveryToday 
                              ? 'Orders placed before 3:00 PM are delivered same day.' 
                              : 'Orders placed after 3:00 PM are delivered next day.'}
                          </p>
                        </div>
                        
                        <RadioGroup value={selectedTimeSlot} onChange={setSelectedTimeSlot}>
                          <div className="space-y-2">
                            {DELIVERY_TIME_SLOTS.map((slot) => (
                              <RadioGroup.Option
                                key={slot.id}
                                value={slot.id}
                                className={({ checked }) =>
                                  `relative flex cursor-pointer rounded-lg px-5 py-3 focus:outline-none ${
                                    checked 
                                      ? 'bg-[#2A9D8F]/10 border border-[#2A9D8F]' 
                                      : 'bg-white border border-[#2A9D8F]/20'
                                  }`
                                }
                              >
                                {({ checked }) => (
                                  <>
                                    <div className="flex w-full items-center justify-between">
                                      <div className="flex items-center">
                                        <div className="text-sm">
                                          <RadioGroup.Label
                                            as="p"
                                            className={`font-medium ${
                                              checked ? 'text-[#2A9D8F]' : 'text-[#4A5568]'
                                            }`}
                                          >
                                            {slot.label}
                                          </RadioGroup.Label>
                                        </div>
                                      </div>
                                      {checked && (
                                        <div className="shrink-0 text-[#2A9D8F]">
                                          <CheckCircleIcon className="h-5 w-5" />
                                        </div>
                                      )}
                                    </div>
                                  </>
                                )}
                              </RadioGroup.Option>
                            ))}
                          </div>
                        </RadioGroup>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="mt-5 sm:mt-6 sm:grid sm:grid-flow-row-dense sm:grid-cols-2 sm:gap-3">
                  <button
                    type="button"
                    className="inline-flex w-full justify-center rounded-md bg-[#2A9D8F] px-3 py-2 text-sm font-medium text-white shadow-sm hover:bg-[#40B4A6] focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed sm:col-start-2"
                    onClick={handleCheckout}
                    disabled={isCheckingOut || !selectedCardId}
                  >
                    {isCheckingOut ? 'Processing...' : 'Submit Order'}
                  </button>
                  <button
                    type="button"
                    className="mt-3 inline-flex w-full justify-center rounded-md bg-white px-3 py-2 text-sm font-medium text-[#2D3748] shadow-sm ring-1 ring-inset ring-[#2A9D8F]/20 hover:bg-[#F5F2EB] focus:outline-none sm:col-start-1 sm:mt-0"
                    onClick={() => onClose(false)}
                  >
                    Cancel
                  </button>
                </div>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition.Root>
  );
} 
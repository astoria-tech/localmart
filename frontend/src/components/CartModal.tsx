'use client';

import { Fragment, useEffect, useState } from 'react';
import { Dialog, Transition } from '@headlessui/react';
import { XMarkIcon } from '@heroicons/react/24/outline';
import { useCart } from '@/app/contexts/cart';
import { useAuth } from '@/app/contexts/auth';
import { toast } from 'react-hot-toast';
import { useRouter } from 'next/navigation';
import { storesApi, paymentApi, authApi, ordersApi, SavedCard, Store } from '@/api';
import CheckoutModal from './CheckoutModal';

interface CartModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function CartModal({ isOpen, onClose }: CartModalProps) {
  const { items, updateQuantity, removeItem, totalPrice, clearCart } = useCart();
  const { user } = useAuth();
  const router = useRouter();
  const [store, setStore] = useState<Store | null>(null);
  const [savedCards, setSavedCards] = useState<SavedCard[]>([]);
  const [selectedCardId, setSelectedCardId] = useState<string>('');
  const [showCheckoutModal, setShowCheckoutModal] = useState(false);
  const [isCheckingOut, setIsCheckingOut] = useState(false);
  const [checkoutSuccess, setCheckoutSuccess] = useState(false);

  // Close the cart modal when checkout is successful
  useEffect(() => {
    if (checkoutSuccess) {
      onClose();
    }
  }, [checkoutSuccess, onClose]);

  // Reset checkout state when modal closes
  useEffect(() => {
    if (!isOpen) {
      setShowCheckoutModal(false);
      setIsCheckingOut(false);
      setCheckoutSuccess(false);
    }
  }, [isOpen]);

  // Reset checkout state when items change
  useEffect(() => {
    setShowCheckoutModal(false);
    setIsCheckingOut(false);
  }, [items]);

  // Fetch store details when cart has items
  useEffect(() => {
    const fetchStore = async () => {
      if (items.length > 0) {
        try {
          const storeData = await storesApi.getStore(items[0].store);
          setStore(storeData);
        } catch (error) {
          console.error('Error fetching store:', error);
          toast.error('Failed to load store details');
        }
      }
    };

    fetchStore();
  }, [items]);

  // Fetch saved cards when modal opens
  useEffect(() => {
    const fetchCards = async () => {
      if (!user?.token) return;

      try {
        const cards = await paymentApi.getCards(user.token);
        setSavedCards(cards);
        // Set the default card if available
        const defaultCard = cards.find(card => card.isDefault);
        if (defaultCard) {
          setSelectedCardId(defaultCard.id);
        } else if (cards.length > 0) {
          setSelectedCardId(cards[0].id);
        }
      } catch (error) {
        console.error('Error fetching cards:', error);
        setSavedCards([]);
      }
    };

    if (isOpen && user) {
      fetchCards();
    }
  }, [isOpen, user]);

  const handleCheckoutClick = () => {
    if (!user) {
      toast.error('Please log in to checkout');
      return;
    }

    if (!store) {
      toast.error('Store information not found');
      return;
    }

    if (!selectedCardId) {
      toast.error('Please select a payment method');
      return;
    }

    setShowCheckoutModal(true);
  };

  const handleCheckoutSuccess = () => {
    setCheckoutSuccess(true);
  };

  return (
    <>
      <Transition.Root show={isOpen} as={Fragment}>
        <Dialog as="div" className="relative z-50" onClose={onClose}>
          <Transition.Child
            as={Fragment}
            enter="ease-in-out duration-500"
            enterFrom="opacity-0"
            enterTo="opacity-100"
            leave="ease-in-out duration-500"
            leaveFrom="opacity-100"
            leaveTo="opacity-0"
          >
            <div className="fixed inset-0 bg-[#2D3748] bg-opacity-75 transition-opacity backdrop-blur-sm" />
          </Transition.Child>

          <div className="fixed inset-0 overflow-hidden">
            <div className="absolute inset-0 overflow-hidden">
              <div className="pointer-events-none fixed inset-y-0 right-0 flex max-w-full pl-10">
                <Transition.Child
                  as={Fragment}
                  enter="transform transition ease-in-out duration-500"
                  enterFrom="translate-x-full"
                  enterTo="translate-x-0"
                  leave="transform transition ease-in-out duration-500"
                  leaveFrom="translate-x-0"
                  leaveTo="translate-x-full"
                >
                  <Dialog.Panel className="pointer-events-auto w-screen max-w-md">
                    <div className="flex h-full flex-col overflow-y-scroll bg-[#F5F2EB] shadow-xl">
                      <div className="flex-1 overflow-y-auto px-4 py-6 sm:px-6">
                        <div className="flex items-start justify-between">
                          <div>
                            <Dialog.Title className="heading-medium text-[#2D3748]">
                              Shopping cart
                            </Dialog.Title>
                            {store && (
                              <p className="mt-1 text-[#4A5568] text-sm">
                                at {store.name}
                              </p>
                            )}
                          </div>
                          <div className="ml-3 flex h-7 items-center">
                            <button
                              type="button"
                              className="relative -m-2 p-2 text-[#4A5568] hover:text-[#2D3748]"
                              onClick={onClose}
                            >
                              <span className="absolute -inset-0.5" />
                              <span className="sr-only">Close panel</span>
                              <XMarkIcon className="h-6 w-6" aria-hidden="true" />
                            </button>
                          </div>
                        </div>

                        <div className="mt-8">
                          <div className="flow-root">
                            <ul role="list" className="-my-6 divide-y divide-[#2A9D8F]/10">
                              {items.map((item) => (
                                <li key={item.id} className="flex py-6">
                                  <div className="flex-1 ml-4">
                                    <div className="flex items-start justify-between">
                                      <div>
                                        <h3 className="text-lg font-medium text-[#2D3748] font-display">{item.name}</h3>
                                        <p className="mt-1 body-small text-[#4A5568]">${item.price.toFixed(2)}</p>
                                      </div>
                                      <button
                                        type="button"
                                        onClick={() => removeItem(item.id)}
                                        className="ml-4 body-small font-medium text-[#2A9D8F] hover:text-[#40B4A6]"
                                      >
                                        Remove
                                      </button>
                                    </div>
                                    <div className="mt-4 flex items-center">
                                      <button
                                        type="button"
                                        onClick={() => updateQuantity(item.id, item.quantity - 1)}
                                        className="rounded-md bg-white/80 px-2.5 py-1.5 text-sm font-medium text-[#2D3748] shadow-sm ring-1 ring-inset ring-[#2A9D8F]/20 hover:bg-white hover:ring-[#2A9D8F]/30"
                                      >
                                        -
                                      </button>
                                      <span className="mx-4 text-[#2D3748] font-medium">{item.quantity}</span>
                                      <button
                                        type="button"
                                        onClick={() => updateQuantity(item.id, item.quantity + 1)}
                                        className="rounded-md bg-white/80 px-2.5 py-1.5 text-sm font-medium text-[#2D3748] shadow-sm ring-1 ring-inset ring-[#2A9D8F]/20 hover:bg-white hover:ring-[#2A9D8F]/30"
                                      >
                                        +
                                      </button>
                                    </div>
                                  </div>
                                </li>
                              ))}
                            </ul>
                          </div>
                        </div>
                      </div>

                      <div className="border-t border-[#2A9D8F]/10 bg-white/50 backdrop-blur-sm px-4 py-6 sm:px-6">
                        {/* Payment Method Selection */}
                        {savedCards.length > 0 && (
                          <div className="mb-4">
                            <label htmlFor="payment-method" className="block text-sm font-medium text-[#2D3748] mb-2">
                              Payment Method
                            </label>
                            <select
                              id="payment-method"
                              value={selectedCardId}
                              onChange={(e) => setSelectedCardId(e.target.value)}
                              className="w-full rounded-lg border border-[#2A9D8F]/20 bg-white py-2 px-3 shadow-sm focus:border-[#2A9D8F] focus:outline-none focus:ring-1 focus:ring-[#2A9D8F]"
                            >
                              {savedCards.map((card) => (
                                <option key={card.id} value={card.id}>
                                  {card.brand.charAt(0).toUpperCase() + card.brand.slice(1)} •••• {card.last4}
                                </option>
                              ))}
                            </select>
                          </div>
                        )}

                        {savedCards.length === 0 && (
                          <div className="mb-4 p-4 bg-yellow-50 rounded-lg">
                            <p className="text-sm text-yellow-800">
                              Please add a payment method in your profile before checking out.
                            </p>
                          </div>
                        )}

                        <div className="mb-4">
                          <div className="flex justify-between text-sm text-[#4A5568]">
                            <span>Items Subtotal</span>
                            <span>${totalPrice.toFixed(2)}</span>
                          </div>
                          <p className="mt-1 text-sm text-[#4A5568]">
                            Tax and delivery fee will be calculated at checkout.
                          </p>
                        </div>
                        <button
                          onClick={handleCheckoutClick}
                          disabled={isCheckingOut || items.length === 0 || savedCards.length === 0}
                          className="w-full flex items-center justify-center rounded-md border border-transparent bg-[#2A9D8F] px-6 py-3 text-base font-medium text-white shadow-sm hover:bg-[#40B4A6] active:bg-[#1E7268] disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          {isCheckingOut ? 'Processing...' : 'Go to checkout'}
                        </button>
                      </div>
                    </div>
                  </Dialog.Panel>
                </Transition.Child>
              </div>
            </div>
          </div>
        </Dialog>
      </Transition.Root>

      {/* Checkout Modal */}
      <CheckoutModal
        isOpen={showCheckoutModal}
        onClose={(success) => {
          setShowCheckoutModal(false);
          if (success) {
            handleCheckoutSuccess();
          }
        }}
        store={store}
        savedCards={savedCards}
        selectedCardId={selectedCardId}
        items={items}
      />
    </>
  );
} 
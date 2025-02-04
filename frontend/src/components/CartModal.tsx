'use client';

import { Fragment } from 'react';
import { Dialog, Transition } from '@headlessui/react';
import { XMarkIcon } from '@heroicons/react/24/outline';
import { useCart } from '@/app/contexts/cart';

interface CartModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function CartModal({ isOpen, onClose }: CartModalProps) {
  const { items, updateQuantity, removeItem, totalPrice } = useCart();

  return (
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
                        <Dialog.Title className="heading-medium text-[#2D3748]">
                          Shopping cart
                        </Dialog.Title>
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
                      <div className="flex justify-between text-lg font-medium text-[#2D3748]">
                        <p>Total</p>
                        <p>${totalPrice.toFixed(2)}</p>
                      </div>
                      <p className="mt-0.5 body-small text-[#4A5568]">
                        Shipping and taxes calculated at checkout.
                      </p>
                      <div className="mt-6">
                        <a
                          href="#"
                          className="flex items-center justify-center rounded-md border border-transparent bg-[#2A9D8F] px-6 py-3 text-base font-medium text-white shadow-sm hover:bg-[#40B4A6] active:bg-[#1E7268]"
                        >
                          Checkout
                        </a>
                      </div>
                    </div>
                  </div>
                </Dialog.Panel>
              </Transition.Child>
            </div>
          </div>
        </div>
      </Dialog>
    </Transition.Root>
  );
} 
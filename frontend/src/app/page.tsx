'use client';

import { useState, useEffect } from 'react';
import { useAuth } from './contexts/auth';
import { toast } from 'react-hot-toast';

interface Store {
  id: string;
  name: string;
  street_1: string;
  street_2?: string;
  city: string;
  state: string;
}

interface StoreItem {
  id: string;
  name: string;
  price: number;
}

interface CheckoutDetails {
  item: StoreItem;
  store: Store;
}

interface DeliveryQuote {
  fee: number;
  currency: string;
  estimated_delivery_time: string;
}

// Mock user data
const MOCK_ADDRESS = {
  street: "30-40 21st Street",
  unit: "Apt 4F",
  city: "Astoria",
  state: "NY",
  zip: "11102"
};

// Mock delivery estimate
const MOCK_DELIVERY_FEE = 5.99;
const TAX_RATE = 0.08875; // NYC tax rate

const formatDeliveryTime = (isoTimestamp: string): string => {
  const date = new Date(isoTimestamp);
  return date.toLocaleString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: 'numeric',
    hour12: true
  });
};

async function handlePlaceOrder(
  item: any,
  store: any,
  user: any,
  quoteData: any,
  deliveryAddress: any
) {
  try {
    // Calculate time windows
    const now = new Date()
    const pickupReady = new Date(now.getTime() + 15 * 60000) // 15 minutes from now
    const pickupDeadline = new Date(pickupReady.getTime() + 60 * 60000) // 1 hour after pickup ready
    const dropoffReady = new Date(pickupReady.getTime() + 30 * 60000) // 30 minutes after pickup ready
    const dropoffDeadline = new Date(dropoffReady.getTime() + 60 * 60000) // 1 hour after dropoff ready

    const orderData = {
      user_id: user.id,
      store_id: store.id,
      delivery_address: deliveryAddress,
      subtotal_amount: item.price,
      tax_amount: item.price * 0.08875, // NYC tax rate
      delivery_fee: quoteData.fee,
      total_amount: item.price + (item.price * 0.08875) + quoteData.fee,
      estimated_delivery_time: quoteData.estimated_delivery_time,
      pickup_ready_time: pickupReady.toISOString(),
      pickup_deadline_time: pickupDeadline.toISOString(),
      dropoff_ready_time: dropoffReady.toISOString(),
      dropoff_deadline_time: dropoffDeadline.toISOString(),
      items: [
        {
          store_item_id: item.id,
          name: item.name,
          quantity: 1,
          price: item.price
        }
      ]
    }

    const response = await fetch('/api/v0/orders', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(orderData),
    })

    if (!response.ok) {
      throw new Error('Failed to create order')
    }

    const data = await response.json()
    
    // Show success message and tracking link
    toast.success(
      <div>
        Order placed successfully!{' '}
        <a
          href={data.tracking_url}
          target="_blank"
          rel="noopener noreferrer"
          className="text-blue-600 hover:text-blue-800"
        >
          Track your delivery →
        </a>
      </div>,
      { duration: 10000 }
    )

  } catch (error) {
    console.error('Error placing order:', error)
    toast.error('Failed to place order. Please try again.')
  }
}

export default function Page() {
  const { user, login, signup, logout } = useAuth();
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [isSignup, setIsSignup] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [authError, setAuthError] = useState('');
  const [stores, setStores] = useState<Store[]>([]);
  const [selectedStore, setSelectedStore] = useState<Store | null>(null);
  const [storeItems, setStoreItems] = useState<StoreItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingItems, setLoadingItems] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [itemsError, setItemsError] = useState<string | null>(null);
  const [checkoutItem, setCheckoutItem] = useState<CheckoutDetails | null>(null);
  const [deliveryQuote, setDeliveryQuote] = useState<DeliveryQuote | null>(null);
  const [loadingQuote, setLoadingQuote] = useState(false);
  const [quoteError, setQuoteError] = useState<string | null>(null);

  useEffect(() => {
    const fetchStores = async () => {
      try {
        const response = await fetch('http://localhost:8000/api/v0/stores');
        if (!response.ok) {
          throw new Error('Failed to fetch stores');
        }
        const data = await response.json();
        setStores(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to fetch stores');
      } finally {
        setLoading(false);
      }
    };

    fetchStores();
  }, []);

  useEffect(() => {
    const fetchStoreItems = async () => {
      if (!selectedStore) {
        setStoreItems([]);
        return;
      }

      setLoadingItems(true);
      setItemsError(null);

      try {
        const response = await fetch(`http://localhost:8000/api/v0/stores/${selectedStore.id}/items`);
        if (!response.ok) {
          throw new Error('Failed to fetch store items');
        }
        const data = await response.json();
        setStoreItems(data);
      } catch (err) {
        setItemsError(err instanceof Error ? err.message : 'Failed to fetch store items');
      } finally {
        setLoadingItems(false);
      }
    };

    fetchStoreItems();
  }, [selectedStore]);

  const handleCheckout = async (item: StoreItem) => {
    if (!selectedStore) return;
    
    setCheckoutItem({
      item,
      store: selectedStore
    });

    // Get delivery quote
    setLoadingQuote(true);
    setQuoteError(null);
    try {
      const response = await fetch('http://localhost:8000/api/v0/delivery/quote', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          store_id: selectedStore.id,
          item_id: item.id,
          delivery_address: MOCK_ADDRESS
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to get delivery quote');
      }

      const quote = await response.json();
      setDeliveryQuote(quote);
    } catch (error) {
      console.error('Delivery quote error:', error);
      setQuoteError('Failed to get delivery estimate');
    } finally {
      setLoadingQuote(false);
    }
  };

  const closeCheckoutModal = () => {
    setCheckoutItem(null);
  };

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError('');
    
    try {
      if (isSignup) {
        await signup(email, password, name);
      } else {
        await login(email, password);
      }
      setShowAuthModal(false);
      // Reset form
      setEmail('');
      setPassword('');
      setName('');
    } catch (error) {
      console.error('Auth error:', error);
      if (error instanceof Error) {
        setAuthError(error.message);
      } else {
        setAuthError('Authentication failed. Please try again.');
      }
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center p-8">
      <h1 className="text-3xl font-bold mb-8">Stores</h1>
      
      {loading && (
        <div className="text-gray-600">Loading stores...</div>
      )}

      {error && (
        <div className="text-red-500 mb-4">
          Error: {error}
        </div>
      )}

      {!loading && !error && stores.length === 0 && (
        <div className="text-gray-600">
          No stores found
        </div>
      )}

      <div className="w-full max-w-6xl flex gap-8">
        <div className="w-1/2">
          {stores.length > 0 && (
            <ul className="space-y-4">
              {stores.map((store) => (
                <li 
                  key={store.id}
                  className={`bg-white text-black shadow rounded-lg p-6 hover:shadow-lg transition-shadow cursor-pointer
                    ${selectedStore?.id === store.id ? 'ring-2 ring-blue-500' : ''}`}
                  onClick={() => setSelectedStore(store)}
                >
                  <div className="flex items-center justify-between">
                    <h2 className="text-xl font-semibold">{store.name}</h2>
                    <p className="text-gray-500 text-sm">
                      {store.street_1}
                      {store.street_2 && `, ${store.street_2}`}
                      {`, ${store.city}, ${store.state}`}
                    </p>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="w-1/2">
          {selectedStore && (
            <div>
              <h2 className="text-2xl font-bold mb-4">Items at {selectedStore.name}</h2>
              
              {loadingItems && (
                <div className="text-gray-600">Loading items...</div>
              )}

              {itemsError && (
                <div className="text-red-500 mb-4">
                  Error: {itemsError}
                </div>
              )}

              {!loadingItems && !itemsError && storeItems.length === 0 && (
                <div className="text-gray-600">
                  No items found at this store
                </div>
              )}

              {storeItems.length > 0 && (
                <ul className="space-y-4">
                  {storeItems.map((item) => (
                    <li 
                      key={item.id}
                      className="bg-white text-black shadow rounded-lg p-4 hover:shadow-lg transition-shadow cursor-pointer"
                      onClick={() => handleCheckout(item)}
                    >
                      <div className="flex items-center justify-between">
                        <h3 className="text-lg font-medium">{item.name}</h3>
                        <p className="text-gray-700">${item.price.toFixed(2)}</p>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Checkout Modal */}
      {checkoutItem && (
        <div className="fixed inset-0 text-black bg-black bg-opacity-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg p-6 max-w-md w-full">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold">Quick Checkout</h2>
              <button 
                onClick={closeCheckoutModal}
                className="text-gray-500 hover:text-gray-700"
              >
                ✕
              </button>
            </div>

            <div className="mb-6">
              <h3 className="font-semibold mb-2">Delivery Address</h3>
              <div className="text-black">
                <p>{user ? user.name : 'Guest'}</p>
                <p>{MOCK_ADDRESS.street}</p>
                <p>{MOCK_ADDRESS.unit}</p>
                <p>{MOCK_ADDRESS.city}, {MOCK_ADDRESS.state} {MOCK_ADDRESS.zip}</p>
              </div>
            </div>

            <div className="border-t pt-4">
              <h3 className="font-semibold mb-2">Order Summary</h3>
              <div className="space-y-2">
                <div className="flex justify-between text-black">
                  <span>{checkoutItem.item.name}</span>
                  <span>${checkoutItem.item.price.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-black">
                  <span>Tax ({(TAX_RATE * 100).toFixed(3)}%)</span>
                  <span>${(checkoutItem.item.price * TAX_RATE).toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-black">
                  <span>Delivery Fee</span>
                  {loadingQuote ? (
                    <span>Calculating...</span>
                  ) : quoteError ? (
                    <span className="text-red-500">Error getting quote</span>
                  ) : deliveryQuote ? (
                    <span>${(deliveryQuote.fee / 100).toFixed(2)}</span>
                  ) : (
                    <span>${MOCK_DELIVERY_FEE.toFixed(2)}</span>
                  )}
                </div>
                <div className="border-t pt-2 font-semibold text-black">
                  <div className="flex justify-between">
                    <span>Total</span>
                    <span>
                      ${(
                        checkoutItem.item.price + 
                        (checkoutItem.item.price * TAX_RATE) + 
                        (deliveryQuote ? deliveryQuote.fee / 100 : MOCK_DELIVERY_FEE)
                      ).toFixed(2)}
                    </span>
                  </div>
                </div>
              </div>
              {deliveryQuote && (
                <div className="mt-4 text-sm text-black">
                  Estimated delivery: {formatDeliveryTime(deliveryQuote.estimated_delivery_time)}
                </div>
              )}
            </div>

            <button 
              className="w-full mt-6 bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors"
              onClick={closeCheckoutModal}
            >
              Place Order
            </button>
          </div>
        </div>
      )}

      {/* Auth Modal */}
      {showAuthModal && (
        <div className="fixed text-black inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold">{isSignup ? 'Sign Up' : 'Login'}</h2>
              <button 
                onClick={() => setShowAuthModal(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleAuth} className="space-y-4">
              {isSignup && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Name
                  </label>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                    required
                  />
                </div>
              )}
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Email
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Password
                </label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  required
                />
              </div>

              {authError && (
                <div className="text-red-500 text-sm">
                  {authError}
                </div>
              )}

              <button
                type="submit"
                className="w-full bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors"
              >
                {isSignup ? 'Sign Up' : 'Login'}
              </button>

              <div className="text-center text-sm">
                <button
                  type="button"
                  onClick={() => setIsSignup(!isSignup)}
                  className="text-blue-600 hover:underline"
                >
                  {isSignup ? 'Already have an account? Login' : "Don't have an account? Sign Up"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

'use client';

import { useAuth, useIsAdmin } from '../app/contexts/auth'
import { useCart } from '../app/contexts/cart'
import Link from 'next/link'
import { useState, useEffect } from 'react'
import OrderHistoryModal from './OrderHistoryModal'
import CartModal from './CartModal'
import { ShoppingCartIcon, BuildingStorefrontIcon } from '@heroicons/react/24/outline'
import { config } from '@/config'
import { authApi, ordersApi, Order } from '@/api'

export default function Header() {
  const { user, logout } = useAuth()
  const isAdmin = useIsAdmin()
  const { totalItems } = useCart()
  const [showOrderHistory, setShowOrderHistory] = useState(false)
  const [showCart, setShowCart] = useState(false)
  const [orders, setOrders] = useState<Order[]>([])
  const [firstName, setFirstName] = useState('')

  useEffect(() => {
    const fetchProfile = async () => {
      if (!user?.token) return;

      try {
        const data = await authApi.getProfile(user.token);
        setFirstName(data.first_name || 'there');
      } catch (error) {
        console.error('Error fetching profile:', error);
        setFirstName('there'); // Fallback
      }
    };

    fetchProfile();
  }, [user]);

  const handleShowOrderHistory = async () => {
    if (user) {
      try {
        const data = await ordersApi.getUserOrders(user.token);
        setOrders(data);
        setShowOrderHistory(true);
      } catch (error) {
        console.error('Failed to fetch orders:', error);
      }
    }
  }

  return (
    <header className="fixed top-0 left-0 right-0 bg-[#2A9D8F] text-white p-4 shadow-md z-30">
      <div className="max-w-6xl mx-auto flex justify-between items-center">
        <div className="flex items-center gap-2">
          <Link href="/" className="flex items-center gap-2 group">
            <BuildingStorefrontIcon className="h-7 w-7 text-white/90 group-hover:text-white transition-colors" />
            <span className="text-2xl font-bold font-display text-white">localmart</span>
          </Link>
          <Link
            href="/about"
            className="text-sm text-white/80 hover:text-white transition-colors ml-4"
          >
            About Us
          </Link>
          {user && (
            <>
              {isAdmin && (
                <>
                  <a
                    href={`${config.pocketbaseUrl}/_/`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm text-white/80 hover:text-white transition-colors ml-2"
                  >
                    db
                  </a>
                  <Link
                    href="/orders"
                    className="text-sm text-white/80 hover:text-white transition-colors ml-2"
                  >
                    admin
                  </Link>
                </>
              )}
            </>
          )}
        </div>
        <div className="flex items-center gap-4">
          {user ? (
            <>
              <div className="flex items-center gap-4">
                <Link
                  href="/profile"
                  className="text-sm text-white/80 hover:text-white transition-colors"
                >
                  Hi, {firstName || 'there'}!
                </Link>
                <button
                  onClick={handleShowOrderHistory}
                  className="bg-white/10 backdrop-blur-sm text-white px-4 py-2 rounded-lg hover:bg-white/20 transition-colors"
                >
                  Your Orders
                </button>
                <button
                  onClick={logout}
                  className="bg-white/10 backdrop-blur-sm text-white px-4 py-2 rounded-lg hover:bg-white/20 transition-colors"
                >
                  Logout
                </button>
                <button
                  onClick={() => setShowCart(true)}
                  className="bg-white/10 backdrop-blur-sm text-white p-2 rounded-lg hover:bg-white/20 transition-colors relative"
                >
                  <ShoppingCartIcon className="h-6 w-6" />
                  {totalItems > 0 && (
                    <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs font-bold rounded-full h-5 w-5 flex items-center justify-center">
                      {totalItems}
                    </span>
                  )}
                </button>
              </div>
            </>
          ) : (
            <div className="flex items-center gap-2">
              <Link
                href="/login"
                className="bg-white/10 backdrop-blur-sm text-white px-4 py-2 rounded-lg hover:bg-white/20 transition-colors"
              >
                Login
              </Link>
              <Link
                href="/login?signup=true"
                className="bg-white/90 backdrop-blur-sm text-[#2A9D8F] px-4 py-2 rounded-lg hover:bg-white transition-colors"
              >
                Sign Up
              </Link>
            </div>
          )}
        </div>
      </div>

      <OrderHistoryModal
        isOpen={showOrderHistory}
        onClose={() => setShowOrderHistory(false)}
        orders={orders}
      />

      <CartModal
        isOpen={showCart}
        onClose={() => setShowCart(false)}
      />
    </header>
  )
} 
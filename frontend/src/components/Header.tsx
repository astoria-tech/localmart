'use client';

import { useAuth } from '../app/contexts/auth'
import { useCart } from '../app/contexts/cart'
import Link from 'next/link'
import { useState } from 'react'
import OrderHistoryModal from './OrderHistoryModal'
import CartModal from './CartModal'
import { ShoppingCartIcon } from '@heroicons/react/24/outline'

export default function Header() {
  const { user, logout } = useAuth()
  const { totalItems } = useCart()
  const [showOrderHistory, setShowOrderHistory] = useState(false)
  const [showCart, setShowCart] = useState(false)
  const [orders, setOrders] = useState([])

  const handleShowOrderHistory = async () => {
    if (user) {
      try {
        console.log('User token:', user.token?.slice(0, 20) + '...')  // Log first 20 chars of token
        
        const response = await fetch('http://localhost:8000/api/v0/orders', {
          headers: {
            'Authorization': `Bearer ${user.token}`,
            'Content-Type': 'application/json'
          }
        })
        
        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          console.error('Orders error response:', errorData)  // Log error response
          throw new Error(errorData.detail || 'Failed to fetch orders');
        }
        
        const data = await response.json()
        console.log('Orders fetched:', data)  // Debug log
        setOrders(data)
        setShowOrderHistory(true)
      } catch (error) {
        console.error('Failed to fetch orders:', error)
      }
    }
  }

  return (
    <header className="fixed top-0 left-0 right-0 bg-blue-600 text-white p-4 shadow-md z-50">
      <div className="max-w-6xl mx-auto flex justify-between items-center">
        <div className="flex items-center gap-4">
          <Link href="/" className="text-2xl font-bold">
            localmart
          </Link>
          {user && (
            <a
              href="http://localhost:8090/_/"
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm text-blue-100 hover:text-white transition-colors"
            >
              admin
            </a>
          )}
        </div>
        <div className="flex items-center gap-4">
          {user ? (
            <>
              <span>Welcome, {user.name}!</span>
              <button
                onClick={handleShowOrderHistory}
                className="bg-white text-blue-600 px-4 py-2 rounded-lg hover:bg-blue-50 transition-colors"
              >
                Order History
              </button>
              <button
                onClick={logout}
                className="bg-white text-blue-600 px-4 py-2 rounded-lg hover:bg-blue-50 transition-colors"
              >
                Logout
              </button>
              <button
                onClick={() => setShowCart(true)}
                className="bg-white text-blue-600 p-2 rounded-lg hover:bg-blue-50 transition-colors relative"
              >
                <ShoppingCartIcon className="h-6 w-6" />
                {totalItems > 0 && (
                  <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs font-bold rounded-full h-5 w-5 flex items-center justify-center">
                    {totalItems}
                  </span>
                )}
              </button>
            </>
          ) : (
            <Link
              href="/login"
              className="bg-white text-blue-600 px-4 py-2 rounded-lg hover:bg-blue-50 transition-colors"
            >
              Login / Sign Up
            </Link>
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
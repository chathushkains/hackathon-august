'use client'

import { useState } from 'react'
import { 
  ShoppingCartIcon, 
  XMarkIcon, 
  PlusIcon, 
  MinusIcon,
  TrashIcon
} from '@heroicons/react/24/outline'
import { useCart } from '../contexts/CartContext'
import { useAuth } from '../contexts/AuthContext'
import toast from 'react-hot-toast'

export default function CartSidebar({ isOpen, onClose, onCheckout }) {
  const { cart, removeFromCart, updateQuantity, clearCart, getCartTotal, getCartItemCount } = useCart()
  const { isAuthenticated } = useAuth()
  const [isUpdating, setIsUpdating] = useState(false)


  const handleQuantityChange = async (variantId, newQuantity) => {
    setIsUpdating(true)
    try {
      updateQuantity(variantId, newQuantity)
    } finally {
      setIsUpdating(false)
    }
  }

  const handleRemoveItem = (variantId, title) => {
    removeFromCart(variantId)
    toast.success(`${title} removed from cart`)
  }

  const handleCheckout = () => {
    if (cart.length === 0) {
      toast.error('Your cart is empty')
      return
    }

    if (!isAuthenticated) {
      toast.error('Please sign in to checkout')
      return
    }

    onCheckout()
  }

  const handleClearCart = () => {
    clearCart()
    toast.success('Cart cleared')
  }

  const total = getCartTotal()
  const itemCount = getCartItemCount()

  return (
    <>
      {/* Backdrop */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 z-40"
          onClick={onClose}
        />
      )}

      {/* Sidebar */}
      <div className={`fixed top-0 right-0 h-full w-full max-w-md bg-white shadow-xl transform transition-transform duration-300 ease-in-out z-50 ${
        isOpen ? 'translate-x-0' : 'translate-x-full'
      }`}>
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b">
            <div className="flex items-center space-x-2">
              <ShoppingCartIcon className="w-6 h-6 text-gray-600" />
              <h2 className="text-lg font-semibold text-gray-900">
                Shopping Cart ({itemCount})
              </h2>
            </div>
            <button
              onClick={onClose}
              className="p-2 text-gray-400 hover:text-gray-600 transition-colors"
            >
              <XMarkIcon className="w-6 h-6" />
            </button>
          </div>

          {/* Cart Items */}
          <div className="flex-1 overflow-y-auto p-6">
            {cart.length === 0 ? (
              <div className="text-center py-12">
                <ShoppingCartIcon className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">Your cart is empty</h3>
                <p className="text-gray-500">Add some items to get started!</p>
              </div>
            ) : (
              <div className="space-y-4">
                {cart.map((item) => (
                  <div key={item.variant_id} className="flex items-center space-x-4 p-4 bg-gray-50 rounded-lg">
                    {/* Product Image */}
                    <div className="w-16 h-16 bg-gray-200 rounded-lg flex items-center justify-center flex-shrink-0 overflow-hidden">
                      {item.image ? (
                        <img
                          src={item.image}
                          alt={item.title}
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            e.target.style.display = 'none';
                            e.target.nextSibling.style.display = 'flex';
                          }}
                        />
                      ) : null}
                      <div className="w-full h-full flex items-center justify-center" style={{ display: item.image ? 'none' : 'flex' }}>
                        <ShoppingCartIcon className="w-8 h-8 text-gray-400" />
                      </div>
                    </div>

                    {/* Product Details */}
                    <div className="flex-1 min-w-0">
                      <h3 className="text-sm font-medium text-gray-900 truncate">
                        {item.title}
                      </h3>
                      <p className="text-sm text-gray-500">
                        ${item.price.toFixed(2)} each
                      </p>
                      
                      {/* Quantity Controls */}
                      <div className="flex items-center space-x-2 mt-2">
                        <button
                          onClick={() => handleQuantityChange(item.variant_id, item.quantity - 1)}
                          disabled={isUpdating}
                          className="p-1 text-gray-400 hover:text-gray-600 disabled:opacity-50"
                        >
                          <MinusIcon className="w-4 h-4" />
                        </button>
                        <span className="text-sm font-medium text-gray-900 min-w-[2rem] text-center">
                          {item.quantity}
                        </span>
                        <button
                          onClick={() => handleQuantityChange(item.variant_id, item.quantity + 1)}
                          disabled={isUpdating}
                          className="p-1 text-gray-400 hover:text-gray-600 disabled:opacity-50"
                        >
                          <PlusIcon className="w-4 h-4" />
                        </button>
                      </div>
                    </div>

                    {/* Price and Remove */}
                    <div className="text-right">
                      <p className="text-sm font-medium text-gray-900">
                        ${(item.price * item.quantity).toFixed(2)}
                      </p>
                      <button
                        onClick={() => handleRemoveItem(item.variant_id, item.title)}
                        className="mt-1 p-1 text-red-400 hover:text-red-600 transition-colors"
                      >
                        <TrashIcon className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Footer */}
          {cart.length > 0 && (
            <div className="border-t p-6 space-y-4">
              {/* Total */}
              <div className="flex justify-between items-center">
                <span className="text-lg font-semibold text-gray-900">Total:</span>
                <span className="text-xl font-bold text-rose-500">
                  ${total.toFixed(2)}
                </span>
              </div>

              {/* Action Buttons */}
              <div className="space-y-2">
                <button
                  onClick={handleCheckout}
                  className="w-full bg-rose-500 text-white py-3 px-4 rounded-lg hover:bg-rose-600 transition-colors font-medium"
                >
                  {isAuthenticated ? 'Checkout' : 'Sign in to Checkout'}
                </button>
                
                <button
                  onClick={handleClearCart}
                  className="w-full text-gray-500 hover:text-gray-700 py-2 px-4 rounded-lg transition-colors text-sm"
                >
                  Clear Cart
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  )
}

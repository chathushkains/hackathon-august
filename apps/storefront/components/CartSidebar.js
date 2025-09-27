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
          className="modal-backdrop"
          onClick={onClose}
        />
      )}

      {/* Sidebar */}
      <div className={`sidebar ${
        isOpen ? 'translate-x-0' : 'translate-x-full'
      }`}>
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-gray-100">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-green-100 rounded-lg">
                <ShoppingCartIcon className="w-6 h-6 text-green-600" />
              </div>
              <h2 className="heading-3">
                Shopping Cart ({itemCount})
              </h2>
            </div>
            <button
              onClick={onClose}
              className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-all duration-200"
            >
              <XMarkIcon className="w-6 h-6" />
            </button>
          </div>

          {/* Cart Items */}
          <div className="flex-1 overflow-y-auto p-6">
            {cart.length === 0 ? (
              <div className="text-center py-16">
                <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-6">
                  <ShoppingCartIcon className="w-10 h-10 text-gray-400" />
                </div>
                <h3 className="heading-3 mb-3">Your cart is empty</h3>
                <p className="text-body">Add some amazing products to get started!</p>
              </div>
            ) : (
              <div className="space-y-4">
                {cart.map((item) => (
                  <div key={item.variant_id} className="flex items-center space-x-4 p-4 bg-gray-50 rounded-2xl hover:bg-gray-100 transition-all duration-200">
                    {/* Product Image */}
                    <div className="w-16 h-16 bg-gray-200 rounded-xl flex items-center justify-center flex-shrink-0 overflow-hidden">
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
                      <h3 className="text-sm font-semibold text-gray-900 truncate mb-1">
                        {item.title}
                      </h3>
                      <p className="text-sm text-gray-500 mb-3">
                        ${item.price.toFixed(2)} each
                      </p>
                      
                      {/* Quantity Controls */}
                      <div className="flex items-center space-x-3">
                        <button
                          onClick={() => handleQuantityChange(item.variant_id, item.quantity - 1)}
                          disabled={isUpdating}
                          className="p-2 text-gray-400 hover:text-gray-600 hover:bg-white rounded-lg disabled:opacity-50 transition-all duration-200"
                        >
                          <MinusIcon className="w-4 h-4" />
                        </button>
                        <span className="text-sm font-semibold text-gray-900 min-w-[2rem] text-center bg-white px-3 py-1 rounded-lg">
                          {item.quantity}
                        </span>
                        <button
                          onClick={() => handleQuantityChange(item.variant_id, item.quantity + 1)}
                          disabled={isUpdating}
                          className="p-2 text-gray-400 hover:text-gray-600 hover:bg-white rounded-lg disabled:opacity-50 transition-all duration-200"
                        >
                          <PlusIcon className="w-4 h-4" />
                        </button>
                      </div>
                    </div>

                    {/* Price and Remove */}
                    <div className="text-right">
                      <p className="text-lg font-bold text-black mb-2">
                        ${(item.price * item.quantity).toFixed(2)}
                      </p>
                      <button
                        onClick={() => handleRemoveItem(item.variant_id, item.title)}
                        className="p-2 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all duration-200"
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
            <div className="border-t border-gray-100 p-6 space-y-6">
              {/* Total */}
              <div className="flex justify-between items-center">
                <span className="text-xl font-semibold text-gray-900">Total:</span>
                <span className="text-2xl font-bold text-black">
                  ${total.toFixed(2)}
                </span>
              </div>

              {/* Action Buttons */}
              <div className="space-y-3">
                <button
                  onClick={handleCheckout}
                  className="w-full btn-accent py-4 text-base"
                >
                  {isAuthenticated ? 'Proceed to Checkout' : 'Sign in to Checkout'}
                </button>
                
                <button
                  onClick={handleClearCart}
                  className="w-full btn-ghost py-3 text-sm"
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

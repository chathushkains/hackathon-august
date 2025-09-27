'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { CreditCardIcon, LockClosedIcon } from '@heroicons/react/24/outline';

export default function CheckoutForm({ cartItems, total, onClose, onSuccess }) {
  const { user, isAuthenticated } = useAuth();
  const [formData, setFormData] = useState({
    email: user?.email || '',
    firstName: user?.firstName || '',
    lastName: user?.lastName || '',
    address: '',
    city: '',
    state: '',
    zipCode: '',
    country: 'US',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [isGuest, setIsGuest] = useState(!isAuthenticated);

  useEffect(() => {
    if (user) {
      setFormData(prev => ({
        ...prev,
        email: user.email,
        firstName: user.firstName || '',
        lastName: user.lastName || '',
      }));
    }
  }, [user]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      // Create payment intent
      const paymentResponse = await fetch('http://localhost:9000/payments/create-intent', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          amount: total,
          currency: 'usd',
        }),
      });

      const paymentData = await paymentResponse.json();

      if (!paymentData.success) {
        throw new Error('Failed to create payment intent');
      }

      // Create order
      const orderData = {
        email: formData.email,
        items: cartItems.map(item => ({
          variant_id: item.variant_id,
          quantity: item.quantity,
        })),
        metadata: {
          customer_info: {
            firstName: formData.firstName,
            lastName: formData.lastName,
            address: formData.address,
            city: formData.city,
            state: formData.state,
            zipCode: formData.zipCode,
            country: formData.country,
          },
          payment_intent_id: paymentData.paymentIntentId,
        },
        total_amount: Math.round(total * 100), // Convert to cents
        shipping_address: {
          firstName: formData.firstName,
          lastName: formData.lastName,
          address1: formData.address,
          city: formData.city,
          province: formData.state,
          postal_code: formData.zipCode,
          country_code: formData.country,
        },
      };

      const orderResponse = await fetch('http://localhost:9000/store/checkout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(orderData),
      });

      const orderResult = await orderResponse.json();

      if (!orderResult.success) {
        throw new Error(orderResult.error || 'Failed to create order');
      }

      // Simulate successful payment (in real app, you'd integrate with Stripe Elements)
      setTimeout(() => {
        onSuccess(orderResult.order);
        onClose();
      }, 2000);

    } catch (err) {
      setError(err.message);
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  return (
    <div className="modal-backdrop flex items-center justify-center p-4 z-50">
      <div className="modal-content w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="p-8">
          <div className="flex justify-between items-center mb-8">
            <h2 className="heading-2">Checkout</h2>
            <button
              onClick={onClose}
              className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-all duration-200"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-8">
            {/* Customer Information */}
            <div className="card-elevated">
              <h3 className="heading-3 mb-6">Customer Information</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label htmlFor="firstName" className="block text-sm font-semibold text-gray-700 mb-3">
                    First name
                  </label>
                  <input
                    type="text"
                    id="firstName"
                    name="firstName"
                    value={formData.firstName}
                    onChange={handleChange}
                    required
                    className="input-modern"
                  />
                </div>
                <div>
                  <label htmlFor="lastName" className="block text-sm font-semibold text-gray-700 mb-3">
                    Last name
                  </label>
                  <input
                    type="text"
                    id="lastName"
                    name="lastName"
                    value={formData.lastName}
                    onChange={handleChange}
                    required
                    className="input-modern"
                  />
                </div>
              </div>
              <div className="mt-6">
                <label htmlFor="email" className="block text-sm font-semibold text-gray-700 mb-3">
                  Email address
                </label>
                <input
                  type="email"
                  id="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  required
                  className="input-modern"
                />
              </div>
            </div>

            {/* Shipping Address */}
            <div className="card-elevated">
              <h3 className="heading-3 mb-6">Shipping Address</h3>
              <div className="space-y-6">
                <div>
                  <label htmlFor="address" className="block text-sm font-semibold text-gray-700 mb-3">
                    Street address
                  </label>
                  <input
                    type="text"
                    id="address"
                    name="address"
                    value={formData.address}
                    onChange={handleChange}
                    required
                    className="input-modern"
                  />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div>
                    <label htmlFor="city" className="block text-sm font-semibold text-gray-700 mb-3">
                      City
                    </label>
                    <input
                      type="text"
                      id="city"
                      name="city"
                      value={formData.city}
                      onChange={handleChange}
                      required
                      className="input-modern"
                    />
                  </div>
                  <div>
                    <label htmlFor="state" className="block text-sm font-semibold text-gray-700 mb-3">
                      State
                    </label>
                    <input
                      type="text"
                      id="state"
                      name="state"
                      value={formData.state}
                      onChange={handleChange}
                      required
                      className="input-modern"
                    />
                  </div>
                  <div>
                    <label htmlFor="zipCode" className="block text-sm font-semibold text-gray-700 mb-3">
                      ZIP code
                    </label>
                    <input
                      type="text"
                      id="zipCode"
                      name="zipCode"
                      value={formData.zipCode}
                      onChange={handleChange}
                      required
                      className="input-modern"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Payment Information */}
            <div className="card-elevated">
              <h3 className="heading-3 mb-6">Payment Information</h3>
              <div className="bg-gray-50 rounded-2xl p-8">
                <div className="flex items-center justify-center space-x-3 text-gray-600">
                  <CreditCardIcon className="w-6 h-6" />
                  <span className="text-sm font-medium">Payment will be processed securely with Stripe</span>
                  <LockClosedIcon className="w-4 h-4" />
                </div>
                <p className="text-xs text-gray-500 text-center mt-3">
                  This is a demo. No real payment will be processed.
                </p>
              </div>
            </div>

            {/* Order Summary */}
            <div className="card-elevated">
              <h3 className="heading-3 mb-6">Order Summary</h3>
              <div className="space-y-4">
                {cartItems.map((item, index) => (
                  <div key={index} className="flex justify-between items-center py-3 border-b border-gray-100 last:border-b-0">
                    <div>
                      <span className="font-medium text-gray-900">{item.title}</span>
                      <span className="text-gray-500 text-sm ml-2">x {item.quantity}</span>
                    </div>
                    <span className="font-semibold text-gray-900">${(item.price * item.quantity).toFixed(2)}</span>
                  </div>
                ))}
                <div className="border-t border-gray-200 pt-4 flex justify-between items-center">
                  <span className="text-xl font-semibold text-gray-900">Total</span>
                  <span className="text-2xl font-bold text-black">${total.toFixed(2)}</span>
                </div>
              </div>
            </div>

            {error && (
              <div className="bg-red-50 border border-red-200 text-red-600 px-6 py-4 rounded-2xl text-sm font-medium">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full btn-accent py-4 text-lg disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
            >
              {loading ? (
                <div className="loading-spinner" />
              ) : (
                <>
                  <LockClosedIcon className="w-5 h-5 mr-3" />
                  Complete Order - ${total.toFixed(2)}
                </>
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}

'use client'

import { useState, useEffect } from 'react'
import { 
  ShoppingCartIcon, 
  CurrencyDollarIcon, 
  ExclamationTriangleIcon,
  ChartBarIcon
} from '@heroicons/react/24/outline'
import { useSocket } from '../hooks/useSocket'
import { io } from 'socket.io-client'

export default function AdminDashboard() {
  const [stats, setStats] = useState({
    totalOrders: 0,
    totalRevenue: 0,
    activeOrders: 0,
    inventoryAlerts: []
  })
  const [recentOrders, setRecentOrders] = useState([])
  const [recentAlerts, setRecentAlerts] = useState([])
  const [selectedOrder, setSelectedOrder] = useState(null)
  const [showOrderDetails, setShowOrderDetails] = useState(false)

  const { connected } = useSocket()

  useEffect(() => {
    // Fetch initial stats and orders
    fetchStats()
    fetchOrders()
    
    // Set up real-time updates
    const socket = io('http://localhost:4003')
    
    socket.on('connect', () => {
      socket.emit('join_admin')
    })

    socket.on('stats_update', (newStats) => {
      setStats(newStats)
    })

    socket.on('order_completed', (order) => {
      setRecentOrders(prev => [order, ...prev.slice(0, 9)])
    })

    socket.on('order_failed', (order) => {
      setRecentOrders(prev => [order, ...prev.slice(0, 9)])
    })

    socket.on('inventory_alert', (alert) => {
      setRecentAlerts(prev => [alert, ...prev.slice(0, 9)])
    })

    return () => {
      socket.disconnect()
    }
  }, [])

  const fetchStats = async () => {
    try {
      const response = await fetch('http://localhost:4003/stats')
      const data = await response.json()
      setStats(data)
    } catch (error) {
      console.error('Error fetching stats:', error)
    }
  }

  const fetchOrders = async () => {
    try {
      const response = await fetch('http://localhost:4003/orders?limit=20')
      const data = await response.json()
      setRecentOrders(data.orders)
    } catch (error) {
      console.error('Error fetching orders:', error)
    }
  }

  const handleOrderClick = (order) => {
    setSelectedOrder(order)
    setShowOrderDetails(true)
  }

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount)
  }

  const formatTimestamp = (timestamp) => {
    return new Date(timestamp).toLocaleString()
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <h1 className="text-3xl font-bold text-gray-900">Admin Dashboard</h1>
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <div className={`w-3 h-3 rounded-full ${connected ? 'bg-green-500' : 'bg-red-500'}`}></div>
                <span className="text-sm text-gray-600">
                  {connected ? 'Connected' : 'Disconnected'}
                </span>
              </div>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          {/* Stats Grid */}
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4 mb-8">
            <div className="stat-card orders">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <ShoppingCartIcon className="h-8 w-8 text-blue-500" />
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">Total Orders</dt>
                    <dd className="text-lg font-medium text-gray-900">{stats.totalOrders}</dd>
                  </dl>
                </div>
              </div>
            </div>

            <div className="stat-card revenue">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <CurrencyDollarIcon className="h-8 w-8 text-green-500" />
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">Total Revenue</dt>
                    <dd className="text-lg font-medium text-gray-900">${stats.totalRevenue}</dd>
                  </dl>
                </div>
              </div>
            </div>

            <div className="stat-card inventory">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <ChartBarIcon className="h-8 w-8 text-yellow-500" />
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">Active Orders</dt>
                    <dd className="text-lg font-medium text-gray-900">{stats.activeOrders}</dd>
                  </dl>
                </div>
              </div>
            </div>

            <div className="stat-card alerts">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <ExclamationTriangleIcon className="h-8 w-8 text-red-500" />
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">Alerts</dt>
                    <dd className="text-lg font-medium text-gray-900">{stats.inventoryAlerts.length}</dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>

          {/* Recent Activity */}
          <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
            {/* Recent Orders */}
            <div className="card">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Recent Orders</h3>
              <div className="space-y-3">
                {recentOrders.length === 0 ? (
                  <p className="text-gray-500 text-sm">No recent orders</p>
                ) : (
                  recentOrders.map((order, index) => (
                    <div 
                      key={index} 
                      className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 cursor-pointer transition-colors"
                      onClick={() => handleOrderClick(order)}
                    >
                      <div className="flex-1">
                        <div className="flex items-center justify-between mb-1">
                          <p className="text-sm font-medium text-gray-900">
                            Order #{order.id || order.sagaId}
                          </p>
                          <p className="text-sm font-semibold text-gray-900">
                            {formatCurrency(order.amount || 0)}
                          </p>
                        </div>
                        <p className="text-xs text-gray-500 mb-1">
                          {typeof order.customer === 'object' ? order.customer.email : order.customer || 'Unknown customer'}
                        </p>
                        <div className="flex items-center justify-between">
                          <p className="text-xs text-gray-400">
                            {formatTimestamp(order.timestamp)}
                          </p>
                          <div className="flex items-center space-x-2">
                            <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                              order.status === 'completed' 
                                ? 'bg-green-100 text-green-800' 
                                : order.status === 'failed'
                                ? 'bg-red-100 text-red-800'
                                : 'bg-yellow-100 text-yellow-800'
                            }`}>
                              {order.status || (order.error ? 'Failed' : 'Completed')}
                            </span>
                            {order.items && order.items.length > 0 && (
                              <span className="text-xs text-gray-500">
                                {order.items.length} item{order.items.length !== 1 ? 's' : ''}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Recent Alerts */}
            <div className="card">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Recent Alerts</h3>
              <div className="space-y-3">
                {recentAlerts.length === 0 ? (
                  <p className="text-gray-500 text-sm">No recent alerts</p>
                ) : (
                  recentAlerts.map((alert, index) => (
                    <div key={index} className="flex items-center justify-between p-3 bg-red-50 rounded-lg">
                      <div>
                        <p className="text-sm font-medium text-red-900">
                          Low Stock Alert
                        </p>
                        <p className="text-xs text-red-600">
                          Variant ID: {alert.variantId}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm text-red-900">
                          {new Date(alert.timestamp).toLocaleTimeString()}
                        </p>
                        <p className="text-xs text-red-600">
                          Stock: {alert.currentStock}
                        </p>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Order Details Modal */}
      {showOrderDetails && selectedOrder && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-11/12 md:w-3/4 lg:w-1/2 shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-medium text-gray-900">
                  Order Details
                </h3>
                <button
                  onClick={() => setShowOrderDetails(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              
              <div className="space-y-4">
                {/* Order Header */}
                <div className="bg-gray-50 p-4 rounded-lg">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm font-medium text-gray-500">Order ID</p>
                      <p className="text-lg font-semibold text-gray-900">
                        {selectedOrder.id || selectedOrder.sagaId}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-500">Status</p>
                      <span className={`inline-flex items-center px-2 py-1 rounded-full text-sm font-medium ${
                        selectedOrder.status === 'completed' 
                          ? 'bg-green-100 text-green-800' 
                          : selectedOrder.status === 'failed'
                          ? 'bg-red-100 text-red-800'
                          : 'bg-yellow-100 text-yellow-800'
                      }`}>
                        {selectedOrder.status || (selectedOrder.error ? 'Failed' : 'Completed')}
                      </span>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-500">Amount</p>
                      <p className="text-lg font-semibold text-gray-900">
                        {formatCurrency(selectedOrder.amount || 0)}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-500">Date</p>
                      <p className="text-sm text-gray-900">
                        {formatTimestamp(selectedOrder.timestamp)}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Customer Info */}
                <div>
                  <h4 className="text-md font-medium text-gray-900 mb-2">Customer Information</h4>
                  <div className="bg-gray-50 p-3 rounded-lg">
                    <p className="text-sm text-gray-900">
                      {typeof selectedOrder.customer === 'object' ? selectedOrder.customer.email : selectedOrder.customer}
                    </p>
                    {selectedOrder.customer && typeof selectedOrder.customer === 'object' && selectedOrder.customer.name && (
                      <p className="text-sm text-gray-600 mt-1">{selectedOrder.customer.name}</p>
                    )}
                    {selectedOrder.shippingAddress && (
                      <p className="text-sm text-gray-600 mt-1">{selectedOrder.shippingAddress}</p>
                    )}
                  </div>
                </div>

                {/* Order Items */}
                {selectedOrder.items && selectedOrder.items.length > 0 && (
                  <div>
                    <h4 className="text-md font-medium text-gray-900 mb-2">Order Items</h4>
                    <div className="space-y-2">
                      {selectedOrder.items.map((item, index) => (
                        <div key={index} className="bg-gray-50 p-3 rounded-lg">
                          <div className="flex justify-between items-center">
                            <div>
                              <p className="text-sm font-medium text-gray-900">
                                Variant ID: {item.variant_id}
                              </p>
                              <p className="text-sm text-gray-600">
                                Quantity: {item.quantity}
                              </p>
                            </div>
                            <div className="text-right">
                              <p className="text-sm font-medium text-gray-900">
                                {formatCurrency(item.price || 0)}
                              </p>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Payment Info */}
                <div>
                  <h4 className="text-md font-medium text-gray-900 mb-2">Payment Information</h4>
                  <div className="bg-gray-50 p-3 rounded-lg">
                    <p className="text-sm text-gray-900">
                      Method: {selectedOrder.paymentMethod || 'Card'}
                    </p>
                    {selectedOrder.error && (
                      <p className="text-sm text-red-600 mt-1">
                        Error: {selectedOrder.error}
                      </p>
                    )}
                  </div>
                </div>

                {/* Saga Info */}
                {selectedOrder.sagaId && (
                  <div>
                    <h4 className="text-md font-medium text-gray-900 mb-2">Transaction Details</h4>
                    <div className="bg-gray-50 p-3 rounded-lg">
                      <p className="text-sm text-gray-900">
                        Saga ID: {selectedOrder.sagaId}
                      </p>
                      {selectedOrder.compensations && selectedOrder.compensations.length > 0 && (
                        <p className="text-sm text-red-600 mt-1">
                          Compensations: {selectedOrder.compensations.join(', ')}
                        </p>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

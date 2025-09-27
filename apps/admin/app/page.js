'use client'

import { useState, useEffect } from 'react'
import { 
  ShoppingCartIcon, 
  CurrencyDollarIcon, 
  ExclamationTriangleIcon,
  ChartBarIcon,
  CubeIcon
} from '@heroicons/react/24/outline'
import Link from 'next/link'
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
      // Calculate stats from orders
      const response = await fetch('http://localhost:9000/admin/orders')
      const data = await response.json()
      const orders = data.orders || []
      
      const totalOrders = orders.length
      const totalRevenue = orders.reduce((sum, order) => sum + (order.metadata?.total_amount || 0), 0) / 100
      const activeOrders = orders.filter(order => order.status === 'in_progress').length
      const inventoryAlerts = [] // Placeholder for inventory alerts
      
      setStats({
        totalOrders,
        totalRevenue,
        activeOrders,
        inventoryAlerts
      })
    } catch (error) {
      console.error('Error fetching stats:', error)
    }
  }

  const fetchOrders = async () => {
    try {
      const response = await fetch('http://localhost:9000/admin/orders')
      const data = await response.json()
      setRecentOrders(data.orders || [])
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
    }).format(amount / 100) // Convert from cents
  }

  const formatTimestamp = (timestamp) => {
    return new Date(timestamp).toLocaleString()
  }

  return (
    <div className="admin-content">
      {/* Header */}
      <header className="admin-header">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-20">
            <div className="flex items-center">
              <h1 className="text-3xl font-bold bg-gradient-to-r from-black to-green-600 bg-clip-text text-transparent">
                Admin Dashboard
              </h1>
            </div>
            <div className="flex items-center space-x-6">
              <Link
                href="/products"
                className="btn-accent inline-flex items-center"
              >
                <CubeIcon className="h-5 w-5 mr-2" />
                Manage Products
              </Link>
              <div className="flex items-center space-x-3">
                <div className={`w-3 h-3 rounded-full ${connected ? 'bg-green-500' : 'bg-red-500'} shadow-sm`}></div>
                <span className="text-sm font-medium text-gray-600">
                  {connected ? 'Connected' : 'Disconnected'}
                </span>
              </div>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto py-8 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          {/* Stats Grid */}
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4 mb-12">
            <div className="stat-card orders group">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center group-hover:bg-green-200 transition-colors duration-200">
                    <ShoppingCartIcon className="h-6 w-6 text-green-600" />
                  </div>
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">Total Orders</dt>
                    <dd className="text-2xl font-bold text-gray-900">{stats.totalOrders}</dd>
                  </dl>
                </div>
              </div>
            </div>

            <div className="stat-card revenue group">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center group-hover:bg-green-200 transition-colors duration-200">
                    <CurrencyDollarIcon className="h-6 w-6 text-green-600" />
                  </div>
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">Total Revenue</dt>
                    <dd className="text-2xl font-bold text-gray-900">${stats.totalRevenue.toFixed(2)}</dd>
                  </dl>
                </div>
              </div>
            </div>

            <div className="stat-card inventory group">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div className="w-12 h-12 bg-gray-100 rounded-xl flex items-center justify-center group-hover:bg-gray-200 transition-colors duration-200">
                    <ChartBarIcon className="h-6 w-6 text-gray-600" />
                  </div>
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">Active Orders</dt>
                    <dd className="text-2xl font-bold text-gray-900">{stats.activeOrders}</dd>
                  </dl>
                </div>
              </div>
            </div>

            <div className="stat-card alerts group">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div className="w-12 h-12 bg-red-100 rounded-xl flex items-center justify-center group-hover:bg-red-200 transition-colors duration-200">
                    <ExclamationTriangleIcon className="h-6 w-6 text-red-600" />
                  </div>
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">Alerts</dt>
                    <dd className="text-2xl font-bold text-gray-900">{stats.inventoryAlerts.length}</dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>

          {/* Recent Activity */}
          <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
            {/* Recent Orders */}
            <div className="card-elevated">
              <div className="flex items-center justify-between mb-6">
                <h3 className="heading-3">Recent Orders</h3>
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
              </div>
              <div className="space-y-4">
                {recentOrders.length === 0 ? (
                  <div className="text-center py-8">
                    <ShoppingCartIcon className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                    <p className="text-gray-500 text-sm">No recent orders</p>
                  </div>
                ) : (
                  recentOrders.map((order, index) => (
                    <div 
                      key={index} 
                      className="flex items-center justify-between p-4 bg-gray-50 rounded-xl hover:bg-gray-100 cursor-pointer transition-all duration-200 group"
                      onClick={() => handleOrderClick(order)}
                    >
                      <div className="flex-1">
                        <div className="flex items-center justify-between mb-2">
                          <p className="text-sm font-semibold text-gray-900 group-hover:text-green-600 transition-colors">
                            Order #{order.id}
                          </p>
                          <p className="text-lg font-bold text-gray-900">
                            {formatCurrency(order.metadata?.total_amount || 0)}
                          </p>
                        </div>
                        <p className="text-sm text-gray-600 mb-2">
                          {order.email || 'Unknown customer'}
                        </p>
                        <div className="flex items-center justify-between">
                          <p className="text-xs text-gray-500">
                            {formatTimestamp(order.created_at)}
                          </p>
                          <div className="flex items-center space-x-2">
                            <span className={`badge ${
                              order.status === 'completed' 
                                ? 'badge-success' 
                                : order.status === 'cancelled'
                                ? 'badge-danger'
                                : order.status === 'in_progress'
                                ? 'badge-info'
                                : 'badge-warning'
                            }`}>
                              {order.status || 'pending'}
                            </span>
                            {order.items && order.items.length > 0 && (
                              <span className="text-xs text-gray-500 font-medium">
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
            <div className="card-elevated">
              <div className="flex items-center justify-between mb-6">
                <h3 className="heading-3">Recent Alerts</h3>
                <div className="w-2 h-2 bg-red-500 rounded-full"></div>
              </div>
              <div className="space-y-4">
                {recentAlerts.length === 0 ? (
                  <div className="text-center py-8">
                    <ExclamationTriangleIcon className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                    <p className="text-gray-500 text-sm">No recent alerts</p>
                  </div>
                ) : (
                  recentAlerts.map((alert, index) => (
                    <div key={index} className="flex items-center justify-between p-4 bg-red-50 rounded-xl border border-red-100">
                      <div>
                        <p className="text-sm font-semibold text-red-900">
                          Low Stock Alert
                        </p>
                        <p className="text-xs text-red-600 mt-1">
                          Variant ID: {alert.variantId}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-semibold text-red-900">
                          {new Date(alert.timestamp).toLocaleTimeString()}
                        </p>
                        <p className="text-xs text-red-600 mt-1">
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
        <div className="modal-backdrop flex items-center justify-center p-4 z-50">
          <div className="modal-content w-full max-w-4xl max-h-[90vh] overflow-y-auto scale-in">
            <div className="p-8">
              <div className="flex items-center justify-between mb-8">
                <h3 className="heading-2">
                  Order Details
                </h3>
                <button
                  onClick={() => setShowOrderDetails(false)}
                  className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-xl transition-all duration-200"
                >
                  <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              
              <div className="space-y-8">
                {/* Order Header */}
                <div className="bg-gray-50 p-6 rounded-2xl border border-gray-100">
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    <div>
                      <p className="text-sm font-medium text-gray-500 mb-2">Order ID</p>
                      <p className="text-lg font-bold text-gray-900">
                        {selectedOrder.id}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-500 mb-2">Status</p>
                      <span className={`badge ${
                        selectedOrder.status === 'completed' 
                          ? 'badge-success' 
                          : selectedOrder.status === 'cancelled'
                          ? 'badge-danger'
                          : selectedOrder.status === 'in_progress'
                          ? 'badge-info'
                          : 'badge-warning'
                      }`}>
                        {selectedOrder.status || 'pending'}
                      </span>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-500 mb-2">Amount</p>
                      <p className="text-xl font-bold text-gray-900">
                        {formatCurrency(selectedOrder.metadata?.total_amount || 0)}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-500 mb-2">Date</p>
                      <p className="text-sm font-semibold text-gray-900">
                        {formatTimestamp(selectedOrder.created_at)}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Customer Info */}
                <div>
                  <h4 className="heading-3 mb-4">Customer Information</h4>
                  <div className="bg-gray-50 p-6 rounded-2xl border border-gray-100">
                    <p className="text-lg font-semibold text-gray-900 mb-3">
                      {selectedOrder.email}
                    </p>
                    {selectedOrder.metadata?.shipping_address && (
                      <div className="space-y-1 text-sm text-gray-600">
                        <p className="font-medium">{selectedOrder.metadata.shipping_address.firstName} {selectedOrder.metadata.shipping_address.lastName}</p>
                        <p>{selectedOrder.metadata.shipping_address.address1}</p>
                        <p>{selectedOrder.metadata.shipping_address.city}, {selectedOrder.metadata.shipping_address.province} {selectedOrder.metadata.shipping_address.postal_code}</p>
                        <p>{selectedOrder.metadata.shipping_address.country_code}</p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Order Items */}
                {selectedOrder.items && selectedOrder.items.length > 0 && (
                  <div>
                    <h4 className="heading-3 mb-4">Order Items</h4>
                    <div className="space-y-3">
                      {selectedOrder.items.map((item, index) => (
                        <div key={index} className="bg-gray-50 p-4 rounded-xl border border-gray-100">
                          <div className="flex justify-between items-center">
                            <div>
                              <p className="text-sm font-semibold text-gray-900">
                                Variant ID: {item.variant_id}
                              </p>
                              <p className="text-sm text-gray-600 mt-1">
                                Quantity: {item.quantity}
                              </p>
                            </div>
                            <div className="text-right">
                              <span className="badge badge-secondary">
                                Item #{index + 1}
                              </span>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Order Summary */}
                <div>
                  <h4 className="heading-3 mb-4">Order Summary</h4>
                  <div className="bg-gray-50 p-6 rounded-2xl border border-gray-100">
                    <div className="space-y-2">
                      <p className="text-sm font-semibold text-gray-900">
                        Status: <span className="text-gray-600">{selectedOrder.status || 'pending'}</span>
                      </p>
                      <p className="text-sm font-semibold text-gray-900">
                        Order ID: <span className="text-gray-600">{selectedOrder.id}</span>
                      </p>
                      {selectedOrder.metadata?.customer_info && (
                        <p className="text-sm font-semibold text-gray-900">
                          Customer: <span className="text-gray-600">{selectedOrder.metadata.customer_info.firstName} {selectedOrder.metadata.customer_info.lastName}</span>
                        </p>
                      )}
                    </div>
                  </div>
                </div>

              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

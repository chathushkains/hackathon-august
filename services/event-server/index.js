const express = require('express');
const { createServer } = require('http');
const { Server } = require('socket.io');
const Redis = require('ioredis');
const cors = require('cors');
require('dotenv').config();

const app = express();
const server = createServer(app);
const io = new Server(server, {
  cors: {
    origin: ["http://localhost:3000", "http://localhost:3001", "http://localhost:3002"],
    methods: ["GET", "POST"]
  }
});

const PORT = process.env.PORT || 4003;

// Redis connection
const redis = new Redis(process.env.REDIS_URL || 'redis://localhost:6379', {
  retryDelayOnFailover: 100,
  maxRetriesPerRequest: 3,
  lazyConnect: true
});

app.use(cors());
app.use(express.json());

// Store for real-time data
let stats = {
  totalOrders: 0,
  totalRevenue: 0,
  activeOrders: 0,
  inventoryAlerts: []
};

// Store detailed order information
let recentOrders = [];
let allOrders = [];

// Socket.IO connection handling
io.on('connection', (socket) => {
  console.log(`📱 Client connected: ${socket.id}`);
  
  // Send current stats to new client
  socket.emit('stats_update', stats);
  
  // Handle admin dashboard join
  socket.on('join_admin', () => {
    socket.join('admin');
    console.log(`👨‍💼 Admin joined: ${socket.id}`);
  });
  
  // Handle storefront join
  socket.on('join_storefront', () => {
    socket.join('storefront');
    console.log(`🛒 Storefront joined: ${socket.id}`);
  });
  
  socket.on('disconnect', () => {
    console.log(`📱 Client disconnected: ${socket.id}`);
  });
});

// Subscribe to Redis events
redis.subscribe('order_events', (err) => {
  if (err) {
    console.error('❌ Redis subscription error:', err);
  } else {
    console.log('📡 Subscribed to order_events channel');
  }
});

redis.on('message', (channel, message) => {
  if (channel === 'order_events') {
    try {
      const event = JSON.parse(message);
      console.log(`📨 Received event: ${event.type}`);
      
      // Update stats based on event type
      switch (event.type) {
        case 'order.completed':
          stats.totalOrders++;
          stats.totalRevenue += event.amount || 100; // Use actual amount from event
          stats.activeOrders = Math.max(0, stats.activeOrders - 1);
          
          // Create detailed order object
          const orderDetails = {
            id: event.orderId || event.sagaId,
            sagaId: event.sagaId,
            customer: event.customer || 'demo@example.com',
            amount: event.amount || 100,
            status: 'completed',
            timestamp: event.timestamp || new Date().toISOString(),
            items: event.items || [],
            paymentMethod: event.paymentMethod || 'card',
            shippingAddress: event.shippingAddress || '123 Demo St, Demo City'
          };
          
          // Add to recent orders (keep last 10)
          recentOrders.unshift(orderDetails);
          if (recentOrders.length > 10) {
            recentOrders = recentOrders.slice(0, 10);
          }
          
          // Add to all orders
          allOrders.unshift(orderDetails);
          
          // Broadcast to all connected clients
          io.emit('order_completed', orderDetails);
          break;
          
        case 'order.failed':
          stats.activeOrders = Math.max(0, stats.activeOrders - 1);
          
          // Create failed order object
          const failedOrderDetails = {
            id: event.orderId || event.sagaId,
            sagaId: event.sagaId,
            customer: event.customer || 'demo@example.com',
            amount: event.amount || 0,
            status: 'failed',
            timestamp: event.timestamp || new Date().toISOString(),
            error: event.error,
            compensations: event.compensations,
            items: event.items || []
          };
          
          // Add to recent orders
          recentOrders.unshift(failedOrderDetails);
          if (recentOrders.length > 10) {
            recentOrders = recentOrders.slice(0, 10);
          }
          
          // Add to all orders
          allOrders.unshift(failedOrderDetails);
          
          // Broadcast to admin only
          io.to('admin').emit('order_failed', failedOrderDetails);
          break;
          
        case 'inventory.low':
          stats.inventoryAlerts.push({
            variantId: event.variantId,
            currentStock: event.currentStock,
            timestamp: event.timestamp
          });
          
          // Broadcast to admin
          io.to('admin').emit('inventory_alert', event);
          break;
      }
      
      // Send updated stats
      io.emit('stats_update', stats);
      
    } catch (error) {
      console.error('❌ Error processing event:', error);
    }
  }
});

// API routes
app.get('/stats', (req, res) => {
  res.json(stats);
});

app.get('/orders', (req, res) => {
  const { limit = 10, status } = req.query;
  let orders = recentOrders;
  
  if (status) {
    orders = orders.filter(order => order.status === status);
  }
  
  if (limit) {
    orders = orders.slice(0, parseInt(limit));
  }
  
  res.json({
    orders,
    total: allOrders.length,
    recent: recentOrders.length
  });
});

app.get('/orders/:id', (req, res) => {
  const { id } = req.params;
  const order = allOrders.find(o => o.id === id || o.sagaId === id);
  
  if (!order) {
    return res.status(404).json({ error: 'Order not found' });
  }
  
  res.json(order);
});

app.get('/health', (req, res) => {
  res.json({ status: 'healthy', timestamp: new Date().toISOString() });
});

server.listen(PORT, () => {
  console.log(`🚀 Event server running on port ${PORT}`);
  console.log(`📡 Socket.IO server ready for connections`);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('Shutting down event server...');
  server.close(() => {
    redis.quit();
    process.exit(0);
  });
});

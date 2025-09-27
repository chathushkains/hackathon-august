const express = require('express');
const cors = require('cors');
const { v4: uuidv4 } = require('uuid');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 9000;

// In-memory storage for demo
let products = [];
let orders = [];
let orderIdCounter = 1;

app.use(cors());
app.use(express.json());

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'healthy', timestamp: new Date().toISOString() });
});

// Store API - Get products
app.get('/store/products', (req, res) => {
  res.json({ products });
});

// Admin API - Create product
app.post('/admin/products', (req, res) => {
  const { title, description, variants, metadata } = req.body;
  
  const product = {
    id: uuidv4(),
    title,
    description,
    variants: variants || [{
      id: uuidv4(),
      title: 'Default',
      sku: `SKU-${Date.now()}`,
      prices: [{ currency_code: 'usd', amount: 1000 }]
    }],
    metadata: metadata || {},
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  };
  
  products.push(product);
  console.log(`✅ Created product: ${title}`);
  
  res.json({ product });
});

// Admin API - Create order
app.post('/admin/orders', (req, res) => {
  const { email, items, metadata } = req.body;
  
  const order = {
    id: `order_${orderIdCounter++}`,
    email,
    items: items || [],
    status: 'pending',
    metadata: metadata || {},
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  };
  
  orders.push(order);
  console.log(`✅ Created order: ${order.id}`);
  
  res.json({ order });
});

// Admin API - Complete order
app.post('/admin/orders/:id/complete', (req, res) => {
  const { id } = req.params;
  const order = orders.find(o => o.id === id);
  
  if (!order) {
    return res.status(404).json({ error: 'Order not found' });
  }
  
  order.status = 'completed';
  order.updated_at = new Date().toISOString();
  
  console.log(`✅ Completed order: ${id}`);
  res.json({ order });
});

// Admin API - Cancel order
app.post('/admin/orders/:id/cancel', (req, res) => {
  const { id } = req.params;
  const order = orders.find(o => o.id === id);
  
  if (!order) {
    return res.status(404).json({ error: 'Order not found' });
  }
  
  order.status = 'cancelled';
  order.updated_at = new Date().toISOString();
  
  console.log(`✅ Cancelled order: ${id}`);
  res.json({ order });
});

// Admin API - Get orders
app.get('/admin/orders', (req, res) => {
  res.json({ orders });
});

// Seed some sample products
function seedProducts() {
  const sampleProducts = [
    {
      id: uuidv4(),
      title: 'Wireless Bluetooth Headphones',
      description: 'High-quality wireless headphones with active noise cancellation.',
      variants: [{
        id: uuidv4(),
        title: 'Default',
        sku: 'WBH-001',
        prices: [{ currency_code: 'usd', amount: 9999 }]
      }],
      metadata: { category: 'electronics' },
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    },
    {
      id: uuidv4(),
      title: 'Smart Fitness Watch',
      description: 'Advanced fitness tracking watch with heart rate monitoring.',
      variants: [{
        id: uuidv4(),
        title: 'Default',
        sku: 'SFW-002',
        prices: [{ currency_code: 'usd', amount: 19999 }]
      }],
      metadata: { category: 'electronics' },
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    },
    {
      id: uuidv4(),
      title: 'Classic Cotton T-Shirt',
      description: 'Comfortable 100% organic cotton t-shirt.',
      variants: [{
        id: uuidv4(),
        title: 'Default',
        sku: 'CCT-001',
        prices: [{ currency_code: 'usd', amount: 2499 }]
      }],
      metadata: { category: 'fashion' },
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }
  ];
  
  products = sampleProducts;
  console.log(`🌱 Seeded ${products.length} sample products`);
}

// Initialize
seedProducts();

app.listen(PORT, () => {
  console.log(`🚀 Mock Medusa API running on port ${PORT}`);
  console.log(`📊 Store API: http://localhost:${PORT}/store/products`);
  console.log(`🔧 Admin API: http://localhost:${PORT}/admin/products`);
});

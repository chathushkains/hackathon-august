const express = require('express');
const cors = require('cors');
const { v4: uuidv4 } = require('uuid');
const { Pool } = require('pg');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 9000;

// Database connection
const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 5432,
  database: process.env.DB_NAME || 'medusa',
  user: process.env.DB_USER || 'medusa',
  password: process.env.DB_PASSWORD || 'medusa',
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
});

// Test database connection
pool.on('connect', () => {
  console.log('📊 Connected to PostgreSQL database');
});

pool.on('error', (err) => {
  console.error('❌ Database connection error:', err);
});

// Initialize database tables
async function initializeDatabase() {
  try {
    // Create products table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS products (
        id UUID PRIMARY KEY,
        title VARCHAR(255) NOT NULL,
        description TEXT,
        metadata JSONB,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      )
    `);

    // Create product_variants table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS product_variants (
        id UUID PRIMARY KEY,
        product_id UUID REFERENCES products(id) ON DELETE CASCADE,
        title VARCHAR(255) NOT NULL,
        sku VARCHAR(100) UNIQUE,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      )
    `);

    // Create variant_prices table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS variant_prices (
        id UUID PRIMARY KEY,
        variant_id UUID REFERENCES product_variants(id) ON DELETE CASCADE,
        currency_code VARCHAR(3) NOT NULL,
        amount INTEGER NOT NULL,
        created_at TIMESTAMP DEFAULT NOW()
      )
    `);

    // Create orders table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS orders (
        id VARCHAR(50) PRIMARY KEY,
        email VARCHAR(255) NOT NULL,
        status VARCHAR(50) DEFAULT 'pending',
        metadata JSONB,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      )
    `);

    // Create order_items table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS order_items (
        id UUID PRIMARY KEY,
        order_id VARCHAR(50) REFERENCES orders(id) ON DELETE CASCADE,
        variant_id UUID NOT NULL,
        quantity INTEGER NOT NULL,
        created_at TIMESTAMP DEFAULT NOW()
      )
    `);

    console.log('✅ Database tables initialized');
  } catch (error) {
    console.error('❌ Database initialization error:', error);
  }
}

app.use(cors());
app.use(express.json());

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'healthy', timestamp: new Date().toISOString() });
});

// Store API - Get products
app.get('/store/products', async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT 
        p.id,
        p.title,
        p.description,
        p.metadata,
        p.created_at,
        p.updated_at,
        json_agg(
          json_build_object(
            'id', pv.id,
            'title', pv.title,
            'sku', pv.sku,
            'prices', (
              SELECT json_agg(
                json_build_object(
                  'currency_code', vp.currency_code,
                  'amount', vp.amount
                )
              )
              FROM variant_prices vp
              WHERE vp.variant_id = pv.id
            )
          )
        ) as variants
      FROM products p
      LEFT JOIN product_variants pv ON p.id = pv.product_id
      GROUP BY p.id, p.title, p.description, p.metadata, p.created_at, p.updated_at
      ORDER BY p.created_at DESC
    `);

    const products = result.rows.map(row => ({
      ...row,
      variants: row.variants.filter(v => v.id !== null)
    }));

    res.json({ products });
  } catch (error) {
    console.error('Error fetching products:', error);
    res.status(500).json({ error: 'Failed to fetch products' });
  }
});

// Admin API - Create product
app.post('/admin/products', async (req, res) => {
  const client = await pool.connect();
  
  try {
    await client.query('BEGIN');
    
    const { title, description, variants, metadata } = req.body;
    const productId = uuidv4();
    
    // Insert product
    await client.query(
      'INSERT INTO products (id, title, description, metadata) VALUES ($1, $2, $3, $4)',
      [productId, title, description, JSON.stringify(metadata || {})]
    );

    // Insert variants
    const productVariants = variants || [{
      title: 'Default',
      sku: `SKU-${Date.now()}`,
      prices: [{ currency_code: 'usd', amount: 1000 }]
    }];

    for (const variant of productVariants) {
      const variantId = uuidv4();
      
      await client.query(
        'INSERT INTO product_variants (id, product_id, title, sku) VALUES ($1, $2, $3, $4)',
        [variantId, productId, variant.title, variant.sku]
      );

      // Insert prices
      for (const price of variant.prices || []) {
        await client.query(
          'INSERT INTO variant_prices (id, variant_id, currency_code, amount) VALUES ($1, $2, $3, $4)',
          [uuidv4(), variantId, price.currency_code, price.amount]
        );
      }
    }

    await client.query('COMMIT');
    
    // Fetch the created product
    const result = await pool.query(`
      SELECT 
        p.id,
        p.title,
        p.description,
        p.metadata,
        p.created_at,
        p.updated_at,
        json_agg(
          json_build_object(
            'id', pv.id,
            'title', pv.title,
            'sku', pv.sku,
            'prices', (
              SELECT json_agg(
                json_build_object(
                  'currency_code', vp.currency_code,
                  'amount', vp.amount
                )
              )
              FROM variant_prices vp
              WHERE vp.variant_id = pv.id
            )
          )
        ) as variants
      FROM products p
      LEFT JOIN product_variants pv ON p.id = pv.product_id
      WHERE p.id = $1
      GROUP BY p.id, p.title, p.description, p.metadata, p.created_at, p.updated_at
    `, [productId]);

    const product = result.rows[0];
    product.variants = product.variants.filter(v => v.id !== null);
    
    console.log(`✅ Created product: ${title}`);
    res.json({ product });
    
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Error creating product:', error);
    res.status(500).json({ error: 'Failed to create product' });
  } finally {
    client.release();
  }
});

// Admin API - Create order
app.post('/admin/orders', async (req, res) => {
  const client = await pool.connect();
  
  try {
    await client.query('BEGIN');
    
    const { email, items, metadata } = req.body;
    const orderId = `order_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    // Insert order
    await client.query(
      'INSERT INTO orders (id, email, metadata) VALUES ($1, $2, $3)',
      [orderId, email, JSON.stringify(metadata || {})]
    );

    // Insert order items
    for (const item of items || []) {
      await client.query(
        'INSERT INTO order_items (id, order_id, variant_id, quantity) VALUES ($1, $2, $3, $4)',
        [uuidv4(), orderId, item.variant_id, item.quantity]
      );
    }

    await client.query('COMMIT');
    
    console.log(`✅ Created order: ${orderId}`);
    res.json({ order: { id: orderId, email, status: 'pending' } });
    
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Error creating order:', error);
    res.status(500).json({ error: 'Failed to create order' });
  } finally {
    client.release();
  }
});

// Admin API - Complete order
app.post('/admin/orders/:id/complete', async (req, res) => {
  try {
    const { id } = req.params;
    
    const result = await pool.query(
      'UPDATE orders SET status = $1, updated_at = NOW() WHERE id = $2 RETURNING *',
      ['completed', id]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Order not found' });
    }
    
    console.log(`✅ Completed order: ${id}`);
    res.json({ order: result.rows[0] });
    
  } catch (error) {
    console.error('Error completing order:', error);
    res.status(500).json({ error: 'Failed to complete order' });
  }
});

// Admin API - Cancel order
app.post('/admin/orders/:id/cancel', async (req, res) => {
  try {
    const { id } = req.params;
    
    const result = await pool.query(
      'UPDATE orders SET status = $1, updated_at = NOW() WHERE id = $2 RETURNING *',
      ['cancelled', id]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Order not found' });
    }
    
    console.log(`✅ Cancelled order: ${id}`);
    res.json({ order: result.rows[0] });
    
  } catch (error) {
    console.error('Error cancelling order:', error);
    res.status(500).json({ error: 'Failed to cancel order' });
  }
});

// Admin API - Get orders
app.get('/admin/orders', async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT 
        o.id,
        o.email,
        o.status,
        o.metadata,
        o.created_at,
        o.updated_at,
        json_agg(
          json_build_object(
            'id', oi.id,
            'variant_id', oi.variant_id,
            'quantity', oi.quantity
          )
        ) as items
      FROM orders o
      LEFT JOIN order_items oi ON o.id = oi.order_id
      GROUP BY o.id, o.email, o.status, o.metadata, o.created_at, o.updated_at
      ORDER BY o.created_at DESC
    `);

    const orders = result.rows.map(row => ({
      ...row,
      items: row.items.filter(item => item.id !== null)
    }));

    res.json({ orders });
  } catch (error) {
    console.error('Error fetching orders:', error);
    res.status(500).json({ error: 'Failed to fetch orders' });
  }
});

// Seed some sample products
async function seedProducts() {
  try {
    // Check if products already exist
    const result = await pool.query('SELECT COUNT(*) FROM products');
    if (parseInt(result.rows[0].count) > 0) {
      console.log('🌱 Products already seeded');
      return;
    }

    const sampleProducts = [
      {
        title: 'Wireless Bluetooth Headphones',
        description: 'High-quality wireless headphones with active noise cancellation.',
        variants: [{
          title: 'Default',
          sku: 'WBH-001',
          prices: [{ currency_code: 'usd', amount: 9999 }]
        }],
        metadata: { category: 'electronics' }
      },
      {
        title: 'Smart Fitness Watch',
        description: 'Advanced fitness tracking watch with heart rate monitoring.',
        variants: [{
          title: 'Default',
          sku: 'SFW-002',
          prices: [{ currency_code: 'usd', amount: 19999 }]
        }],
        metadata: { category: 'electronics' }
      },
      {
        title: 'Classic Cotton T-Shirt',
        description: 'Comfortable 100% organic cotton t-shirt.',
        variants: [{
          title: 'Default',
          sku: 'CCT-001',
          prices: [{ currency_code: 'usd', amount: 2499 }]
        }],
        metadata: { category: 'fashion' }
      }
    ];

    for (const product of sampleProducts) {
      const productId = uuidv4();
      
      // Insert product
      await pool.query(
        'INSERT INTO products (id, title, description, metadata) VALUES ($1, $2, $3, $4)',
        [productId, product.title, product.description, JSON.stringify(product.metadata)]
      );

      // Insert variants
      for (const variant of product.variants) {
        const variantId = uuidv4();
        
        await pool.query(
          'INSERT INTO product_variants (id, product_id, title, sku) VALUES ($1, $2, $3, $4)',
          [variantId, productId, variant.title, variant.sku]
        );

        // Insert prices
        for (const price of variant.prices) {
          await pool.query(
            'INSERT INTO variant_prices (id, variant_id, currency_code, amount) VALUES ($1, $2, $3, $4)',
            [uuidv4(), variantId, price.currency_code, price.amount]
          );
        }
      }
    }
    
    console.log(`🌱 Seeded ${sampleProducts.length} sample products`);
  } catch (error) {
    console.error('Error seeding products:', error);
  }
}

// Initialize database and start server
async function startServer() {
  try {
    await initializeDatabase();
    await seedProducts();
    
    app.listen(PORT, () => {
      console.log(`🚀 Database-integrated Medusa API running on port ${PORT}`);
      console.log(`📊 Store API: http://localhost:${PORT}/store/products`);
      console.log(`🔧 Admin API: http://localhost:${PORT}/admin/products`);
      console.log(`📋 Orders API: http://localhost:${PORT}/admin/orders`);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
}

startServer();

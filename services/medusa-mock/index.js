const express = require('express');
const cors = require('cors');
const { v4: uuidv4 } = require('uuid');
const { Pool } = require('pg');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY || 'sk_test_placeholder');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 9000;
const JWT_SECRET = process.env.JWT_SECRET || 'your-super-secret-jwt-key-change-in-production';

// Authentication middleware
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'Access token required' });
  }

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) {
      return res.status(403).json({ error: 'Invalid or expired token' });
    }
    req.user = user;
    next();
  });
};

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

    // Create users table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS users (
        id UUID PRIMARY KEY,
        email VARCHAR(255) UNIQUE NOT NULL,
        password_hash VARCHAR(255) NOT NULL,
        first_name VARCHAR(100),
        last_name VARCHAR(100),
        phone VARCHAR(20),
        role VARCHAR(20) DEFAULT 'customer',
        is_active BOOLEAN DEFAULT true,
        email_verified BOOLEAN DEFAULT false,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      )
    `);

    // Create addresses table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS addresses (
        id UUID PRIMARY KEY,
        user_id UUID REFERENCES users(id) ON DELETE CASCADE,
        type VARCHAR(20) DEFAULT 'shipping',
        first_name VARCHAR(100),
        last_name VARCHAR(100),
        address_1 VARCHAR(255),
        address_2 VARCHAR(255),
        city VARCHAR(100),
        country_code VARCHAR(2),
        province VARCHAR(100),
        postal_code VARCHAR(20),
        phone VARCHAR(20),
        is_default BOOLEAN DEFAULT false,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      )
    `);

    // Create orders table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS orders (
        id VARCHAR(50) PRIMARY KEY,
        user_id UUID REFERENCES users(id) ON DELETE SET NULL,
        email VARCHAR(255) NOT NULL,
        status VARCHAR(50) DEFAULT 'pending',
        payment_status VARCHAR(50) DEFAULT 'pending',
        shipping_status VARCHAR(50) DEFAULT 'pending',
        total_amount INTEGER NOT NULL DEFAULT 0,
        currency_code VARCHAR(3) DEFAULT 'usd',
        shipping_address JSONB,
        billing_address JSONB,
        payment_intent_id VARCHAR(255),
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

// Store API - Create payment intent
app.post('/payments/create-intent', async (req, res) => {
  try {
    const { amount, currency = 'usd' } = req.body;
    
    // Generate a mock payment intent ID
    const paymentIntentId = `pi_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    console.log(`✅ Created payment intent: ${paymentIntentId} for amount: ${amount}`);
    res.json({ 
      success: true,
      paymentIntentId,
      amount,
      currency
    });
    
  } catch (error) {
    console.error('Error creating payment intent:', error);
    res.status(500).json({ error: 'Failed to create payment intent' });
  }
});

// Store API - Create order (checkout)
app.post('/store/checkout', async (req, res) => {
  const client = await pool.connect();
  
  try {
    await client.query('BEGIN');
    
    const { email, items, metadata, total_amount, shipping_address } = req.body;
    const orderId = `order_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    // Insert order with "in_progress" status
    await client.query(
      'INSERT INTO orders (id, email, status, metadata) VALUES ($1, $2, $3, $4)',
      [orderId, email, 'in_progress', JSON.stringify({...metadata, total_amount, shipping_address})]
    );

    // Insert order items
    for (const item of items || []) {
      await client.query(
        'INSERT INTO order_items (id, order_id, variant_id, quantity) VALUES ($1, $2, $3, $4)',
        [uuidv4(), orderId, uuidv4(), item.quantity] // Generate UUID for variant_id
      );
    }

    await client.query('COMMIT');
    
    console.log(`✅ Created order: ${orderId} with status: in_progress`);
    res.json({ 
      success: true,
      order: { 
        id: orderId, 
        email, 
        status: 'in_progress',
        total_amount,
        items: items || []
      } 
    });
    
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Error creating order:', error);
    res.status(500).json({ error: 'Failed to create order' });
  } finally {
    client.release();
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

// Authentication endpoints

// Register user
app.post('/auth/register', async (req, res) => {
  try {
    const { email, password, firstName, lastName, phone } = req.body;
    
    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    // Check if user already exists
    const existingUser = await pool.query('SELECT id FROM users WHERE email = $1', [email]);
    if (existingUser.rows.length > 0) {
      return res.status(400).json({ error: 'User already exists with this email' });
    }

    // Hash password
    const saltRounds = 12;
    const passwordHash = await bcrypt.hash(password, saltRounds);

    // Create user
    const userId = uuidv4();
    const result = await pool.query(
      'INSERT INTO users (id, email, password_hash, first_name, last_name, phone) VALUES ($1, $2, $3, $4, $5, $6) RETURNING id, email, first_name, last_name, role, created_at',
      [userId, email, passwordHash, firstName, lastName, phone]
    );

    const user = result.rows[0];
    
    // Generate JWT token
    const token = jwt.sign(
      { userId: user.id, email: user.email, role: user.role },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.status(201).json({
      success: true,
      user: {
        id: user.id,
        email: user.email,
        firstName: user.first_name,
        lastName: user.last_name,
        role: user.role
      },
      token
    });

  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ error: 'Registration failed' });
  }
});

// Login user
app.post('/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    
    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    // Find user
    const result = await pool.query(
      'SELECT id, email, password_hash, first_name, last_name, role, is_active FROM users WHERE email = $1',
      [email]
    );

    if (result.rows.length === 0) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const user = result.rows[0];

    if (!user.is_active) {
      return res.status(401).json({ error: 'Account is deactivated' });
    }

    // Verify password
    const isValidPassword = await bcrypt.compare(password, user.password_hash);
    if (!isValidPassword) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Generate JWT token
    const token = jwt.sign(
      { userId: user.id, email: user.email, role: user.role },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.json({
      success: true,
      user: {
        id: user.id,
        email: user.email,
        firstName: user.first_name,
        lastName: user.last_name,
        role: user.role
      },
      token
    });

  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Login failed' });
  }
});

// Get user profile
app.get('/auth/profile', authenticateToken, async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT id, email, first_name, last_name, phone, role, created_at FROM users WHERE id = $1',
      [req.user.userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    const user = result.rows[0];
    res.json({
      success: true,
      user: {
        id: user.id,
        email: user.email,
        firstName: user.first_name,
        lastName: user.last_name,
        phone: user.phone,
        role: user.role,
        createdAt: user.created_at
      }
    });

  } catch (error) {
    console.error('Profile fetch error:', error);
    res.status(500).json({ error: 'Failed to fetch profile' });
  }
});

// Update user profile
app.put('/auth/profile', authenticateToken, async (req, res) => {
  try {
    const { firstName, lastName, phone } = req.body;
    
    const result = await pool.query(
      'UPDATE users SET first_name = $1, last_name = $2, phone = $3, updated_at = NOW() WHERE id = $4 RETURNING id, email, first_name, last_name, phone',
      [firstName, lastName, phone, req.user.userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    const user = result.rows[0];
    res.json({
      success: true,
      user: {
        id: user.id,
        email: user.email,
        firstName: user.first_name,
        lastName: user.last_name,
        phone: user.phone
      }
    });

  } catch (error) {
    console.error('Profile update error:', error);
    res.status(500).json({ error: 'Failed to update profile' });
  }
});

// Get user orders
app.get('/auth/orders', authenticateToken, async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT 
        o.id,
        o.email,
        o.status,
        o.payment_status,
        o.shipping_status,
        o.total_amount,
        o.currency_code,
        o.shipping_address,
        o.billing_address,
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
      WHERE o.user_id = $1
      GROUP BY o.id, o.email, o.status, o.payment_status, o.shipping_status, o.total_amount, o.currency_code, o.shipping_address, o.billing_address, o.created_at, o.updated_at
      ORDER BY o.created_at DESC
    `, [req.user.userId]);

    const orders = result.rows.map(row => ({
      ...row,
      items: row.items.filter(item => item.id !== null)
    }));

    res.json({ success: true, orders });

  } catch (error) {
    console.error('Orders fetch error:', error);
    res.status(500).json({ error: 'Failed to fetch orders' });
  }
});

// Stripe payment endpoints

// Create payment intent
app.post('/payments/create-intent', async (req, res) => {
  try {
    const { amount, currency = 'usd', orderId } = req.body;
    
    if (!amount || amount <= 0) {
      return res.status(400).json({ error: 'Valid amount is required' });
    }

    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(amount * 100), // Convert to cents
      currency,
      metadata: {
        orderId: orderId || 'guest_order'
      }
    });

    res.json({
      success: true,
      clientSecret: paymentIntent.client_secret,
      paymentIntentId: paymentIntent.id
    });

  } catch (error) {
    console.error('Payment intent creation error:', error);
    res.status(500).json({ error: 'Failed to create payment intent' });
  }
});

// Confirm payment
app.post('/payments/confirm', async (req, res) => {
  try {
    const { paymentIntentId, orderId } = req.body;
    
    const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);
    
    if (paymentIntent.status === 'succeeded') {
      // Update order payment status
      await pool.query(
        'UPDATE orders SET payment_status = $1, payment_intent_id = $2, updated_at = NOW() WHERE id = $3',
        ['paid', paymentIntentId, orderId]
      );
      
      res.json({ success: true, status: 'succeeded' });
    } else {
      res.json({ success: false, status: paymentIntent.status });
    }

  } catch (error) {
    console.error('Payment confirmation error:', error);
    res.status(500).json({ error: 'Failed to confirm payment' });
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

// Seed admin user
async function seedAdminUser() {
  try {
    // Check if admin user already exists
    const result = await pool.query('SELECT id FROM users WHERE email = $1', ['admin@admin.com']);
    if (result.rows.length > 0) {
      console.log('🌱 Admin user already exists');
      return;
    }

    // Create admin user
    const adminId = uuidv4();
    const passwordHash = await bcrypt.hash('admin', 12);
    
    await pool.query(
      'INSERT INTO users (id, email, password_hash, first_name, last_name, role, is_active, email_verified) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)',
      [adminId, 'admin@admin.com', passwordHash, 'Admin', 'User', 'admin', true, true]
    );
    
    console.log('🌱 Admin user created: admin@admin.com / admin');
  } catch (error) {
    console.error('Error seeding admin user:', error);
  }
}

// Initialize database and start server
async function startServer() {
  try {
    await initializeDatabase();
    await seedProducts();
    await seedAdminUser();
    
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

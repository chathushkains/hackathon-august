const express = require('express');
const { Queue, Worker } = require('bullmq');
const Redis = require('ioredis');
const axios = require('axios');
const { v4: uuidv4 } = require('uuid');
const cors = require('cors');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 4002;

// Redis connection
const redis = new Redis(process.env.REDIS_URL || 'redis://localhost:6379', {
  retryDelayOnFailover: 100,
  maxRetriesPerRequest: 3,
  lazyConnect: true
});

// BullMQ queue for checkout saga
const checkoutQueue = new Queue('checkout-saga', { connection: redis });

// Medusa API configuration
const MEDUSA_BASE_URL = process.env.MEDUSA_BASE_URL || 'http://localhost:9000';
const MEDUSA_ADMIN_TOKEN = process.env.MEDUSA_ADMIN_TOKEN || '';

app.use(cors());
app.use(express.json());

// Saga steps
const sagaSteps = {
  // Step 1: Create provisional order
  async createOrder(data) {
    console.log('🔄 Creating provisional order...');
    try {
      const orderData = {
        email: data.customer.email,
        region: 'us',
        currency_code: 'usd',
        items: data.cartItems.map(item => ({
          variant_id: item.variant_id,
          quantity: item.quantity
        })),
        metadata: {
          saga_id: data.sagaId,
          status: 'provisional'
        }
      };

      const response = await axios.post(`${MEDUSA_BASE_URL}/admin/orders`, orderData, {
        headers: {
          'Content-Type': 'application/json',
          ...(MEDUSA_ADMIN_TOKEN && { 'Authorization': `Bearer ${MEDUSA_ADMIN_TOKEN}` })
        }
      });

      return { success: true, orderId: response.data.order.id };
    } catch (error) {
      console.error('❌ Failed to create order:', error.message);
      return { success: false, error: error.message };
    }
  },

  // Step 2: Reserve inventory
  async reserveInventory(data) {
    console.log('🔄 Reserving inventory...');
    try {
      // Simulate inventory reservation
      // In production, this would call a dedicated inventory service
      const reservations = data.cartItems.map(item => ({
        variant_id: item.variant_id,
        quantity: item.quantity,
        reserved_at: new Date().toISOString(),
        saga_id: data.sagaId
      }));

      // Store reservations in Redis
      await redis.setex(`reservation:${data.sagaId}`, 300, JSON.stringify(reservations));
      
      return { success: true, reservations };
    } catch (error) {
      console.error('❌ Failed to reserve inventory:', error.message);
      return { success: false, error: error.message };
    }
  },

  // Step 3: Process payment
  async processPayment(data) {
    console.log('🔄 Processing payment...');
    try {
      // Simulate payment processing with more realistic scenarios
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      // Simulate different payment scenarios
      const scenarios = [
        { success: true, message: 'Payment processed successfully', code: 'SUCCESS' },
        { success: true, message: 'Payment authorized', code: 'AUTHORIZED' },
        { success: false, message: 'Insufficient funds', code: 'INSUFFICIENT_FUNDS' },
        { success: false, message: 'Card declined', code: 'CARD_DECLINED' },
        { success: false, message: 'Payment timeout', code: 'TIMEOUT' }
      ];
      
      // 85% success rate for demo
      const isSuccess = Math.random() > 0.15;
      const scenario = scenarios[isSuccess ? Math.floor(Math.random() * 2) : Math.floor(Math.random() * 3) + 2];
      
      if (scenario.success) {
        return { 
          success: true, 
          transactionId: uuidv4(),
          message: scenario.message,
          code: scenario.code
        };
      } else {
        return { 
          success: false, 
          error: scenario.message,
          code: scenario.code
        };
      }
    } catch (error) {
      console.error('❌ Payment processing failed:', error.message);
      return { success: false, error: error.message };
    }
  },

  // Step 4: Complete order
  async completeOrder(data) {
    console.log('🔄 Completing order...');
    try {
      const response = await axios.post(`${MEDUSA_BASE_URL}/admin/orders/${data.orderId}/complete`, {}, {
        headers: {
          'Content-Type': 'application/json',
          ...(MEDUSA_ADMIN_TOKEN && { 'Authorization': `Bearer ${MEDUSA_ADMIN_TOKEN}` })
        }
      });

      return { success: true, order: response.data.order };
    } catch (error) {
      console.error('❌ Failed to complete order:', error.message);
      return { success: false, error: error.message };
    }
  },

  // Compensating actions
  async releaseInventory(sagaId) {
    console.log('🔄 Releasing inventory...');
    try {
      await redis.del(`reservation:${sagaId}`);
      return { success: true };
    } catch (error) {
      console.error('❌ Failed to release inventory:', error.message);
      return { success: false, error: error.message };
    }
  },

  async cancelOrder(orderId) {
    console.log('🔄 Cancelling order...');
    try {
      await axios.post(`${MEDUSA_BASE_URL}/admin/orders/${orderId}/cancel`, {}, {
        headers: {
          'Content-Type': 'application/json',
          ...(MEDUSA_ADMIN_TOKEN && { 'Authorization': `Bearer ${MEDUSA_ADMIN_TOKEN}` })
        }
      });
      return { success: true };
    } catch (error) {
      console.error('❌ Failed to cancel order:', error.message);
      return { success: false, error: error.message };
    }
  }
};

// Worker for processing checkout saga
const worker = new Worker('checkout-saga', async (job) => {
  const { sagaId, cartItems, customer, payment, total } = job.data;
  
  console.log(`\n🚀 Starting checkout saga: ${sagaId}`);
  
  const steps = [];
  let orderId = null;

  try {
    // Step 1: Create provisional order
    const orderResult = await sagaSteps.createOrder({ sagaId, cartItems, customer });
    if (!orderResult.success) {
      throw new Error(`Order creation failed: ${orderResult.error}`);
    }
    orderId = orderResult.orderId;
    steps.push('order_created');

    // Step 2: Reserve inventory
    const inventoryResult = await sagaSteps.reserveInventory({ sagaId, cartItems });
    if (!inventoryResult.success) {
      throw new Error(`Inventory reservation failed: ${inventoryResult.error}`);
    }
    steps.push('inventory_reserved');

    // Step 3: Process payment
    const paymentResult = await sagaSteps.processPayment({ sagaId, payment });
    if (!paymentResult.success) {
      throw new Error(`Payment failed: ${paymentResult.error}`);
    }
    steps.push('payment_processed');

    // Step 4: Complete order
    const completeResult = await sagaSteps.completeOrder({ orderId });
    if (!completeResult.success) {
      throw new Error(`Order completion failed: ${completeResult.error}`);
    }
    steps.push('order_completed');

    // Publish success event
    await redis.publish('order_events', JSON.stringify({
      type: 'order.completed',
      sagaId,
      orderId,
      customer,
      amount: total,
      items: cartItems,
      paymentMethod: payment.method,
      shippingAddress: customer.shippingAddress || '123 Demo St, Demo City',
      steps,
      timestamp: new Date().toISOString()
    }));

    console.log(`✅ Checkout saga completed successfully: ${sagaId}`);
    return { success: true, orderId, steps };

  } catch (error) {
    console.error(`❌ Checkout saga failed: ${sagaId}`, error.message);
    
    // Execute compensating transactions
    const compensations = [];
    
    if (steps.includes('inventory_reserved')) {
      const releaseResult = await sagaSteps.releaseInventory({ sagaId, cartItems });
      compensations.push('inventory_released');
    }
    
    if (steps.includes('order_created')) {
      const cancelResult = await sagaSteps.cancelOrder(orderId);
      compensations.push('order_cancelled');
    }

    // Publish failure event
    await redis.publish('order_events', JSON.stringify({
      type: 'order.failed',
      sagaId,
      orderId,
      customer: customer.email,
      amount: total,
      items: cartItems,
      error: error.message,
      steps,
      compensations,
      timestamp: new Date().toISOString()
    }));

    return { success: false, error: error.message, compensations };
  }
}, { connection: redis });

// API Routes
app.post('/checkout', async (req, res) => {
  try {
    const { cartItems, customer, payment } = req.body;
    
    if (!cartItems || !customer || !payment) {
      return res.status(400).json({ 
        success: false,
        error: 'Missing required fields',
        details: {
          required: ['cartItems', 'customer', 'payment'],
          received: Object.keys(req.body)
        }
      });
    }

    // Validate cart items
    if (!Array.isArray(cartItems) || cartItems.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'Cart is empty or invalid'
      });
    }

    // Validate customer
    if (!customer.email) {
      return res.status(400).json({
        success: false,
        error: 'Customer email is required'
      });
    }

    const sagaId = uuidv4();
    const timestamp = new Date().toISOString();
    
    // Calculate total
    const total = cartItems.reduce((sum, item) => sum + (item.price || 0) * (item.quantity || 1), 0);
    
    // Add job to queue
    await checkoutQueue.add('checkout', {
      sagaId,
      cartItems,
      customer,
      payment,
      total,
      timestamp
    }, {
      attempts: 3,
      backoff: {
        type: 'exponential',
        delay: 2000,
      },
    });

    res.json({ 
      success: true, 
      sagaId,
      message: 'Checkout process started',
      order: {
        id: sagaId,
        status: 'processing',
        total: total,
        items: cartItems.length,
        customer: customer.email,
        timestamp: timestamp
      }
    });
  } catch (error) {
    console.error('Checkout error:', error);
    res.status(500).json({ 
      success: false,
      error: 'Internal server error',
      message: error.message
    });
  }
});

// Get checkout status
app.get('/checkout/:sagaId/status', async (req, res) => {
  try {
    const { sagaId } = req.params;
    
    // In a real implementation, you'd check the job status from BullMQ
    // For now, we'll return a mock status
    res.json({
      success: true,
      sagaId,
      status: 'completed', // or 'processing', 'failed'
      message: 'Order processed successfully'
    });
  } catch (error) {
    console.error('Status check error:', error);
    res.status(500).json({ 
      success: false,
      error: 'Failed to check status'
    });
  }
});

app.get('/health', (req, res) => {
  res.json({ status: 'healthy', timestamp: new Date().toISOString() });
});

app.listen(PORT, () => {
  console.log(`🚀 Orchestrator service running on port ${PORT}`);
  console.log(`📊 BullMQ dashboard: http://localhost:4002/queues`);
});

// Graceful shutdown
process.on('SIGTERM', async () => {
  console.log('Shutting down orchestrator...');
  await worker.close();
  await checkoutQueue.close();
  await redis.quit();
  process.exit(0);
});

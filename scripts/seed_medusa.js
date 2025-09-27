const axios = require('axios');
const fetch = require('node-fetch');
require('dotenv').config();

const MEDUSA_BASE_URL = process.env.MEDUSA_BASE_URL || 'http://localhost:9000';
const MEDUSA_ADMIN_TOKEN = process.env.MEDUSA_ADMIN_TOKEN || '';

// Sample products for seeding
const sampleProducts = [
  {
    title: 'Wireless Bluetooth Headphones',
    description: 'High-quality wireless headphones with active noise cancellation and 30-hour battery life.',
    price: 99.99,
    sku: 'WBH-001',
    category: 'electronics'
  },
  {
    title: 'Smart Fitness Watch',
    description: 'Advanced fitness tracking watch with heart rate monitoring, GPS, and water resistance.',
    price: 199.99,
    sku: 'SFW-002',
    category: 'electronics'
  },
  {
    title: 'Classic Cotton T-Shirt',
    description: 'Comfortable 100% organic cotton t-shirt available in multiple colors and sizes.',
    price: 24.99,
    sku: 'CCT-001',
    category: 'fashion'
  },
  {
    title: 'Ceramic Coffee Mug Set',
    description: 'Set of 4 handcrafted ceramic coffee mugs with unique designs.',
    price: 34.99,
    sku: 'CCM-001',
    category: 'home'
  },
  {
    title: 'LED Desk Lamp',
    description: 'Adjustable LED desk lamp with USB charging port and touch controls.',
    price: 49.99,
    sku: 'LDL-002',
    category: 'home'
  },
  {
    title: 'Denim Jeans',
    description: 'Premium denim jeans with modern slim fit and stretch comfort.',
    price: 79.99,
    sku: 'DJ-002',
    category: 'fashion'
  }
];

async function createProduct(product) {
  try {
    const productData = {
      title: product.title,
      description: product.description,
      status: 'published',
      variants: [
        {
          title: 'Default',
          sku: product.sku,
          prices: [
            {
              currency_code: 'usd',
              amount: Math.round(product.price * 100) // Convert to cents
            }
          ]
        }
      ],
      metadata: {
        category: product.category
      }
    };

    const response = await axios.post(`${MEDUSA_BASE_URL}/admin/products`, productData, {
      headers: {
        'Content-Type': 'application/json',
        ...(MEDUSA_ADMIN_TOKEN && { 'Authorization': `Bearer ${MEDUSA_ADMIN_TOKEN}` })
      }
    });

    return response.data.product;
  } catch (error) {
    console.error(`❌ Failed to create product ${product.title}:`, error.message);
    return null;
  }
}

async function seedMedusa() {
  console.log('🌱 Starting Medusa seeding...');
  
  try {
    // Test connection to Medusa
    const healthResponse = await axios.get(`${MEDUSA_BASE_URL}/health`);
    console.log('✅ Medusa is running and healthy');

    let successCount = 0;
    let failCount = 0;

    for (const product of sampleProducts) {
      console.log(`🔄 Creating product: ${product.title}`);
      const createdProduct = await createProduct(product);
      
      if (createdProduct) {
        console.log(`✅ Created: ${product.title} (ID: ${createdProduct.id})`);
        successCount++;
      } else {
        failCount++;
      }
    }

    console.log(`\n🎉 Seeding completed!`);
    console.log(`✅ Successfully created: ${successCount} products`);
    console.log(`❌ Failed: ${failCount} products`);
    
    if (successCount > 0) {
      console.log(`\n🛒 Storefront: http://localhost:3000`);
      console.log(`👨‍💼 Admin Dashboard: http://localhost:3001`);
      console.log(`🔧 Medusa Admin: http://localhost:9000`);
    }

  } catch (error) {
    console.error('❌ Seeding failed:', error.message);
    console.log('\n💡 Make sure Medusa is running:');
    console.log('   docker-compose up -d');
    console.log('   or');
    console.log('   cd services/medusa && npm run dev');
  }
}

// Run seeding if called directly
if (require.main === module) {
  seedMedusa();
}

module.exports = { seedMedusa, sampleProducts };

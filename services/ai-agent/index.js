const express = require('express');
const OpenAI = require('openai');
const axios = require('axios');
const cors = require('cors');
const { v4: uuidv4 } = require('uuid');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 4004;

// OpenAI client (optional)
const openai = process.env.OPENAI_API_KEY ? new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
}) : null;

// Medusa API configuration
const MEDUSA_BASE_URL = process.env.MEDUSA_BASE_URL || 'http://localhost:9000';
const MEDUSA_ADMIN_TOKEN = process.env.MEDUSA_ADMIN_TOKEN || '';

app.use(cors());
app.use(express.json());

// AI-powered product generation
async function generateProducts(businessName, category, productRange) {
  if (!openai) {
    console.log('🤖 OpenAI not available, using fallback products');
    return getFallbackProducts(category, productRange);
  }

  try {
    const prompt = `Generate ${productRange} e-commerce product titles and descriptions for a ${businessName} store in the ${category} category. 
    Return as JSON array with objects containing: title, description, price (number), sku (string), and category.
    Make the products realistic and appealing for the target market.`;

    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content: "You are an expert e-commerce product manager. Generate realistic, appealing products with proper pricing and SKUs."
        },
        {
          role: "user",
          content: prompt
        }
      ],
      max_tokens: 2000,
      temperature: 0.7,
    });

    const content = completion.choices[0].message.content;
    const products = JSON.parse(content);
    
    return products.map(product => ({
      ...product,
      id: uuidv4(),
      created_at: new Date().toISOString()
    }));
  } catch (error) {
    console.error('Error generating products with AI:', error);
    // Fallback to predefined products
    return getFallbackProducts(category, productRange);
  }
}

// Fallback products when AI is not available
function getFallbackProducts(category, count) {
  const productTemplates = {
    'electronics': [
      { title: 'Wireless Bluetooth Headphones', description: 'High-quality wireless headphones with noise cancellation', price: 99.99, sku: 'WBH-001' },
      { title: 'Smart Fitness Watch', description: 'Advanced fitness tracking with heart rate monitoring', price: 199.99, sku: 'SFW-002' },
      { title: 'Portable Phone Charger', description: 'Fast-charging portable battery pack for smartphones', price: 29.99, sku: 'PPC-003' }
    ],
    'fashion': [
      { title: 'Classic Cotton T-Shirt', description: 'Comfortable 100% cotton t-shirt in various colors', price: 24.99, sku: 'CCT-001' },
      { title: 'Denim Jeans', description: 'Premium denim jeans with modern fit', price: 79.99, sku: 'DJ-002' },
      { title: 'Leather Sneakers', description: 'Stylish leather sneakers for everyday wear', price: 89.99, sku: 'LS-003' }
    ],
    'home': [
      { title: 'Ceramic Coffee Mug Set', description: 'Set of 4 handcrafted ceramic coffee mugs', price: 34.99, sku: 'CCM-001' },
      { title: 'LED Desk Lamp', description: 'Adjustable LED desk lamp with USB charging port', price: 49.99, sku: 'LDL-002' },
      { title: 'Throw Pillow Set', description: 'Decorative throw pillows for living room', price: 39.99, sku: 'TPS-003' }
    ]
  };

  const templates = productTemplates[category.toLowerCase()] || productTemplates['electronics'];
  return templates.slice(0, Math.min(count, templates.length));
}

// Create products in Medusa
async function createProductsInMedusa(products) {
  const createdProducts = [];
  
  for (const product of products) {
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
          ai_generated: true,
          category: product.category || 'general'
        }
      };

      const response = await axios.post(`${MEDUSA_BASE_URL}/admin/products`, productData, {
        headers: {
          'Content-Type': 'application/json',
          ...(MEDUSA_ADMIN_TOKEN && { 'Authorization': `Bearer ${MEDUSA_ADMIN_TOKEN}` })
        }
      });

      createdProducts.push(response.data.product);
      console.log(`✅ Created product: ${product.title}`);
    } catch (error) {
      console.error(`❌ Failed to create product ${product.title}:`, error.message);
    }
  }

  return createdProducts;
}

// API Routes
app.post('/generate-store', async (req, res) => {
  try {
    const { businessName, category, productRange } = req.body;
    
    if (!businessName || !category || !productRange) {
      return res.status(400).json({ 
        error: 'Missing required fields: businessName, category, productRange' 
      });
    }

    console.log(`🚀 Generating store for ${businessName} in ${category} category with ${productRange} products`);

    // Generate products using AI
    const products = await generateProducts(businessName, category, parseInt(productRange));
    
    // Create products in Medusa
    const createdProducts = await createProductsInMedusa(products);

    // Generate store URL (for demo purposes)
    const storeId = uuidv4();
    const storeUrl = `http://localhost:3000?store=${storeId}`;

    res.json({
      success: true,
      storeId,
      storeUrl,
      businessName,
      category,
      productsCreated: createdProducts.length,
      products: createdProducts.map(p => ({
        id: p.id,
        title: p.title,
        price: p.variants?.[0]?.prices?.[0]?.amount / 100 || 0
      })),
      message: `Successfully generated ${createdProducts.length} products for ${businessName}`
    });

  } catch (error) {
    console.error('Store generation error:', error);
    res.status(500).json({ 
      error: 'Failed to generate store',
      details: error.message 
    });
  }
});

app.get('/health', (req, res) => {
  res.json({ 
    status: 'healthy', 
    timestamp: new Date().toISOString(),
    openai_available: !!process.env.OPENAI_API_KEY
  });
});

app.listen(PORT, () => {
  console.log(`🚀 AI Agent service running on port ${PORT}`);
  console.log(`🤖 OpenAI available: ${!!process.env.OPENAI_API_KEY}`);
});

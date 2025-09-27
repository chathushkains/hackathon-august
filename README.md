# Hackathon E-commerce Application

A distributed, event-driven e-commerce system built with Medusa.js, Next.js, and AI-powered store generation. This project demonstrates the Saga pattern for distributed transactions, real-time updates via Socket.IO, and AI-assisted product generation.

## 🏗️ Architecture

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Storefront    │    │  Admin Dashboard│    │   AI Agent      │
│   (Next.js)     │    │   (Next.js)     │    │   (Node.js)     │
│   Port: 3000    │    │   Port: 3001    │    │   Port: 4004    │
└─────────┬───────┘    └─────────┬───────┘    └─────────┬───────┘
          │                      │                      │
          │                      │                      │
          ▼                      ▼                      ▼
┌─────────────────────────────────────────────────────────────────┐
│                    Event Server (Socket.IO)                    │
│                         Port: 4003                            │
└─────────────────────┬───────────────────────────────────────────┘
                      │
                      ▼
┌─────────────────────────────────────────────────────────────────┐
│                  Orchestrator (Saga Pattern)                   │
│                         Port: 4002                            │
└─────────────────────┬───────────────────────────────────────────┘
                      │
                      ▼
┌─────────────────────────────────────────────────────────────────┐
│                    Medusa Backend                              │
│                         Port: 9000                            │
└─────────────────────┬───────────────────────────────────────────┘
                      │
          ┌───────────┴───────────┐
          ▼                       ▼
┌─────────────┐         ┌─────────────┐
│ PostgreSQL  │         │    Redis    │
│ Port: 5432  │         │ Port: 6379  │
└─────────────┘         └─────────────┘
```

## 🚀 Quick Start

### Prerequisites

- Node.js 18+
- Docker & Docker Compose
- Git

### 1. Clone and Setup

```bash
git clone <your-repo-url>
cd hackathon-august
chmod +x scripts/setup.sh
./scripts/setup.sh
```

### 2. Manual Setup (Alternative)

```bash
# Install dependencies
npm install

# Start Docker services
npm run docker:up

# Wait for services to start (15-20 seconds)
sleep 20

# Seed sample data
npm run seed

# Start all services in development
npm run dev
```

### 3. Access the Application

- **Storefront**: http://localhost:3000
- **Admin Dashboard**: http://localhost:3001
- **Medusa Admin**: http://localhost:9000
- **Orchestrator API**: http://localhost:4002
- **Event Server**: http://localhost:4003
- **AI Agent**: http://localhost:4004

## 🎯 Features

### Distributed Transaction Flow (Saga Pattern)

1. **Order Creation**: Provisional order created in Medusa
2. **Inventory Reservation**: Stock reserved with timeout
3. **Payment Processing**: Simulated payment with 90% success rate
4. **Order Completion**: Final order confirmation
5. **Compensation**: Automatic rollback on failures

### Real-time Updates

- **Socket.IO**: Real-time communication between services
- **Redis Pub/Sub**: Event broadcasting
- **Live Stats**: Order counts, revenue, inventory alerts

### AI-Powered Store Generation

- **OpenAI Integration**: Generate product descriptions and titles
- **Fallback System**: Predefined products when AI unavailable
- **Category-based**: Electronics, Fashion, Home & Garden

## 🛠️ Development

### Available Scripts

```bash
# Development
npm run dev                    # Start all services
npm run dev:medusa            # Medusa only
npm run dev:orchestrator      # Orchestrator only
npm run dev:event-server      # Event server only
npm run dev:storefront        # Storefront only
npm run dev:admin             # Admin dashboard only
npm run dev:ai-agent          # AI agent only

# Docker
npm run docker:up             # Start Docker services
npm run docker:down           # Stop Docker services

# Data
npm run seed                  # Seed sample data

# Build
npm run build                 # Build production
npm run build:storefront      # Build storefront
npm run build:admin           # Build admin dashboard
```

### Environment Variables

Create `.env` files in each service directory:

```bash
# services/orchestrator/.env
REDIS_URL=redis://localhost:6379
MEDUSA_BASE_URL=http://localhost:9000
MEDUSA_ADMIN_TOKEN=your-admin-token

# services/event-server/.env
REDIS_URL=redis://localhost:6379

# services/ai-agent/.env
OPENAI_API_KEY=your-openai-api-key

# apps/storefront/.env.local
NEXT_PUBLIC_MEDUSA_BASE_URL=http://localhost:9000
NEXT_PUBLIC_ORCHESTRATOR_URL=http://localhost:4002
NEXT_PUBLIC_EVENT_SERVER_URL=http://localhost:4003
```

## 🧪 Testing the System

### 1. Basic Flow Test

```bash
# Start all services
npm run dev

# Open storefront in browser
open http://localhost:3000

# Add products to cart and checkout
# Watch orchestrator logs for saga steps
# Check admin dashboard for real-time updates
```

### 2. API Testing

```bash
# Test checkout via API
curl -X POST http://localhost:4002/checkout \
  -H "Content-Type: application/json" \
  -d '{
    "cartItems": [{"variant_id": "var_123", "quantity": 1}],
    "customer": {"email": "test@example.com"},
    "payment": {"method": "test"}
  }'

# Test AI agent
curl -X POST http://localhost:4004/generate-store \
  -H "Content-Type: application/json" \
  -d '{
    "businessName": "Tech Store",
    "category": "electronics",
    "productRange": "5"
  }'
```

### 3. Real-time Testing

1. Open storefront and admin dashboard in separate tabs
2. Add items to cart and checkout
3. Watch real-time updates in admin dashboard
4. Check orchestrator logs for saga execution

## 📊 Monitoring

### Service Health Checks

- **Orchestrator**: http://localhost:4002/health
- **Event Server**: http://localhost:4003/health
- **AI Agent**: http://localhost:4004/health
- **Medusa**: http://localhost:9000/health

### Logs

```bash
# View orchestrator logs
cd services/orchestrator && npm run dev

# View event server logs
cd services/event-server && npm run dev

# View Docker logs
docker-compose logs -f
```

## 🚀 Deployment

### Docker Production

```bash
# Build production images
docker-compose -f docker-compose.prod.yml up -d

# Scale services
docker-compose up -d --scale orchestrator=3
```

### AWS Deployment

1. **ECS Fargate**: For Medusa and orchestrator services
2. **RDS**: For PostgreSQL database
3. **ElastiCache**: For Redis
4. **Amplify**: For Next.js applications
5. **API Gateway**: For API routing

### Environment Variables for Production

```bash
# Database
DATABASE_URL=postgres://user:pass@rds-endpoint:5432/medusa

# Redis
REDIS_URL=redis://elasticache-endpoint:6379

# CORS
MEDUSA_ADMIN_CORS=https://your-domain.com
MEDUSA_STORE_CORS=https://your-domain.com

# Security
JWT_SECRET=your-production-jwt-secret
COOKIE_SECRET=your-production-cookie-secret
```

## 🎯 Hackathon Demo Script

### 1. Setup (5 minutes)
```bash
./scripts/setup.sh
npm run dev
```

### 2. Show Architecture (2 minutes)
- Explain distributed transaction flow
- Show real-time updates
- Demonstrate AI integration

### 3. Live Demo (8 minutes)
1. Open storefront → Add products to cart
2. Show checkout process → Watch orchestrator logs
3. Open admin dashboard → Show real-time updates
4. Test AI agent → Generate new products
5. Show failure scenarios → Demonstrate compensation

### 4. Technical Highlights (5 minutes)
- Saga pattern implementation
- Event-driven architecture
- Real-time communication
- AI-powered features
- Scalability considerations

## 🔧 Troubleshooting

### Common Issues

1. **Medusa not starting**: Wait 15-20 seconds for PostgreSQL initialization
2. **Redis connection errors**: Ensure Redis is running on port 6379
3. **CORS errors**: Check environment variables for correct URLs
4. **AI agent failing**: Check OpenAI API key or use fallback products

### Debug Commands

```bash
# Check service status
docker-compose ps

# View logs
docker-compose logs medusa
docker-compose logs redis
docker-compose logs postgres

# Restart services
docker-compose restart

# Clean restart
docker-compose down && docker-compose up -d
```

## 📈 Performance Considerations

- **Redis**: Use Redis Cluster for high availability
- **PostgreSQL**: Configure connection pooling
- **BullMQ**: Scale workers horizontally
- **Socket.IO**: Use Redis adapter for scaling
- **Medusa**: Enable caching and CDN

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## 📄 License

MIT License - see LICENSE file for details

## 🙏 Acknowledgments

- Medusa.js for the e-commerce backend
- Next.js for the frontend framework
- BullMQ for job queue management
- Socket.IO for real-time communication
- OpenAI for AI-powered features

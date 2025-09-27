# 🎯 Hackathon Demo Script

## Quick Start (2 minutes)

```bash
# 1. Setup everything
./scripts/setup.sh

# 2. Start all services
npm run dev
```

## Live Demo Flow (10 minutes)

### 1. Show Architecture (2 minutes)
- **Distributed System**: Explain the microservices architecture
- **Saga Pattern**: Show how distributed transactions work
- **Real-time Updates**: Demonstrate event-driven communication
- **AI Integration**: Show AI-powered store generation

### 2. Storefront Demo (3 minutes)
1. Open http://localhost:3000
2. Show product catalog (seeded with sample data)
3. Add products to cart
4. Demonstrate checkout process
5. Show real-time order status updates

### 3. Admin Dashboard Demo (2 minutes)
1. Open http://localhost:3001
2. Show real-time statistics
3. Demonstrate live order tracking
4. Show inventory alerts
5. Explain real-time updates via Socket.IO

### 4. Distributed Transaction Demo (2 minutes)
1. Open orchestrator logs (terminal)
2. Trigger checkout from storefront
3. Show saga steps in real-time:
   - Order creation
   - Inventory reservation
   - Payment processing
   - Order completion
4. Demonstrate failure scenarios and compensation

### 5. AI Agent Demo (1 minute)
1. Test AI agent: http://localhost:4004/generate-store
2. Show AI-generated products
3. Demonstrate fallback system

## API Testing Commands

```bash
# Test checkout
curl -X POST http://localhost:4002/checkout \
  -H "Content-Type: application/json" \
  -d '{
    "cartItems": [{"variant_id": "var_123", "quantity": 1}],
    "customer": {"email": "demo@example.com"},
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

# Check health
curl http://localhost:4002/health
curl http://localhost:4003/health
curl http://localhost:4004/health
```

## Key Technical Highlights

### 1. Saga Pattern Implementation
- **Orchestrator Service**: Manages distributed transactions
- **Compensating Actions**: Automatic rollback on failures
- **Event Publishing**: Real-time status updates

### 2. Event-Driven Architecture
- **Redis Pub/Sub**: Event broadcasting
- **Socket.IO**: Real-time client updates
- **BullMQ**: Job queue management

### 3. AI Integration
- **OpenAI API**: Product generation
- **Fallback System**: Predefined products
- **Category-based**: Multiple product types

### 4. Real-time Features
- **Live Statistics**: Order counts, revenue
- **Order Tracking**: Real-time status updates
- **Inventory Alerts**: Low stock notifications

## Troubleshooting

### If services don't start:
```bash
# Check Docker
docker-compose ps

# Restart services
docker-compose restart

# View logs
docker-compose logs -f
```

### If products don't load:
```bash
# Re-seed data
npm run seed

# Check Medusa health
curl http://localhost:9000/health
```

### If real-time updates don't work:
```bash
# Check Redis
docker-compose logs redis

# Check event server
cd services/event-server && npm run dev
```

## Demo Tips

1. **Prepare beforehand**: Run setup script 5 minutes before demo
2. **Multiple tabs**: Open storefront and admin in separate tabs
3. **Show logs**: Keep orchestrator terminal visible
4. **Explain concepts**: Don't just click buttons, explain what's happening
5. **Show failures**: Demonstrate error handling and compensation

## Success Metrics

- ✅ All services running and healthy
- ✅ Real-time updates working
- ✅ Distributed transactions completing
- ✅ AI agent generating products
- ✅ Admin dashboard showing live data
- ✅ Error handling and compensation working

## Next Steps for Production

1. **Security**: Add authentication and authorization
2. **Monitoring**: Add logging and metrics
3. **Scaling**: Horizontal scaling with load balancers
4. **CI/CD**: Automated deployment pipeline
5. **Testing**: Unit and integration tests
6. **Documentation**: API documentation and guides

#!/bin/bash

echo "🚀 Setting up Hackathon E-commerce Application"
echo "=============================================="

# Check if Docker is running
if ! docker info > /dev/null 2>&1; then
    echo "❌ Docker is not running. Please start Docker and try again."
    exit 1
fi

echo "✅ Docker is running"

# Install root dependencies
echo "📦 Installing root dependencies..."
npm install

# Install dependencies for each service
echo "📦 Installing service dependencies..."

# Medusa service
echo "  - Medusa backend..."
cd services/medusa && npm install && cd ../..

# Orchestrator service
echo "  - Orchestrator service..."
cd services/orchestrator && npm install && cd ../..

# Event server
echo "  - Event server..."
cd services/event-server && npm install && cd ../..

# AI agent
echo "  - AI agent..."
cd services/ai-agent && npm install && cd ../..

# Storefront app
echo "  - Storefront app..."
cd apps/storefront && npm install && cd ../..

# Admin dashboard
echo "  - Admin dashboard..."
cd apps/admin && npm install && cd ../..

echo "✅ All dependencies installed"

# Start Docker services
echo "🐳 Starting Docker services..."
docker-compose up -d

# Wait for services to be ready
echo "⏳ Waiting for services to start..."
sleep 15

# Check if Medusa is ready
echo "🔍 Checking Medusa health..."
for i in {1..30}; do
    if curl -s http://localhost:9000/health > /dev/null; then
        echo "✅ Medusa is ready"
        break
    fi
    echo "  Waiting for Medusa... ($i/30)"
    sleep 2
done

# Seed Medusa with sample data
echo "🌱 Seeding Medusa with sample data..."
node scripts/seed_medusa.js

echo ""
echo "🎉 Setup completed!"
echo ""
echo "📋 Services running:"
echo "  🛒 Storefront:     http://localhost:3000"
echo "  👨‍💼 Admin Dashboard: http://localhost:3001"
echo "  🔧 Medusa Admin:   http://localhost:9000"
echo "  ⚙️  Orchestrator:   http://localhost:4002"
echo "  📡 Event Server:   http://localhost:4003"
echo "  🤖 AI Agent:       http://localhost:4004"
echo ""
echo "🚀 To start all services in development mode:"
echo "  npm run dev"
echo ""
echo "🛑 To stop all services:"
echo "  npm run docker:down"

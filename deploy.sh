#!/bin/bash

# HelpDesk Mini Deployment Script

echo "🚀 Starting HelpDesk Mini Deployment..."

# Check if Docker is installed
if ! command -v docker &> /dev/null; then
    echo "❌ Docker is not installed. Please install Docker first."
    exit 1
fi

# Check if Docker Compose is installed
if ! command -v docker-compose &> /dev/null; then
    echo "❌ Docker Compose is not installed. Please install Docker Compose first."
    exit 1
fi

echo "✅ Docker and Docker Compose are installed"

# Create production environment file
echo "📝 Creating production environment..."
cat > .env.production << EOF
NODE_ENV=production
MONGODB_URI=mongodb://mongodb:27017/helpdesk_mini
JWT_SECRET=$(openssl rand -hex 32)
PORT=5000
EOF

echo "✅ Production environment created"

# Build and start services
echo "🏗️ Building and starting services..."
docker-compose up --build -d

echo "⏳ Waiting for services to start..."
sleep 10

# Check if services are running
if docker-compose ps | grep -q "Up"; then
    echo "✅ Services are running!"
    echo ""
    echo "🎉 HelpDesk Mini is now deployed!"
    echo ""
    echo "📋 Service URLs:"
    echo "   Frontend: http://localhost"
    echo "   Backend API: http://localhost:5000"
    echo "   MongoDB: mongodb://localhost:27017"
    echo ""
    echo "🔧 Management Commands:"
    echo "   View logs: docker-compose logs -f"
    echo "   Stop services: docker-compose down"
    echo "   Restart: docker-compose restart"
    echo ""
else
    echo "❌ Failed to start services. Check logs with: docker-compose logs"
    exit 1
fi
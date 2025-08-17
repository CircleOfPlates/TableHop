#!/bin/bash

# TableHop Deployment Script
# This script helps deploy TableHop to production

set -e

echo "🚀 TableHop Deployment Script"
echo "=============================="

# Check if .env file exists
if [ ! -f .env ]; then
    echo "❌ .env file not found!"
    echo "Please copy env.example to .env and configure your environment variables:"
    echo "cp env.example .env"
    echo "Then edit .env with your production values."
    exit 1
fi

# Load environment variables
source .env

# Validate required environment variables
if [ -z "$DATABASE_URL" ]; then
    echo "❌ DATABASE_URL is not set in .env"
    exit 1
fi

if [ -z "$SESSION_SECRET" ]; then
    echo "❌ SESSION_SECRET is not set in .env"
    exit 1
fi

if [ -z "$FRONTEND_URL" ]; then
    echo "❌ FRONTEND_URL is not set in .env"
    exit 1
fi

if [ -z "$API_URL" ]; then
    echo "❌ API_URL is not set in .env"
    exit 1
fi

echo "✅ Environment variables validated"

# Build and deploy
echo "🔨 Building and deploying..."

# Stop existing containers
echo "🛑 Stopping existing containers..."
docker-compose -f docker-compose.prod.yml down

# Build images
echo "🔨 Building Docker images..."
docker-compose -f docker-compose.prod.yml build

# Start services
echo "🚀 Starting services..."
docker-compose -f docker-compose.prod.yml up -d

# Wait for services to be ready
echo "⏳ Waiting for services to be ready..."
sleep 10

# Check if API is responding
echo "🔍 Checking API health..."
if curl -f http://localhost:4000/health > /dev/null 2>&1; then
    echo "✅ API is healthy"
else
    echo "❌ API health check failed"
    echo "Check logs with: docker-compose -f docker-compose.prod.yml logs api"
    exit 1
fi

# Check if web is responding
echo "🔍 Checking web service..."
if curl -f http://localhost:80 > /dev/null 2>&1; then
    echo "✅ Web service is healthy"
else
    echo "❌ Web service health check failed"
    echo "Check logs with: docker-compose -f docker-compose.prod.yml logs web"
    exit 1
fi

echo ""
echo "🎉 Deployment completed successfully!"
echo ""
echo "📱 Your application is now running:"
echo "   Frontend: $FRONTEND_URL"
echo "   API: $API_URL"
echo "   API Docs: $API_URL/api-docs"
echo ""
echo "📊 Useful commands:"
echo "   View logs: docker-compose -f docker-compose.prod.yml logs -f"
echo "   Stop services: docker-compose -f docker-compose.prod.yml down"
echo "   Restart services: docker-compose -f docker-compose.prod.yml restart"
echo ""
echo "🔧 Next steps:"
echo "   1. Set up your domain and SSL certificates"
echo "   2. Configure your reverse proxy (if needed)"
echo "   3. Set up monitoring and backups"
echo "   4. Create your admin user: docker-compose -f docker-compose.prod.yml exec api npm run create-admin"

#!/bin/bash

# TableHop Deployment Script
# This script helps you prepare and deploy TableHop

set -e

echo "🚀 TableHop Deployment Script"
echo "=============================="

# Check if .env files exist
if [ ! -f "apps/api/.env" ]; then
    echo "❌ Missing apps/api/.env file"
    echo "Please create apps/api/.env with the following variables:"
    echo "NODE_ENV=production"
    echo "PORT=4000"
    echo "SESSION_SECRET=your-super-secret-session-key-here-min-16-chars"
    echo "DATABASE_URL=your-database-url-here"
    exit 1
fi

if [ ! -f "apps/web/.env" ]; then
    echo "❌ Missing apps/web/.env file"
    echo "Please create apps/web/.env with:"
    echo "VITE_API_URL=https://your-api-domain.com"
    exit 1
fi

echo "✅ Environment files found"

# Build the applications
echo "🔨 Building applications..."

echo "Building API..."
cd apps/api
npm run build
cd ../..

echo "Building Web..."
cd apps/web
npm run build
cd ../..

echo "✅ Builds completed successfully!"

echo ""
echo "🎯 Next Steps:"
echo "1. Push your code to GitHub"
echo "2. Choose your deployment platform:"
echo "   - Railway (recommended): https://railway.app"
echo "   - Vercel + Supabase (free): https://vercel.com + https://supabase.com"
echo "   - Render: https://render.com"
echo "   - Netlify + Supabase: https://netlify.com + https://supabase.com"
echo ""
echo "3. Follow the deployment guide in DEPLOYMENT.md"
echo ""
echo "4. After deployment, run database setup:"
echo "   npm run db:push -w apps/api"
echo "   npm run create-neighbourhoods -w apps/api"
echo "   npm run create-events -w apps/api"
echo "   npm run create-admin -w apps/api"
echo ""
echo "�� Happy deploying!"

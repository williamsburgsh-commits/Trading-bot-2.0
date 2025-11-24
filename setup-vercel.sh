#!/bin/bash

# Vercel Deployment Setup Script
echo "🚀 Setting up Trading Bot for Vercel deployment..."

# Check if Vercel CLI is installed
if ! command -v vercel &> /dev/null; then
    echo "❌ Vercel CLI not found. Install it with: npm i -g vercel"
    exit 1
fi

# Install dependencies
echo "📦 Installing dependencies..."
npm install --legacy-peer-deps

# Generate Prisma client
echo "🔧 Generating Prisma client..."
npx prisma generate

# Build the project
echo "🏗️  Building project..."
npm run build

echo "✅ Setup complete!"
echo ""
echo "📝 Next steps:"
echo "1. Run 'vercel' to deploy to Vercel"
echo "2. Configure environment variables in Vercel dashboard:"
echo "   - DATABASE_URL (required)"
echo "   - FINNHUB_API_KEY (required)"
echo "   - Others are optional (see VERCEL_DEPLOYMENT.md)"
echo ""
echo "3. For database setup, see VERCEL_DEPLOYMENT.md"
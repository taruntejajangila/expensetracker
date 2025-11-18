#!/bin/bash
# Force trigger Railway deployment

echo "🚂 Forcing Railway Deployment..."
echo ""

# Check if Railway CLI is installed
if ! command -v railway &> /dev/null; then
    echo "❌ Railway CLI not found"
    echo "📦 Installing Railway CLI..."
    npm install -g @railway/cli
fi

echo "🔐 Logging into Railway..."
railway login

echo "🔗 Linking to Railway project..."
railway link

echo "📤 Deploying to Railway..."
railway up

echo ""
echo "✅ Deployment triggered!"
echo "📊 Check Railway dashboard for deployment status"


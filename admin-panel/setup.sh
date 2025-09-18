#!/bin/bash

echo "🚀 Setting up Mobile App Admin Panel..."

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed. Please install Node.js 18+ first."
    exit 1
fi

# Check Node.js version
NODE_VERSION=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)
if [ "$NODE_VERSION" -lt 18 ]; then
    echo "❌ Node.js version 18+ is required. Current version: $(node -v)"
    exit 1
fi

echo "✅ Node.js version: $(node -v)"

# Install dependencies
echo "📦 Installing dependencies..."
npm install

if [ $? -eq 0 ]; then
    echo "✅ Dependencies installed successfully!"
else
    echo "❌ Failed to install dependencies"
    exit 1
fi

# Create .env.local if it doesn't exist
if [ ! -f .env.local ]; then
    echo "🔧 Creating .env.local file..."
    cat > .env.local << EOF
# App Configuration
NEXT_PUBLIC_APP_NAME="Mobile App Admin"
NEXT_PUBLIC_API_URL="http://localhost:8000/api"

# Database (if using external DB)
# DATABASE_URL="your-database-url"

# Authentication
# JWT_SECRET="your-jwt-secret"
EOF
    echo "✅ .env.local file created!"
fi

echo ""
echo "🎉 Setup completed successfully!"
echo ""
echo "To start the admin panel:"
echo "  npm run dev"
echo ""
echo "Then open: http://localhost:3000"
echo ""
echo "Happy coding! 🚀"

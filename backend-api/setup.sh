#!/bin/bash

# =============================================
# EXPENSE TRACKER BACKEND API - SETUP SCRIPT
# =============================================

echo "🚀 Setting up Expense Tracker Backend API..."

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed. Please install Node.js 18+ first."
    echo "   Visit: https://nodejs.org/"
    exit 1
fi

# Check Node.js version
NODE_VERSION=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)
if [ "$NODE_VERSION" -lt 18 ]; then
    echo "❌ Node.js version 18+ is required. Current version: $(node -v)"
    exit 1
fi

echo "✅ Node.js version: $(node -v)"

# Check if PostgreSQL is installed
if ! command -v psql &> /dev/null; then
    echo "⚠️  PostgreSQL is not installed. Please install PostgreSQL first."
    echo "   Ubuntu/Debian: sudo apt-get install postgresql postgresql-contrib"
    echo "   macOS: brew install postgresql"
    echo "   CentOS/RHEL: sudo yum install postgresql postgresql-server"
    echo ""
    echo "   Or use Docker: docker run --name postgres -e POSTGRES_PASSWORD=password -d -p 5432:5432 postgres"
    echo ""
    read -p "Continue without PostgreSQL? (y/n): " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        exit 1
    fi
else
    echo "✅ PostgreSQL is installed"
fi

# Create necessary directories
echo "📁 Creating directories..."
mkdir -p logs
mkdir -p uploads
mkdir -p dist

# Install dependencies
echo "📦 Installing dependencies..."
npm install

# Create environment file
if [ ! -f .env ]; then
    echo "🔧 Creating .env file..."
    cp env.example .env
    echo "✅ .env file created. Please update it with your database credentials."
else
    echo "✅ .env file already exists"
fi

# Create TypeScript config
if [ ! -f tsconfig.json ]; then
    echo "⚙️  Creating TypeScript configuration..."
    cat > tsconfig.json << EOF
{
  "compilerOptions": {
    "target": "ES2020",
    "module": "commonjs",
    "lib": ["ES2020"],
    "outDir": "./dist",
    "rootDir": "./src",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true,
    "resolveJsonModule": true,
    "declaration": true,
    "declarationMap": true,
    "sourceMap": true,
    "removeComments": true,
    "noImplicitAny": true,
    "strictNullChecks": true,
    "strictFunctionTypes": true,
    "noImplicitThis": true,
    "noImplicitReturns": true,
    "noFallthroughCasesInSwitch": true,
    "moduleResolution": "node",
    "baseUrl": "./",
    "paths": {
      "@/*": ["src/*"]
    },
    "allowSyntheticDefaultImports": true,
    "experimentalDecorators": true,
    "emitDecoratorMetadata": true
  },
  "include": [
    "src/**/*"
  ],
  "exclude": [
    "node_modules",
    "dist",
    "**/*.test.ts"
  ]
}
EOF
    echo "✅ TypeScript configuration created"
fi

# Create nodemon config
if [ ! -f nodemon.json ]; then
    echo "🔄 Creating nodemon configuration..."
    cat > nodemon.json << EOF
{
  "watch": ["src"],
  "ext": "ts,js,json",
  "ignore": ["src/**/*.spec.ts"],
  "exec": "ts-node ./src/server.ts"
}
EOF
    echo "✅ Nodemon configuration created"
fi

# Create database setup script
echo "🗄️  Creating database setup script..."
cat > scripts/setup-db.sh << 'EOF'
#!/bin/bash

# Database setup script
echo "🗄️  Setting up PostgreSQL database..."

# Check if PostgreSQL is running
if ! pg_isready -q; then
    echo "❌ PostgreSQL is not running. Please start PostgreSQL first."
    exit 1
fi

# Create database
echo "📊 Creating database..."
createdb expense_tracker_db 2>/dev/null || echo "Database already exists"

# Run schema
echo "📋 Running database schema..."
psql -d expense_tracker_db -f ../database/schema.sql

echo "✅ Database setup complete!"
echo "   Database: expense_tracker_db"
echo "   User: postgres (default)"
echo "   Update .env file with your database credentials"
EOF

chmod +x scripts/setup-db.sh

# Create start script
echo "▶️  Creating start script..."
cat > start.sh << 'EOF'
#!/bin/bash

# Start script for Expense Tracker Backend API
echo "🚀 Starting Expense Tracker Backend API..."

# Check if .env exists
if [ ! -f .env ]; then
    echo "❌ .env file not found. Please run setup.sh first."
    exit 1
fi

# Check if node_modules exists
if [ ! -d "node_modules" ]; then
    echo "📦 Installing dependencies..."
    npm install
fi

# Start development server
echo "🔥 Starting development server..."
npm run dev
EOF

chmod +x start.sh

# Create production start script
echo "🚀 Creating production start script..."
cat > start-prod.sh << 'EOF'
#!/bin/bash

# Production start script for Expense Tracker Backend API
echo "🚀 Starting Expense Tracker Backend API in production mode..."

# Check if .env exists
if [ ! -f .env ]; then
    echo "❌ .env file not found. Please run setup.sh first."
    exit 1
fi

# Check if dist exists
if [ ! -d "dist" ]; then
    echo "🔨 Building application..."
    npm run build
fi

# Start production server
echo "🔥 Starting production server..."
npm start
EOF

chmod +x start-prod.sh

echo ""
echo "🎉 Setup complete! Here's what to do next:"
echo ""
echo "1. 📝 Update .env file with your database credentials:"
echo "   - DB_HOST, DB_PORT, DB_NAME, DB_USER, DB_PASSWORD"
echo "   - JWT_SECRET (generate a strong random string)"
echo ""
echo "2. 🗄️  Set up your database:"
echo "   - Run: ./scripts/setup-db.sh"
echo "   - Or manually create database and run schema.sql"
echo ""
echo "3. 🚀 Start the development server:"
echo "   - Run: ./start.sh"
echo "   - Or: npm run dev"
echo ""
echo "4. 🔨 Build for production:"
echo "   - Run: npm run build"
echo "   - Then: ./start-prod.sh"
echo ""
echo "📚 API Documentation: http://localhost:5000/api"
echo "🏥 Health Check: http://localhost:5000/health"
echo ""
echo "Happy coding! 🚀✨"

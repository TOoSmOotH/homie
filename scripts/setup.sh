#!/bin/bash

echo "🚀 Setting up Homie development environment..."

# Install dependencies
echo "📦 Installing dependencies..."
npm install

# Create data directory
echo "📁 Creating data directory..."
mkdir -p data

# Create logs directory
echo "📁 Creating logs directory..."
mkdir -p logs

# Copy environment file
if [ ! -f .env ]; then
    echo "📄 Creating .env file..."
    cp .env.example .env
    echo "⚠️  Please edit .env file with your configuration!"
fi

# Build shared types
echo "🔨 Building shared types..."
cd shared && npm run build && cd ..

# Create necessary directories for backend
echo "📁 Creating backend directories..."
mkdir -p backend/dist
mkdir -p backend/tests/{unit,integration,e2e}

# Create necessary directories for frontend
echo "📁 Creating frontend directories..."
mkdir -p frontend/dist

echo "✅ Setup complete!"
echo "🎯 Next steps:"
echo "  1. Edit .env file with your configuration"
echo "  2. Run 'npm run docker:dev' to start development environment"
echo "  3. Access the application at http://localhost:3000/homie"
echo ""
echo "📚 Available commands:"
echo "  npm run dev      - Start development servers"
echo "  npm run build    - Build all packages"
echo "  npm run test     - Run tests"
echo "  npm run docker:dev  - Start Docker development environment"
echo "  npm run docker:prod - Start Docker production environment"
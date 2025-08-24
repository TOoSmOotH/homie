#!/bin/bash

echo "🔨 Building Homie application..."

# Build shared types
echo "📦 Building shared types..."
cd shared && npm run build && cd ..

# Build backend
echo "⚙️  Building backend..."
cd backend && npm run build && cd ..

# Build frontend
echo "🎨 Building frontend..."
cd frontend && npm run build && cd ..

echo "✅ Build complete!"
echo "🚀 Ready for deployment!"
echo ""
echo "📦 Build outputs:"
echo "  - backend/dist/     - Backend compiled code"
echo "  - frontend/dist/    - Frontend build assets"
echo "  - shared/dist/      - Shared TypeScript types"
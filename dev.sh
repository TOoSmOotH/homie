#!/bin/bash

# Development script for Homie - runs frontend and backend with hot reload
# This script allows for rapid UI development without Docker

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# Script directory
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
cd "$SCRIPT_DIR"

# Function to print colored output
print_info() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

print_header() {
    echo -e "${CYAN}========================================${NC}"
    echo -e "${CYAN}$1${NC}"
    echo -e "${CYAN}========================================${NC}"
}

# Function to check if port is in use
check_port() {
    local port=$1
    if lsof -Pi :$port -sTCP:LISTEN -t >/dev/null 2>&1; then
        return 0
    else
        return 1
    fi
}

# Function to kill process on port
kill_port() {
    local port=$1
    if check_port $port; then
        print_warning "Port $port is in use. Killing process..."
        lsof -ti:$port | xargs kill -9 2>/dev/null || true
        sleep 1
    fi
}

# Function to check dependencies
check_dependencies() {
    print_header "Checking Dependencies"
    
    # Check Node.js
    if ! command -v node &> /dev/null; then
        print_error "Node.js is not installed!"
        exit 1
    fi
    NODE_VERSION=$(node -v)
    print_info "Node.js version: $NODE_VERSION"
    
    # Check npm
    if ! command -v npm &> /dev/null; then
        print_error "npm is not installed!"
        exit 1
    fi
    NPM_VERSION=$(npm -v)
    print_info "npm version: $NPM_VERSION"
    
    # Check if node_modules exists
    if [ ! -d "node_modules" ]; then
        print_warning "node_modules not found. Installing dependencies..."
        npm install
    fi
    
    print_info "All dependencies checked ✓"
}

# Function to setup environment
setup_environment() {
    print_header "Setting Up Development Environment"
    
    # Check if .env.development exists
    if [ ! -f ".env.development" ]; then
        if [ -f ".env.development.example" ]; then
            print_info "Creating .env.development from template..."
            cp .env.development.example .env.development
            print_warning "Please update .env.development with your configuration"
        else
            print_warning ".env.development not found. Creating default..."
            cat > .env.development << 'EOF'
# Development Environment
NODE_ENV=development

# Backend Configuration
PORT=9825
BASE_PATH=
API_PREFIX=/api
DATABASE_URL=sqlite:///app/data/homie-dev.db
DB_PATH=./data/homie-dev.db

# Security (development only)
JWT_SECRET=dev-jwt-secret-change-in-production
ENCRYPTION_KEY=dev-32-character-encryption-key!
SESSION_SECRET=dev-session-secret

# Frontend Configuration
VITE_API_URL=http://localhost:9825
VITE_BASE_PATH=
VITE_WS_URL=ws://localhost:9825

# CORS Configuration
CORS_ORIGIN=http://localhost:3000
CORS_CREDENTIALS=true

# Logging
LOG_LEVEL=debug
LOG_FORMAT=pretty

# Feature Flags
ENABLE_HOT_RELOAD=true
ENABLE_SOURCE_MAPS=true
EOF
            print_info "Created default .env.development"
        fi
    fi
    
    # Create necessary directories
    mkdir -p data logs
    print_info "Directories created/verified: data, logs"
    
    # Load environment variables (properly handling comments and empty lines)
    if [ -f .env.development ]; then
        set -a
        source .env.development
        set +a
        print_info "Environment variables loaded"
    else
        print_warning "Could not load .env.development"
    fi
}

# Function to build shared module
build_shared() {
    print_header "Building Shared Module"
    
    cd "$SCRIPT_DIR/shared"
    if [ ! -d "dist" ] || [ "$1" == "force" ]; then
        print_info "Building shared module..."
        npm run build
        print_info "Shared module built ✓"
    else
        print_info "Shared module already built (use --rebuild to force)"
    fi
    cd "$SCRIPT_DIR"
}

# Function to start backend
start_backend() {
    print_header "Starting Backend Server"
    
    # Kill existing backend process
    kill_port 9825
    
    cd "$SCRIPT_DIR/backend"
    
    print_info "Starting backend with hot reload on port 9825..."
    
    # Start backend with nodemon for hot reload
    npx nodemon \
        --watch src \
        --watch ../shared/src \
        --ext ts,js,json \
        --ignore 'src/**/*.test.ts' \
        --exec 'ts-node' \
        src/server.ts \
        2>&1 | while IFS= read -r line; do
            echo -e "${BLUE}[BACKEND]${NC} $line"
        done &
    
    BACKEND_PID=$!
    
    cd "$SCRIPT_DIR"
    
    # Wait for backend to start
    print_info "Waiting for backend to start..."
    for i in {1..30}; do
        if curl -f -s http://localhost:9825/health > /dev/null 2>&1; then
            print_info "Backend started successfully ✓"
            break
        fi
        sleep 1
    done
}

# Function to start frontend
start_frontend() {
    print_header "Starting Frontend Server"
    
    # Kill existing frontend process
    kill_port 3000
    
    cd "$SCRIPT_DIR/frontend"
    
    print_info "Starting frontend with hot reload on port 3000..."
    
    # Start frontend with Vite
    npx vite \
        --host \
        --port 3000 \
        --open \
        2>&1 | while IFS= read -r line; do
            echo -e "${CYAN}[FRONTEND]${NC} $line"
        done &
    
    FRONTEND_PID=$!
    
    cd "$SCRIPT_DIR"
    
    print_info "Frontend started successfully ✓"
}

# Function to show status
show_status() {
    echo ""
    print_header "Development Servers Running"
    echo -e "${GREEN}✓${NC} Backend:  ${BLUE}http://localhost:9825${NC}"
    echo -e "${GREEN}✓${NC} Frontend: ${CYAN}http://localhost:3000${NC}"
    echo -e "${GREEN}✓${NC} API Docs: ${BLUE}http://localhost:9825/api-docs${NC} (if enabled)"
    echo ""
    echo -e "${YELLOW}Hot Reload:${NC} Both servers will reload automatically on file changes"
    echo -e "${YELLOW}Logs:${NC} Backend logs in ${BLUE}blue${NC}, Frontend logs in ${CYAN}cyan${NC}"
    echo ""
    echo -e "Press ${RED}Ctrl+C${NC} to stop all servers"
    echo ""
}

# Function to cleanup on exit
cleanup() {
    echo ""
    print_warning "Shutting down development servers..."
    
    # Kill backend
    if [ ! -z "$BACKEND_PID" ]; then
        kill $BACKEND_PID 2>/dev/null || true
        # Also kill nodemon process
        pkill -f "nodemon" 2>/dev/null || true
    fi
    
    # Kill frontend
    if [ ! -z "$FRONTEND_PID" ]; then
        kill $FRONTEND_PID 2>/dev/null || true
        # Also kill vite process
        pkill -f "vite" 2>/dev/null || true
    fi
    
    # Kill any remaining processes on ports
    kill_port 3000
    kill_port 9825
    
    print_info "All servers stopped"
    exit 0
}

# Function to run in watch mode
run_watch_mode() {
    print_header "Starting Development Environment"
    
    # Check dependencies
    check_dependencies
    
    # Setup environment
    setup_environment
    
    # Build shared module
    build_shared "$1"
    
    # Start backend
    start_backend
    
    # Give backend time to fully start
    sleep 2
    
    # Start frontend
    start_frontend
    
    # Show status
    show_status
    
    # Wait for processes
    wait $BACKEND_PID $FRONTEND_PID
}

# Function to run specific service
run_service() {
    local service=$1
    
    check_dependencies
    setup_environment
    
    case $service in
        backend)
            print_header "Starting Backend Only"
            build_shared
            start_backend
            show_status
            wait $BACKEND_PID
            ;;
        frontend)
            print_header "Starting Frontend Only"
            build_shared
            start_frontend
            show_status
            wait $FRONTEND_PID
            ;;
        shared)
            print_header "Building Shared Module Only"
            build_shared "force"
            ;;
        *)
            print_error "Unknown service: $service"
            echo "Available services: backend, frontend, shared"
            exit 1
            ;;
    esac
}

# Set up signal handlers
trap cleanup SIGINT SIGTERM EXIT

# Main script logic
case "${1:-}" in
    backend|frontend|shared)
        run_service "$1"
        ;;
    --rebuild)
        run_watch_mode "force"
        ;;
    --help|-h)
        echo "Homie Development Script"
        echo ""
        echo "Usage: $0 [command]"
        echo ""
        echo "Commands:"
        echo "  (no command)    Start both frontend and backend with hot reload"
        echo "  backend         Start only the backend server"
        echo "  frontend        Start only the frontend server"
        echo "  shared          Build only the shared module"
        echo "  --rebuild       Force rebuild shared module and start servers"
        echo "  --help, -h      Show this help message"
        echo ""
        echo "Features:"
        echo "  • Hot reload on file changes"
        echo "  • Automatic port management"
        echo "  • Color-coded logs"
        echo "  • Environment setup"
        echo "  • Graceful shutdown"
        echo ""
        echo "Ports:"
        echo "  • Backend:  http://localhost:9825"
        echo "  • Frontend: http://localhost:3000"
        echo ""
        exit 0
        ;;
    *)
        run_watch_mode
        ;;
esac

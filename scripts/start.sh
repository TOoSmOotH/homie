#!/bin/sh

set -e

echo "🚀 Starting Homie production application..."

# Set environment variables
export NODE_ENV=${NODE_ENV:-production}
export PORT=${PORT:-3001}
export API_PREFIX=${API_PREFIX:-/api}

# Create necessary directories with proper permissions
mkdir -p /app/data /app/logs
chown -R appuser:appuser /app/data /app/logs 2>/dev/null || true

# Function to start backend
start_backend() {
    echo "⚙️  Starting backend server..."
    cd /app

    # Set production environment
    export DB_PATH=${DB_PATH:-/app/data/homie.db}
    export LOG_FILE=${LOG_FILE:-/app/logs/homie.log}
    export LOG_LEVEL=${LOG_LEVEL:-info}

    # Start backend as appuser
    su -s /bin/sh appuser -c "node backend/dist/server.js" &
    BACKEND_PID=$!

    # Wait for backend to be ready
    echo "⏳ Waiting for backend to start..."
    BASE_PATH=${BASE_PATH:-/homie}
    for i in $(seq 1 30); do
        if curl -f -s http://localhost:$PORT${BASE_PATH}/health > /dev/null 2>&1; then
            echo "✅ Backend started successfully"
            return 0
        fi
        sleep 2
    done

    echo "❌ Backend failed to start within 60 seconds"
    exit 1
}

# Function to start nginx
start_nginx() {
    echo "🌐 Starting nginx..."

    # Use HTTP configuration (SSL can be handled by reverse proxy)
    NGINX_CONF="/etc/nginx/nginx.conf"
    echo "🔓 Using HTTP configuration"

    # Test nginx configuration
    nginx -t -c "$NGINX_CONF"
    if [ $? -ne 0 ]; then
        echo "❌ Nginx configuration test failed"
        exit 1
    fi

    # Start nginx
    nginx -c "$NGINX_CONF" -g 'daemon off;' &
    NGINX_PID=$!
}

# Function to handle shutdown
shutdown() {
    echo "🛑 Shutting down services..."
    if [ ! -z "$BACKEND_PID" ]; then
        kill $BACKEND_PID 2>/dev/null || true
    fi
    if [ ! -z "$NGINX_PID" ]; then
        kill $NGINX_PID 2>/dev/null || true
    fi
    exit 0
}

# Set up signal handlers
trap shutdown TERM INT QUIT

# Main startup sequence
main() {
    echo "📋 Environment:"
    echo "   NODE_ENV: $NODE_ENV"
    echo "   PORT: $PORT"
    echo "   BASE_PATH: ${BASE_PATH:-/homie}"

    # Start backend
    start_backend

    # Start nginx
    start_nginx

    echo "✅ Homie application started successfully!"
    echo "📊 Backend: http://localhost:$PORT"
    echo "🌐 Frontend: http://localhost/homie"

    # Wait for processes
    wait $BACKEND_PID $NGINX_PID
}

# Run main function
main
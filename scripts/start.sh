#!/bin/sh

set -e

echo "🚀 Starting Homie production application (no nginx)..."

# Set environment variables
export NODE_ENV=${NODE_ENV:-production}
export PORT=${PORT:-9825}
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
    API_PREFIX=${API_PREFIX:-/api}
    for i in $(seq 1 30); do
        if curl -f -s http://localhost:$PORT${API_PREFIX}/health > /dev/null 2>&1; then
            echo "✅ Backend started successfully"
            return 0
        fi
        sleep 2
    done

    echo "❌ Backend failed to start within 60 seconds"
    exit 1
}

# (nginx removed; served by backend)

# Function to handle shutdown
shutdown() {
    echo "🛑 Shutting down services..."
    if [ ! -z "$BACKEND_PID" ]; then
        kill $BACKEND_PID 2>/dev/null || true
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
    echo "   API_PREFIX: ${API_PREFIX:-/api}"

    # Start backend
    start_backend

    echo "✅ Homie application started successfully!"
    echo "📊 Backend: http://localhost:$PORT"
    echo "🌐 Frontend: http://localhost:${PORT}/homie"

    # Wait for processes
    wait $BACKEND_PID
}

# Run main function
main

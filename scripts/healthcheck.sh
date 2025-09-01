#!/bin/sh

# Health check script for Homie production container
# This script checks if the backend and static frontend are served properly

set -e

# Check if backend is running
if ! pgrep -f "node.*server.js" > /dev/null; then
    echo "❌ Backend server is not running"
    exit 1
fi

# Check if backend is responding
API_PREFIX=${API_PREFIX:-/api}
PORT=${PORT:-9825}
if ! curl -f -s http://localhost:${PORT}${API_PREFIX}/health > /dev/null 2>&1; then
    echo "❌ Backend health endpoint is not responding"
    exit 1
fi

# Check if backend is serving the frontend
if ! curl -f -s -I http://localhost:${PORT}/homie > /dev/null 2>&1; then
    echo "❌ Frontend is not being served by backend"
    exit 1
fi

echo "✅ All services are healthy"
exit 0

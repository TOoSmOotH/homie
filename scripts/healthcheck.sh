#!/bin/sh

# Health check script for Homie production container
# This script checks if both nginx and the backend are running properly

set -e

# Check if nginx is running
if ! pgrep -x "nginx" > /dev/null; then
    echo "❌ Nginx is not running"
    exit 1
fi

# Check if backend is running
if ! pgrep -f "node.*server.js" > /dev/null; then
    echo "❌ Backend server is not running"
    exit 1
fi

# Check if backend is responding
API_PREFIX=${API_PREFIX:-/api}
if ! curl -f -s http://localhost:3001${API_PREFIX}/health > /dev/null 2>&1; then
    echo "❌ Backend health endpoint is not responding"
    exit 1
fi

# Check if nginx is serving the frontend
if ! curl -f -s -I http://localhost/homie > /dev/null 2>&1; then
    echo "❌ Frontend is not being served by nginx"
    exit 1
fi

echo "✅ All services are healthy"
exit 0

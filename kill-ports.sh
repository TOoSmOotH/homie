#!/bin/bash

# Script to kill processes on common development ports

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

# Default ports
DEFAULT_PORTS=(9826 9827 3000 9825 5173 5174 8080 9229)

# Function to kill process on a port
kill_port() {
    local port=$1
    
    # Try different methods to find and kill the process
    if lsof -Pi :$port -sTCP:LISTEN -t >/dev/null 2>&1; then
        echo -e "${YELLOW}Found process on port $port${NC}"
        
        # Get process info
        lsof -i :$port | grep LISTEN | head -1
        
        # Kill the process
        if lsof -ti:$port | xargs kill -9 2>/dev/null; then
            echo -e "${GREEN}✓ Killed process on port $port${NC}"
        else
            echo -e "${RED}✗ Failed to kill process on port $port (may need sudo)${NC}"
            echo "Try: sudo kill -9 \$(sudo lsof -t -i:$port)"
        fi
    else
        echo -e "${GREEN}Port $port is free${NC}"
    fi
}

# Parse arguments
if [ $# -eq 0 ]; then
    # No arguments, use default ports
    PORTS=("${DEFAULT_PORTS[@]}")
    echo "Checking default development ports: ${PORTS[*]}"
else
    # Use provided ports
    PORTS=("$@")
    echo "Checking specified ports: ${PORTS[*]}"
fi

echo ""

# Kill processes on each port
for port in "${PORTS[@]}"; do
    kill_port $port
done

echo ""
echo "Done! All specified ports have been checked."

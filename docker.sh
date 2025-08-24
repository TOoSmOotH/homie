#!/bin/bash

# Docker management script for Homie

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
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

# Function to check if .env file exists
check_env() {
    local env_file="$1"
    if [ ! -f "$env_file" ]; then
        print_warning "$env_file not found. Creating from template..."
        if [ -f "${env_file}.example" ]; then
            cp "${env_file}.example" "$env_file"
            print_info "Created $env_file from template. Please update with your values."
            print_warning "Edit $env_file before running the application!"
            return 1
        else
            print_error "Template ${env_file}.example not found!"
            exit 1
        fi
    fi
    return 0
}

# Function to create required directories
create_directories() {
    print_info "Creating required directories..."
    mkdir -p data logs ssl
    print_info "Directories created/verified: data, logs, ssl"
}

# Main script logic
case "${1:-}" in
    build)
        print_info "Building production Docker image..."
        create_directories
        docker compose build
        print_info "Build complete!"
        ;;
        
    build-dev)
        print_info "Building development Docker image..."
        create_directories
        check_env ".env.development" || exit 1
        docker compose -f docker-compose.dev.yml build
        print_info "Development build complete!"
        ;;
        
    up)
        print_info "Starting production containers..."
        create_directories
        check_env ".env.production" || exit 1
        docker compose up -d
        print_info "Containers started!"
        print_info "Application available at http://localhost (port 80)"
        ;;
        
    up-dev)
        print_info "Starting development containers..."
        create_directories
        check_env ".env.development" || exit 1
        docker compose -f docker-compose.dev.yml up
        ;;
        
    down)
        print_info "Stopping containers..."
        docker compose down
        print_info "Containers stopped!"
        ;;
        
    down-dev)
        print_info "Stopping development containers..."
        docker compose -f docker-compose.dev.yml down
        print_info "Development containers stopped!"
        ;;
        
    logs)
        docker compose logs -f
        ;;
        
    logs-dev)
        docker compose -f docker-compose.dev.yml logs -f
        ;;
        
    restart)
        print_info "Restarting containers..."
        docker compose restart
        print_info "Containers restarted!"
        ;;
        
    status)
        print_info "Container status:"
        docker compose ps
        ;;
        
    shell)
        print_info "Opening shell in container..."
        docker compose exec homie /bin/sh
        ;;
        
    shell-dev)
        print_info "Opening shell in development container..."
        docker compose -f docker-compose.dev.yml exec homie-dev /bin/sh
        ;;
        
    clean)
        print_warning "This will remove all containers, images, and volumes for Homie!"
        read -p "Are you sure? (y/N) " -n 1 -r
        echo
        if [[ $REPLY =~ ^[Yy]$ ]]; then
            print_info "Cleaning up..."
            docker compose down -v --rmi all
            print_info "Cleanup complete!"
        else
            print_info "Cleanup cancelled."
        fi
        ;;
        
    backup)
        print_info "Creating backup..."
        backup_dir="backups/$(date +%Y%m%d_%H%M%S)"
        mkdir -p "$backup_dir"
        
        # Backup data directory
        if [ -d "data" ]; then
            tar -czf "$backup_dir/data.tar.gz" data/
            print_info "Data backed up to $backup_dir/data.tar.gz"
        fi
        
        # Backup environment files
        cp .env.production "$backup_dir/" 2>/dev/null || true
        cp .env.development "$backup_dir/" 2>/dev/null || true
        
        print_info "Backup complete in $backup_dir"
        ;;
        
    *)
        echo "Homie Docker Management Script"
        echo ""
        echo "Usage: $0 {command}"
        echo ""
        echo "Production Commands:"
        echo "  build       - Build production Docker image"
        echo "  up          - Start production containers (detached)"
        echo "  down        - Stop production containers"
        echo "  restart     - Restart production containers"
        echo "  logs        - View production container logs"
        echo "  shell       - Open shell in production container"
        echo ""
        echo "Development Commands:"
        echo "  build-dev   - Build development Docker image"
        echo "  up-dev      - Start development containers (attached)"
        echo "  down-dev    - Stop development containers"
        echo "  logs-dev    - View development container logs"
        echo "  shell-dev   - Open shell in development container"
        echo ""
        echo "Utility Commands:"
        echo "  status      - Show container status"
        echo "  backup      - Create backup of data and configs"
        echo "  clean       - Remove all containers, images, and volumes"
        echo ""
        exit 1
        ;;
esac
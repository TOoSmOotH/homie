#!/bin/bash

# =============================================================================
# Homie Production Deployment Script
# =============================================================================
# This script handles the complete deployment process for Homie in production
# Usage: ./scripts/deploy.sh [options]

set -e

# Configuration
PROJECT_NAME="homie"
DOCKER_COMPOSE_FILE="docker-compose.yml"
ENV_FILE=".env"
BACKUP_DIR="./backups"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Logging functions
log_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

log_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

log_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Function to show usage
usage() {
    cat << EOF
Usage: $0 [OPTIONS]

Options:
    -h, --help              Show this help message
    -b, --build             Build Docker images
    -d, --deploy            Deploy the application
    -s, --stop              Stop the application
    -r, --restart           Restart the application
    -u, --update            Update and redeploy (includes build)
    -l, --logs              Show application logs
    -m, --monitor           Show monitoring status
    -c, --cleanup           Clean up unused Docker resources
    -B, --backup            Create backup of data and configuration
    -R, --restore           Restore from backup
    --ssl-setup             Setup SSL certificates
    --ssl-renew             Renew SSL certificates
    --health-check          Run health checks

Examples:
    $0 --build --deploy     # Build and deploy
    $0 --update             # Update with rebuild
    $0 --logs               # View logs
    $0 --backup             # Create backup
EOF
}

# Function to check prerequisites
check_prerequisites() {
    log_info "Checking prerequisites..."

    # Check if Docker is installed
    if ! command -v docker &> /dev/null; then
        log_error "Docker is not installed or not in PATH"
        exit 1
    fi

    # Check if Docker Compose is installed
    if ! command -v docker compose &> /dev/null; then
        log_error "Docker Compose is not installed or not in PATH"
        exit 1
    fi

    # Check if .env exists
    if [ ! -f "$ENV_FILE" ]; then
        log_error "Environment file $ENV_FILE not found"
        log_info "Please copy .env.example to .env and configure it"
        exit 1
    fi

    # Check if docker-compose.yml exists
    if [ ! -f "$DOCKER_COMPOSE_FILE" ]; then
        log_error "Docker Compose file $DOCKER_COMPOSE_FILE not found"
        exit 1
    fi

    log_success "Prerequisites check passed"
}

# Function to create backup
create_backup() {
    log_info "Creating backup..."

    # Create backup directory
    mkdir -p "$BACKUP_DIR"
    TIMESTAMP=$(date +%Y%m%d_%H%M%S)
    BACKUP_FILE="$BACKUP_DIR/homie_backup_$TIMESTAMP.tar.gz"

    # Create backup of data and configuration
    tar -czf "$BACKUP_FILE" \
        --exclude='node_modules' \
        --exclude='.git' \
        --exclude='logs/*.log' \
        data/ \
        logs/ \
        .env \
        docker-compose.yml \
        docker/ \
        scripts/

    log_success "Backup created: $BACKUP_FILE"
}

# Function to restore from backup
restore_backup() {
    if [ -z "$1" ]; then
        log_error "Please specify backup file to restore"
        exit 1
    fi

    BACKUP_FILE="$1"
    if [ ! -f "$BACKUP_FILE" ]; then
        log_error "Backup file $BACKUP_FILE not found"
        exit 1
    fi

    log_info "Restoring from backup: $BACKUP_FILE"

    # Stop services before restore
    docker compose -f "$DOCKER_COMPOSE_FILE" down

    # Extract backup
    tar -xzf "$BACKUP_FILE"

    log_success "Backup restored successfully"
}

# Function to build Docker images
build_images() {
    log_info "Building Docker images..."

    docker compose -f "$DOCKER_COMPOSE_FILE" build --no-cache

    log_success "Docker images built successfully"
}

# Function to deploy application
deploy_app() {
    log_info "Deploying application..."

    # Pull latest images if not building
    if [[ "$*" != *"--build"* ]]; then
        docker compose -f "$DOCKER_COMPOSE_FILE" pull
    fi

    # Start services
    docker compose -f "$DOCKER_COMPOSE_FILE" up -d

    # Wait for services to be healthy
    log_info "Waiting for services to be healthy..."
    sleep 10

    # Run health check
    if docker compose -f "$DOCKER_COMPOSE_FILE" ps | grep -q "homie"; then
        log_success "Application deployed successfully"
        show_status
    else
        log_error "Application deployment failed"
        exit 1
    fi
}

# Function to stop application
stop_app() {
    log_info "Stopping application..."

    docker compose -f "$DOCKER_COMPOSE_FILE" down

    log_success "Application stopped successfully"
}

# Function to restart application
restart_app() {
    log_info "Restarting application..."

    docker compose -f "$DOCKER_COMPOSE_FILE" restart

    log_success "Application restarted successfully"
}

# Function to show logs
show_logs() {
    log_info "Showing application logs..."

    docker compose -f "$DOCKER_COMPOSE_FILE" logs -f --tail=100
}

# Function to show status
show_status() {
    log_info "Application Status:"

    echo ""
    echo "Docker Compose Services:"
    docker compose -f "$DOCKER_COMPOSE_FILE" ps

    echo ""
    echo "Container Health:"
    if docker compose -f "$DOCKER_COMPOSE_FILE" ps | grep -q "homie"; then
        docker compose -f "$DOCKER_COMPOSE_FILE" exec homie /app/healthcheck.sh 2>/dev/null || echo "Health check failed"
    fi

    echo ""
    echo "Resource Usage:"
    docker stats --no-stream $(docker compose -f "$DOCKER_COMPOSE_FILE" ps -q) 2>/dev/null || echo "Unable to get stats"
}

# Function to cleanup Docker resources
cleanup_docker() {
    log_info "Cleaning up Docker resources..."

    # Remove unused containers
    docker container prune -f

    # Remove unused images
    docker image prune -f

    # Remove unused volumes
    docker volume prune -f

    # Remove unused networks
    docker network prune -f

    log_success "Docker cleanup completed"
}

# Function to setup SSL
setup_ssl() {
    log_info "Setting up SSL certificates..."

    if [ -z "$DOMAIN" ]; then
        log_error "DOMAIN not set in environment"
        exit 1
    fi

    # Check if SSL is enabled
    if [ "$ENABLE_SSL" != "true" ]; then
        log_warning "SSL is not enabled in environment configuration"
        return
    fi

    # Run certbot container to obtain certificates
    docker run --rm \
        -v homie_ssl:/etc/letsencrypt \
        -p 80:80 \
        certbot/certbot certonly \
        --standalone \
        --non-interactive \
        --agree-tos \
        --email "$SSL_EMAIL" \
        -d "$DOMAIN"

    log_success "SSL certificates setup completed"
}

# Function to renew SSL certificates
renew_ssl() {
    log_info "Renewing SSL certificates..."

    docker run --rm \
        -v homie_ssl:/etc/letsencrypt \
        -p 80:80 \
        certbot/certbot renew

    log_success "SSL certificates renewed"
}

# Main script logic
main() {
    # Default action
    ACTION="status"

    # Parse command line arguments
    while [[ $# -gt 0 ]]; do
        case $1 in
            -h|--help)
                usage
                exit 0
                ;;
            -b|--build)
                ACTION="build"
                shift
                ;;
            -d|--deploy)
                ACTION="deploy"
                shift
                ;;
            -s|--stop)
                ACTION="stop"
                shift
                ;;
            -r|--restart)
                ACTION="restart"
                shift
                ;;
            -u|--update)
                ACTION="update"
                shift
                ;;
            -l|--logs)
                ACTION="logs"
                shift
                ;;
            -m|--monitor)
                ACTION="monitor"
                shift
                ;;
            -c|--cleanup)
                ACTION="cleanup"
                shift
                ;;
            -B|--backup)
                ACTION="backup"
                shift
                ;;
            -R|--restore)
                ACTION="restore"
                RESTORE_FILE="$2"
                shift 2
                ;;
            --ssl-setup)
                ACTION="ssl_setup"
                shift
                ;;
            --ssl-renew)
                ACTION="ssl_renew"
                shift
                ;;
            --health-check)
                ACTION="health_check"
                shift
                ;;
            *)
                log_error "Unknown option: $1"
                usage
                exit 1
                ;;
        esac
    done

    # Load environment variables
    if [ -f "$ENV_FILE" ]; then
        source "$ENV_FILE"
    fi

    # Check prerequisites
    check_prerequisites

    # Execute action
    case $ACTION in
        build)
            build_images
            ;;
        deploy)
            deploy_app
            ;;
        stop)
            stop_app
            ;;
        restart)
            restart_app
            ;;
        update)
            create_backup
            build_images
            deploy_app
            ;;
        logs)
            show_logs
            ;;
        monitor)
            show_status
            ;;
        cleanup)
            cleanup_docker
            ;;
        backup)
            create_backup
            ;;
        restore)
            restore_backup "$RESTORE_FILE"
            ;;
        ssl_setup)
            setup_ssl
            ;;
        ssl_renew)
            renew_ssl
            ;;
        health_check)
            docker compose -f "$DOCKER_COMPOSE_FILE" exec homie /app/healthcheck.sh
            ;;
        status|*)
            show_status
            ;;
    esac
}

# Run main function
main "$@"
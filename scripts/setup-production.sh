#!/bin/bash

# =============================================================================
# Homie Production Setup Script
# =============================================================================
# This script automates the initial setup of a production Homie deployment
# Usage: ./scripts/setup-production.sh

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# Configuration
DOMAIN=""
EMAIL=""
SKIP_SSL=false
SKIP_DOCKER=false

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

# Function to check prerequisites
check_prerequisites() {
    log_info "Checking prerequisites..."

    # Check if running as root or with sudo
    if [[ $EUID -eq 0 ]]; then
        log_error "Do not run this script as root"
        exit 1
    fi

    # Check OS
    if [[ "$OSTYPE" != "linux-gnu"* ]]; then
        log_error "This script is designed for Linux systems"
        exit 1
    fi

    # Check available commands
    local commands=("curl" "wget" "git")
    for cmd in "${commands[@]}"; do
        if ! command -v "$cmd" &> /dev/null; then
            log_error "Required command not found: $cmd"
            log_info "Please install: sudo apt-get install curl wget git"
            exit 1
        fi
    done

    log_success "Prerequisites check passed"
}

# Function to setup Docker
setup_docker() {
    if [ "$SKIP_DOCKER" = "true" ]; then
        log_warning "Skipping Docker setup as requested"
        return
    fi

    log_info "Setting up Docker..."

    # Check if Docker is already installed
    if command -v docker &> /dev/null; then
        log_success "Docker is already installed"
    else
        # Install Docker
        log_info "Installing Docker..."

        # Update package index
        sudo apt-get update

        # Install packages to allow apt to use a repository over HTTPS
        sudo apt-get install -y \
            apt-transport-https \
            ca-certificates \
            curl \
            gnupg \
            lsb-release

        # Add Docker's official GPG key
        curl -fsSL https://download.docker.com/linux/ubuntu/gpg | sudo gpg --dearmor -o /usr/share/keyrings/docker-archive-keyring.gpg

        # Set up the stable repository
        echo \
            "deb [arch=amd64 signed-by=/usr/share/keyrings/docker-archive-keyring.gpg] https://download.docker.com/linux/ubuntu \
            $(lsb_release -cs) stable" | sudo tee /etc/apt/sources.list.d/docker.list > /dev/null

        # Install Docker Engine
        sudo apt-get update
        sudo apt-get install -y docker-ce docker-ce-cli containerd.io

        log_success "Docker installed successfully"
    fi

    # Check if Docker Compose is installed (Docker Compose V2 is built into Docker CLI)
    if docker compose version &> /dev/null; then
        log_success "Docker Compose V2 is available"
    else
        log_warning "Docker Compose V2 should be included with Docker installation"
        log_info "If Docker Compose is not working, you may need to install Docker Compose V2 separately or update Docker"
        log_info "Run: docker compose version to verify"
    fi

    # Add user to docker group
    if ! groups "$USER" | grep -q docker; then
        log_info "Adding user to docker group..."
        sudo usermod -aG docker "$USER"
        log_warning "Please log out and back in for Docker group changes to take effect"
    fi

    # Start and enable Docker service
    sudo systemctl start docker
    sudo systemctl enable docker

    log_success "Docker setup completed"
}

# Function to clone or update repository
setup_repository() {
    log_info "Setting up Homie repository..."

    # Check if we're already in a git repository
    if git rev-parse --git-dir > /dev/null 2>&1; then
        log_info "Already in a git repository"
        # Pull latest changes if it's the homie repository
        if git remote -v | grep -q "homie"; then
            log_info "Updating existing Homie repository..."
            git pull origin main || git pull origin master || log_warning "Could not update repository"
        fi
    else
        log_error "Please clone the Homie repository first:"
        echo "  git clone <your-repo-url> homie"
        echo "  cd homie"
        echo "  ./scripts/setup-production.sh"
        exit 1
    fi

    log_success "Repository setup completed"
}

# Function to configure environment
configure_environment() {
    log_info "Configuring environment..."

    # Copy environment template
    if [ ! -f ".env" ]; then
        cp .env.example .env
        log_info "Created .env from .env.example template"
    fi

    # Interactive configuration
    log_info "Please configure your production environment:"

    # Domain configuration
    if [ -z "$DOMAIN" ]; then
        read -p "Enter your domain name (e.g., homie.yourdomain.com): " DOMAIN
    fi

    # Email configuration
    if [ -z "$EMAIL" ]; then
        read -p "Enter your email address for SSL certificates: " EMAIL
    fi

    # Generate secrets if not set
    JWT_SECRET=$(openssl rand -hex 32)
    SESSION_SECRET=$(openssl rand -hex 16)

    # Update environment file
    if [ -f ".env" ]; then
        # Update existing values
        sed -i "s/your-domain.com/$DOMAIN/g" .env
        sed -i "s/admin@your-domain.com/$EMAIL/g" .env
        sed -i "s/your-super-secret-jwt-key-change-this-in-production-min-32-chars/$JWT_SECRET/g" .env
        sed -i "s/your-session-secret-change-this-in-production-min-32-chars/$SESSION_SECRET/g" .env
        # Update environment to production
        sed -i "s/NODE_ENV=development/NODE_ENV=production/g" .env
        # Update SSL settings
        sed -i "s/ENABLE_SSL=false/ENABLE_SSL=true/g" .env
    fi

    log_success "Environment configuration completed"
    log_warning "Please review and customize .env if needed"
}

# Function to setup directories
setup_directories() {
    log_info "Setting up directories..."

    # Create necessary directories
    mkdir -p data logs backups ssl

    # Set proper permissions
    chmod 755 data logs backups ssl

    log_success "Directories setup completed"
}

# Function to setup SSL certificates
setup_ssl() {
    if [ "$SKIP_SSL" = "true" ]; then
        log_warning "Skipping SSL setup as requested"
        return
    fi

    log_info "Setting up SSL certificates..."

    # Check if domain is configured
    if [ -z "$DOMAIN" ]; then
        log_warning "Domain not configured, SSL setup will be skipped"
        log_info "You can setup SSL later with: ./scripts/deploy.sh --ssl-setup"
        return
    fi

    # Check if certbot is available
    if ! command -v certbot &> /dev/null; then
        log_info "Installing Certbot for SSL certificates..."
        sudo apt-get install -y certbot
    fi

    log_info "SSL certificates will be obtained during deployment"
    log_info "Make sure your domain $DOMAIN points to this server's IP address"

    log_success "SSL setup completed"
}

# Function to make scripts executable
setup_scripts() {
    log_info "Setting up scripts..."

    # Make all scripts executable
    find scripts -name "*.sh" -exec chmod +x {} \;

    log_success "Scripts setup completed"
}

# Function to show next steps
show_next_steps() {
    echo ""
    echo "====================================="
    echo "🎉 Homie Production Setup Complete!"
    echo "====================================="
    echo ""
    echo "Next steps:"
    echo ""
    echo "1. Review your configuration:"
    echo "   nano .env.production"
    echo ""
    echo "2. Deploy the application:"
    echo "   ./scripts/deploy.sh --build --deploy"
    echo ""
    echo "3. Setup SSL certificates:"
    echo "   ./scripts/deploy.sh --ssl-setup"
    echo ""
    echo "4. Access your application:"
    echo "   http://localhost (before SSL)"
    echo "   https://$DOMAIN (after SSL setup)"
    echo ""
    echo "Useful commands:"
    echo "  ./scripts/deploy.sh --monitor    # Check status"
    echo "  ./scripts/deploy.sh --logs       # View logs"
    echo "  ./scripts/deploy.sh --backup     # Create backup"
    echo "  ./scripts/deploy.sh --help       # Show all options"
    echo ""
    echo "Documentation:"
    echo "  docs/PRODUCTION_DEPLOYMENT.md"
    echo ""
    echo "For help and support:"
    echo "  Check the logs: ./scripts/deploy.sh --logs"
    echo "  View documentation: docs/PRODUCTION_DEPLOYMENT.md"
}

# Function to parse arguments
parse_arguments() {
    while [[ $# -gt 0 ]]; do
        case $1 in
            --domain=*)
                DOMAIN="${1#*=}"
                shift
                ;;
            --email=*)
                EMAIL="${1#*=}"
                shift
                ;;
            --skip-ssl)
                SKIP_SSL=true
                shift
                ;;
            --skip-docker)
                SKIP_DOCKER=true
                shift
                ;;
            --help)
                echo "Usage: $0 [OPTIONS]"
                echo ""
                echo "Options:"
                echo "  --domain=DOMAIN       Set domain name"
                echo "  --email=EMAIL         Set email for SSL"
                echo "  --skip-ssl           Skip SSL setup"
                echo "  --skip-docker        Skip Docker setup"
                echo "  --help               Show this help"
                exit 0
                ;;
            *)
                log_error "Unknown option: $1"
                exit 1
                ;;
        esac
    done
}

# Main setup function
main() {
    echo "🚀 Homie Production Setup Script"
    echo "================================="

    # Parse arguments
    parse_arguments "$@"

    # Run setup steps
    check_prerequisites
    setup_docker
    setup_repository
    configure_environment
    setup_directories
    setup_ssl
    setup_scripts

    # Show next steps
    show_next_steps
}

# Run main function
main "$@"
#!/bin/bash

# =============================================================================
# Homie Restore Script
# =============================================================================
# This script restores Homie from a backup
# Usage: ./scripts/restore.sh <backup-file.tar.gz>

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

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
    echo "Usage: $0 <backup-file.tar.gz> [options]"
    echo ""
    echo "Options:"
    echo "  -f, --force           Force restore without confirmation"
    echo "  -s, --skip-services   Skip stopping/starting services"
    echo "  -h, --help           Show this help message"
    echo ""
    echo "Example:"
    echo "  $0 ./backups/homie_backup_20231201_120000.tar.gz"
    echo "  $0 ./backups/homie_backup_20231201_120000.tar.gz --force"
}

# Function to check backup file
check_backup() {
    local backup_file="$1"

    if [ ! -f "$backup_file" ]; then
        log_error "Backup file not found: $backup_file"
        exit 1
    fi

    log_info "Checking backup file integrity..."
    if ! tar -tzf "$backup_file" > /dev/null 2>&1; then
        log_error "Backup file is corrupted or not a valid tar.gz file"
        exit 1
    fi

    log_success "Backup file is valid"
}

# Function to show backup contents
show_backup_contents() {
    local backup_file="$1"

    log_info "Backup contents:"
    echo "====================================="
    tar -tzf "$backup_file" | head -20
    echo "..."
    echo "====================================="
}

# Function to confirm restore
confirm_restore() {
    local backup_file="$1"
    local force="$2"

    if [ "$force" = "true" ]; then
        log_warning "Force restore enabled - skipping confirmation"
        return
    fi

    echo ""
    echo "⚠️  WARNING: This will overwrite existing data!"
    echo "Backup file: $backup_file"
    echo "Target directory: $(pwd)"
    echo ""
    read -p "Are you sure you want to proceed? (yes/no): " -r

    if [[ ! $REPLY =~ ^[Yy][Ee][Ss]$ ]]; then
        log_info "Restore cancelled by user"
        exit 0
    fi
}

# Function to stop services
stop_services() {
    local skip_services="$1"

    if [ "$skip_services" = "true" ]; then
        log_warning "Skipping service stop/start as requested"
        return
    fi

    log_info "Stopping services..."
    if [ -f "docker-compose.yml" ]; then
        docker compose down
        log_success "Services stopped"
    else
        log_warning "No docker-compose.yml found"
    fi
}

# Function to extract backup
extract_backup() {
    local backup_file="$1"

    log_info "Extracting backup..."

    # Create temporary directory
    local temp_dir=$(mktemp -d)
    tar -xzf "$backup_file" -C "$temp_dir"

    # Find the backup directory
    local backup_dir=$(find "$temp_dir" -maxdepth 1 -type d -name "homie_backup_*" | head -1)

    if [ -z "$backup_dir" ]; then
        log_error "Could not find backup directory in archive"
        rm -rf "$temp_dir"
        exit 1
    fi

    log_info "Backup directory: $(basename "$backup_dir")"

    # Restore data
    if [ -d "$backup_dir/data" ]; then
        log_info "Restoring database..."
        mkdir -p ./data
        cp -r "$backup_dir/data/"* ./data/ 2>/dev/null || true
        log_success "Database restored"
    fi

    # Restore configuration (with caution)
    if [ -d "$backup_dir/config" ]; then
        log_info "Restoring configuration..."
        cp "$backup_dir/config/docker-compose.yml" ./docker-compose.yml.backup 2>/dev/null || true

        # Only restore env file if it doesn't exist
        if [ ! -f ".env.production" ] && [ -f "$backup_dir/config/env.production.backup" ]; then
            cp "$backup_dir/config/env.production.backup" .env.production.backup
            log_warning "Environment file restored as .env.production.backup (needs manual review)"
        fi
        log_success "Configuration restored"
    fi

    # Restore SSL certificates
    if [ -d "$backup_dir/ssl" ] && [ "$(ls -A "$backup_dir/ssl" 2>/dev/null)" ]; then
        log_info "Restoring SSL certificates..."
        mkdir -p ./ssl
        cp -r "$backup_dir/ssl/"* ./ssl/ 2>/dev/null || true
        log_success "SSL certificates restored"
    fi

    # Restore logs
    if [ -d "$backup_dir/logs" ]; then
        log_info "Restoring logs..."
        mkdir -p ./logs
        cp -r "$backup_dir/logs/"* ./logs/ 2>/dev/null || true
        log_success "Logs restored"
    fi

    # Show manifest if available
    if [ -f "$backup_dir/manifest.txt" ]; then
        echo ""
        echo "Backup Manifest:"
        echo "====================================="
        cat "$backup_dir/manifest.txt"
        echo "====================================="
    fi

    # Cleanup
    rm -rf "$temp_dir"

    log_success "Backup extracted successfully"
}

# Function to start services
start_services() {
    local skip_services="$1"

    if [ "$skip_services" = "true" ]; then
        log_warning "Skipping service start as requested"
        return
    fi

    log_info "Starting services..."
    if [ -f "docker-compose.yml" ]; then
        docker compose up -d
        log_success "Services started"
    else
        log_warning "No docker-compose.yml found"
    fi
}

# Function to verify restore
verify_restore() {
    log_info "Verifying restore..."

    # Check if data directory exists
    if [ -d "./data" ]; then
        log_success "Data directory exists"
    else
        log_warning "Data directory not found"
    fi

    # Check if database exists
    if [ -f "./data/homie.db" ]; then
        log_success "Database file exists"
    else
        log_warning "Database file not found"
    fi

    # Check if services are running
    if [ -f "docker-compose.yml" ]; then
        if docker compose ps | grep -q "Up"; then
            log_success "Services are running"
        else
            log_warning "Services may not be running properly"
        fi
    fi
}

# Main restore function
main() {
    local backup_file=""
    local force=false
    local skip_services=false

    # Parse arguments
    while [[ $# -gt 0 ]]; do
        case $1 in
            -h|--help)
                usage
                exit 0
                ;;
            -f|--force)
                force=true
                shift
                ;;
            -s|--skip-services)
                skip_services=true
                shift
                ;;
            *)
                if [ -z "$backup_file" ]; then
                    backup_file="$1"
                else
                    log_error "Multiple backup files specified"
                    usage
                    exit 1
                fi
                shift
                ;;
        esac
    done

    # Check if backup file is provided
    if [ -z "$backup_file" ]; then
        log_error "No backup file specified"
        usage
        exit 1
    fi

    log_info "Starting Homie restore process..."
    log_info "Backup file: $backup_file"

    # Check backup file
    check_backup "$backup_file"

    # Show backup contents
    show_backup_contents "$backup_file"

    # Confirm restore
    confirm_restore "$backup_file" "$force"

    # Stop services
    stop_services "$skip_services"

    # Extract backup
    extract_backup "$backup_file"

    # Start services
    start_services "$skip_services"

    # Verify restore
    verify_restore

    log_success "Restore completed successfully!"
    echo ""
    echo "Next steps:"
    echo "1. Review the restored configuration files"
    echo "2. Update any sensitive information in .env.production"
    echo "3. Test the application functionality"
    echo "4. Check logs for any issues"
}

# Run main function
main "$@"
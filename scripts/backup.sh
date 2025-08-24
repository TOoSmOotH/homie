#!/bin/bash

# =============================================================================
# Homie Backup Script
# =============================================================================
# This script creates backups of Homie data and configuration
# Usage: ./scripts/backup.sh [backup-directory]

set -e

# Configuration
DEFAULT_BACKUP_DIR="./backups"
BACKUP_DIR=${1:-$DEFAULT_BACKUP_DIR}
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
BACKUP_NAME="homie_backup_$TIMESTAMP"
BACKUP_PATH="$BACKUP_DIR/$BACKUP_NAME"

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

# Function to create directory structure
create_backup_structure() {
    log_info "Creating backup directory structure..."

    mkdir -p "$BACKUP_PATH"
    mkdir -p "$BACKUP_PATH/data"
    mkdir -p "$BACKUP_PATH/config"
    mkdir -p "$BACKUP_PATH/ssl"
    mkdir -p "$BACKUP_PATH/logs"

    log_success "Backup structure created"
}

# Function to backup database
backup_database() {
    log_info "Backing up database..."

    if [ -f "./data/homie.db" ]; then
        cp "./data/homie.db" "$BACKUP_PATH/data/"
        cp "./data/homie.db-wal" "$BACKUP_PATH/data/" 2>/dev/null || true
        cp "./data/homie.db-shm" "$BACKUP_PATH/data/" 2>/dev/null || true
        log_success "Database backed up"
    else
        log_warning "No database file found"
    fi
}

# Function to backup configuration
backup_config() {
    log_info "Backing up configuration..."

    # Backup environment files (excluding secrets)
    if [ -f ".env.production" ]; then
        # Create a sanitized version of env file for backup
        grep -v -E "(JWT_SECRET|SESSION_SECRET|PROXMOX_TOKEN|.*_API_KEY)" .env.production > "$BACKUP_PATH/config/env.production.backup"
        log_success "Configuration backed up (sanitized)"
    fi

    # Backup Docker Compose file
    if [ -f "docker-compose.yml" ]; then
        cp "docker-compose.yml" "$BACKUP_PATH/config/"
        log_success "Docker Compose configuration backed up"
    fi
}

# Function to backup SSL certificates
backup_ssl() {
    log_info "Backing up SSL certificates..."

    if [ -d "./ssl" ] && [ "$(ls -A ./ssl 2>/dev/null)" ]; then
        cp -r ./ssl/* "$BACKUP_PATH/ssl/" 2>/dev/null || true
        log_success "SSL certificates backed up"
    else
        log_warning "No SSL certificates found"
    fi
}

# Function to backup logs (recent logs only)
backup_logs() {
    log_info "Backing up recent logs..."

    if [ -d "./logs" ]; then
        # Only backup logs from the last 7 days
        find ./logs -name "*.log" -mtime -7 -exec cp {} "$BACKUP_PATH/logs/" \;
        log_success "Recent logs backed up"
    else
        log_warning "No logs directory found"
    fi
}

# Function to create backup manifest
create_manifest() {
    log_info "Creating backup manifest..."

    cat > "$BACKUP_PATH/manifest.txt" << EOF
Homie Backup Manifest
=====================
Created: $(date)
Backup ID: $BACKUP_NAME
Version: $(git rev-parse --short HEAD 2>/dev/null || echo "unknown")

Contents:
$(find "$BACKUP_PATH" -type f -exec basename {} \; | sort)

System Info:
- OS: $(uname -s)
- Docker: $(docker --version)
- Docker Compose: $(docker compose version)

Notes:
- Configuration files are sanitized (secrets removed)
- Only recent logs are included (last 7 days)
- SSL certificates may be present if available
EOF

    log_success "Backup manifest created"
}

# Function to compress backup
compress_backup() {
    log_info "Compressing backup..."

    cd "$BACKUP_DIR"
    tar -czf "${BACKUP_NAME}.tar.gz" "$BACKUP_NAME"

    # Remove uncompressed backup
    rm -rf "$BACKUP_NAME"

    # Calculate backup size
    BACKUP_SIZE=$(du -sh "${BACKUP_NAME}.tar.gz" | cut -f1)

    log_success "Backup compressed: ${BACKUP_NAME}.tar.gz (${BACKUP_SIZE})"
}

# Function to cleanup old backups
cleanup_old_backups() {
    log_info "Cleaning up old backups..."

    if [ -n "$BACKUP_RETENTION_DAYS" ]; then
        find "$BACKUP_DIR" -name "homie_backup_*.tar.gz" -mtime +$BACKUP_RETENTION_DAYS -delete
        log_success "Old backups cleaned up (older than $BACKUP_RETENTION_DAYS days)"
    else
        # Default: keep last 7 backups
        ls -t "$BACKUP_DIR"/homie_backup_*.tar.gz | tail -n +8 | xargs -r rm
        log_success "Old backups cleaned up (keeping last 7)"
    fi
}

# Function to show backup summary
show_summary() {
    echo ""
    echo "====================================="
    echo "Backup Summary"
    echo "====================================="
    echo "Backup Location: $BACKUP_DIR/${BACKUP_NAME}.tar.gz"
    echo "Created: $(date)"
    echo "Size: $(du -sh "$BACKUP_DIR/${BACKUP_NAME}.tar.gz" | cut -f1)"
    echo ""
    echo "Contents:"
    echo "- Database files"
    echo "- Configuration (sanitized)"
    echo "- SSL certificates"
    echo "- Recent logs"
    echo "- Backup manifest"
    echo ""
    echo "To restore, run: ./scripts/restore.sh $BACKUP_DIR/${BACKUP_NAME}.tar.gz"
}

# Main backup function
main() {
    log_info "Starting Homie backup process..."
    log_info "Backup directory: $BACKUP_DIR"

    # Create backup directory
    mkdir -p "$BACKUP_DIR"

    # Create backup structure
    create_backup_structure

    # Perform backups
    backup_database
    backup_config
    backup_ssl
    backup_logs

    # Create manifest
    create_manifest

    # Compress backup
    compress_backup

    # Cleanup old backups
    cleanup_old_backups

    # Show summary
    show_summary

    log_success "Backup completed successfully!"
}

# Run main function
main "$@"
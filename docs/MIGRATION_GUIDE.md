# Migration Guide: From Environment Variables to Database Configuration

## Overview

This guide explains how to migrate from the legacy environment variable-based configuration to the new database-backed ServiceConfig system for external services.

## What Changed

### Before (Legacy)
- External service configurations were stored in environment variables:
  ```bash
  PROXMOX_HOST=https://proxmox.example.com:8006
  PROXMOX_TOKEN=your-proxmox-token
  SONARR_URL=http://sonarr.example.com:8989
  SONARR_API_KEY=your-sonarr-api-key
  # ... etc
  ```

### After (New System)
- External service configurations are stored in the database via the ServiceConfig system
- Credentials are encrypted and securely stored
- Configuration changes don't require application restart
- Per-user service configurations supported

## Migration Steps

### Step 1: Backup Your Current Configuration

Before making any changes, backup your current environment variables:

```bash
# Create a backup of your current .env file
cp .env .env.backup
```

### Step 2: Update Environment Files

Remove external service configurations from your environment files:

1. **Edit `.env.production`**:
   - Remove all external service configuration lines
   - The file should only contain application-level settings

2. **Edit `.env`** (development):
   - Remove external service configurations
   - Keep only database, server, and JWT settings

### Step 3: Start the Application

Ensure the application starts successfully with the cleaned environment:

```bash
# For development
npm run dev

# For production
npm run docker:prod
```

### Step 4: Configure Services via Web Interface

1. **Log in to the application**
2. **Navigate to Settings > Service Configuration**
3. **Add each external service**:

#### Proxmox Configuration
- **Service Type**: Proxmox
- **Name**: Your Proxmox server name
- **Base URL**: `https://proxmox.example.com`
- **Port**: `8006`
- **Authentication Type**: Token
- **Token**: Your Proxmox API token

#### Docker Configuration
- **Service Type**: Docker
- **Name**: Your Docker host name
- **Base URL**: `unix:///var/run/docker.sock` (for local) or `tcp://docker-host:2376` (for remote)
- **Authentication Type**: None (for socket) or Certificate (for remote TLS)

#### Sonarr Configuration
- **Service Type**: Sonarr
- **Name**: Your Sonarr instance name
- **Base URL**: `http://sonarr.example.com`
- **Port**: `8989`
- **Authentication Type**: API Key
- **API Key**: Your Sonarr API key

#### Radarr Configuration
- **Service Type**: Radarr
- **Name**: Your Radarr instance name
- **Base URL**: `http://radarr.example.com`
- **Port**: `7878`
- **Authentication Type**: API Key
- **API Key**: Your Radarr API key

#### SABnzbd Configuration
- **Service Type**: SABnzbd
- **Name**: Your SABnzbd instance name
- **Base URL**: `http://sabnzbd.example.com`
- **Port**: `8080`
- **Authentication Type**: None (or API Key if configured)
- **API Key**: Your SABnzbd API key (if using authentication)

### Step 5: Test Service Connections

After configuring each service:

1. **Click "Test Connection"** for each service
2. **Verify the connection status** shows as "Active"
3. **Check service widgets** on the dashboard
4. **Test service operations** (start/stop VMs, etc.)

### Step 6: Verify Dashboard Functionality

Ensure all your services are working correctly:

- **Proxmox**: VM list, status, start/stop controls
- **Docker**: Container list, status, lifecycle controls
- **Sonarr/Radarr**: Queue status, media management
- **SABnzbd**: Download queue, history, controls

## Troubleshooting

### Service Connection Issues

**Problem**: Service shows as "Error" or "Unknown" status
**Solutions**:
1. **Verify credentials**: Double-check API keys, tokens, and passwords
2. **Check network connectivity**: Ensure the application can reach the service
3. **Verify service URLs**: Confirm hostnames, ports, and protocols are correct
4. **Check service logs**: Look for error messages in the target service
5. **Firewall rules**: Ensure no firewall is blocking connections

**Problem**: "Connection refused" or "Timeout" errors
**Solutions**:
1. **Verify service is running**: Check that the target service is operational
2. **Check port configuration**: Ensure the correct port is configured
3. **Network access**: Verify the application server can reach the service
4. **SSL/TLS issues**: For HTTPS services, check SSL configuration

### Configuration Issues

**Problem**: Can't save service configuration
**Solutions**:
1. **Required fields**: Ensure all required fields are filled
2. **Valid URL format**: Check that Base URL is a valid URL
3. **Authentication**: Verify authentication type and credentials match service requirements

**Problem**: Service configurations not persisting
**Solutions**:
1. **Database connectivity**: Ensure database is accessible and writable
2. **Disk space**: Check available disk space for the database
3. **Permissions**: Verify application has write access to database file

## Benefits of the New System

### Security Improvements
- **Encrypted credentials**: API keys and passwords are encrypted at rest
- **No plaintext secrets**: Sensitive data never stored in plain text
- **Secure key management**: Encryption keys are properly managed

### Operational Benefits
- **Runtime configuration**: Add/remove services without restarting
- **Per-user configurations**: Different users can have different service access
- **Centralized management**: All configurations in one place
- **Backup and restore**: Configurations included in database backups

### Developer Experience
- **No environment file management**: No need to manage complex .env files
- **Version control friendly**: Service configurations not in version control
- **Environment consistency**: Same configuration system across all environments

## Rollback Procedure

If you need to rollback to the environment variable system:

1. **Stop the application**
2. **Restore your backup**:
   ```bash
   cp .env.backup .env
   ```
3. **Remove database configurations**:
   - Access the database directly
   - Delete records from `service_configs` table
4. **Restart the application**

## Additional Resources

- **API Documentation**: Check `/docs/API.md` for service configuration endpoints
- **Architecture Document**: Review `/docs/ARCHITECTURE.md` for system design
- **Service Configuration Guide**: See main documentation for detailed service setup

## Support

If you encounter issues during migration:

1. **Check application logs** for error messages
2. **Verify database connectivity** and permissions
3. **Test service endpoints** independently
4. **Review service documentation** for correct configuration parameters

For additional help, consult the project documentation or create an issue in the repository.
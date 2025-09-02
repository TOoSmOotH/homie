# Homie Production Deployment Guide

This guide covers the complete production deployment process for Homie using two services (frontend and backend). TLS/SSL is handled by your external reverse proxy (e.g., Nginx, Traefik, Caddy). No web server runs inside the containers.

## Table of Contents

1. [Prerequisites](#prerequisites)
2. [Quick Start](#quick-start)
3. [Configuration](#configuration)
4. [Reverse Proxy & TLS](#reverse-proxy--tls)
5. [Deployment](#deployment)
6. [Monitoring & Health Checks](#monitoring--health-checks)
7. [Backup & Restore](#backup--restore)
8. [Security](#security)
9. [Troubleshooting](#troubleshooting)
10. [Maintenance](#maintenance)

## Prerequisites

### System Requirements

- **Operating System**: Linux (Ubuntu 20.04+ recommended)
- **Memory**: Minimum 1GB RAM, 2GB recommended
- **Storage**: 10GB free space for application and data
- **Network**: Public IP address and/or domain name (TLS terminated by your proxy)

### Required Software

```bash
# Docker and Docker Compose
sudo apt-get update
sudo apt-get install docker.io
# Docker Compose V2 is included with Docker CLI

# Git
sudo apt-get install git

# curl and other utilities
sudo apt-get install curl wget
```

### Domain & DNS

- A registered domain name (e.g., `homie.yourdomain.com`)
- DNS A record pointing to your server's public IP

## Quick Start

### 1. Clone and Setup

```bash
# Clone the repository
git clone <your-repo-url> homie
cd homie

# Copy and configure environment
cp .env.production .env.production.local
# Edit .env.production.local with your settings
```

### 2. Initial Deployment

```bash
# Make deployment script executable
chmod +x scripts/deploy.sh

# Deploy the application
./scripts/deploy.sh --build --deploy
```

### 3. Configure Reverse Proxy TLS

Terminate TLS at your reverse proxy and forward HTTP to the Homie services on host ports 9826 (frontend) and 9827 (backend). See Reverse Proxy & TLS below for examples.

## Configuration

### Environment Variables

Copy `.env.production` and configure the following critical variables:

```bash
# Required
NODE_ENV=production
DOMAIN=your-domain.com
BACKEND_PORT=9827

# Security (Generate strong secrets)
JWT_SECRET=your-64-character-random-string
SESSION_SECRET=your-32-character-random-string

# Reverse proxy
# Configure TLS on your proxy; container stays HTTP-only
```

### Docker Configuration

The production setup uses two optimized containers with:

- Separate images for frontend and backend
- Security hardening with non-root users
- Resource limits for stability
- Two HTTP ports (9826 for frontend, 9827 for backend) with TLS handled by your reverse proxy

### Network Configuration

- **Internal**: Services communicate via Docker networks
- **External**: Expose two HTTP ports (default host ports 9826 -> 3000 for frontend, 9827 -> 9827 for backend); terminate TLS on your proxy
- **WebSocket**: Support for real-time features

## Reverse Proxy & TLS

Homie serves HTTP on two ports. Configure your reverse proxy to terminate TLS and forward traffic to the containers.

Example Nginx configuration:

```nginx
upstream homie_frontend { server frontend:3000; }
upstream homie_backend { server backend:9827; }

server {
  listen 80;
  server_name your-domain.com;
  return 301 https://$host$request_uri;
}

server {
  listen 443 ssl http2;
  server_name your-domain.com;
  # ssl_certificate /path/to/fullchain.pem;
  # ssl_certificate_key /path/to/privkey.pem;

  location /homie/ {
    proxy_pass http://homie_frontend/homie/;
  }

  location /api/ {
    proxy_pass http://homie_backend/api/;
    proxy_http_version 1.1;
    proxy_set_header Upgrade $http_upgrade;
    proxy_set_header Connection "upgrade";
  }

  location /socket.io/ {
    proxy_pass http://homie_backend/socket.io/;
    proxy_http_version 1.1;
    proxy_set_header Upgrade $http_upgrade;
    proxy_set_header Connection "upgrade";
  }
}
```

## Deployment

### Using the Deployment Script

The deployment script provides various options:

```bash
# Complete deployment with build
./scripts/deploy.sh --build --deploy

# Update existing deployment
./scripts/deploy.sh --update

# View deployment status
./scripts/deploy.sh --monitor

# View logs
./scripts/deploy.sh --logs

# Stop deployment
./scripts/deploy.sh --stop
```

### Manual Deployment

If you prefer manual control:

```bash
# Build and start services
docker compose build
docker compose up -d

# Check status
docker compose ps
docker compose logs
```

### Deployment Strategies

1. **Rolling Deployment**: Zero-downtime updates (default)
2. **Blue-Green**: Deploy to separate environment, then switch
3. **Canary**: Gradual traffic shifting (requires load balancer)

## Monitoring & Health Checks

### Health Check Endpoints

- Application Health: `http(s)://your-domain.com/homie` (serves SPA)
- API Health: `http(s)://your-domain.com/api/health`

### Monitoring Commands

```bash
# Check container health
docker compose ps

# View resource usage
docker stats $(docker compose ps -q)

# Check API health endpoint
curl -f http(s)://your-domain.com/api/health

# View logs
docker compose logs -f --tail=100
```

### Log Files

- Application Logs: `./logs/homie.log`
- Proxy Logs: Managed by your reverse proxy (outside container)

### Resource Monitoring

Monitor these key metrics:

- **CPU Usage**: Should stay below 70%
- **Memory Usage**: Should stay below 80%
- **Disk Usage**: Monitor data directory growth
- **Network I/O**: Monitor for unusual traffic patterns

## Backup & Restore

### Automated Backups

Configure automated backups in your environment:

```bash
# Add to crontab for daily backups
0 2 * * * /path/to/homie/scripts/backup.sh
```

### Manual Backup

```bash
# Create backup
./scripts/backup.sh

# Create backup in specific directory
./scripts/backup.sh /path/to/backups
```

### Restore from Backup

```bash
# Restore from backup
./scripts/restore.sh ./backups/homie_backup_20231201_120000.tar.gz

# Force restore without confirmation
./scripts/restore.sh ./backups/homie_backup_20231201_120000.tar.gz --force
```

### Backup Contents

Each backup includes:

- **Database files** (SQLite database and WAL files)
- **Configuration** (sanitized environment files)
- **SSL certificates** (if available)
- **Recent logs** (last 7 days)
- **Backup manifest** (contents and metadata)

## Security

### Container Security

- **Non-root user**: Application runs as `appuser`
- **Minimal base image**: Alpine Linux with essential packages
- **Security hardening**: Dropped capabilities, read-only filesystem
- **Resource limits**: CPU and memory restrictions

### Network Security

- **SSL/TLS encryption**: All traffic encrypted in transit
- **Rate limiting**: API and general request limits
- **Security headers**: XSS protection, CSRF protection
- **CORS policy**: Configurable cross-origin settings

### Data Security

- **Encrypted secrets**: Sensitive data encrypted at rest
- **Backup security**: Encrypted and compressed backups
- **Access control**: Proper file permissions and ownership

### Security Best Practices

1. **Regular Updates**: Keep Docker images and system packages updated
2. **Strong Passwords**: Use complex passwords for all services
3. **Firewall**: Configure firewall rules to limit access
4. **Monitoring**: Monitor for security threats and anomalies
5. **Backups**: Regular backups with off-site storage

## Troubleshooting

### Common Issues

#### 1. Container Won't Start

```bash
# Check container status
docker compose ps

# View detailed logs
docker compose logs homie

# Check health status
docker compose exec homie /app/healthcheck.sh
```

#### 2. TLS/SSL Issues

TLS is terminated at your reverse proxy. Verify proxy certificate configuration and logs. Common checks:

```bash
# Confirm proxy forwards to container
curl -I http://localhost:9825/api/health

# Check proxy access/error logs
journalctl -u nginx -n 100 --no-pager  # or your proxy
```

#### 3. Database Connection Issues

```bash
# Check database file
ls -la ./data/homie.db

# Check file permissions
docker compose exec homie ls -la /app/data/

# Verify database integrity
docker compose exec homie sqlite3 /app/data/homie.db ".dbinfo"
```

#### 4. High Resource Usage

```bash
# Check resource usage
docker stats $(docker compose ps -q)

# View nginx status
docker compose exec homie nginx -s status

# Check backend process
docker compose exec homie ps aux
```

### Log Analysis

```bash
# View recent application logs
tail -f ./logs/homie.log

# View nginx access logs
docker compose exec homie tail -f /var/log/nginx/access.log

# View nginx error logs
docker compose exec homie tail -f /var/log/nginx/error.log
```

### Performance Tuning

1. **Memory Issues**: Increase container memory limit
2. **CPU Issues**: Adjust CPU allocation or optimize code
3. **Disk I/O**: Use faster storage or optimize database queries
4. **Network**: Check for network bottlenecks or DDoS attacks

## Maintenance

### Regular Maintenance Tasks

#### 1. System Updates

```bash
# Update Docker images
docker compose pull
docker compose up -d

# Update system packages
sudo apt-get update && sudo apt-get upgrade
```

#### 2. Log Rotation

```bash
# Rotate application logs
find ./logs -name "*.log" -size +100M -exec gzip {} \;

# Rotate Docker logs
docker compose exec homie logrotate /etc/logrotate.conf
```

#### 3. Database Maintenance

```bash
# Vacuum SQLite database
docker compose exec homie sqlite3 /app/data/homie.db "VACUUM;"

# Check database integrity
docker compose exec homie sqlite3 /app/data/homie.db "PRAGMA integrity_check;"
```

#### 4. SSL Certificate Maintenance

```bash
# Check certificate expiration
docker compose exec homie openssl x509 -enddate -noout -in /etc/letsencrypt/live/your-domain.com/fullchain.pem

# Renew certificates
./scripts/deploy.sh --ssl-renew
```

### Emergency Procedures

#### 1. Service Recovery

```bash
# Quick restart
docker compose restart

# Full rebuild if needed
./scripts/deploy.sh --update
```

#### 2. Data Recovery

```bash
# Restore from latest backup
LATEST_BACKUP=$(ls -t ./backups/homie_backup_*.tar.gz | head -1)
./scripts/restore.sh "$LATEST_BACKUP" --force
```

#### 3. Proxy Emergency

Fallback to HTTP by routing around TLS at the proxy if needed; the container remains unchanged.

### Monitoring & Alerts

Set up monitoring for:

- **Service availability**: Health check endpoints
- **Resource usage**: CPU, memory, disk
- **SSL certificate expiration**: Alert 30 days before expiry
- **Backup status**: Ensure backups complete successfully
- **Security threats**: Monitor for unusual access patterns

## Advanced Configuration

### Custom Docker Configuration

Modify `docker-compose.yml` for specific requirements:

```yaml
# Add resource limits
deploy:
  resources:
    limits:
      cpus: '2.0'
      memory: 2G
    reservations:
      cpus: '0.5'
      memory: 512M
```

### Load Balancing

For high availability, use a load balancer:

```nginx
# Load balancer configuration
upstream homie_backend {
    server homie1:9825;
    server homie2:9825;
}

server {
    listen 443 ssl http2;
    server_name your-domain.com;

    location /homie/ { proxy_pass http://homie_backend/homie/; }
    location /api/   { proxy_pass http://homie_backend/api/; }
    location /socket.io/ {
      proxy_pass http://homie_backend/socket.io/;
      proxy_http_version 1.1;
      proxy_set_header Upgrade $http_upgrade;
      proxy_set_header Connection "upgrade";
    }
}
```

### Database Optimization

For larger deployments, consider:

1. **Connection pooling**: Implement connection pooling
2. **Database indexing**: Add appropriate indexes
3. **Query optimization**: Monitor and optimize slow queries
4. **Read replicas**: Implement read replicas for scalability

## Support

### Getting Help

1. **Check logs**: Review application and system logs
2. **Health checks**: Verify all health endpoints are responding
3. **Documentation**: Review this guide and inline documentation
4. **Community**: Check for similar issues and solutions

### Escalation

If you encounter critical issues:

1. **Stop the service**: `./scripts/deploy.sh --stop`
2. **Restore from backup**: Use the latest backup
3. **Contact support**: Provide logs and system information

---

## Checklist

Use this checklist for production deployments:

- [ ] Server requirements met (CPU, RAM, storage)
- [ ] Domain name configured and DNS updated
- [ ] Environment variables configured
- [ ] Reverse proxy configured with TLS
- [ ] Backup strategy implemented
- [ ] Monitoring and alerting configured
- [ ] Security hardening applied
- [ ] Documentation reviewed and understood
- [ ] Emergency procedures documented

## Changelog

### v1.0.0
- Initial production deployment guide
- Single-container Docker setup
- Reverse proxy TLS in front of single-port container
- Automated backup and restore
- Health checks and monitoring
- Security hardening

---

**Note**: This guide is continuously updated. Check for the latest version before major deployments.

# Homie Deployment Guide

## Table of Contents
- [Prerequisites](#prerequisites)
- [Quick Start](#quick-start)
- [Production Deployment](#production-deployment)
- [Configuration](#configuration)
- [Security](#security)
- [Backup & Recovery](#backup--recovery)
- [Troubleshooting](#troubleshooting)

## Prerequisites

- Docker and Docker Compose installed
- A domain name (for production)
- SSL certificate (Let's Encrypt recommended)
- SMTP server for email notifications (optional but recommended)

## Quick Start

1. **Clone the repository:**
```bash
git clone https://github.com/yourusername/homie.git
cd homie
```

2. **Copy environment configuration:**
```bash
cp .env.example .env
```

3. **Generate secure secrets:**
```bash
# Generate JWT secret
openssl rand -base64 64

# Generate session secret
openssl rand -base64 32
```

4. **Update `.env` with your values**

5. **Start with Docker Compose:**
```bash
docker-compose up -d
```

6. **Access the application:**
- Navigate to `http://localhost:9826`
- Complete initial admin setup

## Production Deployment

### 1. Environment Configuration

Copy and configure the production environment file:

```bash
cp .env.production .env
```

**Critical settings to update:**

- `JWT_SECRET` - Use a secure random string (64+ characters)
- `SESSION_SECRET` - Use a different secure random string (32+ characters)
- `FRONTEND_URL` - Your domain (e.g., https://your-domain.com)
- `CORS_ORIGIN` - Same as FRONTEND_URL
- Email settings for password resets

### 2. Docker Compose Production

Use the production Docker Compose configuration:

```bash
docker-compose -f docker-compose.yml up -d
```

### 3. Reverse Proxy Setup (Nginx)

Example Nginx configuration:

```nginx
server {
    listen 80;
    server_name your-domain.com;
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name your-domain.com;

    ssl_certificate /etc/letsencrypt/live/your-domain.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/your-domain.com/privkey.pem;

    # Security headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header Referrer-Policy "strict-origin-when-cross-origin" always;

    location / {
        proxy_pass http://localhost:9826;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

### 4. SSL with Let's Encrypt

Install and configure Certbot:

```bash
# Install Certbot
sudo apt-get update
sudo apt-get install certbot python3-certbot-nginx

# Get certificate
sudo certbot --nginx -d your-domain.com

# Auto-renewal
sudo certbot renew --dry-run
```

## Configuration

### Authentication Setup

1. **First-time Setup:**
   - On first visit, create the admin account
   - Save credentials securely

2. **User Management:**
   - Admin users can create additional accounts
   - Navigate to `/admin/users` to manage users

3. **Password Reset:**
   - Configure SMTP settings in `.env` (optional)
   - Users can reset passwords via email if SMTP is configured
   - If email is not configured, password reset tokens are logged to console

4. **Email Verification (Optional):**
   - Disabled by default for home lab environments
   - Enable by setting `ENABLE_EMAIL_VERIFICATION=true` in `.env`
   - Requires SMTP configuration for sending verification emails
   - When disabled, new users are automatically verified

### Service Configuration

Services are configured through the web interface:

1. Login as admin
2. Go to Settings > Service Configuration
3. Add your services (Proxmox, Docker, Sonarr, etc.)
4. Credentials are encrypted in the database

## Security

### Best Practices

1. **Secrets Management:**
   - Never commit `.env` files with real secrets
   - Use strong, unique secrets for JWT and sessions
   - Rotate secrets periodically

2. **Network Security:**
   - Use HTTPS in production
   - Configure firewall rules
   - Limit exposed ports

3. **Database Security:**
   - Database is stored in `/app/data/homie.db`
   - Regular backups recommended
   - Encrypted sensitive data

4. **User Security:**
   - Enforce strong passwords (min 10 chars in production)
   - Account lockout after failed attempts
   - Optional 2FA (when enabled)

### Security Checklist

- [ ] Changed default JWT_SECRET
- [ ] Changed default SESSION_SECRET
- [ ] Configured HTTPS/SSL
- [ ] Set up firewall rules
- [ ] Configured backup strategy
- [ ] Tested password reset flow
- [ ] Reviewed user permissions

## Backup & Recovery

### Automated Backups

Backups are configured in `.env`:

```env
BACKUP_ENABLED=true
BACKUP_INTERVAL=86400000  # Daily
BACKUP_DIR=/app/backups
BACKUP_RETENTION_DAYS=30
```

### Manual Backup

```bash
# Backup database
docker exec homie-backend sqlite3 /app/data/homie.db ".backup /app/backups/homie-$(date +%Y%m%d).db"

# Backup entire data directory
docker exec homie-backend tar -czf /app/backups/homie-data-$(date +%Y%m%d).tar.gz /app/data
```

### Restore from Backup

```bash
# Stop the application
docker-compose down

# Restore database
docker run -v ./backups:/backups -v ./data:/data alpine \
  cp /backups/homie-20240101.db /data/homie.db

# Restart application
docker-compose up -d
```

## Monitoring

### Health Checks

- Health endpoint: `/health`
- Metrics endpoint: `/metrics` (when enabled)

### Logs

View application logs:

```bash
# All logs
docker-compose logs -f

# Backend logs only
docker-compose logs -f backend

# Last 100 lines
docker-compose logs --tail=100
```

### Performance Tuning

Adjust in `.env`:

```env
NODE_MEMORY_LIMIT=1024  # Increase for larger deployments
RATE_LIMIT_MAX_REQUESTS=50  # Adjust based on usage
```

## Troubleshooting

### Common Issues

1. **Cannot access application:**
   - Check Docker containers: `docker-compose ps`
   - Review logs: `docker-compose logs`
   - Verify ports: `netstat -tulpn | grep 3000`

2. **Database errors:**
   - Check permissions: `ls -la ./data`
   - Verify database: `docker exec homie-backend sqlite3 /app/data/homie.db ".tables"`

3. **Authentication issues:**
   - Verify JWT_SECRET is set
   - Check token expiration settings
   - Review auth logs

4. **Email not working:**
   - Verify SMTP settings
   - Check firewall for port 587/465
   - Test with mail client first

### Reset Admin Password

If you lose admin access:

```bash
# Connect to container
docker exec -it homie-backend sh

# Use SQLite to reset password (example)
sqlite3 /app/data/homie.db
UPDATE users SET passwordHash='$2a$12$...' WHERE username='admin';
.exit
```

### Complete Reset

To start fresh:

```bash
# Stop and remove containers
docker-compose down -v

# Remove data (CAUTION: This deletes everything)
rm -rf ./data ./logs ./backups

# Restart
docker-compose up -d
```

## Support

For issues and questions:
- GitHub Issues: [your-repo/issues]
- Documentation: [your-repo/wiki]
- Email: support@your-domain.com

## License

[Your License]

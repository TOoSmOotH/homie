# Homie Production Deployment Checklist

This checklist ensures a smooth and secure production deployment of Homie. Follow each step in order to avoid common deployment issues.

## Pre-Deployment Preparation

### [ ] System Requirements
- [ ] Server meets minimum requirements (1GB RAM, 10GB storage, Linux OS)
- [ ] Public IP address available (for SSL) or domain configured
- [ ] Network connectivity verified (outbound internet access)
- [ ] DNS records configured (A record pointing to server IP)

### [ ] Domain & SSL
- [ ] Domain name registered and DNS propagated
- [ ] SSL certificate plan decided (Let's Encrypt automatic or manual)
- [ ] Email address available for SSL certificate registration
- [ ] Port 80 and 443 accessible through firewall

### [ ] Security Planning
- [ ] Strong passwords generated for all services
- [ ] JWT and session secrets generated (64+ characters)
- [ ] Backup strategy planned (frequency, retention, location)
- [ ] Security monitoring plan in place

## Environment Setup

### [ ] Server Preparation
- [ ] Operating system updated and secured
- [ ] Firewall configured (UFW or iptables)
- [ ] SSH hardened (key-based authentication, non-standard port)
- [ ] Unnecessary services disabled
- [ ] Time synchronization configured (NTP)

### [ ] Docker Installation
- [ ] Docker CE installed and running
- [ ] Docker Compose v2+ installed
- [ ] User added to docker group
- [ ] Docker daemon configured for production

### [ ] Application Setup
- [ ] Homie repository cloned to server
- [ ] Setup script executed: `./scripts/setup-production.sh`
- [ ] Environment file configured: `.env.production`
- [ ] All scripts made executable: `chmod +x scripts/*.sh`

## Configuration

### [ ] Environment Variables
- [ ] `NODE_ENV=production` set
- [ ] `DOMAIN` configured with actual domain name
- [ ] `ENABLE_SSL=true` (if using SSL)
- [ ] `SSL_EMAIL` configured with valid email
- [ ] Database path configured: `DB_PATH=/app/data/homie.db`
- [ ] JWT and session secrets set with strong random values
- [ ] CORS origin configured for production domain
- [ ] Log level set appropriately (info/warn/error)

### [ ] Docker Configuration
- [ ] `docker-compose.yml` reviewed for resource limits
- [ ] Volume mounts configured for data persistence
- [ ] Network configuration verified
- [ ] Port mappings confirmed (80, 443)
- [ ] Health check configuration verified

## SSL/HTTPS Configuration

### [ ] SSL Certificate Setup
- [ ] Domain DNS pointing to server IP verified
- [ ] Port 80 accessible for HTTP-01 challenge
- [ ] SSL setup script ready: `./scripts/deploy.sh --ssl-setup`
- [ ] Certificate auto-renewal configured

### [ ] Alternative SSL Options
- [ ] Custom certificate paths configured (if not using Let's Encrypt)
- [ ] Certificate validity checked
- [ ] Certificate chain verified

## Deployment

### [ ] Initial Deployment
- [ ] Docker images built successfully
- [ ] Services started without errors
- [ ] Health checks passing
- [ ] Application accessible on HTTP (port 80)

### [ ] SSL Activation
- [ ] SSL certificates obtained successfully
- [ ] HTTPS working (port 443)
- [ ] HTTP to HTTPS redirect configured
- [ ] SSL certificate valid and trusted

### [ ] Service Verification
- [ ] Backend API responding: `https://your-domain.com/api/health`
- [ ] Frontend serving correctly: `https://your-domain.com/homie`
- [ ] WebSocket connections working
- [ ] Database accessible and functional

## Security Hardening

### [ ] Container Security
- [ ] Non-root user verified (appuser)
- [ ] Security capabilities dropped
- [ ] Resource limits enforced
- [ ] Read-only filesystem where possible

### [ ] Network Security
- [ ] Rate limiting configured and tested
- [ ] Security headers present
- [ ] CORS policy restrictive
- [ ] WebSocket connections secured

### [ ] Data Security
- [ ] Sensitive environment variables not in logs
- [ ] Database file permissions correct
- [ ] Backup files encrypted and secure

## Monitoring & Maintenance

### [ ] Monitoring Setup
- [ ] Health check endpoints responding
- [ ] Log files accessible and rotating
- [ ] Resource usage monitoring configured
- [ ] SSL certificate expiration monitoring

### [ ] Backup Configuration
- [ ] Automated backup script configured
- [ ] Backup storage location accessible
- [ ] Backup retention policy set
- [ ] Restore procedure tested

### [ ] Maintenance Schedule
- [ ] System update schedule planned
- [ ] SSL certificate renewal automated
- [ ] Log rotation configured
- [ ] Database maintenance planned

## Testing

### [ ] Functionality Testing
- [ ] User authentication working
- [ ] Service connections functional
- [ ] Dashboard loading correctly
- [ ] Real-time updates working

### [ ] Performance Testing
- [ ] Page load times acceptable (<3s)
- [ ] API response times reasonable (<1s)
- [ ] Memory usage stable under load
- [ ] CPU usage reasonable

### [ ] Security Testing
- [ ] SSL certificate valid and secure
- [ ] Security headers present
- [ ] No sensitive data in client-side code
- [ ] Authentication properly enforced

## Documentation

### [ ] Documentation Complete
- [ ] Deployment documentation up to date
- [ ] Configuration documented
- [ ] Troubleshooting guides available
- [ ] Maintenance procedures documented

### [ ] Team Knowledge
- [ ] Team members familiar with deployment process
- [ ] Emergency procedures documented and understood
- [ ] Contact information for support available

## Go-Live Checklist

### [ ] Final Pre-Launch
- [ ] All health checks passing
- [ ] SSL certificates valid
- [ ] DNS fully propagated
- [ ] Backup completed before launch

### [ ] Launch Day
- [ ] Application deployed successfully
- [ ] SSL working correctly
- [ ] Domain accessible and functional
- [ ] Initial user created (if required)

### [ ] Post-Launch
- [ ] Initial backup created
- [ ] Monitoring alerts configured
- [ ] Performance monitored for 24-48 hours
- [ ] User feedback collected and addressed

## Emergency Procedures

### [ ] Quick Recovery
- [ ] Stop command: `./scripts/deploy.sh --stop`
- [ ] Start command: `./scripts/deploy.sh --deploy`
- [ ] Restart command: `./scripts/deploy.sh --restart`

### [ ] Data Recovery
- [ ] Latest backup location identified
- [ ] Restore command: `./scripts/restore.sh <backup-file>`
- [ ] Database integrity check procedure

### [ ] SSL Emergency
- [ ] Disable SSL: Set `ENABLE_SSL=false`
- [ ] Emergency SSL setup procedure
- [ ] Certificate renewal emergency procedure

## Ongoing Maintenance

### [ ] Weekly Tasks
- [ ] Check system resource usage
- [ ] Review application logs
- [ ] Verify backup completion
- [ ] Check SSL certificate expiration

### [ ] Monthly Tasks
- [ ] Security updates applied
- [ ] Performance optimization review
- [ ] Backup restoration test
- [ ] Documentation review and update

### [ ] Quarterly Tasks
- [ ] Major system updates
- [ ] Security audit
- [ ] Performance benchmarking
- [ ] Disaster recovery drill

---

**Note**: This checklist should be reviewed and updated regularly to reflect changes in the application, infrastructure, or organizational requirements. Keep it accessible to all team members involved in deployment and maintenance.
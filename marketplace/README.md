# Homie Service Marketplace

This directory contains service definitions for the Homie homelab manager. Each service is defined as a JSON file that describes how to connect, interact with, and display data from that service.

## 📚 Documentation

- **[Complete Service Creation Guide](../docs/CREATE_SERVICE_GUIDE.md)** - Comprehensive guide for creating custom services
- **[Schema Quick Reference](../docs/SERVICE_SCHEMA_REFERENCE.md)** - Quick reference for all schema properties
- **[Service Template](SERVICE_TEMPLATE.json)** - Ready-to-use template for new services

## 🚀 Quick Start

### Creating a New Service

1. **Copy the template:**
   ```bash
   cp SERVICE_TEMPLATE.json services/[category]/your-service.json
   ```

2. **Customize your service:**
   - Set unique `id` and `name`
   - Configure `connection` settings
   - Define `api` endpoints
   - Create `widgets` for data display
   - Add `settings` for user customization

3. **Test your service:**
   - Place file in appropriate category folder
   - Restart backend or sync marketplace
   - Install from UI marketplace
   - Test connection and widgets

4. **Share with community:**
   - Submit a pull request
   - Include documentation
   - Add examples if complex

## 📁 Directory Structure

```
marketplace/
├── services/           # Service definitions by category
│   ├── automation/    # Automation tools (Radarr, Sonarr, Lidarr)
│   ├── communication/ # Chat and messaging services
│   ├── data/          # Databases and data tools
│   ├── development/   # Dev tools (Gitea, Jenkins)
│   ├── gaming/        # Game servers
│   ├── home-automation/ # Smart home (Home Assistant)
│   ├── infrastructure/ # Infrastructure management
│   ├── media/         # Media servers (Plex, Jellyfin, Emby)
│   ├── monitoring/    # Monitoring tools (Grafana, Prometheus)
│   ├── networking/    # Network tools (Pi-hole, NPM)
│   ├── productivity/  # Productivity apps
│   ├── security/      # Security tools (Bitwarden)
│   ├── storage/       # Storage services (Nextcloud)
│   └── other/         # Uncategorized services
├── schemas/           # JSON schemas for validation
├── icons/            # Service icons (future)
├── categories/       # Category definitions
└── marketplace.json  # Marketplace metadata
```

## 🎯 Service Categories

- `automation` - Download automation, task runners
- `communication` - Chat, email, messaging
- `data` - Databases, analytics, BI tools
- `development` - Code repos, CI/CD, dev tools
- `gaming` - Game servers and managers
- `home-automation` - Smart home platforms
- `infrastructure` - Docker, K8s, system tools
- `media` - Media servers and streaming
- `monitoring` - Metrics, logs, monitoring
- `networking` - DNS, proxy, VPN, firewall
- `productivity` - Notes, docs, project management
- `security` - Password managers, auth, security
- `storage` - File sync, cloud storage, backups
- `other` - Everything else

## 📋 Service Definition Structure

### Minimal Example
```json
{
  "id": "my-service",
  "name": "My Service",
  "version": "1.0.0",
  "author": "Your Name",
  "description": "What this service does",
  "category": "media",
  "icon": "🎬",
  
  "connection": {
    "type": "api",
    "auth": "apikey",
    "fields": [
      {
        "key": "url",
        "label": "Service URL",
        "type": "url",
        "required": true
      },
      {
        "key": "api_key",
        "label": "API Key",
        "type": "password",
        "required": true
      }
    ]
  },
  
  "api": {
    "baseUrl": "{url}",
    "headers": {
      "X-Api-Key": "{api_key}"
    },
    "endpoints": {
      "status": {
        "path": "/api/status",
        "method": "GET"
      }
    }
  },
  
  "widgets": [
    {
      "id": "status",
      "name": "Status",
      "type": "stat",
      "dataSource": "status",
      "display": {
        "value": "{status}",
        "label": "Service Status"
      }
    }
  ]
}
```

### Key Features

#### 🔌 Connection Configuration
- Define authentication method (apikey, basic, oauth2)
- Specify required fields (URL, credentials)
- Include test endpoint for validation

#### 📡 API Integration
- Configure base URL and headers
- Define multiple endpoints
- Transform responses with JavaScript
- Set refresh intervals and caching

#### 📊 Widget System
- **stat** - Single statistics
- **list** - Item lists with templates
- **info** - Information panels
- **chart** - Data visualization (coming soon)
- **calendar** - Event calendars (coming soon)

#### ⚙️ User Settings
- Display toggles for widgets
- Configuration options
- Theme preferences
- Refresh intervals

#### ⚡ Quick Actions
- One-click operations
- Confirmation dialogs
- API endpoint execution

## 🧪 Testing Your Service

1. **Validate JSON syntax:**
   ```bash
   python -m json.tool < your-service.json
   ```

2. **Check required fields:**
   - id, name, version, author, description
   - category from allowed list
   - connection configuration
   - at least one widget

3. **Test in Homie:**
   - Place in correct category folder
   - Sync marketplace in UI
   - Install and configure
   - Verify widgets display data

## 🤝 Contributing

### Submitting a New Service

1. Fork the repository
2. Create your service definition
3. Test thoroughly with your instance
4. Add documentation if complex
5. Submit pull request with:
   - Service file in correct category
   - Description of service
   - Example configuration
   - Screenshots (optional)

### Guidelines

- Use descriptive IDs (lowercase, hyphens)
- Provide clear descriptions
- Include helpful placeholders
- Handle errors gracefully
- Document special requirements
- Test with service variations

## 📜 Examples

Check existing services for reference:
- `media/plex.json` - Complex media server
- `automation/radarr.json` - Full-featured automation
- `monitoring/grafana.json` - Monitoring with dashboards
- `networking/pihole.json` - Network service
- `storage/nextcloud.json` - Storage with auth

## ❓ Need Help?

- Read the [Complete Guide](../docs/CREATE_SERVICE_GUIDE.md)
- Check [Schema Reference](../docs/SERVICE_SCHEMA_REFERENCE.md)
- Review existing services
- Open an issue for questions
- Join community discussions

## 📄 License

Service definitions are provided as-is for use with Homie. Individual services may have their own licenses and terms.
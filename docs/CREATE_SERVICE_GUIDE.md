# Creating Custom Services for Homie Marketplace

This guide will walk you through creating your own service definition for the Homie marketplace. Services in Homie are defined using JSON manifests that describe how to connect to and interact with external services.

## Table of Contents
- [Overview](#overview)
- [Service Manifest Structure](#service-manifest-structure)
- [Basic Service Example](#basic-service-example)
- [Advanced Features](#advanced-features)
- [Testing Your Service](#testing-your-service)
- [Best Practices](#best-practices)

## Overview

A Homie service definition is a JSON file that contains:
- **Connection details** - How to connect and authenticate with the service
- **API endpoints** - What data to fetch and how
- **Widgets** - UI components to display the data
- **Settings** - User-configurable options
- **Quick Actions** - One-click operations users can perform

## Service Manifest Structure

### Basic Structure

```json
{
  "id": "unique-service-id",
  "name": "Service Name",
  "version": "1.0.0",
  "author": "Your Name",
  "description": "Short description of what this service does",
  "longDescription": "Detailed description with features and capabilities",
  "category": "media|automation|monitoring|networking|storage|security|development|productivity|communication|gaming|home-automation|data|infrastructure|other",
  "tags": ["tag1", "tag2"],
  "icon": "🎬",
  "homepage": "https://service-homepage.com",
  "documentation": "https://service-docs.com"
}
```

### Categories

Choose the most appropriate category for your service:
- `media` - Media servers, streaming services (Plex, Jellyfin, Emby)
- `automation` - Automation tools (Radarr, Sonarr, Lidarr)
- `monitoring` - System monitoring (Grafana, Prometheus)
- `networking` - Network tools (Pi-hole, Nginx Proxy Manager)
- `storage` - File storage and sync (Nextcloud, Syncthing)
- `security` - Security tools (Bitwarden, Authelia)
- `development` - Development tools (Gitea, Jenkins)
- `productivity` - Productivity apps (Bookstack, Paperless)
- `communication` - Chat and communication (Matrix, Rocket.Chat)
- `gaming` - Game servers and tools
- `home-automation` - Smart home (Home Assistant, Node-RED)
- `data` - Databases and data tools
- `infrastructure` - Infrastructure management
- `other` - Everything else

## Connection Configuration

The connection section defines how to authenticate with your service:

```json
{
  "connection": {
    "type": "api",
    "auth": "apikey|basic|oauth2|none",
    "fields": [
      {
        "key": "url",
        "label": "Service URL",
        "type": "url",
        "required": true,
        "placeholder": "http://192.168.1.100:8080",
        "description": "Full URL to your service instance"
      },
      {
        "key": "api_key",
        "label": "API Key",
        "type": "password",
        "required": true,
        "description": "Found in Settings > API"
      }
    ],
    "testEndpoint": {
      "path": "/api/health",
      "method": "GET",
      "headers": {
        "X-Api-Key": "{api_key}"
      },
      "expectedStatus": 200,
      "successIndicator": "status"
    }
  }
}
```

### Field Types
- `url` - URL input with validation
- `password` - Masked password input
- `text` - Plain text input
- `number` - Numeric input
- `boolean` - Checkbox
- `select` - Dropdown selection
- `port` - Port number (1-65535)
- `path` - File system path

### Authentication Types
- `apikey` - API key authentication
- `basic` - Basic auth (username/password)
- `oauth2` - OAuth 2.0 flow
- `none` - No authentication required

## API Configuration

Define the endpoints your service will use:

```json
{
  "api": {
    "baseUrl": "{url}",
    "headers": {
      "X-Api-Key": "{api_key}",
      "Content-Type": "application/json"
    },
    "endpoints": {
      "status": {
        "path": "/api/status",
        "method": "GET",
        "refresh": 30000,
        "cache": 60000
      },
      "items": {
        "path": "/api/items",
        "method": "GET",
        "params": {
          "limit": "10",
          "sort": "date"
        },
        "transform": "response.items",
        "refresh": 60000
      },
      "statistics": {
        "path": "/api/stats",
        "method": "GET",
        "transform": "response.data.stats",
        "cache": 300000
      }
    }
  }
}
```

### Endpoint Properties
- `path` - API endpoint path
- `method` - HTTP method (GET, POST, PUT, DELETE)
- `params` - Query parameters
- `body` - Request body (for POST/PUT)
- `headers` - Additional headers
- `refresh` - Auto-refresh interval in milliseconds
- `cache` - Cache duration in milliseconds
- `transform` - JavaScript expression to transform response

### Variable Interpolation
Use `{variable}` syntax to reference:
- Connection fields: `{url}`, `{api_key}`, `{username}`
- Settings values: `{setting_key}`
- Dynamic parameters: `{startDate}`, `{endDate}`

## Widget Configuration

Widgets display data from your API endpoints:

```json
{
  "widgets": [
    {
      "id": "status_widget",
      "name": "Service Status",
      "type": "stat|list|info|chart|grid|calendar",
      "icon": "📊",
      "size": "small|medium|large",
      "dataSource": "status",
      "display": {
        "value": "{status}",
        "label": "Current Status",
        "color": "success|warning|error|info"
      }
    },
    {
      "id": "items_list",
      "name": "Recent Items",
      "type": "list",
      "icon": "📋",
      "size": "large",
      "dataSource": "items",
      "display": {
        "itemTemplate": {
          "title": "{name}",
          "subtitle": "{description}",
          "progress": "{completion}"
        },
        "emptyMessage": "No items found",
        "maxItems": 10
      }
    },
    {
      "id": "info_panel",
      "name": "System Info",
      "type": "info",
      "icon": "ℹ️",
      "size": "medium",
      "dataSource": ["status", "statistics"],
      "display": {
        "fields": [
          { "label": "Version", "value": "{status.version}" },
          { "label": "Uptime", "value": "{status.uptime|duration}" },
          { "label": "Total Items", "value": "{statistics.total}" }
        ]
      }
    }
  ]
}
```

### Widget Types

#### `stat` - Single statistic
```json
{
  "type": "stat",
  "display": {
    "value": "{count}",
    "label": "Total Items",
    "color": "primary"
  }
}
```

#### `list` - List of items
```json
{
  "type": "list",
  "display": {
    "itemTemplate": {
      "title": "{title}",
      "subtitle": "{date|date}",
      "badge": "{status}"
    },
    "maxItems": 5,
    "emptyMessage": "No items"
  }
}
```

#### `info` - Information panel
```json
{
  "type": "info",
  "display": {
    "fields": [
      { "label": "Field 1", "value": "{field1}" },
      { "label": "Field 2", "value": "{field2}" }
    ]
  }
}
```

#### `chart` - Data visualization (future)
#### `grid` - Grid layout (future)
#### `calendar` - Calendar view (future)

## Data Transformers

Transform raw API responses into display-friendly formats:

```json
{
  "transformers": {
    "filesize": "function(bytes) { return (bytes / 1024 / 1024).toFixed(2) + ' MB'; }",
    "date": "function(dateStr) { return new Date(dateStr).toLocaleDateString(); }",
    "duration": "function(seconds) { return Math.floor(seconds / 60) + ' minutes'; }",
    "percentage": "function(value) { return (value * 100).toFixed(1) + '%'; }",
    "status": "function(code) { return code === 200 ? 'Online' : 'Offline'; }"
  }
}
```

Use transformers in templates with the pipe syntax: `{value|transformer}`

## Settings Configuration

Allow users to customize widget behavior:

```json
{
  "settings": {
    "sections": [
      {
        "id": "display",
        "name": "Display Settings",
        "icon": "🎨",
        "fields": [
          {
            "key": "show_status",
            "label": "Show Status Widget",
            "type": "boolean",
            "default": true,
            "description": "Display the status widget on the dashboard"
          },
          {
            "key": "refresh_interval",
            "label": "Refresh Interval (seconds)",
            "type": "number",
            "default": 60,
            "min": 10,
            "max": 300,
            "description": "How often to refresh data"
          },
          {
            "key": "theme",
            "label": "Widget Theme",
            "type": "select",
            "default": "auto",
            "options": [
              { "value": "auto", "label": "Auto" },
              { "value": "light", "label": "Light" },
              { "value": "dark", "label": "Dark" }
            ]
          }
        ]
      }
    ]
  }
}
```

### Setting Field Properties
- `key` - Unique identifier for the setting
- `label` - Display name
- `type` - Input type (text, password, number, boolean, select, multiselect)
- `default` - Default value
- `required` - Whether the field is required
- `description` - Help text
- `min/max` - For number inputs
- `options` - For select/multiselect
- `depends_on` - Show only when another field has specific value
- `show_if` - Conditional display

## Quick Actions

Define one-click actions users can perform:

```json
{
  "quickActions": [
    {
      "id": "refresh_data",
      "name": "Refresh Data",
      "icon": "🔄",
      "confirm": false,
      "api": {
        "endpoint": "/api/refresh",
        "method": "POST"
      }
    },
    {
      "id": "clear_cache",
      "name": "Clear Cache",
      "icon": "🗑️",
      "confirm": true,
      "api": {
        "endpoint": "/api/cache",
        "method": "DELETE"
      }
    },
    {
      "id": "restart_service",
      "name": "Restart Service",
      "icon": "🔄",
      "confirm": true,
      "api": {
        "endpoint": "/api/restart",
        "method": "POST",
        "body": {
          "force": false
        }
      }
    }
  ]
}
```

## Complete Example: Simple Monitor Service

Here's a complete example of a monitoring service:

```json
{
  "id": "simple-monitor",
  "name": "Simple Monitor",
  "version": "1.0.0",
  "author": "Homie Team",
  "description": "Monitor your server's resources",
  "longDescription": "A simple monitoring service that tracks CPU, memory, and disk usage of your server.",
  "category": "monitoring",
  "tags": ["monitoring", "system", "resources"],
  "icon": "📊",
  "homepage": "https://github.com/example/simple-monitor",
  "documentation": "https://github.com/example/simple-monitor/wiki",
  
  "connection": {
    "type": "api",
    "auth": "apikey",
    "fields": [
      {
        "key": "url",
        "label": "Monitor URL",
        "type": "url",
        "required": true,
        "placeholder": "http://localhost:9826",
        "description": "URL to your monitor instance"
      },
      {
        "key": "api_key",
        "label": "API Key",
        "type": "password",
        "required": true,
        "description": "Your monitor API key"
      }
    ],
    "testEndpoint": {
      "path": "/api/health",
      "method": "GET",
      "headers": {
        "Authorization": "Bearer {api_key}"
      },
      "expectedStatus": 200
    }
  },
  
  "api": {
    "baseUrl": "{url}",
    "headers": {
      "Authorization": "Bearer {api_key}"
    },
    "endpoints": {
      "metrics": {
        "path": "/api/metrics",
        "method": "GET",
        "refresh": 5000
      },
      "alerts": {
        "path": "/api/alerts",
        "method": "GET",
        "params": {
          "active": "true"
        },
        "refresh": 30000
      }
    }
  },
  
  "widgets": [
    {
      "id": "cpu_usage",
      "name": "CPU Usage",
      "type": "stat",
      "icon": "💻",
      "size": "small",
      "dataSource": "metrics",
      "display": {
        "value": "{cpu}%",
        "label": "CPU Usage",
        "color": "primary"
      }
    },
    {
      "id": "memory_usage",
      "name": "Memory Usage",
      "type": "stat",
      "icon": "🧠",
      "size": "small",
      "dataSource": "metrics",
      "display": {
        "value": "{memory}%",
        "label": "Memory Usage",
        "color": "warning"
      }
    },
    {
      "id": "active_alerts",
      "name": "Active Alerts",
      "type": "list",
      "icon": "🚨",
      "size": "medium",
      "dataSource": "alerts",
      "display": {
        "itemTemplate": {
          "title": "{name}",
          "subtitle": "{message}"
        },
        "emptyMessage": "No active alerts",
        "maxItems": 5
      }
    }
  ],
  
  "settings": {
    "sections": [
      {
        "id": "display",
        "name": "Display",
        "icon": "🎨",
        "fields": [
          {
            "key": "show_cpu",
            "label": "Show CPU Widget",
            "type": "boolean",
            "default": true
          },
          {
            "key": "show_memory",
            "label": "Show Memory Widget",
            "type": "boolean",
            "default": true
          },
          {
            "key": "show_alerts",
            "label": "Show Alerts",
            "type": "boolean",
            "default": true
          }
        ]
      }
    ]
  },
  
  "quickActions": [
    {
      "id": "refresh",
      "name": "Refresh",
      "icon": "🔄",
      "confirm": false,
      "api": {
        "endpoint": "/api/refresh",
        "method": "POST"
      }
    }
  ]
}
```

## Testing Your Service

### 1. Place Your Service File

Save your service JSON file in the appropriate category folder:
```
marketplace/services/[category]/your-service.json
```

### 2. Sync the Marketplace

The marketplace will automatically pick up your service when synced. You can trigger a sync from the UI or restart the backend.

### 3. Install and Test

1. Go to Services > Marketplace in the Homie UI
2. Find your service and click "Connect"
3. Enter your connection details
4. Test the connection
5. View the dashboard to see your widgets

### 4. Debug Issues

Check the browser console and backend logs for errors:
- Frontend: Browser Developer Tools > Console
- Backend: Check the terminal running the backend

## Best Practices

### 1. Error Handling
- Always include a `testEndpoint` to validate connections
- Provide meaningful error messages in descriptions
- Handle missing or null data in transformers

### 2. Performance
- Use appropriate `refresh` intervals (don't poll too frequently)
- Implement `cache` for data that doesn't change often
- Limit the amount of data fetched (use pagination parameters)

### 3. User Experience
- Provide clear descriptions for all settings
- Use appropriate widget sizes
- Include helpful placeholder text
- Group related settings together

### 4. Security
- Never hardcode credentials
- Use HTTPS when possible
- Validate all user inputs
- Don't expose sensitive data in widgets

### 5. Compatibility
- Test with different versions of the target service
- Document minimum version requirements
- Handle API changes gracefully

## Advanced Features

### Conditional Settings

Show/hide settings based on other values:

```json
{
  "key": "advanced_mode",
  "label": "Advanced Mode",
  "type": "boolean",
  "default": false
},
{
  "key": "advanced_setting",
  "label": "Advanced Setting",
  "type": "text",
  "depends_on": "advanced_mode",
  "show_if": true
}
```

### Dynamic Options

Load options from an API endpoint:

```json
{
  "key": "library",
  "label": "Library",
  "type": "select",
  "options": "dynamic"
}
```

### Multiple Data Sources

Combine data from multiple endpoints:

```json
{
  "dataSource": ["status", "metrics", "info"],
  "display": {
    "fields": [
      { "label": "Status", "value": "{status.state}" },
      { "label": "CPU", "value": "{metrics.cpu}%" },
      { "label": "Version", "value": "{info.version}" }
    ]
  }
}
```

### Custom Authentication

For services with custom auth flows:

```json
{
  "connection": {
    "type": "api",
    "auth": "custom",
    "fields": [
      {
        "key": "url",
        "label": "URL",
        "type": "url",
        "required": true
      },
      {
        "key": "username",
        "label": "Username",
        "type": "text",
        "required": true
      },
      {
        "key": "password",
        "label": "Password",
        "type": "password",
        "required": true
      },
      {
        "key": "token",
        "label": "Token (auto-generated)",
        "type": "text",
        "required": false,
        "readonly": true
      }
    ]
  }
}
```

## Troubleshooting

### Common Issues

1. **Widget not showing data**
   - Check if the endpoint is returning data
   - Verify the transform expression is correct
   - Check browser console for errors

2. **Connection test fails**
   - Verify the URL is correct and accessible
   - Check authentication credentials
   - Ensure the service is running

3. **Transform errors**
   - Test transform functions in browser console
   - Check for typos in property paths
   - Handle null/undefined values

4. **Widgets not appearing**
   - Check if widget is enabled in settings
   - Verify dataSource matches endpoint name
   - Check for JavaScript errors

## Contributing

If you've created a useful service definition, consider contributing it back to the Homie project:

1. Fork the Homie repository
2. Add your service file to `marketplace/services/[category]/`
3. Test thoroughly
4. Submit a pull request

## Support

For help creating services:
- Check existing services in the marketplace for examples
- Open an issue on GitHub with questions
- Join the community discussions

---

Happy service creating! 🚀

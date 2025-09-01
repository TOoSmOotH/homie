# Service Schema Quick Reference

## Required Fields
```json
{
  "id": "string",           // Unique identifier (lowercase, hyphens)
  "name": "string",          // Display name
  "version": "string",       // Semantic version (x.y.z)
  "author": "string",        // Author name
  "description": "string",   // Brief description (< 200 chars)
  "category": "string",      // Category from allowed list
  "icon": "string"           // Emoji or icon identifier
}
```

## Categories
- `media` - Media servers and streaming
- `automation` - Automation and download tools  
- `monitoring` - System and service monitoring
- `networking` - Network management tools
- `storage` - File storage and sync
- `security` - Security and authentication
- `development` - Dev tools and CI/CD
- `productivity` - Productivity applications
- `communication` - Chat and messaging
- `gaming` - Game servers
- `home-automation` - Smart home
- `data` - Databases and analytics
- `infrastructure` - Infrastructure tools
- `other` - Uncategorized

## Connection Types

### API Key Authentication
```json
{
  "connection": {
    "type": "api",
    "auth": "apikey",
    "fields": [
      {
        "key": "url",
        "label": "URL",
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
  }
}
```

### Basic Authentication
```json
{
  "connection": {
    "type": "api",
    "auth": "basic",
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
      }
    ]
  }
}
```

## Field Types
- `text` - Plain text input
- `password` - Masked password input
- `url` - URL with validation
- `number` - Numeric input
- `boolean` - Checkbox
- `select` - Dropdown menu
- `multiselect` - Multiple selection
- `port` - Port number (1-65535)
- `path` - File system path

## API Endpoint Properties
```json
{
  "endpoints": {
    "endpoint_name": {
      "transport": "http|docker|ssh|ws", // Default: http
      "path": "/api/path",              // For http/docker/ws
      "method": "GET|POST|PUT|DELETE",  // http/docker/ws; default GET
      "params": {},                      // Query parameters (http/docker)
      "body": {},                        // Request body (http/docker)
      "headers": {},                     // Additional headers (http/ws)
      "url": "wss://host/path",          // Optional explicit WS URL
      "message": "{payload}",            // WS message to send after connect
      "timeout": 5000,                   // WS/SSH timeout (ms)
      "command": "cat /etc/app.json",    // SSH command
      "parser": "json|text",            // SSH/WS response parser
      "allowNonZeroExit": false,         // SSH: allow non-zero exit codes
      "refresh": 30000,                  // Auto-refresh (ms)
      "cache": 60000,                    // Cache duration (ms)
      "transform": "response"            // Data transformation function body
    }
  }
}
```

### Transports
- http: Default REST over service-configured URL. Interpolates `headers` and `params` from instance config.
- docker: Calls Docker Engine API via unix socket at `/var/run/docker.sock` (or `DOCKER_SOCKET`). Use read-only endpoints unless strictly necessary.
- ssh: Executes a manifest-defined `command` via SSH using instance credentials (`sshHost/host`, `sshPort`, `sshUsername/username`, and either `sshPassword` or `sshPrivateKey`). `parser` may be `json` to parse stdout.
- ws: Connects to a WebSocket URL (`url` or derived from `service.config.url` + `path`). Optionally sends `message` and returns first response. `parser` may be `json`.

## Widget Types

### Stat Widget
```json
{
  "type": "stat",
  "display": {
    "value": "{field}",
    "label": "Label",
    "color": "primary|success|warning|error|info"
  }
}
```

### List Widget
```json
{
  "type": "list",
  "display": {
    "itemTemplate": {
      "title": "{title}",
      "subtitle": "{subtitle}",
      "badge": "{status}",
      "progress": "{percent}"
    },
    "maxItems": 10,
    "emptyMessage": "No items"
  }
}
```

### Info Widget
```json
{
  "type": "info",
  "display": {
    "fields": [
      { "label": "Label", "value": "{field}" }
    ]
  }
}
```

## Widget Sizes
- `small` - 1 column
- `medium` - 2 columns
- `large` - 3 columns

## Transformer Functions
```json
{
  "transformers": {
    "name": "function(value) { return /* transformed value */; }"
  }
}
```

### Common Transformers
```javascript
// Format bytes to human readable
"filesize": "function(bytes) { 
  const sizes = ['B', 'KB', 'MB', 'GB'];
  if (bytes === 0) return '0 B';
  const i = Math.floor(Math.log(bytes) / Math.log(1024));
  return (bytes / Math.pow(1024, i)).toFixed(2) + ' ' + sizes[i];
}"

// Format date
"date": "function(dateStr) { 
  return new Date(dateStr).toLocaleDateString();
}"

// Format duration
"duration": "function(seconds) { 
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  return h > 0 ? `${h}h ${m}m` : `${m}m`;
}"

// Format percentage
"percentage": "function(value) { 
  return (value * 100).toFixed(1) + '%';
}"
```

## Settings Field Properties
```json
{
  "key": "setting_key",
  "label": "Display Label",
  "type": "text|password|number|boolean|select",
  "default": "default_value",
  "required": false,
  "description": "Help text",
  "min": 0,                    // For numbers
  "max": 100,                  // For numbers
  "options": [],               // For select
  "depends_on": "other_field", // Conditional display
  "show_if": true              // Value to show
}
```

## Quick Actions
```json
{
  "quickActions": [
    {
      "id": "action_id",
      "name": "Action Name",
      "icon": "🔄",
      "confirm": true,        // Show confirmation dialog
      "api": {
        "endpoint": "/api/action",
        "method": "POST",
        "body": {}
      }
    }
  ]
}
```

## Variable Interpolation

Use `{variable}` syntax in strings:
- Connection fields: `{url}`, `{api_key}`, `{username}`
- Settings: `{setting_key}`
- Nested paths: `{response.data.value}`
- With transformer: `{value|transformer}`

## Best Practices

1. **Always include**:
   - Test endpoint for connection validation
   - Error handling in transformers
   - Meaningful descriptions
   - Appropriate refresh intervals

2. **Performance**:
   - Don't refresh more than every 5 seconds
   - Use caching for static data
   - Limit list items to reasonable amounts

3. **User Experience**:
   - Group related settings
   - Provide helpful placeholders
   - Use appropriate widget sizes
   - Include empty states

4. **Security**:
   - Never hardcode credentials
   - Use password type for secrets
   - Validate all inputs
   - Use HTTPS when possible

## Testing Checklist

- [ ] Service appears in marketplace
- [ ] Connection test works
- [ ] All widgets display data
- [ ] Settings save correctly
- [ ] Quick actions execute
- [ ] Error states handled
- [ ] Refresh intervals work
- [ ] Transformers apply correctly
- [ ] Responsive on mobile
- [ ] Dark mode compatible

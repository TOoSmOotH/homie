# Homie Marketplace Service Framework

## Overview
Each service in the marketplace should be a complete, self-contained definition that includes:
- Connection configuration
- API endpoint definitions
- Dashboard widget specifications
- Settings and preferences
- Data transformation logic
- Quick actions

## Service Definition Structure

```json
{
  "id": "service-id",
  "name": "Service Name",
  "version": "1.0.0",
  "author": "Author Name",
  "description": "Short description",
  "icon": "🎬",
  "category": "media",
  
  // Connection Configuration
  "connection": {
    "type": "api",
    "auth": "apikey",
    "fields": [
      {
        "key": "url",
        "label": "Service URL",
        "type": "url",
        "required": true,
        "placeholder": "http://192.168.1.100:8080",
        "validation": {
          "pattern": "^https?://.*",
          "message": "Must be a valid URL"
        }
      },
      {
        "key": "api_key",
        "label": "API Key",
        "type": "password",
        "required": true
      }
    ],
    "testEndpoint": {
      "path": "/api/v3/system/status",
      "method": "GET",
      "headers": {
        "X-Api-Key": "{api_key}"
      },
      "expectedStatus": 200,
      "successIndicator": "version"
    }
  },
  
  // API Endpoint Definitions
  "api": {
    "baseUrl": "{url}",
    "headers": {
      "X-Api-Key": "{api_key}"
    },
    "endpoints": {
      "queue": {
        "path": "/api/v3/queue",
        "method": "GET",
        "refresh": 10000,
        "transform": "response.records"
      },
      "calendar": {
        "path": "/api/v3/calendar",
        "method": "GET",
        "params": {
          "start": "{startDate}",
          "end": "{endDate}"
        },
        "refresh": 3600000
      },
      "missing": {
        "path": "/api/v3/wanted/missing",
        "method": "GET",
        "params": {
          "pageSize": 1
        },
        "transform": "response.totalRecords",
        "refresh": 60000
      },
      "status": {
        "path": "/api/v3/system/status",
        "method": "GET",
        "refresh": 30000
      },
      "movies": {
        "path": "/api/v3/movie",
        "method": "GET",
        "cache": 300000
      },
      "health": {
        "path": "/api/v3/health",
        "method": "GET",
        "refresh": 60000
      }
    }
  },

  // Example alternative transports
  "api_alt": {
    "endpoints": {
      "docker_containers": {
        "transport": "docker",
        "method": "GET",
        "path": "/containers/json",
        "params": { "all": "true" }
      },
      "ssh_disk": {
        "transport": "ssh",
        "command": "df -h --output=pcent,/ | tail -n +2",
        "parser": "text",
        "timeout": 5000
      }
    }
  },
  
  // Dashboard Widgets (optional)
  "widgets": [
    {
      "id": "download_queue",
      "name": "Download Queue",
      "type": "list",
      "icon": "📥",
      "size": "medium",
      "position": { "x": 0, "y": 0, "w": 2, "h": 2 },
      "dataSource": "queue",
      "display": {
        "itemTemplate": {
          "title": "{title}",
          "subtitle": "{status} - {sizeleft|filesize} left",
          "progress": "{progress}",
          "icon": "🎬"
        },
        "emptyMessage": "No active downloads",
        "maxItems": 5
      }
    },
    {
      "id": "upcoming_movies",
      "name": "Coming Soon",
      "type": "calendar",
      "icon": "📅",
      "size": "large",
      "position": { "x": 2, "y": 0, "w": 2, "h": 2 },
      "dataSource": "calendar",
      "display": {
        "itemTemplate": {
          "title": "{title} ({year})",
          "date": "{inCinemas|date}",
          "poster": "{remotePoster}"
        },
        "emptyMessage": "No upcoming movies",
        "maxItems": 10
      }
    },
    {
      "id": "missing_counter",
      "name": "Missing Movies",
      "type": "stat",
      "icon": "🎬",
      "size": "small",
      "position": { "x": 0, "y": 2, "w": 1, "h": 1 },
      "dataSource": "missing",
      "display": {
        "value": "{data}",
        "label": "Missing Movies",
        "color": "warning"
      }
    },
    {
      "id": "system_status",
      "name": "System Status",
      "type": "info",
      "icon": "ℹ️",
      "size": "small",
      "position": { "x": 1, "y": 2, "w": 1, "h": 1 },
      "dataSource": ["status", "movies", "health"],
      "display": {
        "fields": [
          { "label": "Version", "value": "{status.version}" },
          { "label": "Movies", "value": "{movies.length}" },
          { "label": "Health", "value": "{health|healthStatus}" }
        ]
      }
    }
  ],
  
  // Settings Configuration
  "settings": {
    "sections": [
      {
        "id": "display",
        "name": "Display Settings",
        "icon": "🎨",
        "fields": [
          {
            "key": "show_queue",
            "label": "Show Download Queue",
            "type": "boolean",
            "default": true,
            "affects": "widgets.download_queue"
          },
          {
            "key": "refresh_interval",
            "label": "Refresh Interval (seconds)",
            "type": "number",
            "default": 30,
            "min": 10,
            "max": 300
          }
        ]
      }
    ]
  },
  
  // Quick Actions
  "quickActions": [
    {
      "id": "search_missing",
      "name": "Search Missing Movies",
      "icon": "🔍",
      "confirm": true,
      "api": {
        "endpoint": "/api/v3/command",
        "method": "POST",
        "body": {
          "name": "MissingMoviesSearch"
        }
      }
    }
  ],
  
  // Data Transformers (optional JavaScript functions as strings)
  "transformers": {
    "filesize": "function(bytes) { return (bytes / 1024 / 1024).toFixed(2) + ' MB'; }",
    "date": "function(dateStr) { return new Date(dateStr).toLocaleDateString(); }",
    "healthStatus": "function(health) { return health.length > 0 ? health.length + ' issues' : 'Healthy'; }"
  }
}
```

## Widget Types

### 1. List Widget
Displays a list of items with optional progress bars, icons, and actions.

### 2. Calendar Widget
Shows upcoming events in a calendar or timeline view.

### 3. Stat Widget
Single statistic display with icon and label.

### 4. Info Widget
Multiple key-value pairs in a compact display.

### 5. Chart Widget
Line, bar, or pie charts for data visualization.

### 6. Grid Widget
Grid layout for items with images (e.g., movie posters).

## Data Flow

1. **Service Installation**
   - User installs service from marketplace
   - Service definition is stored in database
   - Initial configuration is empty

2. **Configuration**
   - User opens settings modal
   - Enters connection details (URL, API key)
   - Settings are saved to service.config

3. **Dashboard Display**
   - Dashboard checks service.config for connection details
   - If configured, widgets fetch data using API definitions
   - Data is transformed using transformers
   - Widgets render based on display templates

4. **API Calls**
   - Backend proxies all API calls
   - Uses connection config to construct requests
   - Applies authentication headers
   - Returns transformed data to frontend

## Implementation Components

### Frontend Components

1. **GenericWidget.tsx**
   - Renders any widget type based on definition
   - Handles data fetching and refresh
   - Applies transformers and templates

2. **ServiceDashboard.tsx**
   - Renders all widgets for a service
   - Manages widget layout and positioning
   - Handles widget visibility based on settings

3. **ServiceAPIClient.tsx**
   - Generic API client for any service
   - Uses endpoint definitions from marketplace
   - Handles authentication and error states

### Backend Components

1. **GenericServiceController**
   - Handles API proxying for any service
   - Uses marketplace definitions
   - Applies authentication and transformations

2. **ServiceDataFetcher**
   - Fetches data based on endpoint definitions
   - Caches responses where specified
   - Handles retry logic

## Benefits

1. **No Custom Code**: Services work without writing service-specific code
2. **Consistent Experience**: All services follow the same patterns
3. **Easy Updates**: Update service definitions without code changes
4. **Community Contributions**: Anyone can add new services via JSON
5. **Flexible Display**: Widgets can be customized per service
6. **Automatic API Integration**: API calls are handled generically

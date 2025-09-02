# Home Lab Management Application - Project Structure

## Overview

This document outlines the comprehensive project structure for the Home Lab Management application, designed to support React/TypeScript frontend, Node.js/Express/TypeScript backend, SQLite database, and Docker deployment.

## Root-Level Structure

```
/homie/
├── 📁 backend/                    # Node.js/Express backend application
├── 📁 frontend/                   # React frontend application
├── 📁 shared/                     # Shared types, utilities, and configurations
├── 📁 docker/                     # Docker configurations and deployment files
├── 📁 docs/                       # Documentation (architecture, API docs, etc.)
├── 📁 scripts/                    # Build, deployment, and utility scripts
├── 📁 .github/                    # GitHub workflows and templates
├── 📄 package.json                # Root package.json for monorepo management
├── 📄 docker-compose.yml          # Docker Compose configuration for multi-service deployment
├── 📄 Dockerfile                  # Main Dockerfile for single-container deployment
├── 📄 .env.example               # Environment variables template
├── 📄 .gitignore                 # Git ignore patterns
├── 📄 README.md                  # Project overview and setup instructions
├── 📄 LICENSE                    # MIT License
└── 📄 .clinerules               # Cline configuration for development
```

## Backend Structure (`/backend/`)

```
/backend/
├── 📁 src/
│   ├── 📁 controllers/           # Route handlers and API endpoints
│   │   ├── 📄 auth.controller.ts
│   │   ├── 📄 services.controller.ts
│   │   ├── 📄 config.controller.ts
│   │   └── 📄 dashboard.controller.ts
│   ├── 📁 services/             # Business logic and service adapters
│   │   ├── 📁 adapters/         # External service adapters
│   │   │   ├── 📄 proxmox.adapter.ts
│   │   │   ├── 📄 docker.adapter.ts
│   │   │   ├── 📄 sonarr.adapter.ts
│   │   │   ├── 📄 radarr.adapter.ts
│   │   │   └── 📄 sabnzbd.adapter.ts
│   │   ├── 📄 auth.service.ts
│   │   ├── 📄 config.service.ts
│   │   ├── 📄 notification.service.ts
│   │   ├── 📄 scheduler.service.ts
│   │   └── 📄 database.service.ts
│   ├── 📁 middleware/           # Express middleware
│   │   ├── 📄 auth.middleware.ts
│   │   ├── 📄 validation.middleware.ts
│   │   ├── 📄 error.middleware.ts
│   │   └── 📄 cors.middleware.ts
│   ├── 📁 models/              # Database models and types
│   │   ├── 📄 user.model.ts
│   │   ├── 📄 service.model.ts
│   │   ├── 📄 config.model.ts
│   │   └── 📄 index.ts
│   ├── 📁 routes/              # API route definitions
│   │   ├── 📄 auth.routes.ts
│   │   ├── 📄 services.routes.ts
│   │   ├── 📄 config.routes.ts
│   │   └── 📄 index.ts
│   ├── 📁 utils/               # Utility functions and helpers
│   │   ├── 📄 logger.ts
│   │   ├── 📄 encryption.ts
│   │   ├── 📄 validation.ts
│   │   └── 📄 constants.ts
│   ├── 📁 database/            # Database migrations and seeds
│   │   ├── 📁 migrations/
│   │   └── 📁 seeds/
│   ├── 📁 config/              # Configuration files
│   │   ├── 📄 database.ts
│   │   ├── 📄 server.ts
│   │   └── 📄 index.ts
│   ├── 📄 app.ts               # Express application setup
│   └── 📄 server.ts            # Server entry point
├── 📁 tests/                   # Backend tests
│   ├── 📁 unit/
│   ├── 📁 integration/
│   └── 📁 e2e/
├── 📄 package.json
├── 📄 tsconfig.json
├── 📄 jest.config.js
├── 📄 .eslintrc.js
└── 📄 README.md
```

## Frontend Structure (`/frontend/`)

```
/frontend/
├── 📁 public/                  # Static assets
│   ├── 📄 index.html
│   ├── 📄 favicon.ico
│   └── 📁 assets/
├── 📁 src/
│   ├── 📁 components/          # React components
│   │   ├── 📁 common/         # Shared UI components
│   │   │   ├── 📄 Button.tsx
│   │   │   ├── 📄 Card.tsx
│   │   │   ├── 📄 Modal.tsx
│   │   │   └── 📄 Loading.tsx
│   │   ├── 📁 dashboard/      # Dashboard-specific components
│   │   │   ├── 📄 Dashboard.tsx
│   │   │   ├── 📄 StatusWidget.tsx
│   │   │   └── 📄 MetricsChart.tsx
│   │   ├── 📁 services/       # Service management components
│   │   │   ├── 📁 proxmox/
│   │   │   ├── 📁 docker/
│   │   │   ├── 📁 sonarr/
│   │   │   ├── 📁 radarr/
│   │   │   └── 📁 sabnzbd/
│   │   ├── 📁 auth/           # Authentication components
│   │   ├── 📁 config/         # Configuration UI components
│   │   └── 📁 layout/         # Layout components
│   ├── 📁 hooks/              # Custom React hooks
│   │   ├── 📄 useAuth.ts
│   │   ├── 📄 useServices.ts
│   │   └── 📄 useWebSocket.ts
│   ├── 📁 pages/              # Page components
│   │   ├── 📄 Login.tsx
│   │   ├── 📄 Dashboard.tsx
│   │   ├── 📄 Services.tsx
│   │   ├── 📄 Settings.tsx
│   │   └── 📄 NotFound.tsx
│   ├── 📁 services/           # Frontend services (API calls)
│   │   ├── 📄 api.service.ts
│   │   ├── 📄 auth.service.ts
│   │   └── 📄 websocket.service.ts
│   ├── 📁 types/              # TypeScript type definitions
│   │   ├── 📄 api.types.ts
│   │   ├── 📄 component.types.ts
│   │   └── 📄 index.ts
│   ├── 📁 utils/              # Utility functions
│   │   ├── 📄 constants.ts
│   │   ├── 📄 helpers.ts
│   │   └── 📄 formatters.ts
│   ├── 📁 styles/             # Styling and themes
│   │   ├── 📄 globals.css
│   │   ├── 📄 themes.ts
│   │   └── 📄 tailwind.config.js
│   ├── 📁 contexts/           # React contexts
│   │   ├── 📄 AuthContext.tsx
│   │   └── 📄 ThemeContext.tsx
│   ├── 📄 App.tsx
│   ├── 📄 index.tsx
│   └── 📄 router.tsx
├── 📁 tests/                   # Frontend tests
│   ├── 📁 unit/
│   ├── 📁 integration/
│   └── 📁 e2e/
├── 📄 package.json
├── 📄 tsconfig.json
├── 📄 tailwind.config.js
├── 📄 vite.config.ts
├── 📄 .eslintrc.js
└── 📄 README.md
```

## Shared Structure (`/shared/`)

```
/shared/
├── 📁 types/                   # Shared TypeScript types
│   ├── 📄 api.types.ts
│   ├── 📄 service.types.ts
│   ├── 📄 config.types.ts
│   ├── 📄 database.types.ts
│   └── 📄 index.ts
├── 📁 utils/                   # Shared utility functions
│   ├── 📄 logger.ts
│   ├── 📄 validation.ts
│   ├── 📄 constants.ts
│   └── 📄 helpers.ts
├── 📁 config/                  # Shared configuration
│   ├── 📄 database.config.ts
│   ├── 📄 server.config.ts
│   └── 📄 index.ts
└── 📄 README.md
```

## Docker Structure (`/docker/`)

```
/docker/
├── 📄 Dockerfile.backend       # Backend container definition
├── 📄 Dockerfile.frontend      # Frontend container definition
├── 📄 Dockerfile.production    # Production container (combined)
├── 📄 nginx.conf               # Nginx configuration for reverse proxy
├── 📄 docker-compose.dev.yml   # Development environment
├── 📄 docker-compose.test.yml  # Testing environment
└── 📄 docker-compose.prod.yml  # Production environment
```

## Scripts Structure (`/scripts/`)

```
/scripts/
├── 📄 build.sh                 # Build script for production
├── 📄 deploy.sh                # Deployment script
├── 📄 setup.sh                 # Initial setup script
├── 📄 migrate.sh               # Database migration script
├── 📄 backup.sh                # Backup script
└── 📄 restore.sh               # Restore script
```

## Configuration Files

### Environment Variables (`.env`)

```bash
# Database
DB_PATH=./data/homie.db

# Server
NODE_ENV=development
PORT=9827
API_PREFIX=/api

# JWT
JWT_SECRET=your-super-secret-jwt-key
JWT_EXPIRES_IN=7d

# Frontend
FRONTEND_URL=http://localhost:9826
BASE_PATH=/homie

# External Services Configuration
# IMPORTANT: External service configurations are now managed through the database
# ServiceConfig system, NOT environment variables. These examples are for
# reference only and should NOT be used in production.
#
# To configure external services:
# 1. Start the application and log in
# 2. Navigate to Settings > Service Configuration
# 3. Add each service with its connection details and credentials
# 4. The system will encrypt and securely store your credentials
#
# Benefits of database-stored configurations:
# - Encrypted credential storage
# - Runtime configuration changes (no restarts required)
# - Per-user service configurations
# - Better security and audit trails
```

### Database Schema (SQLite)

```sql
-- Users table
CREATE TABLE users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    role TEXT DEFAULT 'user',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Service configurations
CREATE TABLE service_configs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    service_type TEXT NOT NULL,
    name TEXT NOT NULL,
    host TEXT NOT NULL,
    port INTEGER,
    api_key TEXT,
    username TEXT,
    password TEXT,
    is_enabled BOOLEAN DEFAULT 1,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- User preferences
CREATE TABLE user_preferences (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER,
    preference_key TEXT NOT NULL,
    preference_value TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users (id)
);
```

## Docker Compose Configuration

### Development (`docker-compose.dev.yml`)

```yaml
version: '3.8'

services:
  backend:
    build:
      context: .
      dockerfile: docker/Dockerfile.backend
    ports:
      - "9825:9825"
    environment:
      - NODE_ENV=development
    volumes:
      - ./backend:/app/backend
      - ./shared:/app/shared
    depends_on:
      - database

  frontend:
    build:
      context: .
      dockerfile: docker/Dockerfile.frontend
    ports:
      - "3000:3000"
    environment:
      - NODE_ENV=development
    volumes:
      - ./frontend:/app/frontend
      - ./shared:/app/shared

  database:
    image: sqlite3:latest
    volumes:
      - ./data:/data
```

### Production (`docker-compose.prod.yml`)

```yaml
version: '3.8'

services:
  homie:
    build:
      context: .
      dockerfile: docker/Dockerfile.production
    ports:
      - "8080:80"
    environment:
      - NODE_ENV=production
    volumes:
      - ./data:/app/data
      - ./logs:/app/logs
    restart: unless-stopped
```

## Development Workflow

### Local Development
1. Clone the repository
2. Run `scripts/setup.sh` to initialize development environment
3. Start services with `docker compose -f docker/docker-compose.dev.yml up`
4. Access frontend at `http://localhost:9826`

### Building for Production
1. Run `scripts/build.sh` to build all components
2. Use `docker compose -f docker/docker-compose.prod.yml up` for production
3. Configure reverse proxy to serve `/` path

## Key Design Decisions

1. **Monorepo Structure**: Single repository for frontend, backend, and shared code
2. **Separation of Concerns**: Clear boundaries between UI, API, and business logic
3. **Service Adapters**: Modular design for external service integrations
4. **TypeScript Everywhere**: Strong typing for maintainability and developer experience
5. **Docker-Centric**: Containerized deployment for easy setup in home lab environments
6. **SQLite Database**: Lightweight, file-based storage suitable for home lab use
7. **Real-time Updates**: WebSocket integration for live service status updates
8. **Security First**: JWT authentication, encrypted credentials, CORS protection

## Scalability Considerations

- **Modular Architecture**: Easy to add new service adapters
- **Database Migrations**: Support for schema evolution
- **Configuration Management**: Environment-based configuration
- **Logging and Monitoring**: Structured logging for debugging and monitoring
- **Error Handling**: Comprehensive error handling and graceful degradation
- **Performance**: Efficient data fetching with React Query, connection pooling

This structure provides a solid foundation for building a robust, maintainable home lab management application that can scale with your needs while remaining simple to deploy and manage.

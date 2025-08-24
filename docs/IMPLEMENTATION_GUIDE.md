# Home Lab Management Application - Implementation Guide

## Overview

This guide provides detailed instructions for implementing the project structure outlined in the PROJECT_STRUCTURE.md document. Follow these steps to set up a complete development environment for the Home Lab Management application.

## Prerequisites

Before starting, ensure you have the following installed:

- **Node.js** (v16 or higher)
- **npm** or **yarn** package manager
- **Docker** and **Docker Compose**
- **Git** for version control
- **TypeScript** compiler (can be installed globally)

## Phase 1: Project Initialization

### Step 1.1: Create Root Directory Structure

```bash
mkdir homie
cd homie
```

### Step 1.2: Initialize Git Repository

```bash
git init
```

### Step 1.3: Create Root-Level Files

Create the following files in the root directory:

#### `package.json` (Root)
```json
{
  "name": "homie",
  "version": "1.0.0",
  "description": "Home Lab Management Application",
  "private": true,
  "workspaces": [
    "backend",
    "frontend",
    "shared"
  ],
  "scripts": {
    "dev": "concurrently \"npm run dev --workspace=backend\" \"npm run dev --workspace=frontend\"",
    "build": "npm run build --workspace=backend && npm run build --workspace=frontend",
    "test": "npm run test --workspace=backend && npm run test --workspace=frontend",
    "lint": "npm run lint --workspace=backend && npm run lint --workspace=frontend",
    "docker:dev": "docker compose -f docker/docker-compose.dev.yml up",
    "docker:prod": "docker compose -f docker/docker-compose.prod.yml up"
  },
  "devDependencies": {
    "concurrently": "^7.6.0",
    "typescript": "^5.0.0"
  }
}
```

#### `.gitignore`
```
# Dependencies
node_modules/
npm-debug.log*
yarn-debug.log*
yarn-error.log*

# Environment variables
.env
.env.local
.env.development.local
.env.test.local
.env.production.local

# Database
*.db
*.sqlite
data/

# Logs
logs/
*.log

# Build outputs
dist/
build/
.next/

# IDE
.vscode/
.idea/
*.swp
*.swo

# OS
.DS_Store
Thumbs.db
```

#### `.env.example`
```bash
# Database
DB_PATH=./data/homie.db

# Server
NODE_ENV=development
PORT=3001
API_PREFIX=/api

# JWT
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
JWT_EXPIRES_IN=7d

# Frontend
FRONTEND_URL=http://localhost:3000
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
#
# Legacy environment variables will be ignored.
```

#### `README.md`
```markdown
# Homie - Home Lab Management

A web-based application for monitoring and controlling your home lab services including Proxmox VMs, Docker containers, and media management applications.

## Quick Start

1. Clone the repository
2. Copy `.env.example` to `.env` and configure your settings
3. Run `npm install`
4. Run `npm run docker:dev` for development
5. Access the application at `http://localhost:3000/homie`

## Documentation

- [Architecture](docs/ARCHITECTURE.md)
- [Project Structure](docs/PROJECT_STRUCTURE.md)
- [API Documentation](docs/API.md)
- [Development Guide](docs/IMPLEMENTATION_GUIDE.md)

## Features

- Real-time monitoring of Proxmox virtual machines
- Docker container management
- Sonarr/Radarr media management integration
- Sabnzbd download management
- Web-based dashboard with responsive design
- RESTful API for automation
- Docker container deployment
```

### Step 1.4: Create Directory Structure

Create the following directories:

```bash
# Main directories
mkdir -p backend frontend shared docker scripts .github/workflows

# Backend subdirectories
mkdir -p backend/src/{controllers,services/adapters,middleware,models,routes,utils,database/migrations,database/seeds,config} backend/tests/{unit,integration,e2e}

# Frontend subdirectories
mkdir -p frontend/public/assets frontend/src/{components/{common,dashboard,services/{proxmox,docker,sonarr,radarr,sabnzbd},auth,config,layout},hooks,pages,services,types,utils,styles,contexts} frontend/tests/{unit,integration,e2e}

# Shared subdirectories
mkdir -p shared/{types,utils,config}

# Docker and scripts
mkdir -p docker scripts
```

## Phase 2: Backend Implementation

### Step 2.1: Initialize Backend Package

Create `backend/package.json`:

```json
{
  "name": "@homie/backend",
  "version": "1.0.0",
  "description": "Backend API server for Homie",
  "main": "dist/server.js",
  "scripts": {
    "dev": "nodemon src/server.ts",
    "build": "tsc",
    "start": "node dist/server.js",
    "test": "jest",
    "test:watch": "jest --watch",
    "lint": "eslint src/**/*.ts",
    "lint:fix": "eslint src/**/*.ts --fix"
  },
  "dependencies": {
    "express": "^4.18.2",
    "sqlite3": "^5.1.6",
    "typeorm": "^0.3.17",
    "jsonwebtoken": "^9.0.2",
    "bcryptjs": "^2.4.3",
    "cors": "^2.8.5",
    "helmet": "^7.1.0",
    "morgan": "^1.10.0",
    "socket.io": "^4.7.2",
    "axios": "^1.6.0",
    "node-cron": "^3.0.3",
    "winston": "^3.10.0",
    "dotenv": "^16.3.1"
  },
  "devDependencies": {
    "@types/express": "^4.17.21",
    "@types/node": "^20.8.7",
    "@types/jsonwebtoken": "^9.0.5",
    "@types/bcryptjs": "^2.4.6",
    "@types/cors": "^2.8.17",
    "@types/morgan": "^1.9.9",
    "@types/node-cron": "^3.0.11",
    "typescript": "^5.2.2",
    "nodemon": "^3.0.1",
    "ts-node": "^10.9.1",
    "jest": "^29.7.0",
    "@types/jest": "^29.5.8",
    "eslint": "^8.52.0",
    "@typescript-eslint/parser": "^6.8.0",
    "@typescript-eslint/eslint-plugin": "^6.8.0"
  }
}
```

### Step 2.2: Backend TypeScript Configuration

Create `backend/tsconfig.json`:

```json
{
  "compilerOptions": {
    "target": "ES2020",
    "module": "commonjs",
    "lib": ["ES2020"],
    "outDir": "./dist",
    "rootDir": "./src",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true,
    "resolveJsonModule": true,
    "declaration": true,
    "declarationMap": true,
    "sourceMap": true,
    "experimentalDecorators": true,
    "emitDecoratorMetadata": true,
    "baseUrl": "./src",
    "paths": {
      "@/*": ["*"],
      "@/shared/*": ["../../shared/src/*"]
    }
  },
  "include": [
    "src/**/*"
  ],
  "exclude": [
    "node_modules",
    "dist",
    "tests"
  ]
}
```

### Step 2.3: Core Backend Files

#### `backend/src/server.ts`
```typescript
import app from './app';
import { logger } from './utils/logger';
import { config } from './config';

const PORT = config.port || 3001;

const server = app.listen(PORT, () => {
  logger.info(`🚀 Server running on port ${PORT}`);
  logger.info(`📊 Environment: ${config.nodeEnv}`);
});

process.on('SIGTERM', () => {
  logger.info('SIGTERM received, shutting down gracefully');
  server.close(() => {
    logger.info('Process terminated');
  });
});
```

#### `backend/src/app.ts`
```typescript
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import { errorMiddleware } from './middleware/error.middleware';
import { corsMiddleware } from './middleware/cors.middleware';
import { authRoutes } from './routes/auth.routes';
import { servicesRoutes } from './routes/services.routes';
import { configRoutes } from './routes/config.routes';
import { logger } from './utils/logger';

const app = express();

// Security middleware
app.use(helmet());
app.use(corsMiddleware);

// Logging
app.use(morgan('combined', { stream: { write: message => logger.info(message.trim()) } }));

// Body parsing
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// API routes
app.use('/api/auth', authRoutes);
app.use('/api/services', servicesRoutes);
app.use('/api/config', configRoutes);

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

// Error handling
app.use(errorMiddleware);

export default app;
```

### Step 2.4: Service Adapters

#### `backend/src/services/adapters/proxmox.adapter.ts`
```typescript
import axios, { AxiosInstance } from 'axios';
import { ServiceConfig } from '../../models/service.model';
import { logger } from '../../utils/logger';

export interface ProxmoxVM {
  vmid: number;
  name: string;
  status: 'running' | 'stopped' | 'paused';
  cpu: number;
  mem: number;
  maxmem: number;
  uptime: number;
}

export class ProxmoxAdapter {
  private client: AxiosInstance;
  private config: ServiceConfig;

  constructor(config: ServiceConfig) {
    this.config = config;
    this.client = axios.create({
      baseURL: `${config.host}/api2/json`,
      headers: {
        'Authorization': `PVEAPIToken=${config.apiKey}`,
        'Content-Type': 'application/json'
      },
      timeout: 10000
    });
  }

  async getVMs(): Promise<ProxmoxVM[]> {
    try {
      const response = await this.client.get('/nodes/proxmox/qemu');
      return response.data.data.map((vm: any) => ({
        vmid: vm.vmid,
        name: vm.name,
        status: vm.status,
        cpu: vm.cpu,
        mem: vm.mem,
        maxmem: vm.maxmem,
        uptime: vm.uptime
      }));
    } catch (error) {
      logger.error('Failed to fetch VMs from Proxmox:', error);
      throw error;
    }
  }

  async startVM(vmid: number): Promise<void> {
    try {
      await this.client.post(`/nodes/proxmox/qemu/${vmid}/status/start`);
    } catch (error) {
      logger.error(`Failed to start VM ${vmid}:`, error);
      throw error;
    }
  }

  async stopVM(vmid: number): Promise<void> {
    try {
      await this.client.post(`/nodes/proxmox/qemu/${vmid}/status/stop`);
    } catch (error) {
      logger.error(`Failed to stop VM ${vmid}:`, error);
      throw error;
    }
  }

  async getNodeStatus(): Promise<any> {
    try {
      const response = await this.client.get('/nodes/proxmox/status');
      return response.data.data;
    } catch (error) {
      logger.error('Failed to fetch node status:', error);
      throw error;
    }
  }
}
```

## Phase 3: Frontend Implementation

### Step 3.1: Initialize Frontend Package

Create `frontend/package.json`:

```json
{
  "name": "@homie/frontend",
  "version": "1.0.0",
  "description": "Frontend React application for Homie",
  "private": true,
  "scripts": {
    "dev": "vite",
    "build": "tsc && vite build",
    "preview": "vite preview",
    "test": "vitest",
    "lint": "eslint src --ext ts,tsx",
    "lint:fix": "eslint src --ext ts,tsx --fix"
  },
  "dependencies": {
    "react": "^18.2.0",
    "react-dom": "^18.2.0",
    "react-router-dom": "^6.17.0",
    "@tanstack/react-query": "^5.0.0",
    "socket.io-client": "^4.7.2",
    "axios": "^1.6.0",
    "tailwindcss": "^3.3.3",
    "lucide-react": "^0.294.0",
    "framer-motion": "^10.16.4",
    "recharts": "^2.7.3"
  },
  "devDependencies": {
    "@types/react": "^18.2.28",
    "@types/react-dom": "^18.2.13",
    "@vitejs/plugin-react": "^4.1.1",
    "typescript": "^5.2.2",
    "vite": "^4.4.11",
    "vitest": "^0.34.6",
    "eslint": "^8.52.0",
    "@typescript-eslint/parser": "^6.8.0",
    "@typescript-eslint/eslint-plugin": "^6.8.0",
    "autoprefixer": "^10.4.16",
    "postcss": "^8.4.31"
  }
}
```

### Step 3.2: Vite Configuration

Create `frontend/vite.config.ts`:

```typescript
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  base: '/homie/',
  server: {
    port: 3000,
    proxy: {
      '/api': {
        target: 'http://localhost:3001',
        changeOrigin: true
      }
    }
  },
  build: {
    outDir: 'dist',
    sourcemap: true
  }
});
```

### Step 3.3: Core Frontend Files

#### `frontend/src/App.tsx`
```tsx
import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AuthProvider } from './contexts/AuthContext';
import { ThemeProvider } from './contexts/ThemeContext';
import Dashboard from './pages/Dashboard';
import Services from './pages/Services';
import Settings from './pages/Settings';
import Login from './pages/Login';
import NotFound from './pages/NotFound';
import Layout from './components/layout/Layout';
import ProtectedRoute from './components/auth/ProtectedRoute';

const queryClient = new QueryClient();

const App: React.FC = () => {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <ThemeProvider>
          <Router basename="/homie">
            <Layout>
              <Routes>
                <Route path="/login" element={<Login />} />
                <Route path="/" element={
                  <ProtectedRoute>
                    <Dashboard />
                  </ProtectedRoute>
                } />
                <Route path="/services" element={
                  <ProtectedRoute>
                    <Services />
                  </ProtectedRoute>
                } />
                <Route path="/settings" element={
                  <ProtectedRoute>
                    <Settings />
                  </ProtectedRoute>
                } />
                <Route path="*" element={<NotFound />} />
              </Routes>
            </Layout>
          </Router>
        </ThemeProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
};

export default App;
```

## Phase 4: Shared Components

### Step 4.1: Shared Types

Create `shared/src/types/api.types.ts`:

```typescript
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface ServiceStatus {
  service: string;
  status: 'online' | 'offline' | 'error';
  lastSeen: Date;
  details?: any;
}

export interface VMInfo {
  id: string;
  name: string;
  status: 'running' | 'stopped' | 'paused';
  cpuUsage: number;
  memoryUsage: number;
  uptime: number;
}

export interface ContainerInfo {
  id: string;
  name: string;
  image: string;
  status: 'running' | 'stopped' | 'paused';
  ports: string[];
  created: Date;
}

export interface User {
  id: string;
  username: string;
  role: 'admin' | 'user';
  createdAt: Date;
}
```

## Phase 5: Docker Configuration

### Step 5.1: Production Dockerfile

Create `docker/Dockerfile.production`:

```dockerfile
# Build stage for backend
FROM node:18-alpine AS backend-builder
WORKDIR /app
COPY backend/package*.json ./backend/
RUN cd backend && npm ci --only=production

# Build stage for frontend
FROM node:18-alpine AS frontend-builder
WORKDIR /app
COPY frontend/package*.json ./frontend/
RUN cd frontend && npm ci
COPY frontend ./frontend
RUN cd frontend && npm run build

# Production stage
FROM node:18-alpine AS production
RUN apk add --no-cache nginx

# Copy backend
COPY --from=backend-builder /app/backend /app/backend
COPY backend /app/backend

# Copy frontend build
COPY --from=frontend-builder /app/frontend/dist /usr/share/nginx/html/homie

# Copy nginx configuration
COPY docker/nginx.conf /etc/nginx/nginx.conf

# Copy startup script
COPY scripts/start.sh /app/start.sh
RUN chmod +x /app/start.sh

EXPOSE 80
CMD ["/app/start.sh"]
```

### Step 5.2: Nginx Configuration

Create `docker/nginx.conf`:

```nginx
events {
    worker_connections 1024;
}

http {
    include /etc/nginx/mime.types;
    default_type application/octet-stream;

    # Gzip compression
    gzip on;
    gzip_vary on;
    gzip_min_length 1024;
    gzip_proxied expired no-cache no-store private must-revalidate auth;
    gzip_types text/plain text/css text/xml text/javascript application/javascript application/xml+rss application/json;

    server {
        listen 80;
        server_name localhost;
        root /usr/share/nginx/html;
        index index.html;

        # Frontend
        location /homie {
            alias /usr/share/nginx/html/homie;
            try_files $uri $uri/ /homie/index.html;
        }

        # Backend API
        location /api {
            proxy_pass http://localhost:3001;
            proxy_http_version 1.1;
            proxy_set_header Upgrade $http_upgrade;
            proxy_set_header Connection 'upgrade';
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto $scheme;
            proxy_cache_bypass $http_upgrade;
        }

        # WebSocket support
        location /socket.io {
            proxy_pass http://localhost:3001;
            proxy_http_version 1.1;
            proxy_set_header Upgrade $http_upgrade;
            proxy_set_header Connection "upgrade";
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto $scheme;
        }
    }
}
```

## Phase 6: Development Setup

### Step 6.1: Setup Script

Create `scripts/setup.sh`:

```bash
#!/bin/bash

echo "🚀 Setting up Homie development environment..."

# Install dependencies
echo "📦 Installing dependencies..."
npm install

# Create data directory
echo "📁 Creating data directory..."
mkdir -p data

# Copy environment file
if [ ! -f .env ]; then
    echo "📄 Creating .env file..."
    cp .env.example .env
    echo "⚠️  Please edit .env file with your configuration!"
fi

# Build shared types
echo "🔨 Building shared types..."
cd shared && npm run build
cd ..

echo "✅ Setup complete!"
echo "🎯 Next steps:"
echo "  1. Edit .env file with your configuration"
echo "  2. Run 'npm run docker:dev' to start development environment"
echo "  3. Access the application at http://localhost:3000/homie"
```

### Step 6.2: Build Script

Create `scripts/build.sh`:

```bash
#!/bin/bash

echo "🔨 Building Homie application..."

# Build shared types
echo "📦 Building shared types..."
cd shared && npm run build && cd ..

# Build backend
echo "⚙️  Building backend..."
cd backend && npm run build && cd ..

# Build frontend
echo "🎨 Building frontend..."
cd frontend && npm run build && cd ..

echo "✅ Build complete!"
```

### Step 6.3: Docker Compose Files

Create `docker/docker-compose.dev.yml`:

```yaml
version: '3.8'

services:
  backend:
    build:
      context: ..
      dockerfile: docker/Dockerfile.backend
    ports:
      - "3001:3001"
    environment:
      - NODE_ENV=development
    volumes:
      - ../backend:/app/backend
      - ../shared:/app/shared
    depends_on:
      - database

  frontend:
    build:
      context: ..
      dockerfile: docker/Dockerfile.frontend
    ports:
      - "3000:3000"
    environment:
      - NODE_ENV=development
    volumes:
      - ../frontend:/app/frontend
      - ../shared:/app/shared

  database:
    image: alpine:latest
    volumes:
      - ../data:/data
    command: ["sh", "-c", "mkdir -p /data && chmod 777 /data"]
```

## Phase 7: Testing and Validation

### Step 7.1: Backend Tests

Create `backend/tests/unit/auth.service.test.ts`:

```typescript
import { AuthService } from '../../src/services/auth.service';
import { User } from '../../src/models/user.model';

describe('AuthService', () => {
  let authService: AuthService;

  beforeEach(() => {
    authService = new AuthService();
  });

  describe('login', () => {
    it('should return a token for valid credentials', async () => {
      const mockUser: User = {
        id: '1',
        username: 'testuser',
        passwordHash: 'hashedpassword',
        role: 'user',
        createdAt: new Date()
      };

      // Mock database call
      jest.spyOn(authService['userModel'], 'findByUsername').mockResolvedValue(mockUser);
      jest.spyOn(authService, 'validatePassword').mockResolvedValue(true);

      const result = await authService.login('testuser', 'password');

      expect(result).toHaveProperty('token');
      expect(result).toHaveProperty('user');
    });

    it('should throw error for invalid credentials', async () => {
      jest.spyOn(authService['userModel'], 'findByUsername').mockResolvedValue(null);

      await expect(authService.login('invaliduser', 'password')).rejects.toThrow('Invalid credentials');
    });
  });
});
```

### Step 7.2: Frontend Tests

Create `frontend/tests/unit/components/Button.test.tsx`:

```tsx
import { render, screen, fireEvent } from '@testing-library/react';
import Button from '../../../../src/components/common/Button';

describe('Button', () => {
  it('renders with correct text', () => {
    render(<Button>Click me</Button>);
    expect(screen.getByText('Click me')).toBeInTheDocument();
  });

  it('calls onClick when clicked', () => {
    const handleClick = jest.fn();
    render(<Button onClick={handleClick}>Click me</Button>);

    fireEvent.click(screen.getByText('Click me'));
    expect(handleClick).toHaveBeenCalledTimes(1);
  });

  it('is disabled when disabled prop is true', () => {
    render(<Button disabled>Click me</Button>);
    expect(screen.getByText('Click me')).toBeDisabled();
  });
});
```

## Next Steps

1. **Implement Database Models**: Create SQLite models for users, services, and configurations
2. **Build Authentication System**: Implement JWT-based authentication with proper middleware
3. **Create Service Adapters**: Implement adapters for Proxmox, Docker, Sonarr, Radarr, and Sabnzbd
4. **Develop UI Components**: Build responsive React components with Tailwind CSS
5. **Add Real-time Features**: Implement WebSocket connections for live updates
6. **Testing**: Add comprehensive unit and integration tests
7. **Documentation**: Create API documentation and user guides

## Troubleshooting

### Common Issues

1. **Port Conflicts**: Make sure ports 3000 (frontend) and 3001 (backend) are available
2. **Environment Variables**: Ensure all required environment variables are set in `.env`
3. **Database Permissions**: Check that the data directory has proper write permissions
4. **Docker Issues**: Ensure Docker daemon is running and user has proper permissions

### Getting Help

- Check the logs in the `logs/` directory
- Review the [Architecture Document](ARCHITECTURE.md) for system design
- Consult the [API Documentation](API.md) for endpoint specifications
- Review the [Project Plan](PROJECT_PLAN.md) for development phases

This implementation guide provides a solid foundation for building the Home Lab Management application. Follow the phases sequentially and test each component thoroughly before moving to the next phase.
# Homie - Home Lab Management Application

A comprehensive web-based application for monitoring and controlling your home lab services including Proxmox virtual machines, Docker containers, and media management applications (Sonarr, Radarr, Sabnzbd).

## 🚀 Features

- **Real-time Monitoring**: Live status updates for all your home lab services
- **Proxmox Integration**: Full VM management with start/stop/restart capabilities
- **Docker Management**: Container lifecycle management and resource monitoring
- **Media Server Control**: Sonarr, Radarr, and Sabnzbd integration
- **Web-based Dashboard**: Responsive UI accessible from any device
- **RESTful API**: Programmatic access for automation and integrations
- **Docker Deployment**: Easy setup with single container deployment
- **Security**: JWT authentication and encrypted credential storage

## 📋 Prerequisites

- Node.js (v16 or higher)
- Docker and Docker Compose
- Git
- At least one home lab service (Proxmox, Docker, Sonarr, etc.)

## 🏗️ Architecture

The application follows a modern full-stack architecture:

### Backend (Node.js/Express/TypeScript)
- RESTful API server with TypeScript
- SQLite database for configuration storage
- Service adapters for external integrations
- JWT authentication system
- WebSocket support for real-time updates

### Frontend (React/TypeScript)
- Modern React application with TypeScript
- Tailwind CSS for styling
- React Query for efficient data fetching
- Responsive design for mobile and desktop

### Deployment
- Single Docker container for production
- Multi-container setup for development
- Designed to sit behind a reverse proxy; SPA served at `/homie`

## 🛠️ Quick Start

### Development Environment

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd homie
   ```

2. **Set up the environment**
   ```bash
   # Install dependencies
   npm install

   # Copy environment template
   cp .env.example .env

   # Edit environment variables
   nano .env
   ```

3. **Start development servers**
   ```bash
   # Using npm scripts
   npm run dev

   # Or using Docker
   npm run docker:dev
   ```

4. **Access the application**
   - Frontend: http://localhost:9826
   - Backend API: http://localhost:9827/api

### Production Deployment

1. **Build the application**
   ```bash
   npm run build
   ```

2. **Start production environment**
   ```bash
   npm run docker:prod
   ```

3. **Configure reverse proxy** (recommended for TLS)
   ```nginx
   # Forward to container on :9825
   location /homie/ { proxy_pass http://homie:9825/homie/; }
   location /api/   { proxy_pass http://homie:9825/api/; }
   location /socket.io/ {
     proxy_pass http://homie:9825/socket.io/;
     proxy_http_version 1.1;
     proxy_set_header Upgrade $http_upgrade;
     proxy_set_header Connection "upgrade";
   }
   ```

## 📁 Project Structure

```
homie/
├── 📁 backend/                    # Node.js/Express backend
│   ├── 📁 src/
│   │   ├── 📁 controllers/        # API route handlers
│   │   ├── 📁 services/          # Business logic & adapters
│   │   ├── 📁 middleware/        # Express middleware
│   │   ├── 📁 models/            # Database models
│   │   ├── 📁 routes/            # API route definitions
│   │   └── 📁 utils/             # Helper functions
│   └── 📄 package.json
├── 📁 frontend/                   # React frontend
│   ├── 📁 src/
│   │   ├── 📁 components/        # React components
│   │   ├── 📁 pages/             # Page components
│   │   ├── 📁 hooks/             # Custom React hooks
│   │   └── 📁 services/          # API client services
│   └── 📄 package.json
├── 📁 shared/                     # Shared TypeScript types
├── 📁 docker/                     # Docker configurations
├── 📁 docs/                       # Documentation
└── 📁 scripts/                    # Build and utility scripts
```

## ⚙️ Configuration

### Environment Variables

Create a `.env` file based on `.env.example`:

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
BASE_PATH=/

```

### Service Configuration

**Important:** External service configurations are managed through the database ServiceConfig system, not environment variables.

To configure your home lab services:

1. **Start the application** and log in to the web interface
2. **Navigate to Settings > Service Configuration**
3. **Add each service** with its connection details and credentials:
   - **Proxmox**: Host URL, API token, and connection settings
   - **Docker**: Socket path, remote daemon URL, or API endpoint
   - **Sonarr/Radarr**: API URLs and API keys
   - **Sabnzbd**: Host URL and API key
4. **Test connections** to ensure services are reachable
5. **Save configurations** - they're encrypted and stored securely

**Benefits of database-stored configurations:**
- **Security**: Credentials are encrypted at rest
- **Flexibility**: Add/remove services without restarting
- **Multi-user**: Different users can have different service access
- **Backup**: Configurations are included in database backups

## 🔧 Development

### Available Scripts

```bash
# Development
npm run dev              # Start development servers
npm run docker:dev       # Start with Docker

# Building
npm run build            # Build all components
npm run build:backend    # Build only backend
npm run build:frontend   # Build only frontend

# Testing
npm run test             # Run all tests
npm run test:backend     # Run backend tests
npm run test:frontend    # Run frontend tests

# Linting
npm run lint             # Lint all code
npm run lint:fix         # Fix linting issues
```

### Adding New Service Adapters

1. Create a new adapter in `backend/src/services/adapters/`
2. Implement the required interface methods
3. Add the adapter to the service registry
4. Create frontend components for the service
5. Add API routes for the service endpoints

### Database Schema

The application uses SQLite with the following main tables:

- `users` - User accounts and authentication
- `service_configs` - External service configurations
- `user_preferences` - User dashboard preferences

## 🚀 API Documentation

### Authentication Endpoints

```http
POST /api/auth/login
POST /api/auth/register
POST /api/auth/logout
GET  /api/auth/me
```

### Service Endpoints

```http
GET  /api/services/proxmox/vms
POST /api/services/proxmox/vms/:id/start
POST /api/services/proxmox/vms/:id/stop

GET  /api/services/docker/containers
POST /api/services/docker/containers/:id/start
POST /api/services/docker/containers/:id/stop

GET  /api/services/sonarr/queue
POST /api/services/sonarr/pause
POST /api/services/sonarr/resume
```

### Configuration Endpoints

```http
GET  /api/config/services
POST /api/config/services
PUT  /api/config/services/:id
DELETE /api/config/services/:id

GET  /api/config/preferences
PUT  /api/config/preferences
```

## 🐳 Docker Deployment

### Single Container (Production)

Serves API and SPA from the backend on port `9825`. Use an external reverse proxy for TLS.

### Multi-Container (Development)

```yaml
version: '3.8'
services:
  backend:
    build: ./backend
    ports: ["9825:9825"]
  frontend:
    build: ./frontend
    ports: ["3000:3000"]
```

## 🔒 Security

- JWT tokens for session management
- Password hashing with bcrypt
- Encrypted storage for API credentials
- CORS protection
- Helmet.js security headers
- Input validation and sanitization

## 📊 Monitoring

- Winston logging for backend
- Error tracking and reporting
- Health check endpoints
- Performance monitoring with custom metrics

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🆘 Support

- 📖 [Documentation](docs/)
- 🐛 [Issue Tracker](https://github.com/your-repo/issues)
- 💬 [Discussions](https://github.com/your-repo/discussions)
- 📧 [Email Support](mailto:support@example.com)

## 🔄 Version History

### v1.0.0 (Current)
- Initial release with Proxmox, Docker, and media server support
- Real-time monitoring and control
- Docker container deployment
- JWT authentication system
- Responsive web interface

### Future Releases
- [ ] Kubernetes integration
- [ ] Prometheus metrics collection
- [ ] Mobile application
- [ ] Plugin system for custom integrations
- [ ] Advanced alerting and notification system

---

**Built with ❤️ for the home lab community**

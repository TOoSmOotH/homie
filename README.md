# Homie - Home Lab Management

A web-based application for monitoring and controlling your home lab services including Proxmox VMs, Docker containers, and media management applications.

## Features

- **Real-time monitoring** of Proxmox virtual machines
- **Docker container management** with live status updates
- **Media management integration** with Sonarr, Radarr, and Sabnzbd
- **Web-based dashboard** with responsive design
- **RESTful API** for automation and integration
- **Docker container deployment** for easy setup
- **Role-based authentication** and user management

## Quick Start

### Prerequisites

- Node.js (v18 or higher)
- npm or yarn
- Docker and Docker Compose
- Git

### Development Setup

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd homie
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Setup environment**
   ```bash
   cp .env.example .env
   # Edit .env with your configuration
   ```

4. **Start development environment**
   ```bash
   npm run docker:dev
   ```

5. **Access the application**
   - Frontend: http://localhost:3000/homie
   - Backend API: http://localhost:3001/api

### Production Deployment

1. **Build the application**
   ```bash
   npm run build
   ```

2. **Start production environment**
   ```bash
   npm run docker:prod
   ```

3. **Access the application**
   - Application: http://localhost:8080/homie

## Project Structure

```
homie/
├── 📁 backend/           # Node.js/Express backend
├── 📁 frontend/          # React frontend
├── 📁 shared/           # Shared types and utilities
├── 📁 docker/           # Docker configurations
├── 📁 scripts/          # Build and deployment scripts
├── 📁 docs/            # Documentation
└── 📁 data/            # SQLite database and logs
```

## Configuration

Copy `.env.example` to `.env` and configure:

```bash
# Database
DB_PATH=./data/homie.db

# Server
NODE_ENV=development
PORT=3001

# JWT
JWT_SECRET=your-super-secret-jwt-key
```

### External Services Configuration

**Important:** External service configurations (Proxmox, Docker, Sonarr, Radarr, Sabnzbd, etc.) are managed through the database ServiceConfig system, not environment variables.

To configure external services:

1. **Start the application** and log in
2. **Navigate to Settings > Service Configuration**
3. **Add each service** with its connection details and credentials
4. **Test the connection** to ensure the service is reachable

This approach provides:
- **Encrypted storage** of sensitive credentials (API keys, passwords)
- **Per-user configurations** - different users can have different service access
- **Runtime configuration** - no need to restart when adding new services
- **Better security** - credentials are encrypted in the database

**Legacy Note:** Environment variables for external services are no longer supported and will be ignored.

**Migration Guide:** If you're upgrading from a previous version that used environment variables for service configuration, see [MIGRATION_GUIDE.md](docs/MIGRATION_GUIDE.md) for step-by-step migration instructions.

## Development

### Available Scripts

- `npm run dev` - Start development servers
- `npm run build` - Build all packages
- `npm run test` - Run tests
- `npm run lint` - Run linting
- `npm run docker:dev` - Start Docker development environment
- `npm run docker:prod` - Start Docker production environment

### Workspace Structure

This is a monorepo managed with npm workspaces:

- **backend/** - Express.js API server with TypeScript
- **frontend/** - React application with Vite and TypeScript
- **shared/** - Shared types, utilities, and configurations

## Documentation

- [Architecture](docs/ARCHITECTURE.md) - System design and components
- [Project Structure](docs/PROJECT_STRUCTURE.md) - Detailed directory structure
- [Implementation Guide](docs/IMPLEMENTATION_GUIDE.md) - Development instructions
- [API Documentation](docs/API.md) - REST API specifications

## Supported Services

- **Proxmox** - Virtual machine monitoring and control
- **Docker** - Container management and monitoring
- **Sonarr** - TV show management and automation
- **Radarr** - Movie management and automation
- **Sabnzbd** - Usenet download management

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests for new functionality
5. Submit a pull request

## License

MIT License - see LICENSE file for details

## Support

For issues and questions, please check the documentation or create an issue in the repository.
# Homie - Modular Homelab Manager

A modern, modular homelab management platform with a service marketplace for easy deployment and monitoring of self-hosted services.

## 🌟 Features

- **🛍️ Service Marketplace**: Browse and install services from a curated marketplace
- **📦 Modular Architecture**: Product-specific service definitions (Plex, Jellyfin, Radarr, etc.)
- **🔄 Real-time Monitoring**: Live status updates via WebSocket connections
- **🐳 Docker Integration**: Manage Docker containers directly from the UI
- **👥 User Management**: Multi-user support with role-based access control
- **🌙 Dark Mode**: Built-in dark theme support
- **📱 Responsive Design**: Works on desktop, tablet, and mobile devices
- **🔒 Secure**: JWT authentication, encrypted credentials, rate limiting

## 🚀 Quick Start

### Prerequisites

- Node.js 18+ and npm
- Docker (optional, for running services)
- Git

### Installation

1. **Clone the repository:**
```bash
git clone https://github.com/TOoSmOotH/homie.git
cd homie
```

2. **Install dependencies:**
```bash
npm install
```

3. **Set up environment variables:**
```bash
cp backend/.env.example backend/.env
# Edit backend/.env with your configuration
```

4. **Start the development server:**
```bash
npm run dev
```

The application will be available at:
- Frontend: http://localhost:5173
- Backend API: http://localhost:3001

5. **Initial Setup:**
- Navigate to http://localhost:5173
- Create your admin account
- Start adding services from the marketplace!

## 📦 Service Marketplace

The marketplace provides pre-configured service definitions for popular homelab applications. Services automatically sync from GitHub, ensuring you always have the latest configurations.

### Available Categories

- **🎬 Media & Entertainment**: Plex, Jellyfin, Emby, Kodi
- **🤖 Automation**: Radarr, Sonarr, Bazarr, Lidarr, Readarr
- **📊 Monitoring**: Grafana, Prometheus, InfluxDB, Telegraf
- **🌐 Networking**: Pi-hole, Traefik, Nginx Proxy Manager, WireGuard
- **💾 Storage**: Nextcloud, Syncthing, FileBrowser, MinIO
- **🏠 Home Automation**: Home Assistant, Node-RED, Mosquitto
- **👨‍💻 Development**: Gitea, GitLab, Jenkins, Drone

### How It Works

1. **Browse**: Explore available services in the marketplace
2. **Configure**: Customize settings for your environment
3. **Deploy**: One-click deployment with Docker
4. **Monitor**: Real-time status and health monitoring

## 🏗️ Architecture

```
homie/
├── frontend/          # React + TypeScript + Vite frontend
├── backend/           # Node.js + Express + TypeORM backend
├── marketplace/       # Service definitions (syncs from GitHub)
│   ├── services/     # JSON service definitions by category
│   └── schemas/      # JSON schemas for validation
├── shared/           # Shared types and utilities
├── docker/           # Docker configurations
└── scripts/          # Build and deployment scripts
```

## 🔧 Configuration

### Environment Variables

Create a `backend/.env` file with:

```env
# Server Configuration
NODE_ENV=development
PORT=3001

# Database
DATABASE_PATH=./data/homie.db

# JWT Authentication
JWT_SECRET=your-secret-key-change-in-production
JWT_EXPIRES_IN=1h

# Marketplace (GitHub Integration)
MARKETPLACE_REPO_URL=https://raw.githubusercontent.com/TOoSmOotH/homie/main
MARKETPLACE_AUTO_SYNC=true
MARKETPLACE_SYNC_INTERVAL=60

# Optional: Email
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password
```

### Marketplace Sync

The marketplace automatically syncs service definitions from GitHub:

- **Default Repository**: Points to the main Homie repository
- **Custom Repository**: Fork and customize for your organization
- **Sync Interval**: Configurable (default: 60 minutes)
- **Manual Sync**: Available through the API

## 🐳 Docker Deployment

### Development

```bash
docker-compose up -d
```

### Production

```bash
docker-compose -f docker-compose.prod.yml up -d
```

### Fresh Instance Behavior
- Database: The backend auto-creates the SQLite database at `DB_PATH` on first start; parent directories are created if missing.
- Admin bootstrap: On a brand-new instance (no admin users), the frontend redirects to `/setup` and calls `POST /api/auth/setup-admin` so the first connecting user can create the admin account.
- Services: The production container does not include local marketplace service definitions. It pulls all service definitions from the remote marketplace on startup and periodically thereafter.

Key environment variables:
- `DB_PATH` (default `/app/data/homie.db` in Docker)
- `MARKETPLACE_DISABLE_LOCAL` (default true in production)
- `MARKETPLACE_REPO_URL` (override remote marketplace base URL)
- `MARKETPLACE_AUTO_SYNC` (default true)
- `MARKETPLACE_SYNC_INTERVAL` (minutes; default 60)

### Environment Variables for Docker

```yaml
environment:
  - NODE_ENV=production
  - DB_PATH=/app/data/homie.db
  - JWT_SECRET=${JWT_SECRET}
  - MARKETPLACE_REPO_URL=${MARKETPLACE_REPO_URL}
  - MARKETPLACE_DISABLE_LOCAL=true
```

### Using GHCR-hosted Image

You can run Homie directly from GitHub Container Registry without building locally. Images are published under `ghcr.io/TOoSmOotH/homie`.

Pull and run with Docker:

```bash
docker pull ghcr.io/TOoSmOotH/homie:latest
docker run -d \
  --name homie \
  -p 80:80 -p 443:443 \
  -e NODE_ENV=production \
  -e DB_PATH=/app/data/homie.db \
  -e JWT_SECRET=change-me \
  -e MARKETPLACE_DISABLE_LOCAL=true \
  -v $(pwd)/data:/app/data \
  -v $(pwd)/logs:/app/logs \
  ghcr.io/TOoSmOotH/homie:latest
```

Or with Docker Compose (image-based):

```yaml
services:
  homie:
    image: ghcr.io/TOoSmOotH/homie:latest
    container_name: homie
    restart: unless-stopped
    environment:
      - NODE_ENV=production
      - DB_PATH=/app/data/homie.db
      - JWT_SECRET=${JWT_SECRET}
      - MARKETPLACE_DISABLE_LOCAL=true
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./data:/app/data
      - ./logs:/app/logs
      - ./ssl:/etc/letsencrypt
```

## 🔖 Versioning & Releases

This repo uses semantic version tags to drive container publishing to GHCR. When you push a tag like `v1.2.3`, GitHub Actions builds and publishes the image.

Convenience scripts (from repo root):

```bash
# bump and tag a patch release, push branch + tags
npm run release:patch

# minor or major release
npm run release:minor
npm run release:major

# prerelease (e.g., v1.2.4-rc.0)
npm run release:prerelease
```

Publishing is handled by `.github/workflows/publish.yml`. Images are pushed to `ghcr.io/TOoSmOotH/homie` with tags for latest, branch, tag, and commit SHA.

## 📦 Publishing to GHCR

Pushing to `main` or a version tag builds and publishes the production image to GitHub Container Registry (GHCR) via GitHub Actions.

- Image: `ghcr.io/<org-or-user>/homie`
- Tags: `latest` (on default branch), branch name, tag, and commit SHA
- Workflow: `.github/workflows/publish.yml`

No extra secrets are required; it uses the default `GITHUB_TOKEN` with `packages: write` permission.

## 🔌 Adding Services to the Marketplace

### Service Definition Format

Create a JSON file in `marketplace/services/{category}/service-name.json`:

```json
{
  "id": "service-id",
  "name": "Service Name",
  "version": "1.0.0",
  "author": "Author Name",
  "description": "Short description",
  "category": "media",
  "docker": {
    "image": "docker-image:tag",
    "ports": [
      {"container": 8080, "host": 8080}
    ],
    "volumes": [
      {"container": "/config", "host": "./config"}
    ],
    "environment": {
      "TZ": "America/New_York"
    }
  },
  "config": {
    "fields": [
      {
        "key": "port",
        "label": "Port",
        "type": "number",
        "required": true,
        "default": 8080
      }
    ]
  }
}
```

### Contributing a Service

1. Fork the repository
2. Add your service definition to `marketplace/services/{category}/`
3. Validate against the schema in `marketplace/schemas/service.schema.json`
4. Test locally
5. Submit a pull request

## 🔒 Security Features

- **JWT Authentication**: Secure token-based authentication
- **Password Hashing**: bcrypt with salt rounds
- **Rate Limiting**: API endpoint protection
- **CORS Protection**: Configurable CORS policies
- **Input Validation**: Comprehensive input sanitization
- **Encrypted Storage**: Sensitive data encrypted in database

## 📊 API Documentation

The backend provides a RESTful API:

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login
- `POST /api/auth/refresh` - Refresh token
- `POST /api/auth/logout` - Logout

### Services
- `GET /api/services` - List user services
- `POST /api/services` - Create service instance
- `GET /api/services/:id` - Get service details
- `PUT /api/services/:id` - Update service
- `DELETE /api/services/:id` - Delete service
- `POST /api/services/:id/check` - Check service status

### Marketplace
- `GET /api/marketplace/services` - List available services
- `GET /api/marketplace/services/:id` - Get service definition
- `GET /api/marketplace/categories` - List categories
- `POST /api/marketplace/sync` - Trigger sync from GitHub
- `POST /api/marketplace/install/:id` - Install service

## 🤝 Contributing

We welcome contributions! See [CONTRIBUTING.md](CONTRIBUTING.md) for guidelines.

### Development Workflow

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

MIT License - see [LICENSE](LICENSE) file for details

## 🙏 Acknowledgments

Built with modern technologies:
- **Frontend**: React, TypeScript, Vite, Tailwind CSS, Tanstack Query
- **Backend**: Node.js, Express, TypeORM, SQLite
- **Real-time**: Socket.io
- **Containerization**: Docker, Docker Compose

## 📞 Support

- **Documentation**: [docs/](docs/)
- **Issues**: [GitHub Issues](https://github.com/TOoSmOotH/homie/issues)
- **Discussions**: [GitHub Discussions](https://github.com/TOoSmOotH/homie/discussions)

---

Made with ❤️ for the homelab community

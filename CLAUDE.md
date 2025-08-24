# 🏠 Homie - Home Lab Management Application

## Project Overview

Homie is a modern, full-stack home lab management application that provides a unified interface for managing various services in your home infrastructure including Docker containers, Proxmox VMs, media services (Sonarr, Radarr, Overseerr), and monitoring tools.

## 🎯 Project Goals

- Provide a single dashboard for all home lab services
- Secure management of service credentials
- Real-time monitoring and control
- Extensible architecture for adding new service types
- Simple deployment via Docker

## 🏗️ Architecture

### Technology Stack

**Backend:**
- Node.js + TypeScript + Express.js
- TypeORM with SQLite database
- Socket.io for real-time updates
- JWT authentication
- Winston logging

**Frontend:**
- React 18 + TypeScript + Vite
- TailwindCSS for styling
- React Query for state management
- Socket.io-client for WebSocket

**Infrastructure:**
- Docker containerization
- Nginx reverse proxy
- PM2 process management

### Key Design Patterns

1. **Service Adapter Pattern**: All external services integrate through a common BaseServiceAdapter
2. **Repository Pattern**: Data access through TypeORM repositories
3. **Factory Pattern**: ServiceAdapterFactory for creating adapter instances
4. **Provider Pattern**: React contexts for theme and WebSocket

## 📁 Project Structure

```
homie/
├── backend/           # Node.js/Express API server
│   ├── src/
│   │   ├── adapters/     # Service adapters (Docker, Proxmox, etc.)
│   │   ├── config/       # Configuration files
│   │   ├── controllers/  # API route controllers
│   │   ├── database/     # TypeORM entities and migrations
│   │   ├── middleware/   # Express middleware
│   │   ├── routes/       # API route definitions
│   │   ├── services/     # Business logic layer
│   │   ├── types/        # TypeScript type definitions
│   │   └── utils/        # Utility functions
├── frontend/          # React application
│   ├── src/
│   │   ├── components/   # Reusable UI components
│   │   ├── contexts/     # React contexts
│   │   ├── hooks/        # Custom React hooks
│   │   ├── pages/        # Page components
│   │   ├── services/     # API client services
│   │   ├── styles/       # Global styles
│   │   └── types/        # TypeScript types
├── shared/           # Shared code between frontend and backend
│   └── types/           # Common type definitions
├── docker/           # Docker configuration
├── docs/             # Documentation
└── scripts/          # Build and deployment scripts
```

## 🔧 Development Guidelines

### Code Style & Conventions

- **TypeScript**: Always use proper types, avoid `any`
- **Naming**: camelCase for variables/functions, PascalCase for types/classes
- **Files**: kebab-case for filenames
- **Components**: One component per file, match filename to component name
- **Imports**: Group imports (external, internal, types)

### Adding New Service Adapters

When adding support for a new service type:

1. Create a new adapter in `backend/src/adapters/` extending `BaseServiceAdapter`
2. Implement all required abstract methods
3. Add the service type to the ServiceType enum
4. Register in ServiceAdapterFactory
5. Add corresponding frontend components
6. Update types in shared/types

Example adapter structure:
```typescript
export class MyServiceAdapter extends BaseServiceAdapter {
  async connect(): Promise<void> { /* ... */ }
  async disconnect(): Promise<void> { /* ... */ }
  async testConnection(): Promise<boolean> { /* ... */ }
  async getStatus(): Promise<ServiceStatus> { /* ... */ }
  // ... implement other required methods
}
```

### API Development

- All endpoints should follow RESTful conventions
- Use proper HTTP status codes
- Implement input validation using class-validator
- Handle errors consistently using the error middleware
- Add authentication where required using JWT middleware

### Frontend Development

- Use React Query for all API calls
- Implement error boundaries for fault tolerance
- Keep components small and focused
- Use custom hooks for reusable logic
- Follow React best practices (memo, useCallback, etc.)
- Ensure responsive design with TailwindCSS

### Security Best Practices

- **Never** store sensitive data unencrypted
- Always validate and sanitize user input
- Use the existing encryption utilities for credentials
- Implement proper authentication checks
- Follow OWASP security guidelines
- Keep dependencies updated

## 🚀 Common Tasks

### Running the Application

```bash
# Development mode
npm run dev

# Production build
npm run build
npm run start

# Docker deployment
docker-compose up -d
```

### Database Operations

```bash
# Run migrations
npm run migration:run

# Generate new migration
npm run migration:generate -- -n MigrationName

# Revert last migration
npm run migration:revert
```

### Testing

```bash
# Run all tests
npm test

# Run with coverage
npm run test:coverage

# Run specific test file
npm test -- path/to/test
```

## 🔌 Service Integrations

### Currently Supported Services

- **Docker**: Container management
- **Proxmox**: VM and container management
- **Sonarr/Radarr**: Media management
- **Overseerr**: Media requests
- **Grafana**: Monitoring dashboards
- **Home Assistant**: Home automation
- **Pi-hole**: Network-wide ad blocking
- **Portainer**: Docker management UI
- **qBittorrent**: Torrent client
- **Tautulli**: Plex statistics

### Adding Service Configurations

Services are configured through the UI or API:
- Endpoint URL
- Authentication credentials (encrypted)
- Connection timeout
- Custom headers if needed

## 🐛 Debugging Tips

1. **Check logs**: Winston logs to `backend/logs/`
2. **Database issues**: Verify migrations are up to date
3. **Connection issues**: Check service URLs and credentials
4. **WebSocket issues**: Verify Socket.io connection in browser console
5. **Build issues**: Clear node_modules and package-lock.json, then reinstall

## 📊 Performance Considerations

- Use React.memo for expensive components
- Implement pagination for large data sets
- Cache API responses with React Query
- Use lazy loading for routes
- Optimize Docker image size
- Consider adding Redis for caching (future enhancement)

## 🔄 State Management

- **Global State**: React Context for theme and WebSocket
- **Server State**: React Query for API data
- **Local State**: useState/useReducer for component state
- **Form State**: Consider react-hook-form for complex forms

## 🚢 Deployment

### Docker Deployment (Recommended)

```bash
# Build and run with docker-compose
docker-compose up -d

# View logs
docker-compose logs -f

# Stop services
docker-compose down
```

### Manual Deployment

1. Build frontend: `npm run build:frontend`
2. Build backend: `npm run build:backend`
3. Set environment variables
4. Run with PM2: `pm2 start ecosystem.config.js`

## 🔐 Environment Variables

Key environment variables:
- `JWT_SECRET`: Secret for JWT signing
- `DATABASE_URL`: Database connection string
- `ENCRYPTION_KEY`: Key for encrypting sensitive data
- `PORT`: Server port (default: 3000)
- `NODE_ENV`: Environment (development/production)

## 📝 API Endpoints

Base path: `/homie` (configurable)

### Authentication
- `POST /auth/login` - User login
- `POST /auth/register` - User registration
- `POST /auth/refresh` - Refresh JWT token
- `POST /auth/logout` - User logout

### Services
- `GET /services` - List all services
- `POST /services` - Add new service
- `PUT /services/:id` - Update service
- `DELETE /services/:id` - Delete service
- `GET /services/:id/status` - Get service status
- `POST /services/:id/action` - Perform service action

### Configuration
- `GET /config` - Get app configuration
- `PUT /config` - Update configuration

## 🤝 Contributing Guidelines

1. Follow existing code patterns and conventions
2. Add TypeScript types for all new code
3. Write unit tests for new functionality
4. Update documentation as needed
5. Ensure all tests pass before submitting
6. Use conventional commits for clear history

## 🎨 UI/UX Guidelines

- Follow Material Design principles
- Ensure accessibility (ARIA labels, keyboard navigation)
- Provide loading states for all async operations
- Show clear error messages with recovery actions
- Maintain consistent spacing and typography
- Support both light and dark themes

## 📚 Additional Resources

- [TypeORM Documentation](https://typeorm.io/)
- [Express.js Guide](https://expressjs.com/)
- [React Query Documentation](https://tanstack.com/query)
- [TailwindCSS Documentation](https://tailwindcss.com/)
- [Socket.io Documentation](https://socket.io/)

## 🔮 Future Enhancements

- [ ] Add comprehensive test coverage
- [ ] Implement service health monitoring
- [ ] Add notification system (email/push)
- [ ] Create mobile app
- [ ] Add backup/restore functionality
- [ ] Implement service dependency management
- [ ] Add Prometheus metrics export
- [ ] Create plugin system for custom integrations

## ⚠️ Important Notes

1. **Database**: Currently using SQLite for simplicity. Consider PostgreSQL for production with high load
2. **Security**: Always review security configurations before exposing to the internet
3. **Backups**: Implement regular backup strategy for database and configurations
4. **Monitoring**: Set up monitoring and alerting for production deployments
5. **Updates**: Keep dependencies updated for security patches

## 🆘 Troubleshooting

### Common Issues

**Service won't connect:**
- Verify service URL is accessible from Homie container/host
- Check authentication credentials
- Review service adapter logs

**Database errors:**
- Run migrations: `npm run migration:run`
- Check database file permissions
- Verify DATABASE_URL environment variable

**Frontend not loading:**
- Clear browser cache
- Check console for errors
- Verify API is running and accessible

**Docker issues:**
- Check container logs: `docker logs homie`
- Verify port mappings
- Ensure volumes are mounted correctly

---

When working on this project, prioritize:
1. **Security** - Protect user credentials and data
2. **Reliability** - Ensure stable connections to services
3. **Performance** - Optimize for responsive user experience
4. **Extensibility** - Make it easy to add new services
5. **User Experience** - Keep the interface intuitive and clean
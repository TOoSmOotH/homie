# Homie Backend

Node.js/Express backend API server for the Home Lab Management application.

## Features

- RESTful API with TypeScript
- JWT authentication
- SQLite database with TypeORM
- Service adapters for external integrations
- WebSocket support for real-time updates
- Comprehensive error handling and logging

## Development

### Prerequisites

- Node.js 18+
- npm or yarn

### Setup

1. Install dependencies:
   ```bash
   npm install
   ```

2. Start development server:
   ```bash
   npm run dev
   ```

3. Build for production:
   ```bash
   npm run build
   ```

### Available Scripts

- `npm run dev` - Start development server with hot reload
- `npm run build` - Build TypeScript to JavaScript
- `npm run start` - Start production server
- `npm run test` - Run tests
- `npm run lint` - Run ESLint

## API Documentation

### Authentication Endpoints

- `POST /api/auth/login` - User login
- `POST /api/auth/register` - User registration
- `GET /api/auth/me` - Get current user profile

### Service Endpoints

- `GET /api/services` - Get all configured services
- `POST /api/services/:type/status` - Get service status
- `POST /api/services/:type/start` - Start service
- `POST /api/services/:type/stop` - Stop service

### Configuration Endpoints

- `GET /api/config` - Get application configuration
- `PUT /api/config` - Update configuration
- `GET /api/config/services` - Get service configurations

### Dashboard Endpoints

- `GET /api/dashboard/summary` - Get dashboard summary
- `GET /api/dashboard/metrics` - Get system metrics

## Project Structure

```
backend/
├── src/
│   ├── controllers/     # Route handlers
│   ├── services/        # Business logic and adapters
│   ├── middleware/      # Express middleware
│   ├── models/          # Database models
│   ├── routes/          # API route definitions
│   ├── utils/           # Utility functions
│   ├── config/          # Configuration files
│   ├── app.ts           # Express application setup
│   └── server.ts        # Server entry point
├── tests/               # Test files
├── dist/               # Compiled JavaScript
├── package.json
├── tsconfig.json
└── jest.config.js
```

## Environment Variables

Copy `.env.example` to `.env` and configure:

```bash
NODE_ENV=development
PORT=3001
DB_PATH=./data/homie.db
JWT_SECRET=your-secret-key
LOG_LEVEL=info
```

## Database

The application uses SQLite for data storage. Database migrations are handled automatically on startup.
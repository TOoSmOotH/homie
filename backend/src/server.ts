import app from './app';
import { logger } from './utils/logger';
import { config } from './config';
import { dbConnection } from './database/connection.js';
import { Server as SocketServer } from 'socket.io';
import http from 'http';
import WebSocketService from './services/websocket.service';
import { initializeServicesRoutes } from './routes/services.routes';
import { marketplaceService } from './services/marketplace.service';

const PORT = config.port || 3001;
let server: http.Server;
let io: SocketServer;

async function startServer() {
  try {
    // Initialize database connection
    logger.info('🔌 Initializing database connection...');
    await dbConnection.initialize();

    // Run migrations if in production or if explicitly requested
    if (config.nodeEnv === 'production' || process.env.RUN_MIGRATIONS === 'true') {
      logger.info('🗃️ Running database migrations...');
      await dbConnection.runMigrations();
    }

    // Create HTTP server
    server = http.createServer(app);

    // Initialize Socket.io server
    io = new SocketServer(server, {
      cors: {
        origin: process.env.FRONTEND_URL || "http://localhost:5173",
        methods: ["GET", "POST"],
        credentials: true
      },
      path: '/socket.io'
    });

    // Socket.io middleware for authentication
    io.use(async (socket, next) => {
      try {
        const token = socket.handshake.auth.token || socket.handshake.headers.authorization?.replace('Bearer ', '');

        if (!token) {
          return next(new Error('Authentication error: No token provided'));
        }

        // Here you would verify the JWT token
        // For now, we'll just check if token exists
        if (token) {
          socket.data.user = { id: 'user-id', name: 'User' }; // Replace with actual user data from token
          next();
        } else {
          next(new Error('Authentication error: Invalid token'));
        }
      } catch (error) {
        logger.error('Socket authentication error:', error);
        next(new Error('Authentication error'));
      }
    });

    // Socket.io connection handling
    io.on('connection', (socket) => {
      logger.info(`🔌 Client connected: ${socket.id}`);

      // Join user to their personal room for targeted notifications
      socket.join(`user_${socket.data.user.id}`);

      // Handle service status subscription
      socket.on('subscribe:service-status', (serviceType) => {
        socket.join(`service_${serviceType}`);
        logger.info(`📡 Client ${socket.id} subscribed to service status: ${serviceType}`);
      });

      // Handle service status unsubscription
      socket.on('unsubscribe:service-status', (serviceType) => {
        socket.leave(`service_${serviceType}`);
        logger.info(`📡 Client ${socket.id} unsubscribed from service status: ${serviceType}`);
      });

      // Handle disconnect
      socket.on('disconnect', (reason) => {
        logger.info(`🔌 Client disconnected: ${socket.id}, reason: ${reason}`);
      });
    });

    // Initialize WebSocket service
    const wsService = new WebSocketService(io);

    // Make io and wsService available to the app
    app.set('io', io);
    app.set('wsService', wsService);

    // Initialize services routes with WebSocket service
    initializeServicesRoutes(wsService);

    // Initialize marketplace service
    await marketplaceService.initialize();
    logger.info('🛍️ Marketplace service initialized');

    // Start the server
    server.listen(PORT, () => {
      logger.info(`🚀 Server running on port ${PORT}`);
      logger.info(`📊 Environment: ${config.nodeEnv}`);
      logger.info(`🔗 API Prefix: ${config.apiPrefix}`);
      logger.info(`🗄️ Database: ${config.dbPath}`);
      logger.info(`🔌 WebSocket server initialized`);
      logger.info(`🛍️ Marketplace ready`);
    });

  } catch (error) {
    logger.error('Failed to start server:', error);
    process.exit(1);
  }
}

// Graceful shutdown handlers
process.on('SIGTERM', async () => {
  logger.info('SIGTERM received, shutting down gracefully');
  if (io) {
    io.close(() => {
      logger.info('WebSocket server closed');
    });
  }
  await dbConnection.close();
  if (server) {
    server.close(() => {
      logger.info('Process terminated');
    });
  } else {
    process.exit(0);
  }
});

process.on('SIGINT', async () => {
  logger.info('SIGINT received, shutting down gracefully');
  if (io) {
    io.close(() => {
      logger.info('WebSocket server closed');
    });
  }
  await dbConnection.close();
  if (server) {
    server.close(() => {
      logger.info('Process terminated');
    });
  } else {
    process.exit(0);
  }
});

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
  logger.error('Uncaught Exception:', error);
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  logger.error('Unhandled Rejection at:', promise, 'reason:', reason);
  process.exit(1);
});

// Start the server
startServer();

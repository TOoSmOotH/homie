import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import rateLimit from 'express-rate-limit';
import { errorMiddleware } from './middleware/error.middleware';
import { corsMiddleware } from './middleware/cors.middleware';
import { authenticateToken } from './middleware/auth.middleware';
import { authRoutes } from './routes/auth.routes';
import { userRoutes } from './routes/user.routes';
import { servicesRoutes } from './routes/services.routes';
import { configRoutes } from './routes/config.routes';
import { dashboardRoutes } from './routes/dashboard.routes';
import { marketplaceRoutes } from './routes/marketplace.routes';
import serviceDataRoutes from './routes/service-data.routes';
import { logger } from './utils/logger';
import path from 'path';
import { config } from './config';

const app = express();

// Trust proxy for accurate IP addresses behind reverse proxy
app.set('trust proxy', 1);

// Security middleware
app.use(helmet({
  // Explicitly disable HSTS to avoid browsers forcing HTTPS on custom hosts/ports
  hsts: false,
  // Disable COOP/COEP on non-secure origins to avoid noisy browser warnings
  crossOriginOpenerPolicy: false,
  crossOriginEmbedderPolicy: false,
  // Relax CORP so static assets can load from same-origin HTTP without issues
  crossOriginResourcePolicy: { policy: 'cross-origin' },
  // Suppress Origin-Agent-Cluster header to reduce confusing console noise
  originAgentCluster: false,
  contentSecurityPolicy: {
    useDefaults: false,
    directives: {
      // IMPORTANT: Do NOT include 'upgrade-insecure-requests' so HTTP works behind external TLS proxies
      upgradeInsecureRequests: null,
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'", "'unsafe-inline'"],
      connectSrc: ["'self'", 'ws:', 'wss:'],
      imgSrc: ["'self'", 'data:', 'https:'],
      baseUri: ["'self'"],
      objectSrc: ["'none'"],
      frameAncestors: ["'self'"],
      formAction: ["'self'"],
      fontSrc: ["'self'", 'https:', 'data:'],
      scriptSrcAttr: ["'none'"],
    },
  },
}));

// CORS middleware (apply only to API routes to avoid interfering with static assets)
app.use(config.apiPrefix, corsMiddleware);

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: {
    success: false,
    error: {
      message: 'Too many requests from this IP, please try again later.'
    }
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// Apply rate limiting only to API routes
app.use(config.apiPrefix, limiter);

// Logging
app.use(morgan('combined', { stream: { write: message => logger.info(message.trim()) } }));

// Body parsing
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// API routes with /api prefix
app.use(`${config.apiPrefix}/auth`, authRoutes);
app.use(`${config.apiPrefix}/users`, userRoutes);
app.use(`${config.apiPrefix}/services`, authenticateToken, servicesRoutes);
app.use(`${config.apiPrefix}/config`, authenticateToken, configRoutes);
app.use(`${config.apiPrefix}/dashboard`, authenticateToken, dashboardRoutes);
app.use(`${config.apiPrefix}/marketplace`, authenticateToken, marketplaceRoutes);
app.use(`${config.apiPrefix}`, serviceDataRoutes); // Generic service data routes

// Health check endpoint (no auth required)
app.get(`${config.apiPrefix}/health`, (req, res) => {
  res.json({
    success: true,
    data: {
      status: 'OK',
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV,
      version: '1.0.0',
      apiPrefix: config.basePath
    }
  });
});

// Serve frontend in production (configurable base path)
if (config.nodeEnv === 'production') {
  const staticDir = path.resolve(__dirname, 'public');
  const basePath = (config.basePath && config.basePath !== '/') ? config.basePath : '/';

  // Static assets
  app.use(basePath, express.static(staticDir));

  // SPA fallback: avoid capturing API routes
  const spaFallbackPath = basePath === '/' ? '*' : `${basePath}*`;
  app.get(spaFallbackPath, (req, res, next) => {
    // If request targets API or a static asset path, let those handlers handle it
    if (req.path.startsWith(config.apiPrefix) || req.path.startsWith(`${basePath}assets/`)) {
      return next();
    }
    // Only serve SPA for navigation requests that accept HTML
    const acceptsHtml = req.headers.accept && req.headers.accept.includes('text/html');
    if (!acceptsHtml) return next();
    res.sendFile(path.join(staticDir, 'index.html'));
  });
}

// Root endpoint
app.get('/', (req, res) => {
  res.json({
    success: true,
    message: 'Homie API Server',
    data: {
      version: '1.0.0',
      apiPrefix: config.basePath,
      endpoints: {
        health: `${config.basePath}/health`,
        auth: `${config.basePath}/auth`,
        services: `${config.basePath}/services`,
        config: `${config.basePath}/config`,
        dashboard: `${config.basePath}/dashboard`
      }
    }
  });
});

// 404 handler for undefined routes
app.use(`${config.basePath}/*`, (req, res) => {
  res.status(404).json({
    success: false,
    error: {
      message: 'Route not found',
      path: req.originalUrl
    }
  });
});

// Global error handling middleware
app.use(errorMiddleware);

export default app;

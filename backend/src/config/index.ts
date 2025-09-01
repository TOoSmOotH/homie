import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

export interface Config {
  nodeEnv: string;
  port: number;
  apiPrefix: string;
  dbPath: string;
  jwtSecret: string;
  jwtExpiresIn: string;
  logLevel: string;
  logFile: string;
  corsOrigin: string;
  frontendUrl: string;
  basePath: string;
  features: {
    emailVerification: boolean;
    twoFactorAuth: boolean;
    autoDiscovery: boolean;
    websocket: boolean;
  };
}

export const config: Config = {
  nodeEnv: process.env.NODE_ENV || 'development',
  port: parseInt(process.env.PORT || '9825', 10),
  apiPrefix: process.env.API_PREFIX || '/api',
  dbPath: process.env.DB_PATH || './data/homie.db',
  jwtSecret: process.env.JWT_SECRET || 'fallback-secret-change-in-production',
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || '7d',
  logLevel: process.env.LOG_LEVEL || 'info',
  logFile: process.env.LOG_FILE || './logs/homie.log',
  corsOrigin: process.env.CORS_ORIGIN || 'http://localhost:3000',
  frontendUrl: process.env.FRONTEND_URL || 'http://localhost:3000',
  basePath: process.env.BASE_PATH || '',
  features: {
    emailVerification: process.env.ENABLE_EMAIL_VERIFICATION === 'true', // Default false
    twoFactorAuth: process.env.ENABLE_2FA === 'true', // Default false
    autoDiscovery: process.env.ENABLE_AUTO_DISCOVERY !== 'false', // Default true
    websocket: process.env.ENABLE_WEBSOCKET !== 'false' // Default true
  }
};

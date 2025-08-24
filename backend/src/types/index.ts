// Export all types for easy importing

// Database types
export * from './database.types';

// API types
export * from './api.types';

// Common utility types
export interface Dictionary<T = any> {
  [key: string]: T;
}

export type Nullable<T> = {
  [K in keyof T]: T[K] | null;
};

export type Optional<T> = {
  [K in keyof T]?: T[K];
};

export type DeepPartial<T> = {
  [P in keyof T]?: T[P] extends object ? DeepPartial<T[P]> : T[P];
};

export type NonEmptyArray<T> = [T, ...T[]];

export type Awaited<T> = T extends PromiseLike<infer U> ? U : T;

// Environment types
export interface EnvironmentConfig {
  NODE_ENV: 'development' | 'production' | 'test';
  PORT: number;
  DB_PATH: string;
  JWT_SECRET: string;
  JWT_EXPIRES_IN: string;
  API_PREFIX: string;
  FRONTEND_URL: string;
  BASE_PATH: string;
  LOG_LEVEL: 'error' | 'warn' | 'info' | 'debug';
  LOG_FILE: string;
  CORS_ORIGIN: string;
  ENCRYPTION_KEY?: string;
  SESSION_SECRET: string;
}

// Error types
export interface AppError extends Error {
  code: string;
  statusCode: number;
  isOperational: boolean;
  details?: any;
}

export class ValidationError extends Error implements AppError {
  code = 'VALIDATION_ERROR';
  statusCode = 400;
  isOperational = true;

  constructor(message: string, public details?: any) {
    super(message);
    this.name = 'ValidationError';
  }
}

export class AuthenticationError extends Error implements AppError {
  code = 'AUTHENTICATION_ERROR';
  statusCode = 401;
  isOperational = true;

  constructor(message: string, public details?: any) {
    super(message);
    this.name = 'AuthenticationError';
  }
}

export class AuthorizationError extends Error implements AppError {
  code = 'AUTHORIZATION_ERROR';
  statusCode = 403;
  isOperational = true;

  constructor(message: string, public details?: any) {
    super(message);
    this.name = 'AuthorizationError';
  }
}

export class NotFoundError extends Error implements AppError {
  code = 'NOT_FOUND_ERROR';
  statusCode = 404;
  isOperational = true;

  constructor(resource: string, public details?: any) {
    super(`${resource} not found`);
    this.name = 'NotFoundError';
  }
}

export class ConflictError extends Error implements AppError {
  code = 'CONFLICT_ERROR';
  statusCode = 409;
  isOperational = true;

  constructor(message: string, public details?: any) {
    super(message);
    this.name = 'ConflictError';
  }
}

export class DatabaseError extends Error implements AppError {
  code = 'DATABASE_ERROR';
  statusCode = 500;
  isOperational = true;

  constructor(message: string, public originalError?: Error, public details?: any) {
    super(message);
    this.name = 'DatabaseError';
  }
}

export class ExternalServiceError extends Error implements AppError {
  code = 'EXTERNAL_SERVICE_ERROR';
  statusCode = 502;
  isOperational = true;

  constructor(service: string, message: string, public details?: any) {
    super(`External service ${service} error: ${message}`);
    this.name = 'ExternalServiceError';
  }
}

// Service health types
export interface ServiceHealth {
  status: 'healthy' | 'unhealthy' | 'unknown';
  lastCheck: Date;
  responseTime?: number;
  errorMessage?: string;
  uptime?: number;
  version?: string;
  details?: any;
}

// Pagination types
export interface PaginationOptions {
  page?: number;
  limit?: number;
  sort?: string;
  order?: 'asc' | 'desc';
  filter?: Dictionary;
}

export interface PaginationResult<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  hasNext: boolean;
  hasPrev: boolean;
}

// File upload types
export interface FileUpload {
  fieldname: string;
  originalname: string;
  encoding: string;
  mimetype: string;
  buffer: Buffer;
  size: number;
  filename?: string;
  path?: string;
}

export interface FileUploadResult {
  filename: string;
  originalName: string;
  size: number;
  mimetype: string;
  url?: string;
  key?: string;
}

// Audit log types
export interface AuditLogEntry {
  id: string;
  timestamp: Date;
  userId?: string;
  action: string;
  resource: string;
  resourceId?: string;
  oldValues?: any;
  newValues?: any;
  ipAddress?: string;
  userAgent?: string;
  metadata?: any;
}

// Metrics types
export interface SystemMetrics {
  timestamp: Date;
  cpu: {
    usage: number;
    cores: number;
    loadAverage: number[];
  };
  memory: {
    total: number;
    used: number;
    free: number;
    usagePercentage: number;
  };
  disk: {
    total: number;
    used: number;
    free: number;
    usagePercentage: number;
  }[];
  network: {
    interfaces: {
      name: string;
      rx: number;
      tx: number;
    }[];
  };
  uptime: number;
  process: {
    pid: number;
    memory: NodeJS.MemoryUsage;
    cpuUsage: NodeJS.CpuUsage;
  };
}

// WebSocket types
export interface WebSocketClient {
  id: string;
  userId?: string;
  connectedAt: Date;
  lastActivity: Date;
  subscriptions: string[];
  userAgent?: string;
  ipAddress?: string;
}

export interface WebSocketMessage<T = any> {
  type: string;
  payload: T;
  timestamp: Date;
  clientId?: string;
  userId?: string;
}

// Event types
export type EventName =
  | 'user.created'
  | 'user.updated'
  | 'user.deleted'
  | 'user.login'
  | 'user.logout'
  | 'service.created'
  | 'service.updated'
  | 'service.deleted'
  | 'service.status.changed'
  | 'system.backup.completed'
  | 'system.maintenance.started'
  | 'system.maintenance.completed'
  | 'security.alert'
  | 'notification.sent';

export interface EventPayload {
  [key: string]: any;
}

export interface Event {
  name: EventName;
  payload: EventPayload;
  timestamp: Date;
  userId?: string;
  metadata?: Dictionary;
}
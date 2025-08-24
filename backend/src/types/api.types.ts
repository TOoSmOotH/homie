// API request and response types

import { UserEntity, UserSettingsEntity, ServiceConfigEntity, AppPreferencesEntity } from './database.types';

// Auth API types
export interface LoginRequest {
  email: string;
  password: string;
}

export interface LoginResponse {
  user: UserEntity;
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
}

export interface RegisterRequest {
  email: string;
  username: string;
  password: string;
  firstName: string;
  lastName: string;
}

export interface RegisterResponse {
  user: UserEntity;
  message: string;
}

export interface RefreshTokenRequest {
  refreshToken: string;
}

export interface RefreshTokenResponse {
  accessToken: string;
  expiresIn: number;
}

export interface ForgotPasswordRequest {
  email: string;
}

export interface ResetPasswordRequest {
  token: string;
  newPassword: string;
}

export interface ChangePasswordRequest {
  currentPassword: string;
  newPassword: string;
}

// User API types
export interface UpdateUserRequest {
  email?: string;
  username?: string;
  firstName?: string;
  lastName?: string;
  twoFactorEnabled?: boolean;
}

export interface UserResponse {
  user: UserEntity;
  settings: UserSettingsEntity;
}

export interface UsersListResponse {
  users: UserEntity[];
  total: number;
  page: number;
  limit: number;
}

// User Settings API types
export interface UpdateUserSettingsRequest {
  theme?: 'light' | 'dark' | 'auto';
  language?: 'en' | 'es' | 'fr' | 'de' | 'it' | 'pt' | 'ru' | 'zh' | 'ja' | 'ko';
  timezone?: string;
  dateFormat?: 'MM/DD/YYYY' | 'DD/MM/YYYY' | 'YYYY-MM-DD' | 'DD MMM YYYY' | 'MMM DD, YYYY';
  timeFormat?: '12h' | '24h';
  dashboardLayout?: any;
  showWelcomeMessage?: boolean;
  showQuickActions?: boolean;
  compactView?: boolean;
  itemsPerPage?: number;
  emailNotifications?: 'all' | 'important' | 'none';
  pushNotifications?: 'all' | 'important' | 'none';
  notifyOnServiceDown?: boolean;
  notifyOnServiceUp?: boolean;
  notifyOnUpdates?: boolean;
  notifyOnSecurityAlerts?: boolean;
  serviceRefreshIntervals?: { [serviceName: string]: number };
  autoRefreshEnabled?: boolean;
  defaultRefreshInterval?: number;
  favoriteServices?: string[];
  hiddenServices?: string[];
  allowDataCollection?: boolean;
  showOnlineStatus?: boolean;
  profileVisibleToPublic?: boolean;
  enableAnimations?: boolean;
  preloadData?: boolean;
  maxConcurrentRequests?: number;
  highContrastMode?: boolean;
  reducedMotion?: boolean;
  fontSize?: number;
  screenReaderEnabled?: boolean;
  customSettings?: any;
}

// Service Config API types
export interface CreateServiceConfigRequest {
  name: string;
  description?: string;
  serviceType: 'proxmox' | 'docker' | 'sonarr' | 'radarr' | 'sabnzbd' | 'qbittorrent' | 'deluge' | 'jellyfin' | 'plex' | 'transmission' | 'nzbget' | 'lidarr' | 'bazarr' | 'tautulli' | 'overseerr' | 'custom';
  baseUrl: string;
  port?: number;
  authType: 'api_key' | 'username_password' | 'token' | 'certificate' | 'none';
  apiKey?: string;
  username?: string;
  password?: string;
  token?: string;
  certificate?: string;
  privateKey?: string;
  serviceConfig?: any;
  healthCheckInterval?: number;
  enableHealthChecks?: boolean;
  maxRetries?: number;
  timeout?: number;
  useSSL?: boolean;
  verifySSL?: boolean;
  headers?: any;
  version?: number;
  isDefault?: boolean;
  tags?: string[];
}

export interface UpdateServiceConfigRequest {
  name?: string;
  description?: string;
  baseUrl?: string;
  port?: number;
  apiKey?: string;
  username?: string;
  password?: string;
  token?: string;
  certificate?: string;
  privateKey?: string;
  serviceConfig?: any;
  healthCheckInterval?: number;
  enableHealthChecks?: boolean;
  maxRetries?: number;
  timeout?: number;
  useSSL?: boolean;
  verifySSL?: boolean;
  headers?: any;
  version?: number;
  isDefault?: boolean;
  tags?: string[];
}

export interface ServiceConfigResponse {
  service: ServiceConfigEntity;
  healthStatus?: {
    status: 'healthy' | 'unhealthy' | 'unknown';
    lastCheck: Date;
    responseTime?: number;
    errorMessage?: string;
  };
}

export interface ServiceConfigsListResponse {
  services: ServiceConfigEntity[];
  total: number;
  page: number;
  limit: number;
}

// App Preferences API types
export interface UpdateAppPreferencesRequest {
  appName?: string;
  appVersion?: string;
  appDescription?: string;
  defaultPort?: number;
  enableCORS?: boolean;
  allowedOrigins?: string[];
  enableCompression?: boolean;
  enableRateLimiting?: boolean;
  rateLimitMaxRequests?: number;
  rateLimitWindowMinutes?: number;
  connectionPoolSize?: number;
  queryTimeout?: number;
  enableQueryLogging?: boolean;
  securityLevel?: 'low' | 'medium' | 'high' | 'maximum';
  bcryptRounds?: number;
  sessionTimeoutHours?: number;
  maxLoginAttempts?: number;
  lockoutDurationMinutes?: number;
  requireStrongPasswords?: boolean;
  enableTwoFactorAuth?: boolean;
  enforceSSL?: boolean;
  securityHeaders?: any;
  logLevel?: 'error' | 'warn' | 'info' | 'debug';
  logFile?: string;
  maxLogFiles?: number;
  maxLogSize?: number;
  enableConsoleLogging?: boolean;
  enableRemoteLogging?: boolean;
  remoteLogEndpoint?: string;
  backupFrequency?: 'daily' | 'weekly' | 'monthly' | 'manual';
  backupDirectory?: string;
  backupRetentionDays?: number;
  enableAutoBackup?: boolean;
  backupHour?: number;
  maxConcurrentConnections?: number;
  requestTimeout?: number;
  enableCaching?: boolean;
  cacheTTL?: number;
  maxCacheSize?: number;
  enableServiceMonitoring?: boolean;
  defaultHealthCheckInterval?: number;
  maxHealthCheckRetries?: number;
  notifyOnServiceFailure?: boolean;
  serviceFailureThreshold?: number;
  enableEmailNotifications?: boolean;
  smtpHost?: string;
  smtpPort?: number;
  smtpUsername?: string;
  smtpPassword?: string;
  notificationEmailFrom?: string;
  enablePushNotifications?: boolean;
  pushNotificationKey?: string;
  enableUserRegistration?: boolean;
  enableGuestAccess?: boolean;
  enableApiDocumentation?: boolean;
  enableMetricsCollection?: boolean;
  enableDebugMode?: boolean;
  enableSwaggerUI?: boolean;
  externalIntegrations?: any;
  enableAnalytics?: boolean;
  analyticsTrackingId?: string;
  maintenanceMode?: boolean;
  maintenanceMessage?: string;
  maintenanceScheduledStart?: Date;
  maintenanceScheduledEnd?: Date;
  customConfig?: any;
}

// Database API types
export interface MigrationStatusResponse {
  pending: any[];
  executed: any[];
}

export interface DatabaseHealthResponse {
  status: 'healthy' | 'unhealthy';
  connection: boolean;
  migrations: {
    current: number;
    total: number;
    pending: number;
  };
  lastCheck: Date;
}

// Common API types
export interface PaginatedRequest {
  page?: number;
  limit?: number;
  sort?: string;
  order?: 'asc' | 'desc';
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface ApiErrorResponse {
  error: {
    code: string;
    message: string;
    details?: any;
  };
  timestamp: string;
  path: string;
}

export interface ApiSuccessResponse<T = any> {
  data: T;
  message?: string;
  timestamp: string;
}

export interface HealthCheckResponse {
  status: 'ok' | 'error';
  timestamp: string;
  uptime: number;
  version: string;
  database: DatabaseHealthResponse;
  services: {
    total: number;
    active: number;
    inactive: number;
    error: number;
  };
}

// WebSocket types
export interface WebSocketMessage {
  type: string;
  payload: any;
  timestamp: string;
}

export interface ServiceStatusUpdateMessage extends WebSocketMessage {
  type: 'service_status_update';
  payload: {
    serviceId: string;
    serviceName: string;
    status: 'active' | 'inactive' | 'error' | 'maintenance' | 'unknown';
    previousStatus?: string;
    errorMessage?: string;
    responseTime?: number;
  };
}

export interface NotificationMessage extends WebSocketMessage {
  type: 'notification';
  payload: {
    id: string;
    title: string;
    message: string;
    type: 'info' | 'success' | 'warning' | 'error';
    category: 'service' | 'system' | 'user' | 'security';
    actionUrl?: string;
    dismissible: boolean;
  };
}
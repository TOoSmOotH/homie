// Database entity types and interfaces

export interface BaseEntity {
  id: string;
  createdAt: Date;
  updatedAt: Date;
}

// User types
export interface UserEntity extends BaseEntity {
  email: string;
  username: string;
  passwordHash: string;
  firstName: string;
  lastName: string;
  role: UserRole;
  status: UserStatus;
  emailVerified: boolean;
  emailVerificationToken?: string;
  emailVerificationExpires?: Date;
  passwordResetToken?: string;
  passwordResetExpires?: Date;
  lastLoginAt?: Date;
  lastLoginIp?: string;
  loginAttempts: number;
  lockoutUntil?: Date;
  twoFactorEnabled: boolean;
  twoFactorSecret?: string;
  refreshToken?: string;
  refreshTokenExpires?: Date;
  settings: UserSettingsEntity;
}

export type UserRole = 'admin' | 'user' | 'guest';
export type UserStatus = 'active' | 'inactive' | 'suspended' | 'pending';

export interface CreateUserInput {
  email: string;
  username: string;
  password: string;
  firstName: string;
  lastName: string;
  role?: UserRole;
}

export interface UpdateUserInput {
  email?: string;
  username?: string;
  firstName?: string;
  lastName?: string;
  role?: UserRole;
  status?: UserStatus;
  twoFactorEnabled?: boolean;
}

// User Settings types
export interface UserSettingsEntity extends BaseEntity {
  theme: Theme;
  language: Language;
  timezone: string;
  dateFormat: DateFormat;
  timeFormat: TimeFormat;
  dashboardLayout?: any;
  showWelcomeMessage: boolean;
  showQuickActions: boolean;
  compactView: boolean;
  itemsPerPage: number;
  emailNotifications: NotificationLevel;
  pushNotifications: NotificationLevel;
  notifyOnServiceDown: boolean;
  notifyOnServiceUp: boolean;
  notifyOnUpdates: boolean;
  notifyOnSecurityAlerts: boolean;
  serviceRefreshIntervals?: { [serviceName: string]: number };
  autoRefreshEnabled: boolean;
  defaultRefreshInterval: number;
  favoriteServices?: string[];
  hiddenServices?: string[];
  allowDataCollection: boolean;
  showOnlineStatus: boolean;
  profileVisibleToPublic: boolean;
  enableAnimations: boolean;
  preloadData: boolean;
  maxConcurrentRequests: number;
  highContrastMode: boolean;
  reducedMotion: boolean;
  fontSize: number;
  screenReaderEnabled: boolean;
  customSettings?: any;
}

export type Theme = 'light' | 'dark' | 'auto';
export type Language = 'en' | 'es' | 'fr' | 'de' | 'it' | 'pt' | 'ru' | 'zh' | 'ja' | 'ko';
export type DateFormat = 'MM/DD/YYYY' | 'DD/MM/YYYY' | 'YYYY-MM-DD' | 'DD MMM YYYY' | 'MMM DD, YYYY';
export type TimeFormat = '12h' | '24h';
export type NotificationLevel = 'all' | 'important' | 'none';

export interface UpdateUserSettingsInput {
  theme?: Theme;
  language?: Language;
  timezone?: string;
  dateFormat?: DateFormat;
  timeFormat?: TimeFormat;
  dashboardLayout?: any;
  showWelcomeMessage?: boolean;
  showQuickActions?: boolean;
  compactView?: boolean;
  itemsPerPage?: number;
  emailNotifications?: NotificationLevel;
  pushNotifications?: NotificationLevel;
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

// Service Config types
export interface ServiceConfigEntity extends BaseEntity {
  name: string;
  description?: string;
  serviceType: ServiceType;
  baseUrl: string;
  port?: number;
  authType: AuthenticationType;
  encryptedApiKey?: string;
  encryptedUsername?: string;
  encryptedPassword?: string;
  encryptedToken?: string;
  encryptedCertificate?: string;
  encryptedPrivateKey?: string;
  serviceConfig?: any;
  status: ServiceStatus;
  lastHealthCheck?: Date;
  healthCheckInterval: number;
  enableHealthChecks: boolean;
  lastErrorMessage?: string;
  maxRetries: number;
  timeout: number;
  useSSL: boolean;
  verifySSL: boolean;
  headers?: any;
  version: number;
  isDefault: boolean;
  tags?: string[];
  userId: string;
  user: UserEntity;
}

export type ServiceType =
  | 'proxmox'
  | 'docker'
  | 'sonarr'
  | 'radarr'
  | 'sabnzbd'
  | 'qbittorrent'
  | 'deluge'
  | 'jellyfin'
  | 'plex'
  | 'transmission'
  | 'nzbget'
  | 'lidarr'
  | 'bazarr'
  | 'tautulli'
  | 'overseerr'
  | 'custom';

export type ServiceStatus = 'active' | 'inactive' | 'error' | 'maintenance' | 'unknown';
export type AuthenticationType = 'api_key' | 'username_password' | 'token' | 'certificate' | 'none';

export interface CreateServiceConfigInput {
  name: string;
  description?: string;
  serviceType: ServiceType;
  baseUrl: string;
  port?: number;
  authType: AuthenticationType;
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

export interface UpdateServiceConfigInput {
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

// App Preferences types
export interface AppPreferencesEntity extends BaseEntity {
  appName: string;
  appVersion: string;
  appDescription?: string;
  defaultPort: number;
  enableCORS: boolean;
  allowedOrigins: string;
  enableCompression: boolean;
  enableRateLimiting: boolean;
  rateLimitMaxRequests: number;
  rateLimitWindowMinutes: number;
  connectionPoolSize: number;
  queryTimeout: number;
  enableQueryLogging: boolean;
  securityLevel: SecurityLevel;
  bcryptRounds: number;
  sessionTimeoutHours: number;
  maxLoginAttempts: number;
  lockoutDurationMinutes: number;
  requireStrongPasswords: boolean;
  enableTwoFactorAuth: boolean;
  enforceSSL: boolean;
  securityHeaders?: any;
  logLevel: LogLevel;
  logFile: string;
  maxLogFiles: number;
  maxLogSize: number;
  enableConsoleLogging: boolean;
  enableRemoteLogging: boolean;
  remoteLogEndpoint?: string;
  backupFrequency: BackupFrequency;
  backupDirectory: string;
  backupRetentionDays: number;
  enableAutoBackup: boolean;
  backupHour: number;
  maxConcurrentConnections: number;
  requestTimeout: number;
  enableCaching: boolean;
  cacheTTL: number;
  maxCacheSize: number;
  enableServiceMonitoring: boolean;
  defaultHealthCheckInterval: number;
  maxHealthCheckRetries: number;
  notifyOnServiceFailure: boolean;
  serviceFailureThreshold: number;
  enableEmailNotifications: boolean;
  smtpHost?: string;
  smtpPort?: number;
  smtpUsername?: string;
  smtpPassword?: string;
  notificationEmailFrom?: string;
  enablePushNotifications: boolean;
  pushNotificationKey?: string;
  enableUserRegistration: boolean;
  enableGuestAccess: boolean;
  enableApiDocumentation: boolean;
  enableMetricsCollection: boolean;
  enableDebugMode: boolean;
  enableSwaggerUI: boolean;
  externalIntegrations?: any;
  enableAnalytics: boolean;
  analyticsTrackingId?: string;
  maintenanceMode: boolean;
  maintenanceMessage?: string;
  maintenanceScheduledStart?: Date;
  maintenanceScheduledEnd?: Date;
  customConfig?: any;
}

export type SecurityLevel = 'low' | 'medium' | 'high' | 'maximum';
export type LogLevel = 'error' | 'warn' | 'info' | 'debug';
export type BackupFrequency = 'daily' | 'weekly' | 'monthly' | 'manual';

export interface UpdateAppPreferencesInput {
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
  securityLevel?: SecurityLevel;
  bcryptRounds?: number;
  sessionTimeoutHours?: number;
  maxLoginAttempts?: number;
  lockoutDurationMinutes?: number;
  requireStrongPasswords?: boolean;
  enableTwoFactorAuth?: boolean;
  enforceSSL?: boolean;
  securityHeaders?: any;
  logLevel?: LogLevel;
  logFile?: string;
  maxLogFiles?: number;
  maxLogSize?: number;
  enableConsoleLogging?: boolean;
  enableRemoteLogging?: boolean;
  remoteLogEndpoint?: string;
  backupFrequency?: BackupFrequency;
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

// Repository types
export interface UserRepository {
  findById(id: string): Promise<UserEntity | null>;
  findByEmail(email: string): Promise<UserEntity | null>;
  findByUsername(username: string): Promise<UserEntity | null>;
  create(user: CreateUserInput): Promise<UserEntity>;
  update(id: string, user: UpdateUserInput): Promise<UserEntity>;
  delete(id: string): Promise<boolean>;
  findAll(): Promise<UserEntity[]>;
}

export interface UserSettingsRepository {
  findByUserId(userId: string): Promise<UserSettingsEntity | null>;
  create(userId: string, settings: Partial<UserSettingsEntity>): Promise<UserSettingsEntity>;
  update(userId: string, settings: UpdateUserSettingsInput): Promise<UserSettingsEntity>;
  delete(userId: string): Promise<boolean>;
}

export interface ServiceConfigRepository {
  findById(id: string): Promise<ServiceConfigEntity | null>;
  findByUserId(userId: string): Promise<ServiceConfigEntity[]>;
  findByType(userId: string, serviceType: ServiceType): Promise<ServiceConfigEntity[]>;
  create(service: CreateServiceConfigInput & { userId: string }): Promise<ServiceConfigEntity>;
  update(id: string, service: UpdateServiceConfigInput): Promise<ServiceConfigEntity>;
  delete(id: string): Promise<boolean>;
  findActiveServices(userId: string): Promise<ServiceConfigEntity[]>;
}

export interface AppPreferencesRepository {
  find(): Promise<AppPreferencesEntity | null>;
  create(preferences: Partial<AppPreferencesEntity>): Promise<AppPreferencesEntity>;
  update(preferences: UpdateAppPreferencesInput): Promise<AppPreferencesEntity>;
  delete(): Promise<boolean>;
}
import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn } from 'typeorm';

export enum LogLevel {
  ERROR = 'error',
  WARN = 'warn',
  INFO = 'info',
  DEBUG = 'debug'
}

export enum BackupFrequency {
  DAILY = 'daily',
  WEEKLY = 'weekly',
  MONTHLY = 'monthly',
  MANUAL = 'manual'
}

export enum SecurityLevel {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  MAXIMUM = 'maximum'
}

@Entity('app_preferences')
export class AppPreferences {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  // Application metadata
  @Column({ type: 'varchar', length: 100, default: 'Homie' })
  appName!: string;

  @Column({ type: 'varchar', length: 50, default: '1.0.0' })
  appVersion!: string;

  @Column({ type: 'text', nullable: true })
  appDescription?: string;

  // Server configuration
  @Column({ type: 'int', default: 3001 })
  defaultPort!: number;

  @Column({ type: 'boolean', default: true })
  enableCORS!: boolean;

  @Column({ type: 'text', default: 'http://localhost:3000' })
  allowedOrigins!: string; // JSON array of allowed origins

  @Column({ type: 'boolean', default: true })
  enableCompression!: boolean;

  @Column({ type: 'boolean', default: true })
  enableRateLimiting!: boolean;

  @Column({ type: 'int', default: 100 })
  rateLimitMaxRequests!: number;

  @Column({ type: 'int', default: 15 })
  rateLimitWindowMinutes!: number;

  // Database configuration
  @Column({ type: 'int', default: 30 })
  connectionPoolSize!: number;

  @Column({ type: 'int', default: 5000 })
  queryTimeout!: number; // in milliseconds

  @Column({ type: 'boolean', default: true })
  enableQueryLogging!: boolean;

  // Security settings
  @Column({
    type: 'varchar',
    length: 50,
    default: SecurityLevel.MEDIUM
  })
  securityLevel!: SecurityLevel;

  @Column({ type: 'int', default: 12 })
  bcryptRounds!: number;

  @Column({ type: 'int', default: 24 })
  sessionTimeoutHours!: number;

  @Column({ type: 'int', default: 5 })
  maxLoginAttempts!: number;

  @Column({ type: 'int', default: 30 })
  lockoutDurationMinutes!: number;

  @Column({ type: 'boolean', default: true })
  requireStrongPasswords!: boolean;

  @Column({ type: 'boolean', default: false })
  enableTwoFactorAuth!: boolean;

  @Column({ type: 'boolean', default: true })
  enforceSSL!: boolean;

  @Column({ type: 'json', nullable: true })
  securityHeaders?: any; // Custom security headers

  // Logging configuration
  @Column({
    type: 'varchar',
    length: 50,
    default: LogLevel.INFO
  })
  logLevel!: LogLevel;

  @Column({ type: 'text', default: './logs/homie.log' })
  logFile!: string;

  @Column({ type: 'int', default: 10 })
  maxLogFiles!: number;

  @Column({ type: 'int', default: 10485760 })
  maxLogSize!: number; // in bytes (10MB default)

  @Column({ type: 'boolean', default: true })
  enableConsoleLogging!: boolean;

  @Column({ type: 'boolean', default: false })
  enableRemoteLogging!: boolean;

  @Column({ type: 'text', nullable: true })
  remoteLogEndpoint?: string;

  // Backup and maintenance
  @Column({
    type: 'varchar',
    length: 50,
    default: BackupFrequency.WEEKLY
  })
  backupFrequency!: BackupFrequency;

  @Column({ type: 'text', default: './backups' })
  backupDirectory!: string;

  @Column({ type: 'int', default: 30 })
  backupRetentionDays!: number;

  @Column({ type: 'boolean', default: true })
  enableAutoBackup!: boolean;

  @Column({ type: 'int', default: 2 })
  backupHour!: number; // Hour of day (0-23)

  // Performance settings
  @Column({ type: 'int', default: 50 })
  maxConcurrentConnections!: number;

  @Column({ type: 'int', default: 30000 })
  requestTimeout!: number; // in milliseconds

  @Column({ type: 'boolean', default: true })
  enableCaching!: boolean;

  @Column({ type: 'int', default: 300 })
  cacheTTL!: number; // in seconds

  @Column({ type: 'int', default: 100 })
  maxCacheSize!: number; // in MB

  // Service monitoring
  @Column({ type: 'boolean', default: true })
  enableServiceMonitoring!: boolean;

  @Column({ type: 'int', default: 30 })
  defaultHealthCheckInterval!: number; // in seconds

  @Column({ type: 'int', default: 3 })
  maxHealthCheckRetries!: number;

  @Column({ type: 'boolean', default: true })
  notifyOnServiceFailure!: boolean;

  @Column({ type: 'int', default: 5 })
  serviceFailureThreshold!: number; // Number of failures before alert

  // Notification settings
  @Column({ type: 'boolean', default: false })
  enableEmailNotifications!: boolean;

  @Column({ type: 'text', nullable: true })
  smtpHost?: string;

  @Column({ type: 'int', nullable: true })
  smtpPort?: number;

  @Column({ type: 'text', nullable: true })
  smtpUsername?: string;

  @Column({ type: 'text', nullable: true })
  smtpPassword?: string; // Will be encrypted in practice

  @Column({ type: 'text', nullable: true })
  notificationEmailFrom?: string;

  @Column({ type: 'boolean', default: false })
  enablePushNotifications!: boolean;

  @Column({ type: 'text', nullable: true })
  pushNotificationKey?: string;

  // Feature flags
  @Column({ type: 'boolean', default: true })
  enableUserRegistration!: boolean;

  @Column({ type: 'boolean', default: true })
  enableGuestAccess!: boolean;

  @Column({ type: 'boolean', default: false })
  enableApiDocumentation!: boolean;

  @Column({ type: 'boolean', default: true })
  enableMetricsCollection!: boolean;

  @Column({ type: 'boolean', default: false })
  enableDebugMode!: boolean;

  @Column({ type: 'boolean', default: true })
  enableSwaggerUI!: boolean;

  // Integration settings
  @Column({ type: 'json', nullable: true })
  externalIntegrations?: any; // Third-party service configurations

  @Column({ type: 'boolean', default: false })
  enableAnalytics!: boolean;

  @Column({ type: 'text', nullable: true })
  analyticsTrackingId?: string;

  // Maintenance mode
  @Column({ type: 'boolean', default: false })
  maintenanceMode!: boolean;

  @Column({ type: 'text', nullable: true })
  maintenanceMessage?: string;

  @Column({ type: 'datetime', nullable: true })
  maintenanceScheduledStart?: Date;

  @Column({ type: 'datetime', nullable: true })
  maintenanceScheduledEnd?: Date;

  // Custom configuration
  @Column({ type: 'json', nullable: true })
  customConfig?: any; // For extensibility

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;

  // Instance methods
  public getAllowedOrigins(): string[] {
    try {
      return JSON.parse(this.allowedOrigins);
    } catch {
      return [this.allowedOrigins];
    }
  }

  public setAllowedOrigins(origins: string[]): void {
    this.allowedOrigins = JSON.stringify(origins);
  }

  public isMaintenanceActive(): boolean {
    if (!this.maintenanceMode) {
      return false;
    }

    if (this.maintenanceScheduledStart && this.maintenanceScheduledEnd) {
      const now = new Date();
      return now >= this.maintenanceScheduledStart && now <= this.maintenanceScheduledEnd;
    }

    return true;
  }

  public setSecurityHeaders(headers: { [key: string]: string }): void {
    if (!this.securityHeaders) {
      this.securityHeaders = {};
    }
    Object.assign(this.securityHeaders, headers);
  }

  public getSecurityHeaders(): { [key: string]: string } {
    return this.securityHeaders || {};
  }

  public setCustomConfig(key: string, value: any): void {
    if (!this.customConfig) {
      this.customConfig = {};
    }
    this.customConfig[key] = value;
  }

  public getCustomConfig(key: string): any {
    return this.customConfig ? this.customConfig[key] : undefined;
  }

  public removeCustomConfig(key: string): void {
    if (this.customConfig) {
      delete this.customConfig[key];
    }
  }

  public getSMTPConfig(): any {
    if (!this.enableEmailNotifications) {
      return null;
    }

    return {
      host: this.smtpHost,
      port: this.smtpPort,
      secure: this.smtpPort === 465,
      auth: this.smtpUsername && this.smtpPassword ? {
        user: this.smtpUsername,
        pass: this.smtpPassword, // In practice, this should be decrypted
      } : undefined,
    };
  }

  public getDefaultSettings(): Partial<AppPreferences> {
    return {
      appName: 'Homie',
      appVersion: '1.0.0',
      defaultPort: 3001,
      enableCORS: true,
      allowedOrigins: JSON.stringify(['http://localhost:3000']),
      enableCompression: true,
      enableRateLimiting: true,
      rateLimitMaxRequests: 100,
      rateLimitWindowMinutes: 15,
      connectionPoolSize: 30,
      queryTimeout: 5000,
      enableQueryLogging: true,
      securityLevel: SecurityLevel.MEDIUM,
      bcryptRounds: 12,
      sessionTimeoutHours: 24,
      maxLoginAttempts: 5,
      lockoutDurationMinutes: 30,
      requireStrongPasswords: true,
      enableTwoFactorAuth: false,
      enforceSSL: true,
      logLevel: LogLevel.INFO,
      logFile: './logs/homie.log',
      maxLogFiles: 10,
      maxLogSize: 10485760, // 10MB
      enableConsoleLogging: true,
      enableRemoteLogging: false,
      backupFrequency: BackupFrequency.WEEKLY,
      backupDirectory: './backups',
      backupRetentionDays: 30,
      enableAutoBackup: true,
      backupHour: 2,
      maxConcurrentConnections: 50,
      requestTimeout: 30000,
      enableCaching: true,
      cacheTTL: 300,
      maxCacheSize: 100,
      enableServiceMonitoring: true,
      defaultHealthCheckInterval: 30,
      maxHealthCheckRetries: 3,
      notifyOnServiceFailure: true,
      serviceFailureThreshold: 5,
      enableUserRegistration: true,
      enableGuestAccess: true,
      enableApiDocumentation: false,
      enableMetricsCollection: true,
      enableDebugMode: false,
      enableSwaggerUI: true,
      enableAnalytics: false,
      maintenanceMode: false,
    };
  }

  // Factory method for creating default preferences
  public static createDefaultPreferences(): AppPreferences {
    const prefs = new AppPreferences();
    Object.assign(prefs, prefs.getDefaultSettings());
    return prefs;
  }
}
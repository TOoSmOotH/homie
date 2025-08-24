import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne } from 'typeorm';
import { User } from './User';
import { encrypt, decrypt } from '../utils/encryption';

export enum ServiceType {
  PROXMOX = 'proxmox',
  DOCKER = 'docker',
  SONARR = 'sonarr',
  RADARR = 'radarr',
  SABNZBD = 'sabnzbd',
  QBITTORRENT = 'qbittorrent',
  DELUGE = 'deluge',
  JELLYFIN = 'jellyfin',
  PLEX = 'plex',
  TRANSMISSION = 'transmission',
  NZBGET = 'nzbget',
  LIDARR = 'lidarr',
  BAZARR = 'bazarr',
  TAUTULLI = 'tautulli',
  OVERSEERR = 'overseerr',
  CUSTOM = 'custom'
}

export enum ServiceStatus {
  ACTIVE = 'active',
  INACTIVE = 'inactive',
  ERROR = 'error',
  MAINTENANCE = 'maintenance',
  UNKNOWN = 'unknown'
}

export enum AuthenticationType {
  API_KEY = 'api_key',
  USERNAME_PASSWORD = 'username_password',
  TOKEN = 'token',
  CERTIFICATE = 'certificate',
  NONE = 'none'
}

@Entity('service_configs')
export class ServiceConfig {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'varchar', length: 100 })
  name!: string;

  @Column({ type: 'text', nullable: true })
  description?: string;

  @Column({
    type: 'varchar',
    length: 50
  })
  serviceType!: ServiceType;

  @Column({ type: 'varchar', length: 500 })
  baseUrl!: string;

  @Column({ type: 'int', nullable: true })
  port?: number;

  @Column({
    type: 'varchar',
    length: 50,
    default: AuthenticationType.API_KEY
  })
  authType!: AuthenticationType;

  // Encrypted fields for sensitive data
  @Column({ type: 'text', nullable: true })
  encryptedApiKey?: string;

  @Column({ type: 'text', nullable: true })
  encryptedUsername?: string;

  @Column({ type: 'text', nullable: true })
  encryptedPassword?: string;

  @Column({ type: 'text', nullable: true })
  encryptedToken?: string;

  @Column({ type: 'text', nullable: true })
  encryptedCertificate?: string;

  @Column({ type: 'text', nullable: true })
  encryptedPrivateKey?: string;

  // Service-specific configuration (JSON)
  @Column({ type: 'json', nullable: true })
  serviceConfig?: any;

  @Column({
    type: 'varchar',
    length: 50,
    default: ServiceStatus.UNKNOWN
  })
  status!: ServiceStatus;

  @Column({ type: 'datetime', nullable: true })
  lastHealthCheck?: Date;

  @Column({ type: 'int', default: 30 })
  healthCheckInterval!: number; // in seconds

  @Column({ type: 'boolean', default: true })
  enableHealthChecks!: boolean;

  @Column({ type: 'text', nullable: true })
  lastErrorMessage?: string;

  @Column({ type: 'int', default: 3 })
  maxRetries!: number;

  @Column({ type: 'int', default: 5000 })
  timeout!: number; // in milliseconds

  @Column({ type: 'boolean', default: false })
  useSSL!: boolean;

  @Column({ type: 'boolean', default: true })
  verifySSL!: boolean;

  @Column({ type: 'json', nullable: true })
  headers?: any; // Additional HTTP headers

  @Column({ type: 'int', default: 1 })
  version!: number; // API version if applicable

  @Column({ type: 'boolean', default: false })
  isDefault!: boolean; // If this is the default config for this service type

  @Column({ type: 'json', nullable: true })
  tags?: string[]; // For categorization and filtering

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;

  @ManyToOne(() => User, { nullable: false })
  user!: User;

  // Virtual getters for decrypted values
  get apiKey(): string | undefined {
    return this.encryptedApiKey ? decrypt(this.encryptedApiKey) : undefined;
  }

  get username(): string | undefined {
    return this.encryptedUsername ? decrypt(this.encryptedUsername) : undefined;
  }

  get password(): string | undefined {
    return this.encryptedPassword ? decrypt(this.encryptedPassword) : undefined;
  }

  get token(): string | undefined {
    return this.encryptedToken ? decrypt(this.encryptedToken) : undefined;
  }

  get certificate(): string | undefined {
    return this.encryptedCertificate ? decrypt(this.encryptedCertificate) : undefined;
  }

  get privateKey(): string | undefined {
    return this.encryptedPrivateKey ? decrypt(this.encryptedPrivateKey) : undefined;
  }

  // Virtual setters for encrypted values
  set apiKey(value: string | undefined) {
    this.encryptedApiKey = value ? encrypt(value) : undefined;
  }

  set username(value: string | undefined) {
    this.encryptedUsername = value ? encrypt(value) : undefined;
  }

  set password(value: string | undefined) {
    this.encryptedPassword = value ? encrypt(value) : undefined;
  }

  set token(value: string | undefined) {
    this.encryptedToken = value ? encrypt(value) : undefined;
  }

  set certificate(value: string | undefined) {
    this.encryptedCertificate = value ? encrypt(value) : undefined;
  }

  set privateKey(value: string | undefined) {
    this.encryptedPrivateKey = value ? encrypt(value) : undefined;
  }

  // Instance methods
  public updateStatus(newStatus: ServiceStatus, errorMessage?: string): void {
    this.status = newStatus;
    this.lastHealthCheck = new Date();
    if (errorMessage) {
      this.lastErrorMessage = errorMessage;
    } else if (newStatus !== ServiceStatus.ERROR) {
      this.lastErrorMessage = undefined;
    }
  }

  public clearError(): void {
    this.lastErrorMessage = undefined;
  }

  public isHealthy(): boolean {
    return this.status === ServiceStatus.ACTIVE;
  }

  public needsHealthCheck(): boolean {
    if (!this.enableHealthChecks) {
      return false;
    }

    if (!this.lastHealthCheck) {
      return true;
    }

    const now = new Date();
    const timeSinceLastCheck = now.getTime() - this.lastHealthCheck.getTime();
    const intervalMs = this.healthCheckInterval * 1000;

    return timeSinceLastCheck >= intervalMs;
  }

  public getFullUrl(): string {
    if (this.baseUrl.includes('://')) {
      return this.baseUrl;
    }

    const protocol = this.useSSL ? 'https' : 'http';
    const port = this.port ? `:${this.port}` : '';
    return `${protocol}://${this.baseUrl}${port}`;
  }

  public getAuthHeaders(): any {
    const headers: any = {};

    if (this.headers) {
      Object.assign(headers, this.headers);
    }

    switch (this.authType) {
      case AuthenticationType.API_KEY:
        if (this.apiKey) {
          headers['X-Api-Key'] = this.apiKey;
        }
        break;
      case AuthenticationType.TOKEN:
        if (this.token) {
          headers['Authorization'] = `Bearer ${this.token}`;
        }
        break;
      case AuthenticationType.USERNAME_PASSWORD:
        if (this.username && this.password) {
          const credentials = Buffer.from(`${this.username}:${this.password}`).toString('base64');
          headers['Authorization'] = `Basic ${credentials}`;
        }
        break;
    }

    return headers;
  }

  public setServiceConfig(key: string, value: any): void {
    if (!this.serviceConfig) {
      this.serviceConfig = {};
    }
    this.serviceConfig[key] = value;
  }

  public getServiceConfig(key: string): any {
    return this.serviceConfig ? this.serviceConfig[key] : undefined;
  }

  public removeServiceConfig(key: string): void {
    if (this.serviceConfig) {
      delete this.serviceConfig[key];
    }
  }

  public hasTag(tag: string): boolean {
    return !!(this.tags && this.tags.includes(tag));
  }

  public addTag(tag: string): void {
    if (!this.tags) {
      this.tags = [];
    }
    if (!this.tags.includes(tag)) {
      this.tags.push(tag);
    }
  }

  public removeTag(tag: string): void {
    if (this.tags) {
      this.tags = this.tags.filter(t => t !== tag);
    }
  }

  // Factory methods for common services
  public static createProxmoxConfig(user: User, baseUrl: string, apiKey: string): ServiceConfig {
    const config = new ServiceConfig();
    config.name = 'Proxmox';
    config.serviceType = ServiceType.PROXMOX;
    config.baseUrl = baseUrl;
    config.port = 8006;
    config.authType = AuthenticationType.API_KEY;
    config.apiKey = apiKey;
    config.useSSL = true;
    config.verifySSL = true;
    config.user = user;
    return config;
  }

  public static createSonarrConfig(user: User, baseUrl: string, apiKey: string): ServiceConfig {
    const config = new ServiceConfig();
    config.name = 'Sonarr';
    config.serviceType = ServiceType.SONARR;
    config.baseUrl = baseUrl;
    config.port = 8989;
    config.authType = AuthenticationType.API_KEY;
    config.apiKey = apiKey;
    config.user = user;
    return config;
  }

  public static createRadarrConfig(user: User, baseUrl: string, apiKey: string): ServiceConfig {
    const config = new ServiceConfig();
    config.name = 'Radarr';
    config.serviceType = ServiceType.RADARR;
    config.baseUrl = baseUrl;
    config.port = 7878;
    config.authType = AuthenticationType.API_KEY;
    config.apiKey = apiKey;
    config.user = user;
    return config;
  }

  public static createDockerConfig(user: User, baseUrl: string, apiKey?: string, username?: string, password?: string): ServiceConfig {
    const config = new ServiceConfig();
    config.name = 'Docker';
    config.serviceType = ServiceType.DOCKER;
    config.baseUrl = baseUrl;
    config.port = 2376; // Default TLS port, can be overridden for non-TLS (2375)
    config.authType = apiKey ? AuthenticationType.API_KEY : (username ? AuthenticationType.USERNAME_PASSWORD : AuthenticationType.NONE);
    if (apiKey) config.apiKey = apiKey;
    if (username) config.username = username;
    if (password) config.password = password;
    config.useSSL = true; // Docker typically uses TLS
    config.verifySSL = false; // Often self-signed certificates
    config.user = user;
    return config;
  }

  public static createSabnzbdConfig(user: User, baseUrl: string, apiKey: string): ServiceConfig {
    const config = new ServiceConfig();
    config.name = 'SABnzbd';
    config.serviceType = ServiceType.SABNZBD;
    config.baseUrl = baseUrl;
    config.port = 8080;
    config.authType = AuthenticationType.API_KEY;
    config.apiKey = apiKey;
    config.user = user;
    return config;
  }
}
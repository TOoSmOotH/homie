// Service Adapter Types
// Defines the interfaces and types for the service adapter framework

import { ServiceType, AuthenticationType, ServiceStatus } from '../models/ServiceConfig';

// Base adapter configuration
export interface AdapterConfig {
  baseUrl: string;
  port?: number;
  timeout?: number;
  maxRetries?: number;
  useSSL?: boolean;
  verifySSL?: boolean;
  headers?: Record<string, string>;
  authType: AuthenticationType;
  apiKey?: string;
  username?: string;
  password?: string;
  token?: string;
  certificate?: string;
  privateKey?: string;
  serviceConfig?: Record<string, any>;
}

// Standardized response format for all adapters
export interface AdapterResponse<T = any> {
  success: boolean;
  data?: T;
  error?: AdapterError;
  metadata?: {
    responseTime?: number;
    requestId?: string;
    timestamp: string;
    serviceVersion?: string;
    endpoint?: string;
  };
}

// Error types for adapter responses
export interface AdapterError {
  code: string;
  message: string;
  details?: any;
  httpStatus?: number;
  retryable?: boolean;
  originalError?: Error;
}

// Health check response
export interface HealthCheckResult {
  status: ServiceStatus;
  responseTime?: number;
  lastCheck: Date;
  errorMessage?: string;
  version?: string;
  details?: Record<string, any>;
}

// Connection state management
export interface ConnectionState {
  isConnected: boolean;
  lastConnectionAttempt?: Date;
  connectionError?: string;
  retryCount: number;
  maxRetries: number;
}

// Base service adapter interface
export interface IServiceAdapter {
  // Core properties
  readonly serviceType: ServiceType;
  readonly config: AdapterConfig;
  connectionState: ConnectionState;

  // Core methods
  initialize(): Promise<void>;
  connect(): Promise<boolean>;
  disconnect(): Promise<void>;
  healthCheck(): Promise<HealthCheckResult>;

  // Generic API methods
  get<T = any>(endpoint: string, params?: Record<string, any>): Promise<AdapterResponse<T>>;
  post<T = any>(endpoint: string, data?: any, params?: Record<string, any>): Promise<AdapterResponse<T>>;
  put<T = any>(endpoint: string, data?: any, params?: Record<string, any>): Promise<AdapterResponse<T>>;
  patch<T = any>(endpoint: string, data?: any, params?: Record<string, any>): Promise<AdapterResponse<T>>;
  delete<T = any>(endpoint: string, params?: Record<string, any>): Promise<AdapterResponse<T>>;

  // Configuration methods
  updateConfig(newConfig: Partial<AdapterConfig>): Promise<void>;
  validateConfig(): Promise<boolean>;

  // Utility methods
  buildUrl(endpoint: string, params?: Record<string, any>): string;
  getAuthHeaders(): Record<string, string>;
  handleError(error: any, context?: string): AdapterError;
}

// Proxmox-specific types
export interface ProxmoxVM {
  vmid: number;
  name: string;
  status: 'running' | 'stopped' | 'paused';
  cpus: number;
  memory: number;
  maxmem: number;
  maxdisk: number;
  disk: number;
  uptime: number;
  template?: number;
  lock?: string;
  pid?: number;
}

export interface ProxmoxContainer {
  vmid: number;
  name: string;
  status: 'running' | 'stopped' | 'paused';
  cpus: number;
  memory: number;
  maxmem: number;
  maxdisk: number;
  disk: number;
  uptime: number;
  template?: number;
  lock?: string;
  pid?: number;
}

export interface ProxmoxNode {
  node: string;
  status: 'online' | 'offline';
  cpu: number;
  memory: number;
  maxmemory: number;
  disk: number;
  maxdisk: number;
  uptime: number;
  level?: string;
}

export interface ProxmoxStorage {
  storage: string;
  type: string;
  content: string[];
  shared: number;
  active: number;
  total: number;
  used: number;
  avail: number;
}

export interface ProxmoxClusterResource {
  id: string;
  type: string;
  status: string;
  node: string;
  vmid?: number;
  name?: string;
  cpus?: number;
  memory?: number;
  disk?: number;
}

// Docker-specific types
export interface DockerContainer {
  Id: string;
  Names: string[];
  Image: string;
  ImageID: string;
  Command: string;
  Created: number;
  Ports: Array<{
    IP?: string;
    PrivatePort: number;
    PublicPort?: number;
    Type: string;
  }>;
  Labels: Record<string, string>;
  State: string;
  Status: string;
  HostConfig: {
    NetworkMode: string;
  };
  NetworkSettings: {
    Networks: Record<string, {
      IPAddress: string;
      Gateway: string;
      MacAddress: string;
    }>;
  };
  Mounts: Array<{
    Type: string;
    Source: string;
    Destination: string;
    Mode: string;
    RW: boolean;
  }>;
}

export interface DockerImage {
  Id: string;
  ParentId: string;
  RepoTags: string[];
  RepoDigests: string[];
  Created: number;
  Size: number;
  VirtualSize: number;
  SharedSize: number;
  Labels: Record<string, string>;
  Containers: number;
}

// Sonarr-specific types
export interface SonarrSeries {
  id: number;
  title: string;
  alternateTitles: Array<{
    title: string;
    seasonNumber: number;
  }>;
  sortTitle: string;
  status: string;
  ended: boolean;
  overview: string;
  network: string;
  airTime: string;
  images: Array<{
    coverType: string;
    url: string;
  }>;
  seasons: Array<{
    seasonNumber: number;
    monitored: boolean;
    episodeCount: number;
    episodeFileCount: number;
    totalEpisodeCount: number;
  }>;
  year: number;
  path: string;
  qualityProfileId: number;
  languageProfileId: number;
  seasonFolder: boolean;
  monitored: boolean;
  useSceneNumbering: boolean;
  runtime: number;
  tvdbId: number;
  tvRageId: number;
  tvMazeId: number;
  firstAired: string;
  lastInfoSync: string;
  seriesType: string;
  cleanTitle: string;
  imdbId: string;
  titleSlug: string;
  certification: string;
  genres: string[];
  tags: number[];
  added: string;
  ratings: {
    votes: number;
    value: number;
  };
  statistics: {
    seasonCount: number;
    episodeCount: number;
    episodeFileCount: number;
    sizeOnDisk: number;
    releaseGroups: string[];
    percentOfEpisodes: number;
  };
}

// Radarr-specific types
export interface RadarrMovie {
  id: number;
  title: string;
  sortTitle: string;
  sizeOnDisk: number;
  overview: string;
  inCinemas: string;
  physicalRelease: string;
  images: Array<{
    coverType: string;
    url: string;
  }>;
  website: string;
  year: number;
  hasFile: boolean;
  youTubeTrailerId: string;
  studio: string;
  path: string;
  qualityProfileId: number;
  monitored: boolean;
  minimumAvailability: string;
  isAvailable: boolean;
  folderName: string;
  runtime: number;
  cleanTitle: string;
  imdbId: string;
  tmdbId: number;
  titleSlug: string;
  certification: string;
  genres: string[];
  tags: number[];
  added: string;
  ratings: {
    votes: number;
    value: number;
  };
  movieFile: {
    movieId: number;
    relativePath: string;
    path: string;
    size: number;
    dateAdded: string;
    indexDate: string;
    quality: {
      quality: {
        id: number;
        name: string;
      };
      revision: {
        version: number;
        real: number;
      };
    };
    mediaInfo: {
      audioBitrate: number;
      audioChannels: number;
      audioCodec: string;
      audioLanguages: string[];
      height: number;
      width: number;
      subtitles: string[];
      videoBitrate: number;
      videoCodec: string;
      videoFps: number;
      runTime: string;
      scanType: string;
    };
    qualityCutoffNotMet: boolean;
  };
  collection: {
    name: string;
    tmdbId: number;
  };
}

// Sabnzbd-specific types
export interface SabnzbdQueue {
  status: string;
  speedlimit: string;
  speed: string;
  queue_size: string;
  queue_mb: string;
  queue_mbleft: string;
  diskspace1: string;
  diskspace2: string;
  eta: string;
  timeleft: string;
  paused: boolean;
  slots: Array<{
    status: string;
    index: number;
    password: string;
    avg_age: string;
    script: string;
    nzb_name: string;
    mb: string;
    mbleft: string;
    percentage: string;
    nzo_id: string;
    timeleft: string;
    eta: string;
    category: string;
    priority: string;
  }>;
}

export interface SabnzbdHistory {
  total_size: string;
  month_size: string;
  week_size: string;
  day_size: string;
  slots: Array<{
    action_line: string;
    show_details: boolean;
    script_log: string;
    meta: string;
    fail_message: string;
    url: string;
    nzb_name: string;
    download_time: string;
    storage: string;
    path: string;
    script: string;
    nzo_id: string;
    size: string;
    category: string;
    pp: string;
    status: string;
    script_line: string;
    completed: number;
    nzb: string;
    downloaded: number;
    report: string;
    password: string;
  }>;
}

// Adapter factory types
export interface AdapterFactory {
  createAdapter(serviceType: ServiceType, config: AdapterConfig): Promise<IServiceAdapter>;
  getSupportedServices(): ServiceType[];
}

// Service discovery types
export interface ServiceDiscoveryResult {
  serviceType: ServiceType;
  detected: boolean;
  confidence: number;
  version?: string;
  endpoints?: string[];
  details?: Record<string, any>;
}

// Configuration validation types
export interface ConfigValidationResult {
  valid: boolean;
  errors: string[];
  warnings: string[];
  suggestions: string[];
}
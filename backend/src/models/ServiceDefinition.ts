import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, OneToMany } from 'typeorm';
import { Service } from './Service';

export enum ServiceDefinitionStatus {
  AVAILABLE = 'available',
  INSTALLED = 'installed',
  DEPRECATED = 'deprecated',
  COMING_SOON = 'coming_soon'
}

export enum ServiceDefinitionCategory {
  MEDIA = 'media',
  AUTOMATION = 'automation',
  MONITORING = 'monitoring',
  NETWORKING = 'networking',
  STORAGE = 'storage',
  SECURITY = 'security',
  DEVELOPMENT = 'development',
  PRODUCTIVITY = 'productivity',
  COMMUNICATION = 'communication',
  GAMING = 'gaming',
  HOME_AUTOMATION = 'home_automation',
  DATA = 'data',
  INFRASTRUCTURE = 'infrastructure',
  OTHER = 'other'
}

export interface ServiceCapability {
  id: string;
  name: string;
  description: string;
  icon?: string;
}

export interface ServiceRequirement {
  type: 'docker' | 'system' | 'port' | 'storage' | 'memory' | 'cpu';
  value: string;
  optional?: boolean;
}

export interface ServiceConfigField {
  key: string;
  label: string;
  type: 'text' | 'password' | 'number' | 'boolean' | 'select' | 'url' | 'port' | 'path' | 'multiselect';
  required?: boolean;
  default?: any;
  placeholder?: string;
  description?: string;
  validation?: {
    pattern?: string;
    min?: number;
    max?: number;
    minLength?: number;
    maxLength?: number;
  };
  min?: number;
  max?: number;
  options?: Array<{ value: string; label: string }> | 'dynamic';
  depends_on?: string; // Another field key that this depends on
  dependsOn?: string; // Alternative spelling
  show_if?: boolean | any; // Conditional display
  showIf?: { field: string; value: any }; // Alternative conditional display
  affects?: string; // What this field affects (e.g., widget visibility)
}

export interface ServiceDockerConfig {
  image: string;
  tag?: string;
  ports?: Array<{ container: number; host?: number; protocol?: 'tcp' | 'udp' }>;
  volumes?: Array<{ container: string; host?: string; mode?: 'rw' | 'ro' }>;
  environment?: Record<string, string>;
  networks?: string[];
  restart?: 'no' | 'unless-stopped' | 'always' | 'on-failure';
  command?: string[];
  labels?: Record<string, string>;
  capabilities?: string[];
  devices?: string[];
}

export interface ServiceManifest {
  id: string;
  name: string;
  displayName: string;
  version: string;
  author: string;
  description: string;
  longDescription?: string;
  icon: string;
  category: ServiceDefinitionCategory;
  tags: string[];
  homepage?: string;
  repository?: string;
  documentation?: string;
  supportUrl?: string;
  capabilities: ServiceCapability[];
  requirements: ServiceRequirement[];
  configFields: ServiceConfigField[];
  dockerConfig?: ServiceDockerConfig;
  // Connection configuration
  connection?: {
    type: string;
    auth: string;
    fields: Array<{
      key: string;
      label: string;
      type: string;
      required: boolean;
      placeholder?: string;
      description?: string;
      default?: any;
    }>;
    testEndpoint?: {
      path: string;
      method: string;
      headers?: Record<string, string>;
      expectedStatus?: number;
      successIndicator?: string;
    };
  };
  // API configuration
  api?: {
    baseUrl?: string;
    headers?: Record<string, string>;
    endpoints?: Record<string, {
      path: string;
      method?: string;
      params?: Record<string, string>;
      body?: any;
      refresh?: number;
      cache?: number;
      transform?: string;
    }>;
  };
  // Widget definitions
  widgets?: Array<{
    id: string;
    name: string;
    type: string;
    icon?: string;
    size?: string;
    dataSource: string | string[];
    display: any;
  }>;
  // Settings sections
  settings?: {
    sections: Array<{
      id: string;
      name: string;
      icon: string;
      fields: ServiceConfigField[];
    }>;
  };
  // Quick actions
  quickActions?: Array<{
    id: string;
    name: string;
    icon: string;
    action?: 'open_url' | 'api_call' | 'docker_command';
    confirm?: boolean;
    api?: {
      endpoint: string;
      method?: string;
      body?: any;
    };
    config?: any;
  }>;
  // Data transformers
  transformers?: Record<string, string>;
  apiIntegration?: {
    baseUrlPattern: string; // e.g., "http://{host}:{port}"
    apiKeyField?: string;
    authType: 'none' | 'apikey' | 'basic' | 'oauth2' | 'custom';
    healthCheckEndpoint?: string;
    testEndpoint?: string;
  };
  screenshots?: string[];
  defaultConfig?: Record<string, any>;
  setupSteps?: string[];
}

@Entity('service_definitions')
export class ServiceDefinition {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'varchar', length: 100, unique: true })
  serviceId!: string; // Unique identifier for the service type (e.g., 'plex', 'jellyfin')

  @Column({ type: 'varchar', length: 255 })
  name!: string;

  @Column({ type: 'varchar', length: 255 })
  displayName!: string;

  @Column({ type: 'varchar', length: 50 })
  version!: string;

  @Column({ type: 'varchar', length: 255 })
  author!: string;

  @Column({ type: 'text' })
  description!: string;

  @Column({ type: 'text', nullable: true })
  longDescription?: string;

  @Column({ type: 'varchar', length: 500 })
  icon!: string;

  @Column({ 
    type: 'varchar', 
    length: 50,
    enum: ServiceDefinitionCategory,
    default: ServiceDefinitionCategory.OTHER
  })
  category!: ServiceDefinitionCategory;

  @Column({ type: 'json' })
  tags!: string[];

  @Column({ type: 'varchar', length: 500, nullable: true })
  homepage?: string;

  @Column({ type: 'varchar', length: 500, nullable: true })
  repository?: string;

  @Column({ type: 'varchar', length: 500, nullable: true })
  documentation?: string;

  @Column({ type: 'json' })
  manifest!: ServiceManifest;

  @Column({ 
    type: 'varchar', 
    length: 20,
    enum: ServiceDefinitionStatus,
    default: ServiceDefinitionStatus.AVAILABLE
  })
  status!: ServiceDefinitionStatus;

  @Column({ type: 'integer', default: 0 })
  installCount!: number;

  @Column({ type: 'float', nullable: true })
  rating?: number;

  @Column({ type: 'integer', default: 0 })
  reviewCount!: number;

  @Column({ type: 'boolean', default: false })
  featured!: boolean;

  @Column({ type: 'boolean', default: false })
  official!: boolean; // Official/verified services

  @OneToMany(() => Service, service => service.definition)
  instances?: Service[];

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;
}
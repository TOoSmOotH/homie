import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne } from 'typeorm';
import { User } from './User';
import { ServiceDefinition } from './ServiceDefinition';

export enum ServiceStatus {
  ONLINE = 'online',
  OFFLINE = 'offline',
  UNKNOWN = 'unknown',
  STARTING = 'starting',
  STOPPING = 'stopping',
  ERROR = 'error'
}

@Entity('services')
export class Service {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'varchar', length: 255 })
  name!: string; // User-given name for this instance (e.g., "My Plex Server")

  @ManyToOne(() => ServiceDefinition, definition => definition.instances)
  definition!: ServiceDefinition; // Links to the service type (Plex, Jellyfin, etc.)

  @Column({ type: 'varchar', length: 500, nullable: true })
  url?: string; // The actual URL to access this service instance

  @Column({ 
    type: 'varchar', 
    length: 20,
    enum: ServiceStatus,
    default: ServiceStatus.UNKNOWN
  })
  status!: ServiceStatus;

  @Column({ type: 'text', nullable: true })
  description?: string; // User's custom description for this instance

  @Column({ type: 'json', nullable: true })
  config?: any; // Instance-specific configuration (ports, paths, credentials, etc.)

  @Column({ type: 'json', nullable: true })
  dockerInfo?: {
    containerId?: string;
    containerName?: string;
    imageName?: string;
    imageTag?: string;
    ports?: Record<string, string>;
    networks?: string[];
    state?: string;
  };

  @Column({ type: 'datetime', nullable: true })
  lastChecked?: Date;

  @Column({ type: 'json', nullable: true })
  metrics?: {
    uptime?: number;
    responseTime?: number;
    cpuUsage?: number;
    memoryUsage?: number;
    diskUsage?: number;
  };

  @Column({ type: 'boolean', default: true })
  enabled!: boolean; // Whether this service instance is enabled

  @Column({ type: 'boolean', default: false })
  autoStart!: boolean; // Auto-start on system boot

  @ManyToOne(() => User, { nullable: true })
  user?: User;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;
}
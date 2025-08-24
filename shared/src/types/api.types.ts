export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
  timestamp?: string;
}

export interface ServiceStatus {
  service: string;
  status: 'online' | 'offline' | 'error' | 'unknown';
  lastSeen: Date;
  details?: any;
  responseTime?: number;
}

export interface VMInfo {
  id: string;
  name: string;
  status: 'running' | 'stopped' | 'paused' | 'error';
  cpuUsage: number;
  memoryUsage: number;
  maxMemory: number;
  uptime: number;
  node?: string;
}

export interface ContainerInfo {
  id: string;
  name: string;
  image: string;
  status: 'running' | 'stopped' | 'paused' | 'error';
  ports: string[];
  created: Date;
  labels?: Record<string, string>;
}

export interface ServiceConfig {
  id: string;
  serviceType: 'proxmox' | 'docker' | 'sonarr' | 'radarr' | 'sabnzbd';
  name: string;
  host: string;
  port?: number;
  apiKey?: string;
  username?: string;
  password?: string;
  isEnabled: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface User {
  id: string;
  username: string;
  role: 'admin' | 'user';
  createdAt: Date;
  lastLogin?: Date;
}

export interface LoginRequest {
  username: string;
  password: string;
}

export interface LoginResponse {
  token: string;
  user: User;
  expiresIn: number;
}

export interface DashboardMetrics {
  totalVMs: number;
  runningVMs: number;
  totalContainers: number;
  runningContainers: number;
  servicesOnline: number;
  totalServices: number;
  systemLoad: number;
  memoryUsage: number;
}
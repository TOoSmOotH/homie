import { BaseServiceAdapter } from './BaseServiceAdapter';
import {
  AdapterConfig,
  AdapterResponse,
  HealthCheckResult,
  DockerContainer,
  DockerImage
} from '../../types/adapter.types';
import { ServiceType, ServiceStatus } from '../../models/ServiceConfig';
import { logger } from '../../utils/logger';

// Docker-specific configuration
interface DockerConfig extends AdapterConfig {
  socketPath?: string; // Unix socket path for Docker daemon
  tlsVerify?: boolean; // Whether to verify TLS certificates
  certPath?: string; // Path to TLS certificates
  dockerVersion?: string; // Docker API version to use
}

// Docker API response structure
interface DockerApiResponse<T = any> {
  data?: T;
  error?: {
    message: string;
    code?: number;
  };
}

// Docker container create/update options
interface DockerContainerCreateOptions {
  Image: string;
  name?: string;
  Env?: string[];
  Cmd?: string[];
  Entrypoint?: string[];
  WorkingDir?: string;
  User?: string;
  Labels?: Record<string, string>;
  ExposedPorts?: Record<string, any>;
  HostConfig?: {
    PortBindings?: Record<string, Array<{ HostPort: string }>>;
    Binds?: string[];
    Mounts?: Array<{
      Type: string;
      Source: string;
      Target: string;
      ReadOnly?: boolean;
    }>;
    RestartPolicy?: {
      Name: string;
      MaximumRetryCount?: number;
    };
    NetworkMode?: string;
    Memory?: number;
    CpuQuota?: number;
    CpuPeriod?: number;
  };
  NetworkingConfig?: {
    EndpointsConfig?: Record<string, {
      IPAMConfig?: {
        IPv4Address?: string;
        IPv6Address?: string;
      };
      Aliases?: string[];
    }>;
  };
}

export class DockerAdapter extends BaseServiceAdapter {
  readonly serviceType = ServiceType.DOCKER;
  private dockerVersion: string;

  constructor(config: DockerConfig) {
    super(ServiceType.DOCKER, config);
    this.dockerVersion = config.dockerVersion || 'v1.43';
  }

  // Get Docker-specific configuration
  private get dockerConfig(): DockerConfig {
    return this._config as DockerConfig;
  }

  // Override to add Docker-specific headers
  protected getServiceSpecificHeaders(): Record<string, string> {
    const headers: Record<string, string> = {};

    // Docker API doesn't typically require special headers beyond auth
    // But we can add version header if needed
    headers['Accept'] = 'application/json';

    return headers;
  }

  // Build Docker API URL with version
  private buildDockerUrl(endpoint: string): string {
    const protocol = this._config.useSSL ? 'https' : 'http';
    const port = this._config.port ? `:${this._config.port}` : '';
    const baseUrl = `${protocol}://${this._config.baseUrl}${port}`;
    const versionedEndpoint = endpoint.startsWith('/') ? `/${this.dockerVersion}${endpoint}` : `/${this.dockerVersion}/${endpoint}`;
    return `${baseUrl}${versionedEndpoint}`;
  }

  // Docker-specific request method
  private async makeDockerRequest<T>(
    method: string,
    endpoint: string,
    data?: any,
    params?: Record<string, any>
  ): Promise<AdapterResponse<T>> {
    const startTime = Date.now();
    const requestId = `${this._serviceType}_${startTime}_${Math.random().toString(36).substr(2, 9)}`;

    try {
      if (!this.initialized) {
        await this.initialize();
      }

      if (!this._connectionState.isConnected) {
        await this.connect();
      }

      logger.debug(`Making Docker ${method} request to ${endpoint}`, {
        endpoint,
        requestId,
        hasData: !!data,
        hasParams: !!params
      });

      const dockerUrl = this.buildDockerUrl(endpoint);
      const response = await this.httpClient.request<T>({
        method: method as any,
        url: dockerUrl,
        data,
        params
      });

      const responseTime = Date.now() - startTime;

      logger.debug(`Docker ${method} request successful`, {
        endpoint,
        requestId,
        responseTime,
        status: response.status
      });

      return {
        success: true,
        data: response.data,
        metadata: {
          responseTime,
          requestId,
          timestamp: new Date().toISOString(),
          endpoint
        }
      };
    } catch (error) {
      const responseTime = Date.now() - startTime;
      const adapterError = this.handleError(error, `${method}_${endpoint}`);

      logger.error(`Docker ${method} request failed`, {
        endpoint,
        requestId,
        responseTime,
        error: adapterError
      });

      return {
        success: false,
        error: adapterError,
        metadata: {
          responseTime,
          requestId,
          timestamp: new Date().toISOString(),
          endpoint
        }
      };
    }
  }

  // Docker-specific configuration validation
  protected async validateServiceSpecificConfig(errors: string[]): Promise<void> {
    // Docker typically uses socket connection or localhost with port 2376 (TLS) or 2375 (no TLS)
    if (!this._config.port) {
      logger.warn('Docker port not specified, using default 2376 for TLS or 2375 for no TLS');
    } else if (this._config.port !== 2376 && this._config.port !== 2375) {
      logger.warn(`Non-standard Docker port ${this._config.port} specified`);
    }

    // If using socket path, validate it exists
    if (this.dockerConfig.socketPath) {
      // Note: In a real implementation, you might want to validate socket path exists
      logger.info(`Using Docker socket at ${this.dockerConfig.socketPath}`);
    }
  }

  // Health check implementation
  async healthCheck(): Promise<HealthCheckResult> {
    const startTime = Date.now();

    try {
      // Try to get Docker version as a health check
      const response = await this.get('/version');

      if (response.success) {
        return {
          status: ServiceStatus.ACTIVE,
          responseTime: Date.now() - startTime,
          lastCheck: new Date(),
          version: this.extractVersionFromResponse(response),
          details: {
            dockerVersion: (response.data as any)?.Version,
            apiVersion: (response.data as any)?.ApiVersion
          }
        };
      } else {
        return {
          status: ServiceStatus.ERROR,
          responseTime: Date.now() - startTime,
          lastCheck: new Date(),
          errorMessage: response.error?.message || 'Health check failed'
        };
      }
    } catch (error) {
      return {
        status: ServiceStatus.ERROR,
        responseTime: Date.now() - startTime,
        lastCheck: new Date(),
        errorMessage: this.handleError(error, 'health_check').message
      };
    }
  }

  // Extract version from API response
  private extractVersionFromResponse(response: AdapterResponse): string | undefined {
    try {
      if (response.data && typeof response.data === 'object') {
        const data = response.data as any;
        return data.Version || data.version || undefined;
      }
    } catch (error) {
      logger.debug('Could not extract version from response', { error });
    }
    return undefined;
  }

  // Get Docker version
  async getVersion(): Promise<AdapterResponse<any>> {
    return this.makeDockerRequest('GET', '/version');
  }

  // Get Docker info
  async getInfo(): Promise<AdapterResponse<any>> {
    return this.makeDockerRequest('GET', '/info');
  }

  // List containers
  async listContainers(all: boolean = false, filters?: Record<string, string[]>): Promise<AdapterResponse<DockerContainer[]>> {
    const params: Record<string, any> = { all };
    if (filters) {
      params.filters = JSON.stringify(filters);
    }
    return this.makeDockerRequest<DockerContainer[]>('GET', '/containers/json', undefined, params);
  }

  // Get container by ID
  async getContainer(id: string): Promise<AdapterResponse<DockerContainer>> {
    return this.makeDockerRequest<DockerContainer>('GET', `/containers/${id}/json`);
  }

  // Create container
  async createContainer(options: DockerContainerCreateOptions): Promise<AdapterResponse<{ Id: string; Warnings: string[] }>> {
    return this.makeDockerRequest<{ Id: string; Warnings: string[] }>('POST', '/containers/create', options);
  }

  // Start container
  async startContainer(id: string): Promise<AdapterResponse<void>> {
    return this.makeDockerRequest<void>('POST', `/containers/${id}/start`);
  }

  // Stop container
  async stopContainer(id: string, timeout?: number): Promise<AdapterResponse<void>> {
    const params = timeout ? { t: timeout } : undefined;
    return this.makeDockerRequest<void>('POST', `/containers/${id}/stop`, undefined, params);
  }

  // Restart container
  async restartContainer(id: string, timeout?: number): Promise<AdapterResponse<void>> {
    const params = timeout ? { t: timeout } : undefined;
    return this.makeDockerRequest<void>('POST', `/containers/${id}/restart`, undefined, params);
  }

  // Pause container
  async pauseContainer(id: string): Promise<AdapterResponse<void>> {
    return this.makeDockerRequest<void>('POST', `/containers/${id}/pause`);
  }

  // Unpause container
  async unpauseContainer(id: string): Promise<AdapterResponse<void>> {
    return this.makeDockerRequest<void>('POST', `/containers/${id}/unpause`);
  }

  // Kill container
  async killContainer(id: string, signal?: string): Promise<AdapterResponse<void>> {
    const params = signal ? { signal } : undefined;
    return this.makeDockerRequest<void>('POST', `/containers/${id}/kill`, undefined, params);
  }

  // Remove container
  async removeContainer(id: string, force?: boolean, removeVolumes?: boolean): Promise<AdapterResponse<void>> {
    const params: Record<string, any> = {};
    if (force) params.force = true;
    if (removeVolumes) params.v = true;
    return this.makeDockerRequest<void>('DELETE', `/containers/${id}`, undefined, params);
  }

  // Get container logs
  async getContainerLogs(id: string, options?: {
    stdout?: boolean;
    stderr?: boolean;
    since?: number;
    until?: number;
    timestamps?: boolean;
    follow?: boolean;
    tail?: string;
  }): Promise<AdapterResponse<string>> {
    const params: Record<string, any> = {};
    if (options) {
      Object.assign(params, options);
    }
    return this.makeDockerRequest<string>('GET', `/containers/${id}/logs`, undefined, params);
  }

  // Get container stats
  async getContainerStats(id: string): Promise<AdapterResponse<any>> {
    return this.makeDockerRequest<any>('GET', `/containers/${id}/stats`);
  }

  // List images
  async listImages(all: boolean = false, filters?: Record<string, string[]>): Promise<AdapterResponse<DockerImage[]>> {
    const params: Record<string, any> = { all };
    if (filters) {
      params.filters = JSON.stringify(filters);
    }
    return this.makeDockerRequest<DockerImage[]>('GET', '/images/json', undefined, params);
  }

  // Get image by ID
  async getImage(id: string): Promise<AdapterResponse<DockerImage>> {
    return this.makeDockerRequest<DockerImage>('GET', `/images/${id}/json`);
  }

  // Pull image
  async pullImage(fromImage: string, tag?: string): Promise<AdapterResponse<string>> {
    const params: Record<string, any> = { fromImage };
    if (tag) params.tag = tag;
    return this.makeDockerRequest<string>('POST', '/images/create', undefined, params);
  }

  // Remove image
  async removeImage(id: string, force?: boolean, noprune?: boolean): Promise<AdapterResponse<any[]>> {
    const params: Record<string, any> = {};
    if (force) params.force = true;
    if (noprune) params.noprune = true;
    return this.makeDockerRequest<any[]>('DELETE', `/images/${id}`, undefined, params);
  }

  // Prune unused images
  async pruneImages(filters?: Record<string, string[]>): Promise<AdapterResponse<any>> {
    const params = filters ? { filters: JSON.stringify(filters) } : undefined;
    return this.makeDockerRequest<any>('POST', '/images/prune', undefined, params);
  }

  // Get Docker events
  async getEvents(since?: number, until?: number, filters?: Record<string, string[]>): Promise<AdapterResponse<any[]>> {
    const params: Record<string, any> = {};
    if (since) params.since = since;
    if (until) params.until = until;
    if (filters) params.filters = JSON.stringify(filters);
    return this.makeDockerRequest<any[]>('GET', '/events', undefined, params);
  }

  // Execute command in container
  async execInContainer(containerId: string, options: {
    AttachStdin?: boolean;
    AttachStdout?: boolean;
    AttachStderr?: boolean;
    DetachKeys?: string;
    Tty?: boolean;
    Env?: string[];
    Cmd: string[];
    WorkingDir?: string;
    User?: string;
  }): Promise<AdapterResponse<{ Id: string }>> {
    return this.makeDockerRequest<{ Id: string }>('POST', `/containers/${containerId}/exec`, options);
  }

  // Start exec instance
  async startExec(execId: string, options?: {
    Detach?: boolean;
    Tty?: boolean;
  }): Promise<AdapterResponse<string>> {
    return this.makeDockerRequest<string>('POST', `/exec/${execId}/start`, options);
  }

  // Inspect exec instance
  async inspectExec(execId: string): Promise<AdapterResponse<any>> {
    return this.makeDockerRequest<any>('GET', `/exec/${execId}/json`);
  }

  // Override error handling for Docker-specific error codes
  handleError(error: any, context?: string): import('../../types/adapter.types').AdapterError {
    const baseError = super.handleError(error, context);

    // Docker-specific error handling
    if (error.response?.status === 404) {
      baseError.code = 'DOCKER_NOT_FOUND';
      baseError.message = 'Resource not found';
      baseError.retryable = false;
    } else if (error.response?.status === 409) {
      baseError.code = 'DOCKER_CONFLICT';
      baseError.message = 'Resource conflict';
      baseError.retryable = false;
    } else if (error.response?.status === 500) {
      baseError.code = 'DOCKER_SERVER_ERROR';
      baseError.message = 'Docker daemon error';
      baseError.retryable = true;
    }

    return baseError;
  }
}
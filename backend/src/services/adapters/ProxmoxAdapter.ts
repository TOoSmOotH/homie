import { BaseServiceAdapter } from './BaseServiceAdapter';
import {
  AdapterConfig,
  AdapterResponse,
  HealthCheckResult,
  ProxmoxVM,
  ProxmoxContainer,
  ProxmoxNode,
  ProxmoxStorage,
  ProxmoxClusterResource
} from '../../types/adapter.types';
import { ServiceType, ServiceStatus } from '../../models/ServiceConfig';
import { logger } from '../../utils/logger';

// Proxmox-specific configuration
interface ProxmoxConfig extends AdapterConfig {
  node?: string; // Default node to use for operations
  realm?: string; // Authentication realm (default: 'pam')
  verifySSL?: boolean; // Whether to verify SSL certificates
  csrfPreventionToken?: string; // CSRF token for POST/PUT/DELETE operations
}

// Proxmox API response structure
interface ProxmoxApiResponse<T = any> {
  data: T;
  success?: boolean;
  message?: string;
  errors?: Record<string, string>;
}

// Proxmox authentication response
interface ProxmoxAuthResponse {
  data: {
    ticket: string;
    CSRFPreventionToken: string;
    username: string;
    cap: Record<string, any>;
  };
  success: boolean;
}

// Proxmox VM/Container configuration
interface ProxmoxVmConfig {
  vmid: number;
  name?: string;
  cores?: number;
  memory?: number;
  net?: Record<string, any>;
  disk?: Record<string, any>;
  template?: number;
  tags?: string;
  description?: string;
  [key: string]: any;
}

export class ProxmoxAdapter extends BaseServiceAdapter {
  readonly serviceType = ServiceType.PROXMOX;
  private ticket?: string;
  private csrfToken?: string;
  private authTimestamp?: number;
  private readonly TICKET_LIFETIME = 7200000; // 2 hours in milliseconds

  constructor(config: ProxmoxConfig) {
    super(ServiceType.PROXMOX, config);
    this._config = { ...config };
  }

  // Get Proxmox-specific configuration
  private get proxmoxConfig(): ProxmoxConfig {
    return this._config as ProxmoxConfig;
  }

  // Override to add Proxmox-specific headers
  protected getServiceSpecificHeaders(): Record<string, string> {
    const headers: Record<string, string> = {};

    if (this.ticket) {
      headers['Cookie'] = `PVEAuthCookie=${this.ticket}`;
    }

    if (this.csrfToken) {
      headers['CSRFPreventionToken'] = this.csrfToken;
    }

    // Proxmox API requires specific Accept header for some endpoints
    headers['Accept'] = 'application/json';

    return headers;
  }

  // Override connection to handle Proxmox ticket-based authentication
  async connect(): Promise<boolean> {
    try {
      // Check if we need to re-authenticate
      if (!this.isTicketValid()) {
        await this.authenticate();
      }

      return await super.connect();
    } catch (error) {
      logger.error('Proxmox authentication failed', {
        error: this.handleError(error, 'authentication')
      });
      return false;
    }
  }

  // Proxmox-specific authentication
  private async authenticate(): Promise<void> {
    try {
      logger.info('Authenticating with Proxmox API');

      const authData = {
        username: this._config.username,
        password: this._config.password,
        realm: this.proxmoxConfig.realm || 'pam'
      };

      const response = await this.httpClient.post<ProxmoxAuthResponse>('/access/ticket', authData);

      if (response.data.success && response.data.data) {
        this.ticket = response.data.data.ticket;
        this.csrfToken = response.data.data.CSRFPreventionToken;
        this.authTimestamp = Date.now();

        logger.info('Successfully authenticated with Proxmox API');
      } else {
        throw new Error('Authentication failed: Invalid response from Proxmox API');
      }
    } catch (error) {
      logger.error('Proxmox authentication error', {
        error: this.handleError(error, 'authentication')
      });
      throw error;
    }
  }

  // Check if current ticket is still valid
  private isTicketValid(): boolean {
    if (!this.ticket || !this.authTimestamp) {
      return false;
    }

    const timeSinceAuth = Date.now() - this.authTimestamp;
    return timeSinceAuth < this.TICKET_LIFETIME;
  }

  // Proxmox-specific configuration validation
  protected async validateServiceSpecificConfig(errors: string[]): Promise<void> {
    if (!this._config.username) {
      errors.push('Username is required for Proxmox authentication');
    }

    if (!this._config.password) {
      errors.push('Password is required for Proxmox authentication');
    }

    // Proxmox typically uses port 8006
    if (!this._config.port) {
      logger.warn('Proxmox port not specified, using default 8006');
    } else if (this._config.port !== 8006) {
      logger.warn(`Non-standard Proxmox port ${this._config.port} specified`);
    }
  }

  // Health check implementation
  async healthCheck(): Promise<HealthCheckResult> {
    const startTime = Date.now();

    try {
      // Try to get cluster resources as a health check
      const response = await this.get('/cluster/resources');

      if (response.success) {
        return {
          status: ServiceStatus.ACTIVE,
          responseTime: Date.now() - startTime,
          lastCheck: new Date(),
          version: this.extractVersionFromResponse(response),
          details: {
            resourceCount: Array.isArray(response.data) ? response.data.length : 0
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
      // Try to extract version from response metadata or data
      if (response.metadata?.serviceVersion) {
        return response.metadata.serviceVersion;
      }

      // Look for version in response data
      if (response.data && typeof response.data === 'object') {
        const data = response.data as any;
        return data.version || data['pve-version'] || undefined;
      }
    } catch (error) {
      logger.debug('Could not extract version from response', { error });
    }
    return undefined;
  }

  // Get list of nodes
  async getNodes(): Promise<AdapterResponse<ProxmoxNode[]>> {
    return this.get<ProxmoxNode[]>('/nodes');
  }

  // Get specific node information
  async getNode(node: string): Promise<AdapterResponse<ProxmoxNode>> {
    return this.get<ProxmoxNode>(`/nodes/${node}`);
  }

  // Get VMs on a specific node
  async getNodeVMs(node: string): Promise<AdapterResponse<ProxmoxVM[]>> {
    return this.get<ProxmoxVM[]>(`/nodes/${node}/qemu`);
  }

  // Get specific VM information
  async getVM(node: string, vmid: number): Promise<AdapterResponse<ProxmoxVM>> {
    return this.get<ProxmoxVM>(`/nodes/${node}/qemu/${vmid}`);
  }

  // Get VM configuration
  async getVMConfig(node: string, vmid: number): Promise<AdapterResponse<ProxmoxVmConfig>> {
    return this.get<ProxmoxVmConfig>(`/nodes/${node}/qemu/${vmid}/config`);
  }

  // Start a VM
  async startVM(node: string, vmid: number): Promise<AdapterResponse<void>> {
    return this.post<void>(`/nodes/${node}/qemu/${vmid}/status/start`);
  }

  // Stop a VM
  async stopVM(node: string, vmid: number): Promise<AdapterResponse<void>> {
    return this.post<void>(`/nodes/${node}/qemu/${vmid}/status/stop`);
  }

  // Restart a VM
  async restartVM(node: string, vmid: number): Promise<AdapterResponse<void>> {
    return this.post<void>(`/nodes/${node}/qemu/${vmid}/status/reboot`);
  }

  // Pause a VM
  async pauseVM(node: string, vmid: number): Promise<AdapterResponse<void>> {
    return this.post<void>(`/nodes/${node}/qemu/${vmid}/status/suspend`);
  }

  // Resume a VM
  async resumeVM(node: string, vmid: number): Promise<AdapterResponse<void>> {
    return this.post<void>(`/nodes/${node}/qemu/${vmid}/status/resume`);
  }

  // Create a new VM
  async createVM(node: string, config: Partial<ProxmoxVmConfig>): Promise<AdapterResponse<{ vmid: number }>> {
    return this.post<{ vmid: number }>(`/nodes/${node}/qemu`, config);
  }

  // Update VM configuration
  async updateVM(node: string, vmid: number, config: Partial<ProxmoxVmConfig>): Promise<AdapterResponse<void>> {
    return this.put<void>(`/nodes/${node}/qemu/${vmid}/config`, config);
  }

  // Delete a VM
  async deleteVM(node: string, vmid: number, purge?: boolean): Promise<AdapterResponse<void>> {
    const params = purge ? { purge: '1' } : undefined;
    return this.delete<void>(`/nodes/${node}/qemu/${vmid}`, params);
  }

  // Get containers on a specific node
  async getNodeContainers(node: string): Promise<AdapterResponse<ProxmoxContainer[]>> {
    return this.get<ProxmoxContainer[]>(`/nodes/${node}/lxc`);
  }

  // Get specific container information
  async getContainer(node: string, vmid: number): Promise<AdapterResponse<ProxmoxContainer>> {
    return this.get<ProxmoxContainer>(`/nodes/${node}/lxc/${vmid}`);
  }

  // Get container configuration
  async getContainerConfig(node: string, vmid: number): Promise<AdapterResponse<ProxmoxVmConfig>> {
    return this.get<ProxmoxVmConfig>(`/nodes/${node}/lxc/${vmid}/config`);
  }

  // Start a container
  async startContainer(node: string, vmid: number): Promise<AdapterResponse<void>> {
    return this.post<void>(`/nodes/${node}/lxc/${vmid}/status/start`);
  }

  // Stop a container
  async stopContainer(node: string, vmid: number): Promise<AdapterResponse<void>> {
    return this.post<void>(`/nodes/${node}/lxc/${vmid}/status/stop`);
  }

  // Restart a container
  async restartContainer(node: string, vmid: number): Promise<AdapterResponse<void>> {
    return this.post<void>(`/nodes/${node}/lxc/${vmid}/status/reboot`);
  }

  // Get cluster resources
  async getClusterResources(): Promise<AdapterResponse<ProxmoxClusterResource[]>> {
    return this.get<ProxmoxClusterResource[]>('/cluster/resources');
  }

  // Get storage information
  async getStorages(node?: string): Promise<AdapterResponse<ProxmoxStorage[]>> {
    const endpoint = node ? `/nodes/${node}/storage` : '/storage';
    return this.get<ProxmoxStorage[]>(endpoint);
  }

  // Get specific storage information
  async getStorage(storageId: string): Promise<AdapterResponse<ProxmoxStorage>> {
    return this.get<ProxmoxStorage>(`/storage/${storageId}`);
  }

  // Get storage content
  async getStorageContent(storageId: string, content?: string): Promise<AdapterResponse<any[]>> {
    const params = content ? { content } : undefined;
    return this.get<any[]>(`/storage/${storageId}/content`, params);
  }

  // Get node logs
  async getNodeLogs(node: string, lines?: number, since?: number): Promise<AdapterResponse<any[]>> {
    const params: Record<string, any> = {};
    if (lines) params.lines = lines;
    if (since) params.since = since;
    return this.get<any[]>(`/nodes/${node}/syslog`, params);
  }

  // Get node tasks
  async getNodeTasks(node: string, vmid?: number): Promise<AdapterResponse<any[]>> {
    const params = vmid ? { vmid } : undefined;
    return this.get<any[]>(`/nodes/${node}/tasks`, params);
  }

  // Get task status
  async getTaskStatus(node: string, taskId: string): Promise<AdapterResponse<any>> {
    return this.get<any>(`/nodes/${node}/tasks/${taskId}/status`);
  }

  // Get task log
  async getTaskLog(node: string, taskId: string, start?: number, limit?: number): Promise<AdapterResponse<any[]>> {
    const params: Record<string, any> = {};
    if (start !== undefined) params.start = start;
    if (limit !== undefined) params.limit = limit;
    return this.get<any[]>(`/nodes/${node}/tasks/${taskId}/log`, params);
  }

  // Get API version
  async getVersion(): Promise<AdapterResponse<{ version: string; release: string; repoid: string }>> {
    return this.get<{ version: string; release: string; repoid: string }>('/version');
  }

  // Override error handling for Proxmox-specific error codes
  handleError(error: any, context?: string): import('../../types/adapter.types').AdapterError {
    const baseError = super.handleError(error, context);

    // Proxmox-specific error handling
    if (error.response?.status === 401) {
      // Authentication error - clear ticket
      this.ticket = undefined;
      this.csrfToken = undefined;
      this.authTimestamp = undefined;
      baseError.code = 'PROXMOX_AUTH_FAILED';
      baseError.message = 'Authentication failed - please check credentials';
      baseError.retryable = false;
    } else if (error.response?.status === 403) {
      baseError.code = 'PROXMOX_INSUFFICIENT_PRIVILEGES';
      baseError.message = 'Insufficient privileges for this operation';
      baseError.retryable = false;
    } else if (error.response?.status === 500) {
      baseError.code = 'PROXMOX_SERVER_ERROR';
      baseError.message = 'Proxmox server error';
      baseError.retryable = true;
    }

    return baseError;
  }
}
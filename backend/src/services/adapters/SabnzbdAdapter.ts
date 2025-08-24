import { BaseServiceAdapter } from './BaseServiceAdapter';
import {
  AdapterConfig,
  AdapterResponse,
  HealthCheckResult,
  SabnzbdQueue,
  SabnzbdHistory
} from '../../types/adapter.types';
import { ServiceType, ServiceStatus } from '../../models/ServiceConfig';
import { logger } from '../../utils/logger';

// Sabnzbd-specific configuration
interface SabnzbdConfig extends AdapterConfig {
  apikey?: string; // SABnzbd uses 'apikey' parameter instead of header
  nzbkey?: string; // NZB key for uploads
  username?: string; // Optional username for HTTP auth
  password?: string; // Optional password for HTTP auth
}

// SABnzbd API response structure
interface SabnzbdApiResponse<T = any> {
  status: boolean;
  error?: string;
  data?: T;
}

// SABnzbd queue item
interface SabnzbdQueueItem {
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
  filename?: string;
  unpackopts?: string;
  msgid?: string;
  verbosity?: string;
  size: string;
  sizeleft: string;
  download_time?: string;
  complete_time?: string;
}

// SABnzbd history item
interface SabnzbdHistoryItem {
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
}

// SABnzbd category
interface SabnzbdCategory {
  name: string;
  dir: string;
  priority: number;
  script: string;
  pp: string;
}

// SABnzbd server
interface SabnzbdServer {
  host: string;
  port: number;
  username?: string;
  priority: number;
  ssl: boolean;
  retention: number;
  connections: number;
  displayname: string;
  categories: string[];
}

// SABnzbd warning
interface SabnzbdWarning {
  text: string;
  type: string;
  time: number;
}

export class SabnzbdAdapter extends BaseServiceAdapter {
  readonly serviceType = ServiceType.SABNZBD;

  constructor(config: SabnzbdConfig) {
    super(ServiceType.SABNZBD, config);
  }

  // Get Sabnzbd-specific configuration
  private get sabnzbdConfig(): SabnzbdConfig {
    return this._config as SabnzbdConfig;
  }

  // Override to add Sabnzbd-specific headers and query parameters
  protected getServiceSpecificHeaders(): Record<string, string> {
    const headers: Record<string, string> = {};

    // SABnzbd typically doesn't require special headers
    headers['Accept'] = 'application/json';

    return headers;
  }

  // Override buildUrl to include SABnzbd-specific parameters
  buildUrl(endpoint: string, params?: Record<string, any>): string {
    const baseParams: Record<string, any> = { ...params };

    // Add API key if configured
    if (this.sabnzbdConfig.apikey) {
      baseParams.apikey = this.sabnzbdConfig.apikey;
    }

    // Add output format
    baseParams.output = 'json';

    return super.buildUrl(endpoint, baseParams);
  }

  // Sabnzbd-specific configuration validation
  protected async validateServiceSpecificConfig(errors: string[]): Promise<void> {
    if (!this.sabnzbdConfig.apikey) {
      errors.push('API key is required for SABnzbd authentication');
    }

    // SABnzbd typically uses port 8080
    if (!this._config.port) {
      logger.warn('SABnzbd port not specified, using default 8080');
    } else if (this._config.port !== 8080) {
      logger.warn(`Non-standard SABnzbd port ${this._config.port} specified`);
    }
  }

  // Health check implementation
  async healthCheck(): Promise<HealthCheckResult> {
    const startTime = Date.now();

    try {
      // Try to get queue status as a health check
      const response = await this.get<SabnzbdQueue>('/queue');

      if (response.success) {
        return {
          status: ServiceStatus.ACTIVE,
          responseTime: Date.now() - startTime,
          lastCheck: new Date(),
          version: this.extractVersionFromResponse(response),
          details: {
            queueSize: (response.data as any)?.queue?.noofslots || 0,
            speed: (response.data as any)?.queue?.speed || '0'
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
        return data.version || undefined;
      }
    } catch (error) {
      logger.debug('Could not extract version from response', { error });
    }
    return undefined;
  }

  // Get queue status
  async getQueue(): Promise<AdapterResponse<SabnzbdQueue>> {
    return this.get<SabnzbdQueue>('/queue');
  }

  // Get queue with specific parameters
  async getQueueDetails(start?: number, limit?: number, search?: string): Promise<AdapterResponse<SabnzbdQueue>> {
    const params: Record<string, any> = {};
    if (start !== undefined) params.start = start;
    if (limit !== undefined) params.limit = limit;
    if (search) params.search = search;
    return this.get<SabnzbdQueue>('/queue', params);
  }

  // Add NZB by URL
  async addNzbByUrl(url: string, category?: string, priority?: number, name?: string, nzbname?: string, password?: string): Promise<AdapterResponse<{ status: boolean; nzo_ids: string[] }>> {
    const params: Record<string, any> = { name: url };
    if (category) params.cat = category;
    if (priority !== undefined) params.priority = priority;
    if (name) params.nzbname = name;
    if (nzbname) params.nzbname = nzbname;
    if (password) params.password = password;

    return this.get<{ status: boolean; nzo_ids: string[] }>('/addurl', params);
  }

  // Add NZB file (this would typically be a file upload, but we'll provide the interface)
  async addNzbFile(filename: string, content: string, category?: string, priority?: number, name?: string, password?: string): Promise<AdapterResponse<{ status: boolean; nzo_ids: string[] }>> {
    const params: Record<string, any> = { name: filename, file: content };
    if (category) params.cat = category;
    if (priority !== undefined) params.priority = priority;
    if (name) params.nzbname = name;
    if (password) params.password = password;

    return this.post<{ status: boolean; nzo_ids: string[] }>('/addfile', params);
  }

  // Pause queue
  async pauseQueue(): Promise<AdapterResponse<{ status: boolean }>> {
    return this.get<{ status: boolean }>('/pause');
  }

  // Resume queue
  async resumeQueue(): Promise<AdapterResponse<{ status: boolean }>> {
    return this.get<{ status: boolean }>('/resume');
  }

  // Pause specific job
  async pauseJob(nzoId: string): Promise<AdapterResponse<{ status: boolean }>> {
    return this.get<{ status: boolean }>('/pause', { value: nzoId });
  }

  // Resume specific job
  async resumeJob(nzoId: string): Promise<AdapterResponse<{ status: boolean }>> {
    return this.get<{ status: boolean }>('/resume', { value: nzoId });
  }

  // Delete job from queue
  async deleteJob(nzoId: string): Promise<AdapterResponse<{ status: boolean }>> {
    return this.get<{ status: boolean }>('/queue/delete', { value: nzoId });
  }

  // Delete job and cleanup files
  async deleteJobWithFiles(nzoId: string): Promise<AdapterResponse<{ status: boolean }>> {
    return this.get<{ status: boolean }>('/queue/delete', { value: nzoId, del_files: 1 });
  }

  // Change job priority
  async changeJobPriority(nzoId: string, priority: number): Promise<AdapterResponse<{ status: boolean }>> {
    return this.get<{ status: boolean }>('/queue/priority', { value: nzoId, priority });
  }

  // Move job in queue
  async moveJob(nzoId: string, position: number): Promise<AdapterResponse<{ status: boolean }>> {
    return this.get<{ status: boolean }>('/queue/move', { value: nzoId, pos: position });
  }

  // Change job category
  async changeJobCategory(nzoId: string, category: string): Promise<AdapterResponse<{ status: boolean }>> {
    return this.get<{ status: boolean }>('/queue/category', { value: nzoId, cat: category });
  }

  // Change job script
  async changeJobScript(nzoId: string, script: string): Promise<AdapterResponse<{ status: boolean }>> {
    return this.get<{ status: boolean }>('/queue/script', { value: nzoId, script });
  }

  // Get job files
  async getJobFiles(nzoId: string): Promise<AdapterResponse<any>> {
    return this.get<any>('/queue/files', { value: nzoId });
  }

  // Get history
  async getHistory(): Promise<AdapterResponse<SabnzbdHistory>> {
    return this.get<SabnzbdHistory>('/history');
  }

  // Get history with parameters
  async getHistoryDetails(limit?: number, search?: string, category?: string, start?: number): Promise<AdapterResponse<SabnzbdHistory>> {
    const params: Record<string, any> = {};
    if (limit !== undefined) params.limit = limit;
    if (search) params.search = search;
    if (category) params.category = category;
    if (start !== undefined) params.start = start;
    return this.get<SabnzbdHistory>('/history', params);
  }

  // Delete history item
  async deleteHistoryItem(nzoId: string): Promise<AdapterResponse<{ status: boolean }>> {
    return this.get<{ status: boolean }>('/history/delete', { value: nzoId });
  }

  // Delete all history
  async deleteAllHistory(): Promise<AdapterResponse<{ status: boolean }>> {
    return this.get<{ status: boolean }>('/history/delete', { value: 'all' });
  }

  // Retry failed job from history
  async retryHistoryItem(nzoId: string): Promise<AdapterResponse<{ status: boolean }>> {
    return this.get<{ status: boolean }>('/history/retry', { value: nzoId });
  }

  // Get categories
  async getCategories(): Promise<AdapterResponse<SabnzbdCategory[]>> {
    return this.get<SabnzbdCategory[]>('/config/categories');
  }

  // Add category
  async addCategory(name: string, dir: string, priority?: number, script?: string, pp?: string): Promise<AdapterResponse<{ status: boolean }>> {
    const params: Record<string, any> = { name, dir };
    if (priority !== undefined) params.priority = priority;
    if (script) params.script = script;
    if (pp) params.pp = pp;
    return this.get<{ status: boolean }>('/config/categories/add', params);
  }

  // Delete category
  async deleteCategory(name: string): Promise<AdapterResponse<{ status: boolean }>> {
    return this.get<{ status: boolean }>('/config/categories/delete', { name });
  }

  // Get servers
  async getServers(): Promise<AdapterResponse<SabnzbdServer[]>> {
    return this.get<SabnzbdServer[]>('/config/servers');
  }

  // Add server
  async addServer(host: string, port: number, username?: string, password?: string, priority?: number, ssl?: boolean): Promise<AdapterResponse<{ status: boolean }>> {
    const params: Record<string, any> = { host, port };
    if (username) params.username = username;
    if (password) params.password = password;
    if (priority !== undefined) params.priority = priority;
    if (ssl !== undefined) params.ssl = ssl;
    return this.get<{ status: boolean }>('/config/servers/add', params);
  }

  // Delete server
  async deleteServer(host: string): Promise<AdapterResponse<{ status: boolean }>> {
    return this.get<{ status: boolean }>('/config/servers/delete', { host });
  }

  // Test server connection
  async testServer(host: string, port: number, username?: string, password?: string, ssl?: boolean): Promise<AdapterResponse<{ status: boolean; error?: string }>> {
    const params: Record<string, any> = { host, port };
    if (username) params.username = username;
    if (password) params.password = password;
    if (ssl !== undefined) params.ssl = ssl;
    return this.get<{ status: boolean; error?: string }>('/config/servers/test', params);
  }

  // Get warnings
  async getWarnings(): Promise<AdapterResponse<SabnzbdWarning[]>> {
    return this.get<SabnzbdWarning[]>('/config/warnings');
  }

  // Clear warnings
  async clearWarnings(): Promise<AdapterResponse<{ status: boolean }>> {
    return this.get<{ status: boolean }>('/config/warnings/clear');
  }

  // Get version
  async getVersion(): Promise<AdapterResponse<{ version: string }>> {
    return this.get<{ version: string }>('/version');
  }

  // Shutdown SABnzbd
  async shutdown(): Promise<AdapterResponse<{ status: boolean }>> {
    return this.get<{ status: boolean }>('/shutdown');
  }

  // Restart SABnzbd
  async restart(): Promise<AdapterResponse<{ status: boolean }>> {
    return this.get<{ status: boolean }>('/restart');
  }

  // Get configuration
  async getConfig(): Promise<AdapterResponse<any>> {
    return this.get<any>('/config');
  }

  // Get specific config section
  async getConfigSection(section: string): Promise<AdapterResponse<any>> {
    return this.get<any>(`/config/${section}`);
  }

  // Set configuration value
  async setConfig(section: string, key: string, value: any): Promise<AdapterResponse<{ status: boolean }>> {
    const params: Record<string, any> = { section, keyword: key, value };
    return this.get<{ status: boolean }>('/config/set', params);
  }

  // Override error handling for SABnzbd-specific error codes
  handleError(error: any, context?: string): import('../../types/adapter.types').AdapterError {
    const baseError = super.handleError(error, context);

    // SABnzbd-specific error handling
    if (error.response?.status === 400) {
      baseError.code = 'SABNZBD_BAD_REQUEST';
      baseError.message = 'Invalid request data';
      baseError.retryable = false;
    } else if (error.response?.status === 401) {
      baseError.code = 'SABNZBD_UNAUTHORIZED';
      baseError.message = 'API key invalid or missing';
      baseError.retryable = false;
    } else if (error.response?.status === 404) {
      baseError.code = 'SABNZBD_NOT_FOUND';
      baseError.message = 'Resource not found';
      baseError.retryable = false;
    } else if (error.response?.status === 500) {
      baseError.code = 'SABNZBD_SERVER_ERROR';
      baseError.message = 'SABnzbd server error';
      baseError.retryable = true;
    }

    return baseError;
  }
}
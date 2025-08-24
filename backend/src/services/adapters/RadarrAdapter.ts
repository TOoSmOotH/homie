import { BaseServiceAdapter } from './BaseServiceAdapter';
import {
  AdapterConfig,
  AdapterResponse,
  HealthCheckResult,
  RadarrMovie
} from '../../types/adapter.types';
import { ServiceType, ServiceStatus } from '../../models/ServiceConfig';
import { logger } from '../../utils/logger';

// Radarr-specific configuration
interface RadarrConfig extends AdapterConfig {
  qualityProfileId?: number;
  rootFolderPath?: string;
  monitored?: boolean;
  searchForMissingMovies?: boolean;
  searchForCutoffUnmetMovies?: boolean;
  minimumAvailability?: string;
}

// Radarr API response structure
interface RadarrApiResponse<T = any> {
  data?: T;
  success?: boolean;
  errorMessage?: string;
}

// Radarr movie options for adding/updating
interface RadarrMovieOptions {
  tmdbId?: number;
  title?: string;
  qualityProfileId?: number;
  rootFolderPath?: string;
  monitored?: boolean;
  minimumAvailability?: string;
  tags?: number[];
  addOptions?: {
    searchForMovie?: boolean;
  };
}

// Radarr quality profile
interface RadarrQualityProfile {
  id: number;
  name: string;
  cutoff: {
    id: number;
    name: string;
    source: string;
    resolution: number;
  };
  items: Array<{
    quality: {
      id: number;
      name: string;
      source: string;
      resolution: number;
    };
    allowed: boolean;
  }>;
}

// Radarr root folder
interface RadarrRootFolder {
  id: number;
  path: string;
  accessible: boolean;
  freeSpace: number;
  unmappedFolders: Array<{
    name: string;
    path: string;
  }>;
}

// Radarr system status
interface RadarrSystemStatus {
  version: string;
  buildTime: string;
  isDebug: boolean;
  isProduction: boolean;
  isAdmin: boolean;
  isUserInteractive: boolean;
  startupPath: string;
  appData: string;
  osVersion: string;
  isMono: boolean;
  isLinux: boolean;
  isOsx: boolean;
  isWindows: boolean;
  isDocker: boolean;
  mode: string;
  branch: string;
  authentication: string;
  sqliteVersion: string;
  urlBase: string;
  runtimeVersion: string;
  runtimeName: string;
}

// Radarr collection
interface RadarrCollection {
  id: number;
  title: string;
  sortTitle: string;
  tmdbId: number;
  overview: string;
  monitored: boolean;
  qualityProfileId: number;
  searchOnAdd: boolean;
  images: Array<{
    coverType: string;
    url: string;
  }>;
  movies: RadarrMovie[];
}

// Radarr import list
interface RadarrImportList {
  id: number;
  name: string;
  fields: Array<{
    name: string;
    value: any;
  }>;
  implementationName: string;
  implementation: string;
  configContract: string;
  infoLink: string;
  tags: number[];
  enabled: boolean;
  enableAuto: boolean;
  minRefreshInterval: string;
}

export class RadarrAdapter extends BaseServiceAdapter {
  readonly serviceType = ServiceType.RADARR;

  constructor(config: RadarrConfig) {
    super(ServiceType.RADARR, config);
  }

  // Get Radarr-specific configuration
  private get radarrConfig(): RadarrConfig {
    return this._config as RadarrConfig;
  }

  // Override to add Radarr-specific headers
  protected getServiceSpecificHeaders(): Record<string, string> {
    const headers: Record<string, string> = {};

    // Radarr API typically uses X-Api-Key header
    headers['Accept'] = 'application/json';

    return headers;
  }

  // Radarr-specific configuration validation
  protected async validateServiceSpecificConfig(errors: string[]): Promise<void> {
    if (!this._config.apiKey) {
      errors.push('API key is required for Radarr authentication');
    }

    // Radarr typically uses port 7878
    if (!this._config.port) {
      logger.warn('Radarr port not specified, using default 7878');
    } else if (this._config.port !== 7878) {
      logger.warn(`Non-standard Radarr port ${this._config.port} specified`);
    }
  }

  // Health check implementation
  async healthCheck(): Promise<HealthCheckResult> {
    const startTime = Date.now();

    try {
      // Try to get system status as a health check
      const response = await this.get<RadarrSystemStatus>('/system/status');

      if (response.success) {
        return {
          status: ServiceStatus.ACTIVE,
          responseTime: Date.now() - startTime,
          lastCheck: new Date(),
          version: this.extractVersionFromResponse(response),
          details: {
            version: (response.data as any)?.version,
            branch: (response.data as any)?.branch
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

  // Get system status
  async getSystemStatus(): Promise<AdapterResponse<RadarrSystemStatus>> {
    return this.get<RadarrSystemStatus>('/system/status');
  }

  // Get all movies
  async getMovies(): Promise<AdapterResponse<RadarrMovie[]>> {
    return this.get<RadarrMovie[]>('/movie');
  }

  // Get movie by ID
  async getMovieById(id: number): Promise<AdapterResponse<RadarrMovie>> {
    return this.get<RadarrMovie>(`/movie/${id}`);
  }

  // Lookup movie by term (TMDB ID, title, etc.)
  async lookupMovie(term: string): Promise<AdapterResponse<RadarrMovie[]>> {
    return this.get<RadarrMovie[]>('/movie/lookup', { term });
  }

  // Add new movie
  async addMovie(movieOptions: RadarrMovieOptions): Promise<AdapterResponse<RadarrMovie>> {
    return this.post<RadarrMovie>('/movie', movieOptions);
  }

  // Update movie
  async updateMovie(id: number, movieOptions: Partial<RadarrMovieOptions>): Promise<AdapterResponse<RadarrMovie>> {
    return this.put<RadarrMovie>(`/movie/${id}`, movieOptions);
  }

  // Delete movie
  async deleteMovie(id: number, deleteFiles?: boolean, addImportExclusion?: boolean): Promise<AdapterResponse<void>> {
    const params: Record<string, any> = {};
    if (deleteFiles !== undefined) params.deleteFiles = deleteFiles;
    if (addImportExclusion !== undefined) params.addImportExclusion = addImportExclusion;
    return this.delete<void>(`/movie/${id}`, params);
  }

  // Get quality profiles
  async getQualityProfiles(): Promise<AdapterResponse<RadarrQualityProfile[]>> {
    return this.get<RadarrQualityProfile[]>('/qualityprofile');
  }

  // Get quality profile by ID
  async getQualityProfile(id: number): Promise<AdapterResponse<RadarrQualityProfile>> {
    return this.get<RadarrQualityProfile>(`/qualityprofile/${id}`);
  }

  // Add quality profile
  async addQualityProfile(profile: Omit<RadarrQualityProfile, 'id'>): Promise<AdapterResponse<RadarrQualityProfile>> {
    return this.post<RadarrQualityProfile>('/qualityprofile', profile);
  }

  // Update quality profile
  async updateQualityProfile(id: number, profile: Partial<RadarrQualityProfile>): Promise<AdapterResponse<RadarrQualityProfile>> {
    return this.put<RadarrQualityProfile>(`/qualityprofile/${id}`, profile);
  }

  // Delete quality profile
  async deleteQualityProfile(id: number): Promise<AdapterResponse<void>> {
    return this.delete<void>(`/qualityprofile/${id}`);
  }

  // Get root folders
  async getRootFolders(): Promise<AdapterResponse<RadarrRootFolder[]>> {
    return this.get<RadarrRootFolder[]>('/rootfolder');
  }

  // Get queue
  async getQueue(page?: number, pageSize?: number, sortKey?: string, sortDir?: string, includeUnknownMovieItems?: boolean): Promise<AdapterResponse<any>> {
    const params: Record<string, any> = {};
    if (page !== undefined) params.page = page;
    if (pageSize !== undefined) params.pageSize = pageSize;
    if (sortKey) params.sortKey = sortKey;
    if (sortDir) params.sortDir = sortDir;
    if (includeUnknownMovieItems !== undefined) params.includeUnknownMovieItems = includeUnknownMovieItems;
    return this.get<any>('/queue', params);
  }

  // Delete queue item
  async deleteQueueItem(id: number, removeFromClient?: boolean, blocklist?: boolean): Promise<AdapterResponse<void>> {
    const params: Record<string, any> = {};
    if (removeFromClient !== undefined) params.removeFromClient = removeFromClient;
    if (blocklist !== undefined) params.blocklist = blocklist;
    return this.delete<void>(`/queue/${id}`, params);
  }

  // Get history
  async getHistory(page?: number, pageSize?: number, sortKey?: string, sortDir?: string, movieId?: number): Promise<AdapterResponse<any>> {
    const params: Record<string, any> = {};
    if (page !== undefined) params.page = page;
    if (pageSize !== undefined) params.pageSize = pageSize;
    if (sortKey) params.sortKey = sortKey;
    if (sortDir) params.sortDir = sortDir;
    if (movieId !== undefined) params.movieId = movieId;
    return this.get<any>('/history', params);
  }

  // Get wanted/missing movies
  async getWanted(page?: number, pageSize?: number, sortKey?: string, sortDir?: string, includeMovie?: boolean): Promise<AdapterResponse<any>> {
    const params: Record<string, any> = {};
    if (page !== undefined) params.page = page;
    if (pageSize !== undefined) params.pageSize = pageSize;
    if (sortKey) params.sortKey = sortKey;
    if (sortDir) params.sortDir = sortDir;
    if (includeMovie !== undefined) params.includeMovie = includeMovie;
    return this.get<any>('/wanted/missing', params);
  }

  // Get calendar
  async getCalendar(start?: string, end?: string, includeMovie?: boolean, includeMovieFile?: boolean, includeMovieImages?: boolean): Promise<AdapterResponse<RadarrMovie[]>> {
    const params: Record<string, any> = {};
    if (start) params.start = start;
    if (end) params.end = end;
    if (includeMovie !== undefined) params.includeMovie = includeMovie;
    if (includeMovieFile !== undefined) params.includeMovieFile = includeMovieFile;
    if (includeMovieImages !== undefined) params.includeMovieImages = includeMovieImages;
    return this.get<RadarrMovie[]>('/calendar', params);
  }

  // Search for movie
  async searchMovie(movieId: number): Promise<AdapterResponse<void>> {
    return this.post<void>('/command', {
      name: 'MovieSearch',
      movieId
    });
  }

  // Search all missing movies
  async searchAllMissing(): Promise<AdapterResponse<void>> {
    return this.post<void>('/command', { name: 'MissingMoviesSearch' });
  }

  // Refresh movie
  async refreshMovie(movieId?: number): Promise<AdapterResponse<void>> {
    const command: Record<string, any> = { name: 'RefreshMovie' };
    if (movieId !== undefined) command.movieId = movieId;
    return this.post<void>('/command', command);
  }

  // Rescan movie
  async rescanMovie(movieId?: number): Promise<AdapterResponse<void>> {
    const command: Record<string, any> = { name: 'RescanMovie' };
    if (movieId !== undefined) command.movieId = movieId;
    return this.post<void>('/command', command);
  }

  // RSS sync
  async rssSync(): Promise<AdapterResponse<void>> {
    return this.post<void>('/command', { name: 'RssSync' });
  }

  // Backup
  async backup(): Promise<AdapterResponse<void>> {
    return this.post<void>('/command', { name: 'Backup' });
  }

  // Get collections
  async getCollections(): Promise<AdapterResponse<RadarrCollection[]>> {
    return this.get<RadarrCollection[]>('/collection');
  }

  // Get collection by ID
  async getCollection(id: number): Promise<AdapterResponse<RadarrCollection>> {
    return this.get<RadarrCollection>(`/collection/${id}`);
  }

  // Get import lists
  async getImportLists(): Promise<AdapterResponse<RadarrImportList[]>> {
    return this.get<RadarrImportList[]>('/importlist');
  }

  // Get import list by ID
  async getImportList(id: number): Promise<AdapterResponse<RadarrImportList>> {
    return this.get<RadarrImportList>(`/importlist/${id}`);
  }

  // Get logs
  async getLogs(page?: number, pageSize?: number, sortKey?: string, sortDir?: string, level?: string): Promise<AdapterResponse<any>> {
    const params: Record<string, any> = {};
    if (page !== undefined) params.page = page;
    if (pageSize !== undefined) params.pageSize = pageSize;
    if (sortKey) params.sortKey = sortKey;
    if (sortDir) params.sortDir = sortDir;
    if (level) params.level = level;
    return this.get<any>('/log', params);
  }

  // Get disk space
  async getDiskSpace(): Promise<AdapterResponse<any[]>> {
    return this.get<any[]>('/diskspace');
  }

  // Get blocklist
  async getBlocklist(page?: number, pageSize?: number, sortKey?: string, sortDir?: string): Promise<AdapterResponse<any>> {
    const params: Record<string, any> = {};
    if (page !== undefined) params.page = page;
    if (pageSize !== undefined) params.pageSize = pageSize;
    if (sortKey) params.sortKey = sortKey;
    if (sortDir) params.sortDir = sortDir;
    return this.get<any>('/blocklist', params);
  }

  // Delete from blocklist
  async deleteFromBlocklist(id: number): Promise<AdapterResponse<void>> {
    return this.delete<void>(`/blocklist/${id}`);
  }

  // Clear blocklist
  async clearBlocklist(): Promise<AdapterResponse<void>> {
    return this.delete<void>('/blocklist/bulk');
  }

  // Override error handling for Radarr-specific error codes
  handleError(error: any, context?: string): import('../../types/adapter.types').AdapterError {
    const baseError = super.handleError(error, context);

    // Radarr-specific error handling
    if (error.response?.status === 400) {
      baseError.code = 'RADARR_BAD_REQUEST';
      baseError.message = 'Invalid request data';
      baseError.retryable = false;
    } else if (error.response?.status === 401) {
      baseError.code = 'RADARR_UNAUTHORIZED';
      baseError.message = 'API key invalid or missing';
      baseError.retryable = false;
    } else if (error.response?.status === 404) {
      baseError.code = 'RADARR_NOT_FOUND';
      baseError.message = 'Resource not found';
      baseError.retryable = false;
    } else if (error.response?.status === 409) {
      baseError.code = 'RADARR_CONFLICT';
      baseError.message = 'Resource conflict';
      baseError.retryable = false;
    } else if (error.response?.status === 500) {
      baseError.code = 'RADARR_SERVER_ERROR';
      baseError.message = 'Radarr server error';
      baseError.retryable = true;
    }

    return baseError;
  }
}
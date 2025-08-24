import { BaseServiceAdapter } from './BaseServiceAdapter';
import {
  AdapterConfig,
  AdapterResponse,
  HealthCheckResult,
  SonarrSeries
} from '../../types/adapter.types';
import { ServiceType, ServiceStatus } from '../../models/ServiceConfig';
import { logger } from '../../utils/logger';

// Sonarr-specific configuration
interface SonarrConfig extends AdapterConfig {
  qualityProfileId?: number;
  languageProfileId?: number;
  rootFolderPath?: string;
  seasonFolder?: boolean;
  monitored?: boolean;
  searchForMissingEpisodes?: boolean;
  searchForCutoffUnmetEpisodes?: boolean;
}

// Sonarr API response structure
interface SonarrApiResponse<T = any> {
  data?: T;
  success?: boolean;
  errorMessage?: string;
}

// Sonarr series options for adding/updating
interface SonarrSeriesOptions {
  tvdbId?: number;
  title?: string;
  qualityProfileId?: number;
  languageProfileId?: number;
  rootFolderPath?: string;
  seasonFolder?: boolean;
  monitored?: boolean;
  tags?: number[];
  addOptions?: {
    searchForMissingEpisodes?: boolean;
    searchForCutoffUnmetEpisodes?: boolean;
  };
}

// Sonarr episode structure
interface SonarrEpisode {
  id: number;
  episodeNumber: number;
  seasonNumber: number;
  title: string;
  airDate: string;
  airDateUtc: string;
  overview: string;
  hasFile: boolean;
  monitored: boolean;
  absoluteEpisodeNumber: number;
  sceneAbsoluteEpisodeNumber: number;
  sceneEpisodeNumber: number;
  sceneSeasonNumber: number;
  unverifiedSceneNumbering: boolean;
  downloadId?: string;
  grabDate?: string;
  seriesId: number;
  tvDbEpisodeId?: number;
  episodeFileId?: number;
  changed: string;
  series?: SonarrSeries;
  episodeFile?: {
    id: number;
    relativePath: string;
    path: string;
    size: number;
    dateAdded: string;
    quality: {
      quality: {
        id: number;
        name: string;
        source: string;
        resolution: number;
      };
      revision: {
        version: number;
        real: number;
        isRepack: boolean;
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
}

// Sonarr quality profile
interface SonarrQualityProfile {
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
  language?: {
    id: number;
    name: string;
  };
}

// Sonarr root folder
interface SonarrRootFolder {
  id: number;
  path: string;
  accessible: boolean;
  freeSpace: number;
  unmappedFolders: Array<{
    name: string;
    path: string;
  }>;
}

// Sonarr system status
interface SonarrSystemStatus {
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

export class SonarrAdapter extends BaseServiceAdapter {
  readonly serviceType = ServiceType.SONARR;

  constructor(config: SonarrConfig) {
    super(ServiceType.SONARR, config);
  }

  // Get Sonarr-specific configuration
  private get sonarrConfig(): SonarrConfig {
    return this._config as SonarrConfig;
  }

  // Override to add Sonarr-specific headers
  protected getServiceSpecificHeaders(): Record<string, string> {
    const headers: Record<string, string> = {};

    // Sonarr API typically uses X-Api-Key header
    headers['Accept'] = 'application/json';

    return headers;
  }

  // Sonarr-specific configuration validation
  protected async validateServiceSpecificConfig(errors: string[]): Promise<void> {
    if (!this._config.apiKey) {
      errors.push('API key is required for Sonarr authentication');
    }

    // Sonarr typically uses port 8989
    if (!this._config.port) {
      logger.warn('Sonarr port not specified, using default 8989');
    } else if (this._config.port !== 8989) {
      logger.warn(`Non-standard Sonarr port ${this._config.port} specified`);
    }
  }

  // Health check implementation
  async healthCheck(): Promise<HealthCheckResult> {
    const startTime = Date.now();

    try {
      // Try to get system status as a health check
      const response = await this.get<SonarrSystemStatus>('/system/status');

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
  async getSystemStatus(): Promise<AdapterResponse<SonarrSystemStatus>> {
    return this.get<SonarrSystemStatus>('/system/status');
  }

  // Get all series
  async getSeries(): Promise<AdapterResponse<SonarrSeries[]>> {
    return this.get<SonarrSeries[]>('/series');
  }

  // Get series by ID
  async getSeriesById(id: number): Promise<AdapterResponse<SonarrSeries>> {
    return this.get<SonarrSeries>(`/series/${id}`);
  }

  // Lookup series by term (TVDB ID, title, etc.)
  async lookupSeries(term: string): Promise<AdapterResponse<SonarrSeries[]>> {
    return this.get<SonarrSeries[]>('/series/lookup', { term });
  }

  // Add new series
  async addSeries(seriesOptions: SonarrSeriesOptions): Promise<AdapterResponse<SonarrSeries>> {
    return this.post<SonarrSeries>('/series', seriesOptions);
  }

  // Update series
  async updateSeries(id: number, seriesOptions: Partial<SonarrSeriesOptions>): Promise<AdapterResponse<SonarrSeries>> {
    return this.put<SonarrSeries>(`/series/${id}`, seriesOptions);
  }

  // Delete series
  async deleteSeries(id: number, deleteFiles?: boolean, addImportExclusion?: boolean): Promise<AdapterResponse<void>> {
    const params: Record<string, any> = {};
    if (deleteFiles !== undefined) params.deleteFiles = deleteFiles;
    if (addImportExclusion !== undefined) params.addImportExclusion = addImportExclusion;
    return this.delete<void>(`/series/${id}`, params);
  }

  // Get episodes for series
  async getEpisodes(seriesId: number, seasonNumber?: number): Promise<AdapterResponse<SonarrEpisode[]>> {
    const params = seasonNumber !== undefined ? { seasonNumber } : undefined;
    return this.get<SonarrEpisode[]>(`/episode`, { seriesId, ...params });
  }

  // Get episode by ID
  async getEpisode(id: number): Promise<AdapterResponse<SonarrEpisode>> {
    return this.get<SonarrEpisode>(`/episode/${id}`);
  }

  // Update episode
  async updateEpisode(id: number, episodeData: Partial<SonarrEpisode>): Promise<AdapterResponse<SonarrEpisode>> {
    return this.put<SonarrEpisode>(`/episode/${id}`, episodeData);
  }

  // Monitor/unmonitor episodes
  async monitorEpisodes(episodeIds: number[], monitored: boolean): Promise<AdapterResponse<void>> {
    return this.put<void>('/episode/monitor', { episodeIds, monitored });
  }

  // Search for episodes
  async searchEpisodes(seriesId?: number, seasonNumber?: number): Promise<AdapterResponse<void>> {
    const params: Record<string, any> = {};
    if (seriesId !== undefined) params.seriesId = seriesId;
    if (seasonNumber !== undefined) params.seasonNumber = seasonNumber;
    return this.post<void>('/command', {
      name: 'EpisodeSearch',
      seriesId,
      seasonNumber
    });
  }

  // Get quality profiles
  async getQualityProfiles(): Promise<AdapterResponse<SonarrQualityProfile[]>> {
    return this.get<SonarrQualityProfile[]>('/qualityprofile');
  }

  // Get quality profile by ID
  async getQualityProfile(id: number): Promise<AdapterResponse<SonarrQualityProfile>> {
    return this.get<SonarrQualityProfile>(`/qualityprofile/${id}`);
  }

  // Add quality profile
  async addQualityProfile(profile: Omit<SonarrQualityProfile, 'id'>): Promise<AdapterResponse<SonarrQualityProfile>> {
    return this.post<SonarrQualityProfile>('/qualityprofile', profile);
  }

  // Update quality profile
  async updateQualityProfile(id: number, profile: Partial<SonarrQualityProfile>): Promise<AdapterResponse<SonarrQualityProfile>> {
    return this.put<SonarrQualityProfile>(`/qualityprofile/${id}`, profile);
  }

  // Delete quality profile
  async deleteQualityProfile(id: number): Promise<AdapterResponse<void>> {
    return this.delete<void>(`/qualityprofile/${id}`);
  }

  // Get root folders
  async getRootFolders(): Promise<AdapterResponse<SonarrRootFolder[]>> {
    return this.get<SonarrRootFolder[]>('/rootfolder');
  }

  // Get queue
  async getQueue(page?: number, pageSize?: number, sortKey?: string, sortDir?: string, includeUnknownSeriesItems?: boolean): Promise<AdapterResponse<any>> {
    const params: Record<string, any> = {};
    if (page !== undefined) params.page = page;
    if (pageSize !== undefined) params.pageSize = pageSize;
    if (sortKey) params.sortKey = sortKey;
    if (sortDir) params.sortDir = sortDir;
    if (includeUnknownSeriesItems !== undefined) params.includeUnknownSeriesItems = includeUnknownSeriesItems;
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
  async getHistory(page?: number, pageSize?: number, sortKey?: string, sortDir?: string, seriesId?: number, episodeId?: number): Promise<AdapterResponse<any>> {
    const params: Record<string, any> = {};
    if (page !== undefined) params.page = page;
    if (pageSize !== undefined) params.pageSize = pageSize;
    if (sortKey) params.sortKey = sortKey;
    if (sortDir) params.sortDir = sortDir;
    if (seriesId !== undefined) params.seriesId = seriesId;
    if (episodeId !== undefined) params.episodeId = episodeId;
    return this.get<any>('/history', params);
  }

  // Get wanted/missing episodes
  async getWanted(page?: number, pageSize?: number, sortKey?: string, sortDir?: string, includeSeries?: boolean): Promise<AdapterResponse<any>> {
    const params: Record<string, any> = {};
    if (page !== undefined) params.page = page;
    if (pageSize !== undefined) params.pageSize = pageSize;
    if (sortKey) params.sortKey = sortKey;
    if (sortDir) params.sortDir = sortDir;
    if (includeSeries !== undefined) params.includeSeries = includeSeries;
    return this.get<any>('/wanted/missing', params);
  }

  // Get calendar
  async getCalendar(start?: string, end?: string, includeSeries?: boolean, includeEpisodeFile?: boolean, includeEpisodeImages?: boolean): Promise<AdapterResponse<SonarrEpisode[]>> {
    const params: Record<string, any> = {};
    if (start) params.start = start;
    if (end) params.end = end;
    if (includeSeries !== undefined) params.includeSeries = includeSeries;
    if (includeEpisodeFile !== undefined) params.includeEpisodeFile = includeEpisodeFile;
    if (includeEpisodeImages !== undefined) params.includeEpisodeImages = includeEpisodeImages;
    return this.get<SonarrEpisode[]>('/calendar', params);
  }

  // Search all missing episodes
  async searchAllMissing(): Promise<AdapterResponse<void>> {
    return this.post<void>('/command', { name: 'missingEpisodeSearch' });
  }

  // Refresh series
  async refreshSeries(seriesId?: number): Promise<AdapterResponse<void>> {
    const command: Record<string, any> = { name: 'RefreshSeries' };
    if (seriesId !== undefined) command.seriesId = seriesId;
    return this.post<void>('/command', command);
  }

  // Rescan series
  async rescanSeries(seriesId?: number): Promise<AdapterResponse<void>> {
    const command: Record<string, any> = { name: 'RescanSeries' };
    if (seriesId !== undefined) command.seriesId = seriesId;
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

  // Override error handling for Sonarr-specific error codes
  handleError(error: any, context?: string): import('../../types/adapter.types').AdapterError {
    const baseError = super.handleError(error, context);

    // Sonarr-specific error handling
    if (error.response?.status === 400) {
      baseError.code = 'SONARR_BAD_REQUEST';
      baseError.message = 'Invalid request data';
      baseError.retryable = false;
    } else if (error.response?.status === 401) {
      baseError.code = 'SONARR_UNAUTHORIZED';
      baseError.message = 'API key invalid or missing';
      baseError.retryable = false;
    } else if (error.response?.status === 404) {
      baseError.code = 'SONARR_NOT_FOUND';
      baseError.message = 'Resource not found';
      baseError.retryable = false;
    } else if (error.response?.status === 409) {
      baseError.code = 'SONARR_CONFLICT';
      baseError.message = 'Resource conflict';
      baseError.retryable = false;
    } else if (error.response?.status === 500) {
      baseError.code = 'SONARR_SERVER_ERROR';
      baseError.message = 'Sonarr server error';
      baseError.retryable = true;
    }

    return baseError;
  }
}
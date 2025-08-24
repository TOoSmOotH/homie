# Service Adapters API Reference

This document provides comprehensive API reference for all service adapters in the Homie system.

## Docker Adapter

### Configuration
```typescript
interface DockerConfig extends AdapterConfig {
  socketPath?: string;    // Unix socket path for Docker daemon
  tlsVerify?: boolean;    // Whether to verify TLS certificates
  certPath?: string;      // Path to TLS certificates
  dockerVersion?: string; // Docker API version to use (default: 'v1.43')
}
```

### Container Operations

#### List Containers
```typescript
listContainers(all?: boolean, filters?: Record<string, string[]>): Promise<AdapterResponse<DockerContainer[]>>
```
- `all`: Include stopped containers (default: false)
- `filters`: Filter containers by labels, names, etc.

#### Get Container
```typescript
getContainer(id: string): Promise<AdapterResponse<DockerContainer>>
```
- `id`: Container ID or name

#### Create Container
```typescript
createContainer(options: DockerContainerCreateOptions): Promise<AdapterResponse<{ Id: string; Warnings: string[] }>>
```
- `options`: Container creation configuration

#### Container Lifecycle
```typescript
startContainer(id: string): Promise<AdapterResponse<void>>
stopContainer(id: string, timeout?: number): Promise<AdapterResponse<void>>
restartContainer(id: string, timeout?: number): Promise<AdapterResponse<void>>
pauseContainer(id: string): Promise<AdapterResponse<void>>
unpauseContainer(id: string): Promise<AdapterResponse<void>>
killContainer(id: string, signal?: string): Promise<AdapterResponse<void>>
removeContainer(id: string, force?: boolean, removeVolumes?: boolean): Promise<AdapterResponse<void>>
```

#### Container Management
```typescript
getContainerLogs(id: string, options?: {
  stdout?: boolean;
  stderr?: boolean;
  since?: number;
  until?: number;
  timestamps?: boolean;
  follow?: boolean;
  tail?: string;
}): Promise<AdapterResponse<string>>

getContainerStats(id: string): Promise<AdapterResponse<any>>
execInContainer(containerId: string, options: ExecOptions): Promise<AdapterResponse<{ Id: string }>>
```

### Image Operations

#### List Images
```typescript
listImages(all?: boolean, filters?: Record<string, string[]>): Promise<AdapterResponse<DockerImage[]>>
```

#### Image Management
```typescript
getImage(id: string): Promise<AdapterResponse<DockerImage>>
pullImage(fromImage: string, tag?: string): Promise<AdapterResponse<string>>
removeImage(id: string, force?: boolean, noprune?: boolean): Promise<AdapterResponse<any[]>>
pruneImages(filters?: Record<string, string[]>): Promise<AdapterResponse<any>>
```

## Sonarr Adapter

### Configuration
```typescript
interface SonarrConfig extends AdapterConfig {
  qualityProfileId?: number;
  languageProfileId?: number;
  rootFolderPath?: string;
  seasonFolder?: boolean;
  monitored?: boolean;
  searchForMissingEpisodes?: boolean;
  searchForCutoffUnmetEpisodes?: boolean;
}
```

### Series Operations

#### Series Management
```typescript
getSeries(): Promise<AdapterResponse<SonarrSeries[]>>
getSeriesById(id: number): Promise<AdapterResponse<SonarrSeries>>
lookupSeries(term: string): Promise<AdapterResponse<SonarrSeries[]>>
addSeries(seriesOptions: SonarrSeriesOptions): Promise<AdapterResponse<SonarrSeries>>
updateSeries(id: number, seriesOptions: Partial<SonarrSeriesOptions>): Promise<AdapterResponse<SonarrSeries>>
deleteSeries(id: number, deleteFiles?: boolean, addImportExclusion?: boolean): Promise<AdapterResponse<void>>
```

#### Episode Operations
```typescript
getEpisodes(seriesId: number, seasonNumber?: number): Promise<AdapterResponse<SonarrEpisode[]>>
getEpisode(id: number): Promise<AdapterResponse<SonarrEpisode>>
updateEpisode(id: number, episodeData: Partial<SonarrEpisode>): Promise<AdapterResponse<SonarrEpisode>>
monitorEpisodes(episodeIds: number[], monitored: boolean): Promise<AdapterResponse<void>>
searchEpisodes(seriesId?: number, seasonNumber?: number): Promise<AdapterResponse<void>>
```

#### Quality Profiles
```typescript
getQualityProfiles(): Promise<AdapterResponse<SonarrQualityProfile[]>>
getQualityProfile(id: number): Promise<AdapterResponse<SonarrQualityProfile>>
addQualityProfile(profile: Omit<SonarrQualityProfile, 'id'>): Promise<AdapterResponse<SonarrQualityProfile>>
updateQualityProfile(id: number, profile: Partial<SonarrQualityProfile>): Promise<AdapterResponse<SonarrQualityProfile>>
deleteQualityProfile(id: number): Promise<AdapterResponse<void>>
```

#### Queue and History
```typescript
getQueue(page?: number, pageSize?: number, sortKey?: string, sortDir?: string, includeUnknownSeriesItems?: boolean): Promise<AdapterResponse<any>>
deleteQueueItem(id: number, removeFromClient?: boolean, blocklist?: boolean): Promise<AdapterResponse<void>>
getHistory(page?: number, pageSize?: number, sortKey?: string, sortDir?: string, seriesId?: number, episodeId?: number): Promise<AdapterResponse<any>>
getWanted(page?: number, pageSize?: number, sortKey?: string, sortDir?: string, includeSeries?: boolean): Promise<AdapterResponse<any>>
```

#### Calendar and Search
```typescript
getCalendar(start?: string, end?: string, includeSeries?: boolean, includeEpisodeFile?: boolean, includeEpisodeImages?: boolean): Promise<AdapterResponse<SonarrEpisode[]>>
searchAllMissing(): Promise<AdapterResponse<void>>
refreshSeries(seriesId?: number): Promise<AdapterResponse<void>>
rescanSeries(seriesId?: number): Promise<AdapterResponse<void>>
```

## Radarr Adapter

### Configuration
```typescript
interface RadarrConfig extends AdapterConfig {
  qualityProfileId?: number;
  rootFolderPath?: string;
  monitored?: boolean;
  searchForMissingMovies?: boolean;
  searchForCutoffUnmetMovies?: boolean;
  minimumAvailability?: string;
}
```

### Movie Operations

#### Movie Management
```typescript
getMovies(): Promise<AdapterResponse<RadarrMovie[]>>
getMovieById(id: number): Promise<AdapterResponse<RadarrMovie>>
lookupMovie(term: string): Promise<AdapterResponse<RadarrMovie[]>>
addMovie(movieOptions: RadarrMovieOptions): Promise<AdapterResponse<RadarrMovie>>
updateMovie(id: number, movieOptions: Partial<RadarrMovieOptions>): Promise<AdapterResponse<RadarrMovie>>
deleteMovie(id: number, deleteFiles?: boolean, addImportExclusion?: boolean): Promise<AdapterResponse<void>>
```

#### Quality Profiles
```typescript
getQualityProfiles(): Promise<AdapterResponse<RadarrQualityProfile[]>>
getQualityProfile(id: number): Promise<AdapterResponse<RadarrQualityProfile>>
addQualityProfile(profile: Omit<RadarrQualityProfile, 'id'>): Promise<AdapterResponse<RadarrQualityProfile>>
updateQualityProfile(id: number, profile: Partial<RadarrQualityProfile>): Promise<AdapterResponse<RadarrQualityProfile>>
deleteQualityProfile(id: number): Promise<AdapterResponse<void>>
```

#### Collections and Import Lists
```typescript
getCollections(): Promise<AdapterResponse<RadarrCollection[]>>
getCollection(id: number): Promise<AdapterResponse<RadarrCollection>>
getImportLists(): Promise<AdapterResponse<RadarrImportList[]>>
getImportList(id: number): Promise<AdapterResponse<RadarrImportList>>
```

#### Queue and History
```typescript
getQueue(page?: number, pageSize?: number, sortKey?: string, sortDir?: string, includeUnknownMovieItems?: boolean): Promise<AdapterResponse<any>>
deleteQueueItem(id: number, removeFromClient?: boolean, blocklist?: boolean): Promise<AdapterResponse<void>>
getHistory(page?: number, pageSize?: number, sortKey?: string, sortDir?: string, movieId?: number): Promise<AdapterResponse<any>>
getBlocklist(page?: number, pageSize?: number, sortKey?: string, sortDir?: string): Promise<AdapterResponse<any>>
```

#### Search and Calendar
```typescript
getCalendar(start?: string, end?: string, includeMovie?: boolean, includeMovieFile?: boolean, includeMovieImages?: boolean): Promise<AdapterResponse<RadarrMovie[]>>
searchMovie(movieId: number): Promise<AdapterResponse<void>>
searchAllMissing(): Promise<AdapterResponse<void>>
refreshMovie(movieId?: number): Promise<AdapterResponse<void>>
rescanMovie(movieId?: number): Promise<AdapterResponse<void>>
```

## SABnzbd Adapter

### Configuration
```typescript
interface SabnzbdConfig extends AdapterConfig {
  apikey?: string;        // SABnzbd API key
  nzbkey?: string;        // NZB key for uploads
  username?: string;      // Optional username for HTTP auth
  password?: string;      // Optional password for HTTP auth
}
```

### Queue Operations

#### Queue Management
```typescript
getQueue(): Promise<AdapterResponse<SabnzbdQueue>>
getQueueDetails(start?: number, limit?: number, search?: string): Promise<AdapterResponse<SabnzbdQueue>>
pauseQueue(): Promise<AdapterResponse<{ status: boolean }>>
resumeQueue(): Promise<AdapterResponse<{ status: boolean }>>
```

#### Job Operations
```typescript
pauseJob(nzoId: string): Promise<AdapterResponse<{ status: boolean }>>
resumeJob(nzoId: string): Promise<AdapterResponse<{ status: boolean }>>
deleteJob(nzoId: string): Promise<AdapterResponse<{ status: boolean }>>
deleteJobWithFiles(nzoId: string): Promise<AdapterResponse<{ status: boolean }>>
changeJobPriority(nzoId: string, priority: number): Promise<AdapterResponse<{ status: boolean }>>
moveJob(nzoId: string, position: number): Promise<AdapterResponse<{ status: boolean }>>
changeJobCategory(nzoId: string, category: string): Promise<AdapterResponse<{ status: boolean }>>
changeJobScript(nzoId: string, script: string): Promise<AdapterResponse<{ status: boolean }>>
```

### NZB Operations

#### Add NZBs
```typescript
addNzbByUrl(url: string, category?: string, priority?: number, name?: string, nzbname?: string, password?: string): Promise<AdapterResponse<{ status: boolean; nzo_ids: string[] }>>
addNzbFile(filename: string, content: string, category?: string, priority?: number, name?: string, password?: string): Promise<AdapterResponse<{ status: boolean; nzo_ids: string[] }>>
```

### History Operations

#### History Management
```typescript
getHistory(): Promise<AdapterResponse<SabnzbdHistory>>
getHistoryDetails(limit?: number, search?: string, category?: string, start?: number): Promise<AdapterResponse<SabnzbdHistory>>
deleteHistoryItem(nzoId: string): Promise<AdapterResponse<{ status: boolean }>>
deleteAllHistory(): Promise<AdapterResponse<{ status: boolean }>>
retryHistoryItem(nzoId: string): Promise<AdapterResponse<{ status: boolean }>>
```

### Category Operations

#### Category Management
```typescript
getCategories(): Promise<AdapterResponse<SabnzbdCategory[]>>
addCategory(name: string, dir: string, priority?: number, script?: string, pp?: string): Promise<AdapterResponse<{ status: boolean }>>
deleteCategory(name: string): Promise<AdapterResponse<{ status: boolean }>>
```

### Server Operations

#### Server Management
```typescript
getServers(): Promise<AdapterResponse<SabnzbdServer[]>>
addServer(host: string, port: number, username?: string, password?: string, priority?: number, ssl?: boolean): Promise<AdapterResponse<{ status: boolean }>>
deleteServer(host: string): Promise<AdapterResponse<{ status: boolean }>>
testServer(host: string, port: number, username?: string, password?: string, ssl?: boolean): Promise<AdapterResponse<{ status: boolean; error?: string }>>
```

### System Operations

#### System Management
```typescript
getVersion(): Promise<AdapterResponse<{ version: string }>>
getConfig(): Promise<AdapterResponse<any>>
getConfigSection(section: string): Promise<AdapterResponse<any>>
setConfig(section: string, key: string, value: any): Promise<AdapterResponse<{ status: boolean }>>
getWarnings(): Promise<AdapterResponse<SabnzbdWarning[]>>
clearWarnings(): Promise<AdapterResponse<{ status: boolean }>>
shutdown(): Promise<AdapterResponse<{ status: boolean }>>
restart(): Promise<AdapterResponse<{ status: boolean }>>
```

## Common Types

### AdapterResponse<T>
```typescript
interface AdapterResponse<T = any> {
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
```

### AdapterError
```typescript
interface AdapterError {
  code: string;
  message: string;
  details?: any;
  httpStatus?: number;
  retryable?: boolean;
  originalError?: Error;
}
```

### HealthCheckResult
```typescript
interface HealthCheckResult {
  status: ServiceStatus;
  responseTime?: number;
  lastCheck: Date;
  errorMessage?: string;
  version?: string;
  details?: Record<string, any>;
}
```

## Error Handling

All adapters implement consistent error handling with service-specific error codes:

### Docker Error Codes
- `DOCKER_NOT_FOUND`: Resource not found (404)
- `DOCKER_CONFLICT`: Resource conflict (409)
- `DOCKER_SERVER_ERROR`: Docker daemon error (500)

### Sonarr Error Codes
- `SONARR_BAD_REQUEST`: Invalid request data (400)
- `SONARR_UNAUTHORIZED`: API key invalid or missing (401)
- `SONARR_NOT_FOUND`: Resource not found (404)
- `SONARR_CONFLICT`: Resource conflict (409)
- `SONARR_SERVER_ERROR`: Sonarr server error (500)

### Radarr Error Codes
- `RADARR_BAD_REQUEST`: Invalid request data (400)
- `RADARR_UNAUTHORIZED`: API key invalid or missing (401)
- `RADARR_NOT_FOUND`: Resource not found (404)
- `RADARR_CONFLICT`: Resource conflict (409)
- `RADARR_SERVER_ERROR`: Radarr server error (500)

### SABnzbd Error Codes
- `SABNZBD_BAD_REQUEST`: Invalid request data (400)
- `SABNZBD_UNAUTHORIZED`: API key invalid or missing (401)
- `SABNZBD_NOT_FOUND`: Resource not found (404)
- `SABNZBD_SERVER_ERROR`: SABnzbd server error (500)

## Authentication

Each service uses different authentication methods:

- **Docker**: API key, username/password, or certificate-based auth
- **Sonarr**: API key (X-Api-Key header)
- **Radarr**: API key (X-Api-Key header)
- **SABnzbd**: API key (apikey query parameter)

## Configuration Examples

### Docker Configuration
```typescript
const dockerConfig: AdapterConfig = {
  baseUrl: 'https://docker.example.com',
  port: 2376,
  authType: AuthenticationType.API_KEY,
  apiKey: 'your-docker-api-key',
  useSSL: true,
  verifySSL: false,
  serviceConfig: {
    dockerVersion: 'v1.43'
  }
};
```

### Sonarr Configuration
```typescript
const sonarrConfig: AdapterConfig = {
  baseUrl: 'https://sonarr.example.com',
  port: 8989,
  authType: AuthenticationType.API_KEY,
  apiKey: 'your-sonarr-api-key',
  useSSL: true,
  verifySSL: true,
  serviceConfig: {
    qualityProfileId: 1,
    rootFolderPath: '/tv'
  }
};
```

### Radarr Configuration
```typescript
const radarrConfig: AdapterConfig = {
  baseUrl: 'https://radarr.example.com',
  port: 7878,
  authType: AuthenticationType.API_KEY,
  apiKey: 'your-radarr-api-key',
  useSSL: true,
  verifySSL: true,
  serviceConfig: {
    qualityProfileId: 1,
    rootFolderPath: '/movies'
  }
};
```

### SABnzbd Configuration
```typescript
const sabnzbdConfig: AdapterConfig = {
  baseUrl: 'https://sabnzbd.example.com',
  port: 8080,
  authType: AuthenticationType.API_KEY,
  apiKey: 'your-sabnzbd-api-key',
  useSSL: true,
  verifySSL: true
};
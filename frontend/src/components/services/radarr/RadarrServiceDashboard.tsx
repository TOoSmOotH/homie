import React, { useState, useEffect } from 'react';
import { StatusCard } from '@/components/ui/StatusCard';
import { HealthIndicator } from '@/components/ui/HealthIndicator';
import { ServiceControls } from '@/components/ui/ServiceControls';
import { RadarrMovieWidget } from './RadarrMovieWidget';
import { RadarrMovie } from '@/types/adapter.types';

export interface RadarrServiceDashboardProps {
  serviceId: string;
  onServiceAction?: (action: string, serviceId: string) => Promise<void>;
  className?: string;
}

interface RadarrSystemStatus {
  version: string;
  branch: string;
  isProduction: boolean;
  isDebug: boolean;
  startupPath: string;
  appData: string;
  osVersion: string;
  isMono: boolean;
  isLinux: boolean;
  isOsx: boolean;
  isWindows: boolean;
  isDocker: boolean;
}

interface RadarrQueueItem {
  id: number;
  movie: RadarrMovie;
  size: number;
  title: string;
  sizeleft: number;
  timeleft: string;
  estimatedCompletionTime: string;
  status: string;
  trackedDownloadStatus: string;
  trackedDownloadState: string;
  downloadId: string;
  protocol: string;
  downloadClient: string;
  indexer: string;
  outputPath: string;
}

interface QualityProfile {
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

export const RadarrServiceDashboard: React.FC<RadarrServiceDashboardProps> = ({
  serviceId,
  onServiceAction,
  className
}) => {
  const [systemStatus, setSystemStatus] = useState<RadarrSystemStatus | null>(null);
  const [movies, setMovies] = useState<RadarrMovie[]>([]);
  const [queue, setQueue] = useState<RadarrQueueItem[]>([]);
  const [qualityProfiles, setQualityProfiles] = useState<QualityProfile[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'movies' | 'queue' | 'profiles'>('movies');
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  // Mock data loading - in real implementation, this would call the backend API
  useEffect(() => {
    const loadData = async () => {
      setIsLoading(true);
      try {
        // Simulate API calls
        await new Promise(resolve => setTimeout(resolve, 1000));

        // Mock system status
        setSystemStatus({
          version: '4.3.2.6857',
          branch: 'master',
          isProduction: true,
          isDebug: false,
          startupPath: '/opt/radarr',
          appData: '/var/lib/radarr',
          osVersion: 'Ubuntu 20.04.5 LTS',
          isMono: false,
          isLinux: true,
          isOsx: false,
          isWindows: false,
          isDocker: true
        });

        // Mock movies data
        setMovies([
          {
            id: 1,
            title: 'Inception',
            sortTitle: 'inception',
            sizeOnDisk: 2147483648,
            overview: 'A thief who steals corporate secrets through the use of dream-sharing technology is given the inverse task of planting an idea into the mind of a C.E.O.',
            inCinemas: '2010-07-16T00:00:00Z',
            physicalRelease: '2010-07-23T00:00:00Z',
            images: [
              { coverType: 'poster', url: 'https://image.tmdb.org/t/p/w500/xlaY2zyzMfkhk0HSC5VUwzoZPU1.jpg' }
            ],
            website: 'https://www.imdb.com/title/tt1375666/',
            year: 2010,
            hasFile: true,
            youTubeTrailerId: '8hP9D6kZseM',
            studio: 'Warner Bros. Pictures',
            path: '/movies/Inception (2010)',
            qualityProfileId: 1,
            monitored: true,
            minimumAvailability: 'released',
            isAvailable: true,
            folderName: 'Inception (2010)',
            runtime: 148,
            cleanTitle: 'inception',
            imdbId: 'tt1375666',
            tmdbId: 27205,
            titleSlug: 'inception-27205',
            certification: 'PG-13',
            genres: ['Action', 'Science Fiction', 'Thriller'],
            tags: [],
            added: '2023-01-15T10:30:00Z',
            ratings: { votes: 2150000, value: 8.8 },
            movieFile: {
              movieId: 1,
              relativePath: 'Inception.2010.BluRay.1080p.mkv',
              path: '/movies/Inception (2010)/Inception.2010.BluRay.1080p.mkv',
              size: 2147483648,
              dateAdded: '2023-01-15T12:00:00Z',
              indexDate: '2023-01-15T12:00:00Z',
              quality: {
                quality: { id: 7, name: 'Bluray-1080p', source: 'bluray', resolution: 1080 },
                revision: { version: 1, real: 0 }
              },
              mediaInfo: {
                audioBitrate: 1509000,
                audioChannels: 6,
                audioCodec: 'DTS',
                audioLanguages: ['en'],
                height: 1080,
                width: 1920,
                subtitles: ['en', 'es', 'fr'],
                videoBitrate: 25000000,
                videoCodec: 'x264',
                videoFps: 23.976,
                runTime: '02:28:00',
                scanType: 'Progressive'
              },
              qualityCutoffNotMet: false
            }
          }
        ]);

        // Mock queue data
        setQueue([
          {
            id: 1,
            movie: {
              id: 2,
              title: 'The Dark Knight',
              sortTitle: 'dark knight',
              sizeOnDisk: 0,
              overview: 'When the menace known as the Joker wreaks havoc and chaos on the people of Gotham, Batman must accept one of the greatest psychological and physical tests of his ability to fight injustice.',
              inCinemas: '2008-07-18T00:00:00Z',
              images: [
                { coverType: 'poster', url: 'https://image.tmdb.org/t/p/w500/qJ2tW6WMUDux911r6m7haRef0WH.jpg' }
              ],
              year: 2008,
              hasFile: false,
              path: '/movies/The Dark Knight (2008)',
              qualityProfileId: 1,
              monitored: true,
              runtime: 152,
              genres: ['Action', 'Crime', 'Drama'],
              ratings: { votes: 2400000, value: 9.0 }
            } as RadarrMovie,
            size: 1610612736,
            title: 'The Dark Knight 2008 1080p BluRay x264',
            sizeleft: 536870912,
            timeleft: '01:30:00',
            estimatedCompletionTime: '2023-12-01T14:30:00Z',
            status: 'downloading',
            trackedDownloadStatus: 'downloading',
            trackedDownloadState: 'downloading',
            downloadId: 'SABnzbd_nzo_12345',
            protocol: 'torrent',
            downloadClient: 'Transmission',
            indexer: 'YTS',
            outputPath: '/downloads/complete'
          }
        ]);

        // Mock quality profiles
        setQualityProfiles([
          {
            id: 1,
            name: 'HD-1080p',
            cutoff: { id: 7, name: 'Bluray-1080p', source: 'bluray', resolution: 1080 },
            items: [
              { quality: { id: 1, name: 'SD', source: 'unknown', resolution: 0 }, allowed: false },
              { quality: { id: 2, name: 'WEBDL-480p', source: 'webdl', resolution: 480 }, allowed: true },
              { quality: { id: 4, name: 'WEBDL-720p', source: 'webdl', resolution: 720 }, allowed: true },
              { quality: { id: 7, name: 'Bluray-1080p', source: 'bluray', resolution: 1080 }, allowed: true },
              { quality: { id: 9, name: 'Bluray-2160p', source: 'bluray', resolution: 2160 }, allowed: true }
            ]
          },
          {
            id: 2,
            name: 'SD',
            cutoff: { id: 1, name: 'SD', source: 'unknown', resolution: 0 },
            items: [
              { quality: { id: 1, name: 'SD', source: 'unknown', resolution: 0 }, allowed: true }
            ]
          }
        ]);

      } catch (error) {
        console.error('Failed to load Radarr data:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadData();
  }, [serviceId]);

  const handleServiceAction = async (action: string) => {
    if (!onServiceAction) return;

    setActionLoading(action);
    try {
      await onServiceAction(action, serviceId);
    } catch (error) {
      console.error(`Failed to ${action} Radarr:`, error);
    } finally {
      setActionLoading(null);
    }
  };

  const handleMovieAction = async (action: string, movieId: number, ...args: any[]) => {
    // In real implementation, this would call the backend API
    console.log(`Movie ${action}:`, movieId, args);
  };

  const serviceControls = [
    {
      id: 'start',
      label: 'Start',
      icon: <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.828 14.828a4 4 0 01-5.656 0M9 10h1v4a1 1 0 001 1h1m6 0a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>,
      onClick: () => handleServiceAction('start'),
      variant: 'success' as const,
      loading: actionLoading === 'start'
    },
    {
      id: 'restart',
      label: 'Restart',
      icon: <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0V9a8 8 0 1115.356 2m-15.356 0H9" />
      </svg>,
      onClick: () => handleServiceAction('restart'),
      variant: 'secondary' as const,
      loading: actionLoading === 'restart'
    },
    {
      id: 'stop',
      label: 'Stop',
      icon: <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 9v6m4-6v6m7-3a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>,
      onClick: () => handleServiceAction('stop'),
      variant: 'danger' as const,
      loading: actionLoading === 'stop'
    }
  ];

  const tabs = [
    { id: 'movies', label: 'Movies', count: movies.length },
    { id: 'queue', label: 'Queue', count: queue.length },
    { id: 'profiles', label: 'Quality Profiles', count: qualityProfiles.length }
  ];

  return (
    <div className={`space-y-6 ${className || ''}`}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Radarr</h2>
          <p className="text-gray-600">Movie management and download automation</p>
        </div>
        <div className="flex items-center space-x-4">
          <HealthIndicator
            status="healthy"
            message="Service is running"
          />
          {systemStatus && (
            <span className="text-sm text-gray-500">
              v{systemStatus.version}
            </span>
          )}
        </div>
      </div>

      {/* System Status Card */}
      {systemStatus && (
        <StatusCard
          title="System Status"
          status="active"
          isLoading={isLoading}
        >
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-sm">
            <div>
              <span className="text-gray-600">Version:</span>
              <span className="ml-1 font-medium">{systemStatus.version}</span>
            </div>
            <div>
              <span className="text-gray-600">Branch:</span>
              <span className="ml-1 font-medium">{systemStatus.branch}</span>
            </div>
            <div>
              <span className="text-gray-600">Environment:</span>
              <span className="ml-1 font-medium">
                {systemStatus.isProduction ? 'Production' : 'Development'}
              </span>
            </div>
            <div>
              <span className="text-gray-600">Platform:</span>
              <span className="ml-1 font-medium">
                {systemStatus.isDocker ? 'Docker' : systemStatus.osVersion}
              </span>
            </div>
          </div>
        </StatusCard>
      )}

      {/* Service Controls */}
      <StatusCard
        title="Service Controls"
        status="active"
      >
        <ServiceControls
          controls={serviceControls}
          size="md"
          orientation="horizontal"
        />
      </StatusCard>

      {/* Tabs */}
      <div className="border-b border-gray-200">
        <nav className="flex space-x-8">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === tab.id
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              {tab.label}
              {tab.count !== undefined && (
                <span className="ml-2 py-0.5 px-2 rounded-full text-xs bg-gray-100 text-gray-600">
                  {tab.count}
                </span>
              )}
            </button>
          ))}
        </nav>
      </div>

      {/* Tab Content */}
      <div className="space-y-4">
        {activeTab === 'movies' && (
          <div className="grid gap-4">
            {movies.map((movie) => (
              <RadarrMovieWidget
                key={movie.id}
                movie={movie}
                onMonitorToggle={(movieId, monitored) =>
                  handleMovieAction('monitor', movieId, monitored)
                }
                onSearchMovie={(movieId) =>
                  handleMovieAction('search', movieId)
                }
                onRefreshMovie={(movieId) =>
                  handleMovieAction('refresh', movieId)
                }
                onDeleteMovie={(movieId) =>
                  handleMovieAction('delete', movieId)
                }
                onEditMovie={(movieId) =>
                  handleMovieAction('edit', movieId)
                }
                isLoading={isLoading}
              />
            ))}
            {movies.length === 0 && !isLoading && (
              <div className="text-center py-8 text-gray-500">
                No movies found. Add some movies to get started.
              </div>
            )}
          </div>
        )}

        {activeTab === 'queue' && (
          <div className="grid gap-4">
            {queue.map((item) => (
              <StatusCard
                key={item.id}
                title={item.movie.title}
                status="active"
                isLoading={isLoading}
              >
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">{item.title}</span>
                    <span className="px-2 py-1 text-xs bg-blue-100 text-blue-800 rounded-full">
                      {item.status}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-sm">
                    <div>
                      <span className="text-gray-600">Size:</span>
                      <span className="ml-1 font-medium">
                        {Math.round(item.size / 1024 / 1024)} MB
                      </span>
                    </div>
                    <div>
                      <span className="text-gray-600">Remaining:</span>
                      <span className="ml-1 font-medium">
                        {Math.round(item.sizeleft / 1024 / 1024)} MB
                      </span>
                    </div>
                    <div>
                      <span className="text-gray-600">Time Left:</span>
                      <span className="ml-1 font-medium">{item.timeleft}</span>
                    </div>
                    <div>
                      <span className="text-gray-600">Client:</span>
                      <span className="ml-1 font-medium">{item.downloadClient}</span>
                    </div>
                  </div>

                  <div className="space-y-1">
                    <div className="flex justify-between text-xs text-gray-600">
                      <span>Progress</span>
                      <span>
                        {Math.round(((item.size - item.sizeleft) / item.size) * 100)}%
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-blue-500 h-2 rounded-full transition-all duration-300"
                        style={{
                          width: `${((item.size - item.sizeleft) / item.size) * 100}%`
                        }}
                      />
                    </div>
                  </div>
                </div>
              </StatusCard>
            ))}
            {queue.length === 0 && !isLoading && (
              <div className="text-center py-8 text-gray-500">
                No downloads in queue.
              </div>
            )}
          </div>
        )}

        {activeTab === 'profiles' && (
          <div className="grid gap-4">
            {qualityProfiles.map((profile) => (
              <StatusCard
                key={profile.id}
                title={profile.name}
                status="active"
                isLoading={isLoading}
              >
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="text-sm text-gray-600">Cutoff:</span>
                      <span className="ml-1 font-medium">{profile.cutoff.name}</span>
                    </div>
                    <span className="px-2 py-1 text-xs bg-green-100 text-green-800 rounded-full">
                      Active
                    </span>
                  </div>

                  <div>
                    <span className="text-sm text-gray-600">Allowed Qualities:</span>
                    <div className="mt-2 flex flex-wrap gap-1">
                      {profile.items
                        .filter(item => item.allowed)
                        .map(item => (
                          <span
                            key={item.quality.id}
                            className="px-2 py-1 text-xs bg-blue-100 text-blue-800 rounded-full"
                          >
                            {item.quality.name}
                          </span>
                        ))}
                    </div>
                  </div>
                </div>
              </StatusCard>
            ))}
            {qualityProfiles.length === 0 && !isLoading && (
              <div className="text-center py-8 text-gray-500">
                No quality profiles found.
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
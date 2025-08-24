import React, { useState } from 'react';
import { StatusCard } from '@/components/ui/StatusCard';
import { ServiceControls } from '@/components/ui/ServiceControls';
import { HealthIndicator } from '@/components/ui/HealthIndicator';
import { cn } from '@/utils/cn';

export interface SonarrSeries {
  id: number;
  title: string;
  sortTitle: string;
  status: string;
  ended: boolean;
  overview: string;
  network: string;
  airTime: string;
  images: Array<{
    coverType: string;
    url: string;
  }>;
  seasons: Array<{
    seasonNumber: number;
    monitored: boolean;
    episodeCount: number;
    episodeFileCount: number;
    totalEpisodeCount: number;
  }>;
  year: number;
  path: string;
  qualityProfileId: number;
  languageProfileId: number;
  seasonFolder: boolean;
  monitored: boolean;
  useSceneNumbering: boolean;
  runtime: number;
  tvdbId: number;
  tvRageId: number;
  tvMazeId: number;
  firstAired: string;
  lastInfoSync: string;
  seriesType: string;
  cleanTitle: string;
  imdbId: string;
  titleSlug: string;
  certification: string;
  genres: string[];
  tags: number[];
  added: string;
  ratings: {
    votes: number;
    value: number;
  };
  statistics: {
    seasonCount: number;
    episodeCount: number;
    episodeFileCount: number;
    sizeOnDisk: number;
    releaseGroups: string[];
    percentOfEpisodes: number;
  };
}

export interface SonarrSeriesWidgetProps {
  series: SonarrSeries;
  onMonitorToggle?: (seriesId: number, monitored: boolean) => Promise<void>;
  onSearchEpisodes?: (seriesId: number) => Promise<void>;
  onRefreshSeries?: (seriesId: number) => Promise<void>;
  onDeleteSeries?: (seriesId: number) => Promise<void>;
  onEditSeries?: (seriesId: number) => void;
  className?: string;
  isLoading?: boolean;
}

const getStatusFromSeriesStatus = (status: string, ended: boolean): 'active' | 'inactive' | 'error' => {
  if (status === 'continuing' || !ended) {
    return 'active';
  }
  return 'inactive';
};

const formatBytes = (bytes: number): string => {
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
  if (bytes === 0) return '0 B';
  const i = Math.floor(Math.log(bytes) / Math.log(1024));
  return Math.round(bytes / Math.pow(1024, i) * 100) / 100 + ' ' + sizes[i];
};

const formatRating = (rating: { value: number; votes: number }): string => {
  if (!rating || rating.value === 0) return 'No rating';
  return `${rating.value.toFixed(1)}/10 (${rating.votes.toLocaleString()} votes)`;
};

const getPosterImage = (images: SonarrSeries['images']): string | undefined => {
  const poster = images.find(img => img.coverType === 'poster');
  return poster?.url;
};

export const SonarrSeriesWidget: React.FC<SonarrSeriesWidgetProps> = ({
  series,
  onMonitorToggle,
  onSearchEpisodes,
  onRefreshSeries,
  onDeleteSeries,
  onEditSeries,
  className,
  isLoading = false
}) => {
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const handleAction = async (action: string, handler?: (id: number, ...args: any[]) => Promise<void>, ...args: any[]) => {
    if (!handler) return;

    setActionLoading(action);
    try {
      await handler(series.id, ...args);
    } catch (error) {
      console.error(`Failed to ${action} series:`, error);
    } finally {
      setActionLoading(null);
    }
  };

  const status = getStatusFromSeriesStatus(series.status, series.ended);
  const posterUrl = getPosterImage(series.images);
  const completionPercentage = Math.round(series.statistics.percentOfEpisodes);
  const hasMissingEpisodes = series.statistics.episodeFileCount < series.statistics.episodeCount;

  const controls = [
    {
      id: 'monitor',
      label: series.monitored ? 'Unmonitor' : 'Monitor',
      icon: series.monitored ? (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
        </svg>
      ) : (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
          <line strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} x1="2" y1="2" x2="22" y2="22" />
        </svg>
      ),
      onClick: () => handleAction('monitor', onMonitorToggle, !series.monitored),
      variant: series.monitored ? 'secondary' as const : 'success' as const,
      loading: actionLoading === 'monitor'
    },
    {
      id: 'search',
      label: 'Search',
      icon: <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
      </svg>,
      onClick: () => handleAction('search', onSearchEpisodes),
      variant: 'primary' as const,
      loading: actionLoading === 'search'
    },
    {
      id: 'refresh',
      label: 'Refresh',
      icon: <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0V9a8 8 0 1115.356 2m-15.356 0H9" />
      </svg>,
      onClick: () => handleAction('refresh', onRefreshSeries),
      variant: 'secondary' as const,
      loading: actionLoading === 'refresh'
    },
    {
      id: 'edit',
      label: 'Edit',
      icon: <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
      </svg>,
      onClick: () => onEditSeries?.(series.id),
      variant: 'secondary' as const
    },
    {
      id: 'delete',
      label: 'Delete',
      icon: <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
      </svg>,
      onClick: () => handleAction('delete', onDeleteSeries),
      variant: 'danger' as const,
      loading: actionLoading === 'delete'
    }
  ];

  return (
    <StatusCard
      title={series.title}
      status={status}
      onRefresh={() => window.location.reload()}
      isLoading={isLoading}
      className={className}
    >
      <div className="space-y-3">
        {/* Poster and Basic Info */}
        <div className="flex items-start space-x-3">
          {posterUrl && (
            <div className="flex-shrink-0">
              <img
                src={posterUrl}
                alt={`${series.title} poster`}
                className="w-16 h-24 object-cover rounded-md shadow-sm"
                onError={(e) => {
                  e.currentTarget.style.display = 'none';
                }}
              />
            </div>
          )}
          <div className="flex-1 min-w-0">
            <div className="flex items-center space-x-2 mb-1">
              <HealthIndicator
                status={series.monitored ? 'healthy' : 'warning'}
                message={series.monitored ? 'Monitored' : 'Not monitored'}
              />
              {series.ended && (
                <span className="px-2 py-1 text-xs bg-blue-100 text-blue-800 rounded-full">
                  Ended
                </span>
              )}
              {hasMissingEpisodes && (
                <span className="px-2 py-1 text-xs bg-yellow-100 text-yellow-800 rounded-full">
                  Missing episodes
                </span>
              )}
            </div>
            <p className="text-sm text-gray-600 mb-1">
              {series.year} • {series.network} • {series.runtime}min
            </p>
            <p className="text-sm text-gray-600 mb-2">
              {series.genres.slice(0, 3).join(', ')}
            </p>
            {series.overview && (
              <p className="text-sm text-gray-700 line-clamp-2">
                {series.overview}
              </p>
            )}
          </div>
        </div>

        {/* Statistics */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-sm">
          <div>
            <span className="text-gray-600">Seasons:</span>
            <span className="ml-1 font-medium">{series.statistics.seasonCount}</span>
          </div>
          <div>
            <span className="text-gray-600">Episodes:</span>
            <span className="ml-1 font-medium">
              {series.statistics.episodeFileCount}/{series.statistics.episodeCount}
            </span>
          </div>
          <div>
            <span className="text-gray-600">Completion:</span>
            <span className="ml-1 font-medium">{completionPercentage}%</span>
          </div>
          <div>
            <span className="text-gray-600">Size:</span>
            <span className="ml-1 font-mono text-xs">
              {formatBytes(series.statistics.sizeOnDisk)}
            </span>
          </div>
        </div>

        {/* Rating */}
        {series.ratings.value > 0 && (
          <div className="text-sm">
            <span className="text-gray-600">Rating:</span>
            <span className="ml-1 font-medium">{formatRating(series.ratings)}</span>
          </div>
        )}

        {/* Progress Bar */}
        <div className="space-y-1">
          <div className="flex justify-between text-xs text-gray-600">
            <span>Progress</span>
            <span>{completionPercentage}%</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div
              className={cn(
                'h-2 rounded-full transition-all duration-300',
                completionPercentage === 100 ? 'bg-green-500' :
                completionPercentage > 75 ? 'bg-blue-500' :
                completionPercentage > 50 ? 'bg-yellow-500' : 'bg-red-500'
              )}
              style={{ width: `${completionPercentage}%` }}
            />
          </div>
        </div>

        {/* Controls */}
        <div className="pt-2 border-t border-gray-200">
          <ServiceControls
            controls={controls}
            size="sm"
            orientation="horizontal"
          />
        </div>
      </div>
    </StatusCard>
  );
};
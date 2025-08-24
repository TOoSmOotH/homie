import React, { useState } from 'react';
import { StatusCard } from '@/components/ui/StatusCard';
import { ServiceControls } from '@/components/ui/ServiceControls';
import { HealthIndicator } from '@/components/ui/HealthIndicator';
import { cn } from '@/utils/cn';
import { RadarrMovie } from '@/types/adapter.types';

export interface RadarrMovieWidgetProps {
  movie: RadarrMovie;
  onMonitorToggle?: (movieId: number, monitored: boolean) => Promise<void>;
  onSearchMovie?: (movieId: number) => Promise<void>;
  onRefreshMovie?: (movieId: number) => Promise<void>;
  onDeleteMovie?: (movieId: number) => Promise<void>;
  onEditMovie?: (movieId: number) => void;
  className?: string;
  isLoading?: boolean;
}

const getStatusFromMovieStatus = (movie: RadarrMovie): 'active' | 'inactive' | 'error' => {
  if (movie.hasFile) {
    return 'active';
  }
  if (movie.monitored) {
    return 'inactive'; // Available but not downloaded
  }
  return 'error'; // Not monitored
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

const formatRuntime = (minutes: number): string => {
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return hours > 0 ? `${hours}h ${mins}m` : `${mins}m`;
};

const getPosterImage = (images: RadarrMovie['images']): string | undefined => {
  const poster = images.find(img => img.coverType === 'poster');
  return poster?.url;
};

const getReleaseDate = (movie: RadarrMovie): string => {
  if (movie.physicalRelease) {
    return new Date(movie.physicalRelease).toLocaleDateString();
  }
  if (movie.inCinemas) {
    return new Date(movie.inCinemas).toLocaleDateString();
  }
  return movie.year?.toString() || 'Unknown';
};

export const RadarrMovieWidget: React.FC<RadarrMovieWidgetProps> = ({
  movie,
  onMonitorToggle,
  onSearchMovie,
  onRefreshMovie,
  onDeleteMovie,
  onEditMovie,
  className,
  isLoading = false
}) => {
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const handleAction = async (action: string, handler?: (id: number, ...args: any[]) => Promise<void>, ...args: any[]) => {
    if (!handler) return;

    setActionLoading(action);
    try {
      await handler(movie.id, ...args);
    } catch (error) {
      console.error(`Failed to ${action} movie:`, error);
    } finally {
      setActionLoading(null);
    }
  };

  const status = getStatusFromMovieStatus(movie);
  const posterUrl = getPosterImage(movie.images);
  const releaseDate = getReleaseDate(movie);
  const hasFile = movie.hasFile;
  const fileSize = movie.movieFile?.size || movie.sizeOnDisk || 0;

  const controls = [
    {
      id: 'monitor',
      label: movie.monitored ? 'Unmonitor' : 'Monitor',
      icon: movie.monitored ? (
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
      onClick: () => handleAction('monitor', onMonitorToggle, !movie.monitored),
      variant: movie.monitored ? 'secondary' as const : 'success' as const,
      loading: actionLoading === 'monitor'
    },
    {
      id: 'search',
      label: 'Search',
      icon: <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
      </svg>,
      onClick: () => handleAction('search', onSearchMovie),
      variant: 'primary' as const,
      loading: actionLoading === 'search'
    },
    {
      id: 'refresh',
      label: 'Refresh',
      icon: <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0V9a8 8 0 1115.356 2m-15.356 0H9" />
      </svg>,
      onClick: () => handleAction('refresh', onRefreshMovie),
      variant: 'secondary' as const,
      loading: actionLoading === 'refresh'
    },
    {
      id: 'edit',
      label: 'Edit',
      icon: <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
      </svg>,
      onClick: () => onEditMovie?.(movie.id),
      variant: 'secondary' as const
    },
    {
      id: 'delete',
      label: 'Delete',
      icon: <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
      </svg>,
      onClick: () => handleAction('delete', onDeleteMovie),
      variant: 'danger' as const,
      loading: actionLoading === 'delete'
    }
  ];

  return (
    <StatusCard
      title={movie.title}
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
                alt={`${movie.title} poster`}
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
                status={movie.monitored ? 'healthy' : 'warning'}
                message={movie.monitored ? 'Monitored' : 'Not monitored'}
              />
              {hasFile && (
                <span className="px-2 py-1 text-xs bg-green-100 text-green-800 rounded-full">
                  Downloaded
                </span>
              )}
              {movie.certification && (
                <span className="px-2 py-1 text-xs bg-blue-100 text-blue-800 rounded-full">
                  {movie.certification}
                </span>
              )}
            </div>
            <p className="text-sm text-gray-600 mb-1">
              {releaseDate} • {movie.studio} • {formatRuntime(movie.runtime)}
            </p>
            <p className="text-sm text-gray-600 mb-2">
              {movie.genres.slice(0, 3).join(', ')}
            </p>
            {movie.overview && (
              <p className="text-sm text-gray-700 line-clamp-2">
                {movie.overview}
              </p>
            )}
          </div>
        </div>

        {/* File Information */}
        {hasFile && movie.movieFile && (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-sm">
            <div>
              <span className="text-gray-600">Quality:</span>
              <span className="ml-1 font-medium">{movie.movieFile.quality.quality.name}</span>
            </div>
            <div>
              <span className="text-gray-600">Size:</span>
              <span className="ml-1 font-mono text-xs">
                {formatBytes(movie.movieFile.size)}
              </span>
            </div>
            <div>
              <span className="text-gray-600">Video:</span>
              <span className="ml-1 font-medium text-xs">
                {movie.movieFile.mediaInfo.videoCodec} {movie.movieFile.mediaInfo.width}x{movie.movieFile.mediaInfo.height}
              </span>
            </div>
            <div>
              <span className="text-gray-600">Audio:</span>
              <span className="ml-1 font-medium text-xs">
                {movie.movieFile.mediaInfo.audioCodec} {movie.movieFile.mediaInfo.audioChannels}ch
              </span>
            </div>
          </div>
        )}

        {/* Rating */}
        {movie.ratings.value > 0 && (
          <div className="text-sm">
            <span className="text-gray-600">Rating:</span>
            <span className="ml-1 font-medium">{formatRating(movie.ratings)}</span>
          </div>
        )}

        {/* Collection Info */}
        {movie.collection && (
          <div className="text-sm">
            <span className="text-gray-600">Collection:</span>
            <span className="ml-1 font-medium">{movie.collection.name}</span>
          </div>
        )}

        {/* Storage Info */}
        <div className="text-sm">
          <span className="text-gray-600">Path:</span>
          <span className="ml-1 font-mono text-xs break-all">{movie.path}</span>
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
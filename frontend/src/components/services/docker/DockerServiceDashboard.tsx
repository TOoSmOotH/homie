import React, { useState, useEffect } from 'react';
import { DockerContainerWidget, DockerContainer } from './DockerContainerWidget';
import { StatusCard } from '@/components/ui/StatusCard';
import { HealthIndicator } from '@/components/ui/HealthIndicator';
import { ServiceControls } from '@/components/ui/ServiceControls';
import { cn } from '@/utils/cn';

export interface DockerServiceDashboardProps {
  containers: DockerContainer[];
  isLoading?: boolean;
  error?: string | null;
  onRefresh?: () => void;
  onStartContainer?: (containerId: string) => Promise<void>;
  onStopContainer?: (containerId: string) => Promise<void>;
  onRestartContainer?: (containerId: string) => Promise<void>;
  onRemoveContainer?: (containerId: string) => Promise<void>;
  onViewLogs?: (containerId: string) => void;
  className?: string;
}

export const DockerServiceDashboard: React.FC<DockerServiceDashboardProps> = ({
  containers,
  isLoading = false,
  error,
  onRefresh,
  onStartContainer,
  onStopContainer,
  onRestartContainer,
  onRemoveContainer,
  onViewLogs,
  className
}) => {
  const [filter, setFilter] = useState<'all' | 'running' | 'stopped'>('all');
  const [searchTerm, setSearchTerm] = useState('');

  // Calculate statistics
  const stats = {
    total: containers.length,
    running: containers.filter(c => c.State === 'running').length,
    stopped: containers.filter(c => c.State === 'exited' || c.State === 'stopped').length,
    paused: containers.filter(c => c.State === 'paused').length,
    created: containers.filter(c => c.State === 'created').length
  };

  // Filter containers based on current filter and search term
  const filteredContainers = containers.filter(container => {
    const containerName = container.Names[0]?.replace(/^\//, '') || '';

    // Filter by status
    if (filter === 'running' && container.State !== 'running') return false;
    if (filter === 'stopped' && !['exited', 'stopped'].includes(container.State)) return false;

    // Filter by search term
    if (searchTerm && !containerName.toLowerCase().includes(searchTerm.toLowerCase())) {
      return false;
    }

    return true;
  });

  const serviceStatus = error ? 'error' : stats.running > 0 ? 'active' : 'inactive';

  return (
    <div className={cn('space-y-6', className)}>
      {/* Service Overview Card */}
      <StatusCard
        title="Docker Service Overview"
        status={serviceStatus}
        onRefresh={onRefresh}
        isLoading={isLoading}
      >
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-4">
          <div className="text-center">
            <div className="text-2xl font-bold text-gray-900">{stats.total}</div>
            <div className="text-sm text-gray-600">Total</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-green-600">{stats.running}</div>
            <div className="text-sm text-gray-600">Running</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-red-600">{stats.stopped}</div>
            <div className="text-sm text-gray-600">Stopped</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-yellow-600">{stats.paused}</div>
            <div className="text-sm text-gray-600">Paused</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-blue-600">{stats.created}</div>
            <div className="text-sm text-gray-600">Created</div>
          </div>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-md p-3 mb-4">
            <div className="flex items-center">
              <svg className="w-5 h-5 text-red-600 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span className="text-sm text-red-700">{error}</span>
            </div>
          </div>
        )}

        {/* Filter Controls */}
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1">
            <input
              type="text"
              placeholder="Search containers..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => setFilter('all')}
              className={cn(
                'px-3 py-2 text-sm font-medium rounded-md transition-colors',
                filter === 'all'
                  ? 'bg-blue-500 text-white'
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              )}
            >
              All ({stats.total})
            </button>
            <button
              onClick={() => setFilter('running')}
              className={cn(
                'px-3 py-2 text-sm font-medium rounded-md transition-colors',
                filter === 'running'
                  ? 'bg-green-500 text-white'
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              )}
            >
              Running ({stats.running})
            </button>
            <button
              onClick={() => setFilter('stopped')}
              className={cn(
                'px-3 py-2 text-sm font-medium rounded-md transition-colors',
                filter === 'stopped'
                  ? 'bg-red-500 text-white'
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              )}
            >
              Stopped ({stats.stopped})
            </button>
          </div>
        </div>
      </StatusCard>

      {/* Containers Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4">
        {filteredContainers.map((container) => (
          <DockerContainerWidget
            key={container.Id}
            container={container}
            onStart={onStartContainer}
            onStop={onStopContainer}
            onRestart={onRestartContainer}
            onRemove={onRemoveContainer}
            onLogs={onViewLogs}
            isLoading={isLoading}
          />
        ))}
      </div>

      {/* Empty State */}
      {filteredContainers.length === 0 && !isLoading && (
        <div className="text-center py-12">
          <div className="text-gray-400 mb-4">
            <svg className="w-16 h-16 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
            </svg>
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">No containers found</h3>
          <p className="text-gray-600">
            {searchTerm
              ? `No containers match "${searchTerm}"`
              : filter === 'all'
                ? 'No containers are currently running'
                : `No ${filter} containers found`
            }
          </p>
        </div>
      )}
    </div>
  );
};
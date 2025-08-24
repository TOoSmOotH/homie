import React, { useState } from 'react';
import { StatusCard } from '@/components/ui/StatusCard';
import { ServiceControls } from '@/components/ui/ServiceControls';
import { HealthIndicator } from '@/components/ui/HealthIndicator';
import { cn } from '@/utils/cn';

export interface DockerContainer {
  Id: string;
  Names: string[];
  Image: string;
  State: string;
  Status: string;
  Ports: Array<{
    IP?: string;
    PrivatePort: number;
    PublicPort?: number;
    Type: string;
  }>;
  Mounts: Array<{
    Type: string;
    Source: string;
    Destination: string;
    Mode: string;
  }>;
  Created: number;
}

export interface DockerContainerWidgetProps {
  container: DockerContainer;
  onStart?: (containerId: string) => Promise<void>;
  onStop?: (containerId: string) => Promise<void>;
  onRestart?: (containerId: string) => Promise<void>;
  onRemove?: (containerId: string) => Promise<void>;
  onLogs?: (containerId: string) => void;
  className?: string;
  isLoading?: boolean;
}

const getStatusFromState = (state: string): 'active' | 'inactive' | 'error' => {
  switch (state.toLowerCase()) {
    case 'running':
      return 'active';
    case 'exited':
    case 'stopped':
      return 'inactive';
    case 'created':
    case 'restarting':
    case 'paused':
      return 'active';
    default:
      return 'error';
  }
};

const formatUptime = (created: number): string => {
  const now = Date.now() / 1000;
  const diff = now - created;
  const days = Math.floor(diff / 86400);
  const hours = Math.floor((diff % 86400) / 3600);
  const minutes = Math.floor((diff % 3600) / 60);

  if (days > 0) return `${days}d ${hours}h`;
  if (hours > 0) return `${hours}h ${minutes}m`;
  return `${minutes}m`;
};

const formatPorts = (ports: DockerContainer['Ports']): string => {
  if (!ports || ports.length === 0) return 'No ports';

  return ports
    .map(port => {
      if (port.PublicPort) {
        return `${port.PublicPort}:${port.PrivatePort}`;
      }
      return `${port.PrivatePort}`;
    })
    .join(', ');
};

export const DockerContainerWidget: React.FC<DockerContainerWidgetProps> = ({
  container,
  onStart,
  onStop,
  onRestart,
  onRemove,
  onLogs,
  className,
  isLoading = false
}) => {
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const handleAction = async (action: string, handler?: (id: string) => Promise<void>) => {
    if (!handler) return;

    setActionLoading(action);
    try {
      await handler(container.Id);
    } catch (error) {
      console.error(`Failed to ${action} container:`, error);
    } finally {
      setActionLoading(null);
    }
  };

  const status = getStatusFromState(container.State);
  const containerName = container.Names[0]?.replace(/^\//, '') || 'Unnamed';

  const controls = [
    {
      id: 'start',
      label: 'Start',
      icon: <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.828 14.828a4 4 0 01-5.656 0M9 10h1m4 0h1m-7 4h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2z" />
      </svg>,
      onClick: () => handleAction('start', onStart),
      disabled: container.State === 'running',
      variant: 'success' as const,
      loading: actionLoading === 'start'
    },
    {
      id: 'stop',
      label: 'Stop',
      icon: <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 10h6m-6 4h6" />
      </svg>,
      onClick: () => handleAction('stop', onStop),
      disabled: container.State !== 'running',
      variant: 'secondary' as const,
      loading: actionLoading === 'stop'
    },
    {
      id: 'restart',
      label: 'Restart',
      icon: <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0V9a8 8 0 1115.356 2m-15.356 0H9" />
      </svg>,
      onClick: () => handleAction('restart', onRestart),
      variant: 'primary' as const,
      loading: actionLoading === 'restart'
    },
    {
      id: 'logs',
      label: 'Logs',
      icon: <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
      </svg>,
      onClick: () => onLogs?.(container.Id),
      variant: 'secondary' as const
    },
    {
      id: 'remove',
      label: 'Remove',
      icon: <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
      </svg>,
      onClick: () => handleAction('remove', onRemove),
      disabled: container.State === 'running',
      variant: 'danger' as const,
      loading: actionLoading === 'remove'
    }
  ];

  return (
    <StatusCard
      title={containerName}
      status={status}
      onRefresh={() => window.location.reload()}
      isLoading={isLoading}
      className={className}
    >
      <div className="space-y-3">
        {/* Status and Health */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <HealthIndicator status={status === 'active' ? 'healthy' : 'error'} />
            <span className="text-sm font-medium text-gray-700">
              {container.State}
            </span>
          </div>
          <span className="text-xs text-gray-500">
            {formatUptime(container.Created)}
          </span>
        </div>

        {/* Container Details */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm">
          <div>
            <span className="text-gray-600">Image:</span>
            <span className="ml-1 font-mono text-xs">{container.Image}</span>
          </div>
          <div>
            <span className="text-gray-600">Ports:</span>
            <span className="ml-1 font-mono text-xs">{formatPorts(container.Ports)}</span>
          </div>
        </div>

        {/* Mounts */}
        {container.Mounts && container.Mounts.length > 0 && (
          <div className="text-sm">
            <span className="text-gray-600">Mounts:</span>
            <div className="mt-1 space-y-1">
              {container.Mounts.map((mount, index) => (
                <div key={index} className="text-xs font-mono bg-gray-50 p-1 rounded">
                  {mount.Source} → {mount.Destination}
                </div>
              ))}
            </div>
          </div>
        )}

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
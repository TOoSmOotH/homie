import React, { useState } from 'react';
import { StatusCard } from '@/components/ui/StatusCard';
import { ServiceControls } from '@/components/ui/ServiceControls';
import { HealthIndicator } from '@/components/ui/HealthIndicator';
import { cn } from '@/utils/cn';
import { SabnzbdQueue } from '@/types/adapter.types';

export interface SabnzbdQueueWidgetProps {
  queueItem: SabnzbdQueue['slots'][0];
  onPause?: (nzoId: string) => Promise<void>;
  onResume?: (nzoId: string) => Promise<void>;
  onDelete?: (nzoId: string) => Promise<void>;
  onMove?: (nzoId: string, position: number) => Promise<void>;
  onChangePriority?: (nzoId: string, priority: number) => Promise<void>;
  className?: string;
  isLoading?: boolean;
}

const getStatusFromQueueStatus = (status: string): 'active' | 'inactive' | 'error' => {
  switch (status.toLowerCase()) {
    case 'downloading':
    case 'queued':
      return 'active';
    case 'paused':
      return 'inactive';
    case 'failed':
    case 'error':
      return 'error';
    default:
      return 'inactive';
  }
};

const formatBytes = (bytes: string): string => {
  const numBytes = parseInt(bytes) || 0;
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
  if (numBytes === 0) return '0 B';
  const i = Math.floor(Math.log(numBytes) / Math.log(1024));
  return Math.round(numBytes / Math.pow(1024, i) * 100) / 100 + ' ' + sizes[i];
};

const formatSpeed = (speed: string): string => {
  const numBytes = parseInt(speed) || 0;
  if (numBytes === 0) return '0 B/s';

  const sizes = ['B/s', 'KB/s', 'MB/s', 'GB/s'];
  const i = Math.floor(Math.log(numBytes) / Math.log(1024));
  return Math.round(numBytes / Math.pow(1024, i) * 100) / 100 + ' ' + sizes[i];
};

const getPriorityLabel = (priority: string): string => {
  const priorities: Record<string, string> = {
    '-100': 'Paused',
    '-2': 'Low',
    '-1': 'Normal',
    '0': 'Normal',
    '1': 'High',
    '2': 'Force'
  };
  return priorities[priority] || 'Normal';
};

const getPriorityColor = (priority: string): string => {
  switch (priority) {
    case '2': return 'text-red-600 bg-red-100';
    case '1': return 'text-orange-600 bg-orange-100';
    case '-1': return 'text-blue-600 bg-blue-100';
    case '-2': return 'text-gray-600 bg-gray-100';
    case '-100': return 'text-gray-500 bg-gray-50';
    default: return 'text-green-600 bg-green-100';
  }
};

export const SabnzbdQueueWidget: React.FC<SabnzbdQueueWidgetProps> = ({
  queueItem,
  onPause,
  onResume,
  onDelete,
  onMove,
  onChangePriority,
  className,
  isLoading = false
}) => {
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const handleAction = async (action: string, handler?: (id: string, ...args: any[]) => Promise<void>, ...args: any[]) => {
    if (!handler) return;

    setActionLoading(action);
    try {
      await handler(queueItem.nzo_id, ...args);
    } catch (error) {
      console.error(`Failed to ${action} queue item:`, error);
    } finally {
      setActionLoading(null);
    }
  };

  const status = getStatusFromQueueStatus(queueItem.status);
  const percentage = parseFloat(queueItem.percentage) || 0;
  const isPaused = queueItem.status.toLowerCase() === 'paused';
  const sizeInBytes = parseInt(queueItem.mb) * 1024 * 1024;
  const sizeLeftInBytes = parseInt(queueItem.mbleft) * 1024 * 1024;

  const controls = [
    {
      id: isPaused ? 'resume' : 'pause',
      label: isPaused ? 'Resume' : 'Pause',
      icon: isPaused ? (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.828 14.828a4 4 0 01-5.656 0M9 10h1v4a1 1 0 001 1h1m6 0a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ) : (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 9v6m4-6v6m7-3a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ),
      onClick: () => handleAction(isPaused ? 'resume' : 'pause', isPaused ? onResume : onPause),
      variant: isPaused ? 'success' as const : 'secondary' as const,
      loading: actionLoading === 'pause' || actionLoading === 'resume'
    },
    {
      id: 'priority',
      label: 'Priority',
      icon: <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
      </svg>,
      onClick: () => {
        const newPriority = queueItem.priority === '1' ? '0' : '1';
        handleAction('priority', onChangePriority, parseInt(newPriority));
      },
      variant: 'secondary' as const,
      loading: actionLoading === 'priority'
    },
    {
      id: 'move_up',
      label: 'Move Up',
      icon: <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
      </svg>,
      onClick: () => handleAction('move_up', onMove, queueItem.index - 1),
      variant: 'secondary' as const,
      loading: actionLoading === 'move_up'
    },
    {
      id: 'move_down',
      label: 'Move Down',
      icon: <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
      </svg>,
      onClick: () => handleAction('move_down', onMove, queueItem.index + 1),
      variant: 'secondary' as const,
      loading: actionLoading === 'move_down'
    },
    {
      id: 'delete',
      label: 'Delete',
      icon: <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
      </svg>,
      onClick: () => handleAction('delete', onDelete),
      variant: 'danger' as const,
      loading: actionLoading === 'delete'
    }
  ];

  return (
    <StatusCard
      title={queueItem.nzb_name}
      status={status}
      onRefresh={() => window.location.reload()}
      isLoading={isLoading}
      className={className}
    >
      <div className="space-y-3">
        {/* Status and Priority */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <HealthIndicator
              status={status}
              message={queueItem.status}
            />
            <span className={cn("px-2 py-1 text-xs rounded-full", getPriorityColor(queueItem.priority))}>
              {getPriorityLabel(queueItem.priority)}
            </span>
          </div>
          <div className="text-right text-sm text-gray-600">
            <div>#{queueItem.index + 1}</div>
          </div>
        </div>

        {/* Download Details */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-sm">
          <div>
            <span className="text-gray-600">Size:</span>
            <span className="ml-1 font-medium">{formatBytes(queueItem.mb + '000000')}</span>
          </div>
          <div>
            <span className="text-gray-600">Remaining:</span>
            <span className="ml-1 font-medium">{formatBytes(queueItem.mbleft + '000000')}</span>
          </div>
          <div>
            <span className="text-gray-600">Time Left:</span>
            <span className="ml-1 font-medium">{queueItem.timeleft}</span>
          </div>
          <div>
            <span className="text-gray-600">Category:</span>
            <span className="ml-1 font-medium">{queueItem.category}</span>
          </div>
        </div>

        {/* Age and ETA */}
        <div className="grid grid-cols-2 gap-2 text-sm">
          <div>
            <span className="text-gray-600">Age:</span>
            <span className="ml-1 font-medium">{queueItem.avg_age}</span>
          </div>
          <div>
            <span className="text-gray-600">ETA:</span>
            <span className="ml-1 font-medium">{queueItem.eta}</span>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="space-y-1">
          <div className="flex justify-between text-xs text-gray-600">
            <span>Progress</span>
            <span>{percentage.toFixed(1)}%</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div
              className={cn(
                'h-2 rounded-full transition-all duration-300',
                percentage === 100 ? 'bg-green-500' :
                percentage > 75 ? 'bg-blue-500' :
                percentage > 50 ? 'bg-yellow-500' : 'bg-red-500'
              )}
              style={{ width: `${percentage}%` }}
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
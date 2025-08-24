import React, { useState } from 'react';
import { StatusCard } from '@/components/ui/StatusCard';
import { ServiceControls } from '@/components/ui/ServiceControls';
import { HealthIndicator } from '@/components/ui/HealthIndicator';
import { cn } from '@/utils/cn';

export interface ProxmoxVM {
  vmid: number;
  name: string;
  status: 'running' | 'stopped' | 'paused';
  cpus: number;
  memory: number;
  maxmem: number;
  maxdisk: number;
  disk: number;
  uptime: number;
  template?: number;
  lock?: string;
  pid?: number;
}

export interface ProxmoxVMWidgetProps {
  vm: ProxmoxVM;
  node: string;
  onStart?: (node: string, vmid: number) => Promise<void>;
  onStop?: (node: string, vmid: number) => Promise<void>;
  onRestart?: (node: string, vmid: number) => Promise<void>;
  onPause?: (node: string, vmid: number) => Promise<void>;
  onResume?: (node: string, vmid: number) => Promise<void>;
  onDelete?: (node: string, vmid: number) => Promise<void>;
  className?: string;
  isLoading?: boolean;
}

const getStatusFromVmStatus = (status: string): 'active' | 'inactive' | 'error' => {
  switch (status.toLowerCase()) {
    case 'running':
      return 'active';
    case 'stopped':
      return 'inactive';
    case 'paused':
      return 'inactive';
    default:
      return 'error';
  }
};

const formatUptime = (uptime: number): string => {
  if (uptime === 0) return 'Stopped';

  const days = Math.floor(uptime / 86400);
  const hours = Math.floor((uptime % 86400) / 3600);
  const minutes = Math.floor((uptime % 3600) / 60);

  if (days > 0) return `${days}d ${hours}h`;
  if (hours > 0) return `${hours}h ${minutes}m`;
  return `${minutes}m`;
};

const formatBytes = (bytes: number): string => {
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
  if (bytes === 0) return '0 B';
  const i = Math.floor(Math.log(bytes) / Math.log(1024));
  return Math.round(bytes / Math.pow(1024, i) * 100) / 100 + ' ' + sizes[i];
};

const formatMemoryUsage = (used: number, total: number): string => {
  const usedGB = used / (1024 * 1024 * 1024);
  const totalGB = total / (1024 * 1024 * 1024);
  const percentage = total > 0 ? (used / total * 100).toFixed(1) : '0.0';
  return `${usedGB.toFixed(1)}/${totalGB.toFixed(1)} GB (${percentage}%)`;
};

export const ProxmoxVMWidget: React.FC<ProxmoxVMWidgetProps> = ({
  vm,
  node,
  onStart,
  onStop,
  onRestart,
  onPause,
  onResume,
  onDelete,
  className,
  isLoading = false
}) => {
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const handleAction = async (action: string, handler?: (node: string, vmid: number) => Promise<void>) => {
    if (!handler) return;

    setActionLoading(action);
    try {
      await handler(node, vm.vmid);
    } catch (error) {
      console.error(`Failed to ${action} VM:`, error);
    } finally {
      setActionLoading(null);
    }
  };

  const status = getStatusFromVmStatus(vm.status);
  const vmName = vm.name || `VM ${vm.vmid}`;
  const isTemplate = vm.template === 1;
  const isLocked = !!vm.lock;

  const controls = [
    {
      id: 'start',
      label: 'Start',
      icon: <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.828 14.828a4 4 0 01-5.656 0M9 10h1m4 0h1m-7 4h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2z" />
      </svg>,
      onClick: () => handleAction('start', onStart),
      disabled: vm.status === 'running' || isTemplate || isLocked,
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
      disabled: vm.status !== 'running' || isLocked,
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
      disabled: vm.status !== 'running' || isLocked,
      variant: 'primary' as const,
      loading: actionLoading === 'restart'
    },
    {
      id: 'pause',
      label: 'Pause',
      icon: <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 9v6m4-6v6m7-3a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>,
      onClick: () => handleAction('pause', onPause),
      disabled: vm.status !== 'running' || isLocked,
      variant: 'secondary' as const,
      loading: actionLoading === 'pause'
    },
    {
      id: 'resume',
      label: 'Resume',
      icon: <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.828 14.828a4 4 0 01-5.656 0M9 10h1m4 0h1m-7 4h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2z" />
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 9l3 3m0 0l3-3m-3 3V4" />
      </svg>,
      onClick: () => handleAction('resume', onResume),
      disabled: vm.status !== 'paused' || isLocked,
      variant: 'success' as const,
      loading: actionLoading === 'resume'
    },
    {
      id: 'delete',
      label: 'Delete',
      icon: <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
      </svg>,
      onClick: () => handleAction('delete', onDelete),
      disabled: vm.status === 'running' || isTemplate || isLocked,
      variant: 'danger' as const,
      loading: actionLoading === 'delete'
    }
  ];

  return (
    <StatusCard
      title={vmName}
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
              {vm.status}
            </span>
            {isTemplate && (
              <span className="px-2 py-1 text-xs bg-blue-100 text-blue-800 rounded-full">
                Template
              </span>
            )}
            {isLocked && (
              <span className="px-2 py-1 text-xs bg-yellow-100 text-yellow-800 rounded-full">
                Locked
              </span>
            )}
          </div>
          <span className="text-xs text-gray-500">
            Node: {node}
          </span>
        </div>

        {/* VM Details */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-sm">
          <div>
            <span className="text-gray-600">VM ID:</span>
            <span className="ml-1 font-mono text-xs">{vm.vmid}</span>
          </div>
          <div>
            <span className="text-gray-600">CPU:</span>
            <span className="ml-1 font-mono text-xs">{vm.cpus}</span>
          </div>
          <div>
            <span className="text-gray-600">Memory:</span>
            <span className="ml-1 font-mono text-xs">
              {formatMemoryUsage(vm.memory, vm.maxmem)}
            </span>
          </div>
          <div>
            <span className="text-gray-600">Disk:</span>
            <span className="ml-1 font-mono text-xs">
              {formatBytes(vm.disk)} / {formatBytes(vm.maxdisk)}
            </span>
          </div>
        </div>

        {/* Uptime */}
        <div className="text-sm">
          <span className="text-gray-600">Uptime:</span>
          <span className="ml-1 font-mono text-xs">{formatUptime(vm.uptime)}</span>
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
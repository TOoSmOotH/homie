import React, { useState, useMemo } from 'react';
import { ProxmoxVMWidget, ProxmoxVM } from './ProxmoxVMWidget';
import { StatusCard } from '@/components/ui/StatusCard';
import { HealthIndicator } from '@/components/ui/HealthIndicator';
import { cn } from '@/utils/cn';

export interface ProxmoxNode {
  node: string;
  status: 'online' | 'offline';
  cpu: number;
  memory: number;
  maxmemory: number;
  disk: number;
  maxdisk: number;
  uptime: number;
}

export interface ProxmoxServiceDashboardProps {
  vms: ProxmoxVM[];
  nodes: ProxmoxNode[];
  nodeVMs: Record<string, ProxmoxVM[]>; // VMs grouped by node
  isLoading?: boolean;
  error?: string | null;
  onRefresh?: () => void;
  onStartVM?: (node: string, vmid: number) => Promise<void>;
  onStopVM?: (node: string, vmid: number) => Promise<void>;
  onRestartVM?: (node: string, vmid: number) => Promise<void>;
  onPauseVM?: (node: string, vmid: number) => Promise<void>;
  onResumeVM?: (node: string, vmid: number) => Promise<void>;
  onDeleteVM?: (node: string, vmid: number) => Promise<void>;
  className?: string;
}

const formatBytes = (bytes: number): string => {
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
  if (bytes === 0) return '0 B';
  const i = Math.floor(Math.log(bytes) / Math.log(1024));
  return Math.round(bytes / Math.pow(1024, i) * 100) / 100 + ' ' + sizes[i];
};

const formatUptime = (uptime: number): string => {
  const days = Math.floor(uptime / 86400);
  const hours = Math.floor((uptime % 86400) / 3600);
  const minutes = Math.floor((uptime % 3600) / 60);

  if (days > 0) return `${days}d ${hours}h`;
  if (hours > 0) return `${hours}h ${minutes}m`;
  return `${minutes}m`;
};

const formatPercentage = (value: number): string => {
  return `${(value * 100).toFixed(1)}%`;
};

export const ProxmoxServiceDashboard: React.FC<ProxmoxServiceDashboardProps> = ({
  vms,
  nodes,
  nodeVMs,
  isLoading = false,
  error,
  onRefresh,
  onStartVM,
  onStopVM,
  onRestartVM,
  onPauseVM,
  onResumeVM,
  onDeleteVM,
  className
}) => {
  const [selectedNode, setSelectedNode] = useState<string>('all');
  const [filter, setFilter] = useState<'all' | 'running' | 'stopped' | 'paused'>('all');
  const [searchTerm, setSearchTerm] = useState('');

  // Calculate statistics
  const stats = useMemo(() => {
    const nodeStats = nodes.map(node => {
      const nodeVMsList = nodeVMs[node.node] || [];
      return {
        node: node.node,
        status: node.status,
        vmCount: nodeVMsList.length,
        runningVMs: nodeVMsList.filter(vm => vm.status === 'running').length,
        stoppedVMs: nodeVMsList.filter(vm => vm.status === 'stopped').length,
        pausedVMs: nodeVMsList.filter(vm => vm.status === 'paused').length,
        cpuUsage: formatPercentage(node.cpu),
        memoryUsage: formatBytes(node.memory) + ' / ' + formatBytes(node.maxmemory),
        diskUsage: formatBytes(node.disk) + ' / ' + formatBytes(node.maxdisk),
        uptime: formatUptime(node.uptime)
      };
    });

    const totalStats = {
      totalNodes: nodes.length,
      onlineNodes: nodes.filter(n => n.status === 'online').length,
      totalVMs: vms.length,
      runningVMs: vms.filter(vm => vm.status === 'running').length,
      stoppedVMs: vms.filter(vm => vm.status === 'stopped').length,
      pausedVMs: vms.filter(vm => vm.status === 'paused').length
    };

    return { nodeStats, totalStats };
  }, [vms, nodes, nodeVMs]);

  // Filter VMs based on current filters
  const filteredVMs = useMemo(() => {
    let filtered = vms;

    // Filter by node
    if (selectedNode !== 'all') {
      filtered = filtered.filter(vm => {
        // Find which node this VM belongs to
        for (const [node, nodeVMsList] of Object.entries(nodeVMs)) {
          if (nodeVMsList.some(nvm => nvm.vmid === vm.vmid)) {
            return node === selectedNode;
          }
        }
        return false;
      });
    }

    // Filter by status
    if (filter !== 'all') {
      filtered = filtered.filter(vm => vm.status === filter);
    }

    // Filter by search term
    if (searchTerm) {
      filtered = filtered.filter(vm =>
        vm.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        vm.vmid.toString().includes(searchTerm)
      );
    }

    return filtered;
  }, [vms, selectedNode, filter, searchTerm, nodeVMs]);

  const serviceStatus = error ? 'error' : stats.totalStats.onlineNodes > 0 ? 'active' : 'inactive';

  // Get node name for a VM
  const getNodeForVM = (vm: ProxmoxVM): string => {
    for (const [node, nodeVMsList] of Object.entries(nodeVMs)) {
      if (nodeVMsList.some(nvm => nvm.vmid === vm.vmid)) {
        return node;
      }
    }
    return 'unknown';
  };

  return (
    <div className={cn('space-y-6', className)}>
      {/* Service Overview Card */}
      <StatusCard
        title="Proxmox Service Overview"
        status={serviceStatus}
        onRefresh={onRefresh}
        isLoading={isLoading}
      >
        <div className="grid grid-cols-2 md:grid-cols-6 gap-4 mb-4">
          <div className="text-center">
            <div className="text-2xl font-bold text-gray-900">{stats.totalStats.totalNodes}</div>
            <div className="text-sm text-gray-600">Nodes</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-green-600">{stats.totalStats.onlineNodes}</div>
            <div className="text-sm text-gray-600">Online</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-blue-600">{stats.totalStats.totalVMs}</div>
            <div className="text-sm text-gray-600">Total VMs</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-green-600">{stats.totalStats.runningVMs}</div>
            <div className="text-sm text-gray-600">Running</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-red-600">{stats.totalStats.stoppedVMs}</div>
            <div className="text-sm text-gray-600">Stopped</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-yellow-600">{stats.totalStats.pausedVMs}</div>
            <div className="text-sm text-gray-600">Paused</div>
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
              placeholder="Search VMs..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          <div className="flex gap-2">
            <select
              value={selectedNode}
              onChange={(e) => setSelectedNode(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">All Nodes</option>
              {nodes.map(node => (
                <option key={node.node} value={node.node}>
                  {node.node} ({node.status})
                </option>
              ))}
            </select>
            <button
              onClick={() => setFilter('all')}
              className={cn(
                'px-3 py-2 text-sm font-medium rounded-md transition-colors',
                filter === 'all'
                  ? 'bg-blue-500 text-white'
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              )}
            >
              All ({stats.totalStats.totalVMs})
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
              Running ({stats.totalStats.runningVMs})
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
              Stopped ({stats.totalStats.stoppedVMs})
            </button>
          </div>
        </div>
      </StatusCard>

      {/* Node Status Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {stats.nodeStats.map(nodeStat => (
          <StatusCard
            key={nodeStat.node}
            title={`Node: ${nodeStat.node}`}
            status={nodeStat.status === 'online' ? 'active' : 'inactive'}
            className="text-sm"
          >
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div>
                <span className="text-gray-600">Status:</span>
                <span className="ml-1 font-medium">{nodeStat.status}</span>
              </div>
              <div>
                <span className="text-gray-600">VMs:</span>
                <span className="ml-1 font-medium">{nodeStat.vmCount}</span>
              </div>
              <div>
                <span className="text-gray-600">CPU:</span>
                <span className="ml-1 font-mono">{nodeStat.cpuUsage}</span>
              </div>
              <div>
                <span className="text-gray-600">Memory:</span>
                <span className="ml-1 font-mono">{nodeStat.memoryUsage}</span>
              </div>
              <div className="col-span-2">
                <span className="text-gray-600">Disk:</span>
                <span className="ml-1 font-mono">{nodeStat.diskUsage}</span>
              </div>
              <div className="col-span-2">
                <span className="text-gray-600">Uptime:</span>
                <span className="ml-1 font-mono">{nodeStat.uptime}</span>
              </div>
            </div>
          </StatusCard>
        ))}
      </div>

      {/* VMs Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4">
        {filteredVMs.map((vm) => (
          <ProxmoxVMWidget
            key={`${getNodeForVM(vm)}-${vm.vmid}`}
            vm={vm}
            node={getNodeForVM(vm)}
            onStart={onStartVM}
            onStop={onStopVM}
            onRestart={onRestartVM}
            onPause={onPauseVM}
            onResume={onResumeVM}
            onDelete={onDeleteVM}
            isLoading={isLoading}
          />
        ))}
      </div>

      {/* Empty State */}
      {filteredVMs.length === 0 && !isLoading && (
        <div className="text-center py-12">
          <div className="text-gray-400 mb-4">
            <svg className="w-16 h-16 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
            </svg>
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">No VMs found</h3>
          <p className="text-gray-600">
            {searchTerm
              ? `No VMs match "${searchTerm}"`
              : filter === 'all'
                ? 'No VMs are currently available'
                : `No ${filter} VMs found`
            }
          </p>
        </div>
      )}
    </div>
  );
};
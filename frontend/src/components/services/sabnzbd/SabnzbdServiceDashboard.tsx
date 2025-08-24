import React, { useState, useEffect } from 'react';
import { StatusCard } from '@/components/ui/StatusCard';
import { HealthIndicator } from '@/components/ui/HealthIndicator';
import { ServiceControls } from '@/components/ui/ServiceControls';
import { SabnzbdQueueWidget } from './SabnzbdQueueWidget';
import { SabnzbdQueue, SabnzbdHistory } from '@/types/adapter.types';

export interface SabnzbdServiceDashboardProps {
  serviceId: string;
  onServiceAction?: (action: string, serviceId: string) => Promise<void>;
  className?: string;
}

interface SabnzbdSystemStatus {
  version: string;
  speedlimit: string;
  speed: string;
  queue_size: string;
  queue_mb: string;
  diskspace1: string;
  diskspace2: string;
  paused: boolean;
}

interface SabnzbdCategory {
  name: string;
  dir: string;
  priority: number;
  script: string;
  pp: string;
}

export const SabnzbdServiceDashboard: React.FC<SabnzbdServiceDashboardProps> = ({
  serviceId,
  onServiceAction,
  className
}) => {
  const [systemStatus, setSystemStatus] = useState<SabnzbdSystemStatus | null>(null);
  const [queue, setQueue] = useState<SabnzbdQueue | null>(null);
  const [history, setHistory] = useState<SabnzbdHistory | null>(null);
  const [categories, setCategories] = useState<SabnzbdCategory[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'queue' | 'history' | 'categories'>('queue');
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [speedHistory, setSpeedHistory] = useState<number[]>([]);

  // Mock data loading - in real implementation, this would call the backend API
  useEffect(() => {
    const loadData = async () => {
      setIsLoading(true);
      try {
        // Simulate API calls
        await new Promise(resolve => setTimeout(resolve, 1000));

        // Mock system status
        setSystemStatus({
          version: '4.2.1',
          speedlimit: '0',
          speed: '25.5',
          queue_size: '3',
          queue_mb: '15.2',
          diskspace1: '500.0',
          diskspace2: '2000.0',
          paused: false
        });

        // Mock queue data
        setQueue({
          status: 'Downloading',
          speedlimit: '0',
          speed: '25.5',
          queue_size: '3',
          queue_mb: '15.2',
          queue_mbleft: '8.7',
          diskspace1: '500.0',
          diskspace2: '2000.0',
          eta: '02:30:00',
          timeleft: '02:30:00',
          paused: false,
          slots: [
            {
              status: 'downloading',
              index: 0,
              password: '',
              avg_age: '2h',
              script: '',
              nzb_name: 'The.Matrix.1999.2160p.BluRay.x265.10bit.SDR.DTS-HD.MA.TrueHD.7.1.Atmos-SWTYBLZ',
              mb: '51200',
              mbleft: '30720',
              percentage: '40.0',
              nzo_id: 'SABnzbd_nzo_12345',
              timeleft: '01:30:00',
              eta: '14:30:00',
              category: 'movies',
              priority: '0'
            },
            {
              status: 'queued',
              index: 1,
              password: '',
              avg_age: '30m',
              script: '',
              nzb_name: 'Dune.2021.2160p.BluRay.x265.10bit.SDR.DTS-HD.MA.TrueHD.7.1.Atmos-CMRG',
              mb: '61440',
              mbleft: '61440',
              percentage: '0.0',
              nzo_id: 'SABnzbd_nzo_12346',
              timeleft: '',
              eta: '',
              category: 'movies',
              priority: '-1'
            },
            {
              status: 'paused',
              index: 2,
              password: '',
              avg_age: '1h',
              script: '',
              nzb_name: 'Inception.2010.2160p.BluRay.x265.10bit.SDR.DTS-HD.MA.TrueHD.7.1.Atmos-HDH',
              mb: '35840',
              mbleft: '35840',
              percentage: '0.0',
              nzo_id: 'SABnzbd_nzo_12347',
              timeleft: '',
              eta: '',
              category: 'movies',
              priority: '-100'
            }
          ]
        });

        // Mock history data
        setHistory({
          total_size: '1.2',
          month_size: '850.5',
          week_size: '324.2',
          day_size: '89.7',
          slots: [
            {
              action_line: 'Downloaded',
              show_details: false,
              script_log: '',
              meta: '',
              fail_message: '',
              url: '',
              nzb_name: 'The Dark Knight 2008 1080p BluRay x264 DTS-HD MA 5.1',
              download_time: '02:15:00',
              storage: '/downloads/complete/movies',
              path: '/downloads/complete/movies/The Dark Knight 2008',
              script: '',
              nzo_id: 'SABnzbd_nzo_12344',
              size: '25.0',
              category: 'movies',
              pp: '3',
              status: 'Completed',
              script_line: '',
              completed: 1699123200,
              nzb: 'The Dark Knight 2008 1080p BluRay x264 DTS-HD MA 5.1.nzb',
              downloaded: 26214400,
              report: '',
              password: ''
            }
          ]
        });

        // Mock categories
        setCategories([
          { name: 'movies', dir: '/downloads/movies', priority: 0, script: '', pp: '3' },
          { name: 'tv', dir: '/downloads/tv', priority: 0, script: '', pp: '3' },
          { name: 'music', dir: '/downloads/music', priority: -1, script: '', pp: '2' },
          { name: 'software', dir: '/downloads/software', priority: -2, script: '', pp: '1' }
        ]);

        // Initialize speed history for chart
        setSpeedHistory([20.1, 22.3, 24.8, 23.1, 25.5, 26.2, 24.9, 25.5]);

      } catch (error) {
        console.error('Failed to load Sabnzbd data:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadData();

    // Update speed history periodically
    const speedInterval = setInterval(() => {
      setSpeedHistory(prev => {
        const newSpeed = 20 + Math.random() * 10; // Random speed between 20-30 MB/s
        const newHistory = [...prev.slice(1), newSpeed];
        return newHistory;
      });
    }, 2000);

    return () => clearInterval(speedInterval);
  }, [serviceId]);

  const handleServiceAction = async (action: string) => {
    if (!onServiceAction) return;

    setActionLoading(action);
    try {
      await onServiceAction(action, serviceId);
    } catch (error) {
      console.error(`Failed to ${action} Sabnzbd:`, error);
    } finally {
      setActionLoading(null);
    }
  };

  const handleQueueAction = async (action: string, nzoId: string, ...args: any[]) => {
    // In real implementation, this would call the backend API
    console.log(`Queue ${action}:`, nzoId, args);
  };

  const formatBytes = (bytes: string): string => {
    const numBytes = parseFloat(bytes) || 0;
    if (numBytes === 0) return '0 GB';

    if (numBytes >= 1000) {
      return (numBytes / 1000).toFixed(1) + ' TB';
    }
    return numBytes.toFixed(1) + ' GB';
  };

  const formatSpeed = (speed: string): string => {
    const numSpeed = parseFloat(speed) || 0;
    if (numSpeed === 0) return '0 MB/s';
    return numSpeed.toFixed(1) + ' MB/s';
  };

  const serviceControls = [
    {
      id: systemStatus?.paused ? 'resume' : 'pause',
      label: systemStatus?.paused ? 'Resume' : 'Pause',
      icon: systemStatus?.paused ? (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.828 14.828a4 4 0 01-5.656 0M9 10h1v4a1 1 0 001 1h1m6 0a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ) : (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 9v6m4-6v6m7-3a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ),
      onClick: () => handleServiceAction(systemStatus?.paused ? 'resume' : 'pause'),
      variant: systemStatus?.paused ? 'success' as const : 'secondary' as const,
      loading: actionLoading === 'pause' || actionLoading === 'resume'
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
    { id: 'queue', label: 'Queue', count: queue?.slots.length || 0 },
    { id: 'history', label: 'History', count: history?.slots.length || 0 },
    { id: 'categories', label: 'Categories', count: categories.length }
  ];

  return (
    <div className={`space-y-6 ${className || ''}`}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Sabnzbd</h2>
          <p className="text-gray-600">Binary download management and automation</p>
        </div>
        <div className="flex items-center space-x-4">
          <HealthIndicator
            status={systemStatus?.paused ? 'inactive' : 'healthy'}
            message={systemStatus?.paused ? 'Paused' : 'Active'}
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
          status={systemStatus.paused ? 'inactive' : 'active'}
          isLoading={isLoading}
        >
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-sm">
            <div>
              <span className="text-gray-600">Status:</span>
              <span className="ml-1 font-medium">
                {systemStatus.paused ? 'Paused' : 'Downloading'}
              </span>
            </div>
            <div>
              <span className="text-gray-600">Speed:</span>
              <span className="ml-1 font-medium">{formatSpeed(systemStatus.speed)}</span>
            </div>
            <div>
              <span className="text-gray-600">Queue:</span>
              <span className="ml-1 font-medium">
                {systemStatus.queue_size} items ({systemStatus.queue_mb} GB)
              </span>
            </div>
            <div>
              <span className="text-gray-600">ETA:</span>
              <span className="ml-1 font-medium">{systemStatus.timeleft}</span>
            </div>
          </div>

          {/* Speed Chart */}
          <div className="mt-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-gray-700">Download Speed</span>
              <span className="text-sm text-gray-500">
                Current: {formatSpeed(systemStatus.speed)}
              </span>
            </div>
            <div className="flex items-end space-x-1 h-16 bg-gray-50 rounded p-2">
              {speedHistory.map((speed, index) => (
                <div
                  key={index}
                  className="flex-1 bg-blue-500 rounded-sm transition-all duration-300"
                  style={{
                    height: `${(speed / 30) * 100}%`,
                    opacity: 0.7 + (index / speedHistory.length) * 0.3
                  }}
                />
              ))}
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
        {activeTab === 'queue' && queue && (
          <div className="grid gap-4">
            {queue.slots.map((item) => (
              <SabnzbdQueueWidget
                key={item.nzo_id}
                queueItem={item}
                onPause={(nzoId) => handleQueueAction('pause', nzoId)}
                onResume={(nzoId) => handleQueueAction('resume', nzoId)}
                onDelete={(nzoId) => handleQueueAction('delete', nzoId)}
                onMove={(nzoId, position) => handleQueueAction('move', nzoId, position)}
                onChangePriority={(nzoId, priority) => handleQueueAction('priority', nzoId, priority)}
                isLoading={isLoading}
              />
            ))}
            {queue.slots.length === 0 && !isLoading && (
              <div className="text-center py-8 text-gray-500">
                No downloads in queue.
              </div>
            )}
          </div>
        )}

        {activeTab === 'history' && history && (
          <div className="grid gap-4">
            {history.slots.map((item) => (
              <StatusCard
                key={item.nzo_id}
                title={item.nzb_name}
                status="active"
                isLoading={isLoading}
              >
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">{item.status}</span>
                    <span className="px-2 py-1 text-xs bg-green-100 text-green-800 rounded-full">
                      {item.category}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-sm">
                    <div>
                      <span className="text-gray-600">Size:</span>
                      <span className="ml-1 font-medium">{item.size} GB</span>
                    </div>
                    <div>
                      <span className="text-gray-600">Time:</span>
                      <span className="ml-1 font-medium">{item.download_time}</span>
                    </div>
                    <div>
                      <span className="text-gray-600">Completed:</span>
                      <span className="ml-1 font-medium">
                        {new Date(item.completed * 1000).toLocaleDateString()}
                      </span>
                    </div>
                    <div>
                      <span className="text-gray-600">Storage:</span>
                      <span className="ml-1 font-medium text-xs break-all">
                        {item.storage}
                      </span>
                    </div>
                  </div>
                </div>
              </StatusCard>
            ))}
            {history.slots.length === 0 && !isLoading && (
              <div className="text-center py-8 text-gray-500">
                No download history.
              </div>
            )}
          </div>
        )}

        {activeTab === 'categories' && (
          <div className="grid gap-4">
            {categories.map((category) => (
              <StatusCard
                key={category.name}
                title={category.name}
                status="active"
                isLoading={isLoading}
              >
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="text-sm text-gray-600">Directory:</span>
                      <span className="ml-1 font-mono text-xs">{category.dir}</span>
                    </div>
                    <span className="px-2 py-1 text-xs bg-blue-100 text-blue-800 rounded-full">
                      Priority: {category.priority}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-gray-600">Script:</span>
                      <span className="ml-1 font-medium">{category.script || 'None'}</span>
                    </div>
                    <div>
                      <span className="text-gray-600">Post-Processing:</span>
                      <span className="ml-1 font-medium">{category.pp}</span>
                    </div>
                  </div>
                </div>
              </StatusCard>
            ))}
            {categories.length === 0 && !isLoading && (
              <div className="text-center py-8 text-gray-500">
                No categories configured.
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
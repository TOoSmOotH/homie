import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { Card } from '@/components/ui/Card';
import { cn } from '@/utils/cn';
import EmailVerificationBanner from '@/components/EmailVerificationBanner';
import axios from 'axios';
import {
  Server,
  Activity,
  AlertTriangle,
  CheckCircle,
  Clock,
  TrendingUp,
  Plus,
  FileText,
  Bell
} from 'lucide-react';

interface DashboardData {
  totalServices: number;
  activeServices: number;
  inactiveServices: number;
  systemHealth: number;
  recentActivity: Array<{
    id: number;
    message: string;
    time: string;
    type: 'success' | 'error' | 'warning' | 'info';
  }>;
  systemMetrics?: {
    cpu: number;
    memory: number;
    disk: number;
    network: number;
  };
}

const Dashboard: React.FC = () => {
  const navigate = useNavigate();

  // Fetch dashboard data from API
  const { data: dashboardData, isLoading, error } = useQuery<DashboardData>({
    queryKey: ['dashboard'],
    queryFn: async () => {
      const response = await axios.get('/api/dashboard');
      return response.data.data;
    },
    refetchInterval: 30000, // Refresh every 30 seconds
  });

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-1/4 mb-4"></div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-32 bg-gray-200 dark:bg-gray-700 rounded-lg"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-6">
        <Card className="p-6 bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800">
          <div className="flex items-center space-x-3">
            <AlertTriangle className="h-5 w-5 text-red-600 dark:text-red-400" />
            <p className="text-red-800 dark:text-red-200">
              Failed to load dashboard data. Please try refreshing the page.
            </p>
          </div>
        </Card>
      </div>
    );
  }

  // Default empty state data
  const data: DashboardData = dashboardData || {
    totalServices: 0,
    activeServices: 0,
    inactiveServices: 0,
    systemHealth: 100,
    recentActivity: [],
    systemMetrics: {
      cpu: 0,
      memory: 0,
      disk: 0,
      network: 0
    }
  };

  return (
    <div className="space-y-8">
      {/* Email Verification Banner */}
      <EmailVerificationBanner />
      
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">Dashboard</h1>
        <p className="text-gray-600 dark:text-gray-400 mt-2">Overview of your homelab services and system status</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Total Services</p>
              <p className="text-3xl font-bold text-gray-900 dark:text-gray-100">{data.totalServices}</p>
            </div>
            <Server className="h-8 w-8 text-blue-600 dark:text-blue-400" />
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Active Services</p>
              <p className="text-3xl font-bold text-green-600 dark:text-green-400">{data.activeServices}</p>
            </div>
            <CheckCircle className="h-8 w-8 text-green-600 dark:text-green-400" />
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Inactive Services</p>
              <p className="text-3xl font-bold text-red-600 dark:text-red-400">{data.inactiveServices}</p>
            </div>
            <AlertTriangle className="h-8 w-8 text-red-600 dark:text-red-400" />
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">System Health</p>
              <p className="text-3xl font-bold text-blue-600 dark:text-blue-400">{data.systemHealth}%</p>
            </div>
            <Activity className="h-8 w-8 text-blue-600 dark:text-blue-400" />
          </div>
        </Card>
      </div>

      {/* Show empty state if no services configured */}
      {data.totalServices === 0 && (
        <Card className="p-8 text-center">
          <Server className="h-12 w-12 text-gray-400 dark:text-gray-500 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">
            No Services Configured
          </h3>
          <p className="text-gray-600 dark:text-gray-400 mb-4">
            Get started by adding your first service to monitor
          </p>
          <button
            onClick={() => navigate('/services')}
            className="inline-flex items-center px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
          >
            <Plus className="h-4 w-4 mr-2" />
            Add Service
          </button>
        </Card>
      )}

      {/* Show metrics and activity only if there are services */}
      {data.totalServices > 0 && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* System Metrics */}
          {data.systemMetrics && (
            <Card className="p-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">System Metrics</h3>
              <div className="space-y-4">
                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-gray-900 dark:text-gray-100">CPU Usage</span>
                    <span className="text-gray-900 dark:text-gray-100">{data.systemMetrics.cpu}%</span>
                  </div>
                  <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                    <div
                      className={cn(
                        "h-2 rounded-full transition-all",
                        data.systemMetrics.cpu > 80 ? "bg-red-500 dark:bg-red-400" : "bg-green-500 dark:bg-green-400"
                      )}
                      style={{ width: `${data.systemMetrics.cpu}%` }}
                    ></div>
                  </div>
                </div>

                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-gray-900 dark:text-gray-100">Memory Usage</span>
                    <span className="text-gray-900 dark:text-gray-100">{data.systemMetrics.memory}%</span>
                  </div>
                  <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                    <div
                      className={cn(
                        "h-2 rounded-full transition-all",
                        data.systemMetrics.memory > 80 ? "bg-red-500 dark:bg-red-400" : "bg-blue-500 dark:bg-blue-400"
                      )}
                      style={{ width: `${data.systemMetrics.memory}%` }}
                    ></div>
                  </div>
                </div>

                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-gray-900 dark:text-gray-100">Disk Usage</span>
                    <span className="text-gray-900 dark:text-gray-100">{data.systemMetrics.disk}%</span>
                  </div>
                  <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                    <div
                      className={cn(
                        "h-2 rounded-full transition-all",
                        data.systemMetrics.disk > 90 ? "bg-red-500 dark:bg-red-400" : "bg-purple-500 dark:bg-purple-400"
                      )}
                      style={{ width: `${data.systemMetrics.disk}%` }}
                    ></div>
                  </div>
                </div>

                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-gray-900 dark:text-gray-100">Network Usage</span>
                    <span className="text-gray-900 dark:text-gray-100">{data.systemMetrics.network}%</span>
                  </div>
                  <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                    <div
                      className="h-2 bg-gray-500 dark:bg-gray-400 rounded-full transition-all"
                      style={{ width: `${data.systemMetrics.network}%` }}
                    ></div>
                  </div>
                </div>
              </div>
            </Card>
          )}

          {/* Recent Activity */}
          <Card className="p-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">Recent Activity</h3>
            {data.recentActivity.length > 0 ? (
              <div className="space-y-4">
                {data.recentActivity.map((activity) => (
                  <div key={activity.id} className="flex items-start space-x-3">
                    <div className={cn(
                      "flex-shrink-0 w-2 h-2 rounded-full mt-2",
                      activity.type === 'success' ? "bg-green-500 dark:bg-green-400" : 
                      activity.type === 'error' ? "bg-red-500 dark:bg-red-400" :
                      activity.type === 'warning' ? "bg-yellow-500 dark:bg-yellow-400" :
                      "bg-blue-500 dark:bg-blue-400"
                    )} />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 dark:text-gray-100">{activity.message}</p>
                      <div className="flex items-center space-x-2 mt-1">
                        <Clock className="h-3 w-3 text-gray-400 dark:text-gray-500" />
                        <p className="text-xs text-gray-500 dark:text-gray-400">{activity.time}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-500 dark:text-gray-400 text-sm">No recent activity</p>
            )}
          </Card>
        </div>
      )}

      {/* Quick Actions */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">Quick Actions</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <button 
            onClick={() => navigate('/services')}
            className="flex flex-col items-center p-4 rounded-lg border-2 border-dashed border-gray-300 dark:border-gray-600 hover:border-blue-500 dark:hover:border-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors"
          >
            <Plus className="h-8 w-8 text-gray-400 dark:text-gray-500 mb-2" />
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Add Service</span>
          </button>
          <button 
            className="flex flex-col items-center p-4 rounded-lg border-2 border-dashed border-gray-300 dark:border-gray-600 hover:border-blue-500 dark:hover:border-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors"
            disabled
          >
            <TrendingUp className="h-8 w-8 text-gray-400 dark:text-gray-500 mb-2" />
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">View Analytics</span>
          </button>
          <button 
            className="flex flex-col items-center p-4 rounded-lg border-2 border-dashed border-gray-300 dark:border-gray-600 hover:border-blue-500 dark:hover:border-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors"
            disabled
          >
            <FileText className="h-8 w-8 text-gray-400 dark:text-gray-500 mb-2" />
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">System Logs</span>
          </button>
          <button 
            className="flex flex-col items-center p-4 rounded-lg border-2 border-dashed border-gray-300 dark:border-gray-600 hover:border-blue-500 dark:hover:border-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors"
            disabled
          >
            <Bell className="h-8 w-8 text-gray-400 dark:text-gray-500 mb-2" />
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Alerts</span>
          </button>
        </div>
      </Card>
    </div>
  );
};

export default Dashboard;
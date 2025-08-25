import React, { useEffect, useState } from 'react';
import { Card } from '@/components/ui/Card';
import { Film, Download, Calendar, AlertCircle, RefreshCw } from 'lucide-react';
import axios from 'axios';

interface RadarrWidgetProps {
  service: any;
  type: 'queue' | 'upcoming' | 'missing' | 'status';
}

const RadarrWidget: React.FC<RadarrWidgetProps> = ({ service, type }) => {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Check if service has connection config
      if (!service.config?.url || !service.config?.api_key) {
        setError('Service not configured');
        setLoading(false);
        return;
      }

      // Call backend API to fetch Radarr data
      const response = await axios.get(`/api/services/${service.id}/radarr/${type}`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`
        }
      });

      setData(response.data.data);
    } catch (err: any) {
      console.error(`Error fetching Radarr ${type} data:`, err);
      setError(err.response?.data?.error?.message || 'Failed to fetch data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    
    // Refresh based on widget type
    const intervals: Record<string, number> = {
      queue: 10000,      // 10 seconds
      upcoming: 3600000, // 1 hour
      missing: 60000,    // 1 minute
      status: 30000      // 30 seconds
    };

    const interval = setInterval(fetchData, intervals[type] || 60000);
    return () => clearInterval(interval);
  }, [service, type]);

  const renderContent = () => {
    if (loading) {
      return (
        <div className="flex items-center justify-center py-8">
          <RefreshCw className="h-6 w-6 animate-spin text-gray-400" />
        </div>
      );
    }

    if (error) {
      return (
        <div className="flex items-center justify-center py-4 text-sm text-gray-500">
          <AlertCircle className="h-4 w-4 mr-2" />
          {error}
        </div>
      );
    }

    switch (type) {
      case 'queue':
        return (
          <div className="space-y-2">
            {data?.records?.length > 0 ? (
              data.records.slice(0, 5).map((item: any) => (
                <div key={item.id} className="flex items-center justify-between py-2 border-b border-gray-200 dark:border-gray-700 last:border-0">
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-900 dark:text-white">
                      {item.title}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      {item.status} - {Math.round(item.sizeleft / 1024 / 1024)} MB left
                    </p>
                  </div>
                  <div className="text-sm text-blue-600 dark:text-blue-400">
                    {Math.round(item.progress)}%
                  </div>
                </div>
              ))
            ) : (
              <p className="text-sm text-gray-500 dark:text-gray-400">No active downloads</p>
            )}
          </div>
        );

      case 'upcoming':
        return (
          <div className="space-y-2">
            {data?.length > 0 ? (
              data.slice(0, 5).map((movie: any) => (
                <div key={movie.id} className="flex items-center justify-between py-2 border-b border-gray-200 dark:border-gray-700 last:border-0">
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-900 dark:text-white">
                      {movie.title} ({movie.year})
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      {new Date(movie.inCinemas || movie.physicalRelease).toLocaleDateString()}
                    </p>
                  </div>
                  <Calendar className="h-4 w-4 text-gray-400" />
                </div>
              ))
            ) : (
              <p className="text-sm text-gray-500 dark:text-gray-400">No upcoming movies</p>
            )}
          </div>
        );

      case 'missing':
        return (
          <div className="flex items-center justify-between">
            <div>
              <p className="text-3xl font-bold text-gray-900 dark:text-white">
                {data?.totalRecords || 0}
              </p>
              <p className="text-sm text-gray-500 dark:text-gray-400">Missing Movies</p>
            </div>
            <Film className="h-8 w-8 text-gray-400" />
          </div>
        );

      case 'status':
        return (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600 dark:text-gray-400">Version</span>
              <span className="text-sm font-medium text-gray-900 dark:text-white">
                {data?.version || 'Unknown'}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600 dark:text-gray-400">Movies</span>
              <span className="text-sm font-medium text-gray-900 dark:text-white">
                {data?.movieCount || 0}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600 dark:text-gray-400">Health</span>
              <span className={`text-sm font-medium ${
                data?.health?.length > 0 ? 'text-yellow-600' : 'text-green-600'
              }`}>
                {data?.health?.length > 0 ? `${data.health.length} issues` : 'Healthy'}
              </span>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  const titles: Record<string, string> = {
    queue: 'Download Queue',
    upcoming: 'Coming Soon',
    missing: 'Missing Movies',
    status: 'System Status'
  };

  const icons: Record<string, React.ReactNode> = {
    queue: <Download className="h-4 w-4" />,
    upcoming: <Calendar className="h-4 w-4" />,
    missing: <Film className="h-4 w-4" />,
    status: <AlertCircle className="h-4 w-4" />
  };

  return (
    <Card className="p-4">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-semibold text-gray-900 dark:text-white flex items-center gap-2">
          {icons[type]}
          {titles[type]}
        </h3>
        <button
          onClick={fetchData}
          className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
        >
          <RefreshCw className="h-3 w-3" />
        </button>
      </div>
      {renderContent()}
    </Card>
  );
};

export default RadarrWidget;
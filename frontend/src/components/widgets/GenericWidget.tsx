import React, { useEffect, useState } from 'react';
import { Card } from '@/components/ui/Card';
import { RefreshCw, AlertCircle } from 'lucide-react';
import axios from 'axios';

interface WidgetDefinition {
  id: string;
  name: string;
  type: 'list' | 'calendar' | 'stat' | 'info' | 'chart' | 'grid';
  icon?: string;
  size?: 'small' | 'medium' | 'large';
  dataSource: string | string[];
  display: {
    itemTemplate?: any;
    emptyMessage?: string;
    maxItems?: number;
    value?: string;
    label?: string;
    color?: string;
    fields?: Array<{ label: string; value: string }>;
  };
}

interface GenericWidgetProps {
  service: any;
  widget: WidgetDefinition;
  settings?: any;
}

const GenericWidget: React.FC<GenericWidgetProps> = ({ service, widget, settings }) => {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Check if service is configured
      if (!service.config?.url || !service.config?.api_key) {
        setError('Service not configured');
        setLoading(false);
        return;
      }

      // Check if widget should be shown based on settings
      const showWidgetKey = `show_${widget.id}`;
      if (settings && settings[showWidgetKey] === false) {
        setLoading(false);
        return;
      }

      // Determine data sources
      const sources = Array.isArray(widget.dataSource) ? widget.dataSource : [widget.dataSource];
      const results: any = {};

      // Fetch data from each source
      for (const source of sources) {
        try {
          const response = await axios.post(
            `/api/services/${service.id}/data`,
            {
              endpoint: source,
              serviceType: service.definition?.serviceId
            },
            {
              headers: {
                Authorization: `Bearer ${localStorage.getItem('token')}`
              }
            }
          );
          results[source] = response.data.data;
        } catch (sourceError: any) {
          console.error(`Failed to fetch data for source ${source}:`, sourceError);
          // Continue with other sources if one fails
          results[source] = null;
        }
      }

      // If single source, use data directly
      if (sources.length === 1) {
        setData(results[sources[0]]);
      } else {
        setData(results);
      }
    } catch (err: any) {
      console.error(`Error fetching widget data:`, err);
      setError(err.response?.data?.error?.message || 'Failed to fetch data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    
    // Get refresh interval from widget definition or settings
    const refreshInterval = service.definition?.api?.endpoints?.[widget.dataSource]?.refresh || 60000;
    const interval = setInterval(fetchData, refreshInterval);
    
    return () => clearInterval(interval);
  }, [service, widget, settings]);

  const applyTemplate = (template: string, item: any): string => {
    return template.replace(/\{([^}]+)\}/g, (match, key) => {
      const [field, transformer] = key.split('|');
      let value = field.split('.').reduce((obj, k) => obj?.[k], item);
      
      // Apply transformer if specified
      if (transformer && service.definition?.transformers?.[transformer]) {
        try {
          const transformFn = new Function('return ' + service.definition.transformers[transformer])();
          value = transformFn(value);
        } catch (e) {
          console.error('Transform error:', e);
        }
      }
      
      return value ?? '';
    });
  };

  const renderContent = () => {
    if (loading) {
      return (
        <div className="flex items-center justify-center py-4">
          <RefreshCw className="h-5 w-5 animate-spin text-gray-400" />
        </div>
      );
    }

    if (error) {
      return (
        <div className="flex items-center justify-center py-3 text-sm text-gray-500">
          <AlertCircle className="h-4 w-4 mr-2" />
          {error}
        </div>
      );
    }

    switch (widget.type) {
      case 'list':
        const items = Array.isArray(data) ? data : data?.records || [];
        return (
          <div className="space-y-2">
            {items.length > 0 ? (
              items.slice(0, widget.display.maxItems || 5).map((item: any, idx: number) => (
                <div key={idx} className="py-2 border-b border-gray-200 dark:border-gray-700 last:border-0">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-900 dark:text-white">
                        {applyTemplate(widget.display.itemTemplate?.title || '', item)}
                      </p>
                      {widget.display.itemTemplate?.subtitle && (
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                          {applyTemplate(widget.display.itemTemplate.subtitle, item)}
                        </p>
                      )}
                    </div>
                    {widget.display.itemTemplate?.progress && (
                      <div className="text-sm text-blue-600 dark:text-blue-400">
                        {applyTemplate(widget.display.itemTemplate.progress, item)}%
                      </div>
                    )}
                  </div>
                </div>
              ))
            ) : (
              <p className="text-sm text-gray-500 dark:text-gray-400">
                {widget.display.emptyMessage || 'No data'}
              </p>
            )}
          </div>
        );

      case 'stat':
        return (
          <div className="flex items-center justify-between">
            <div>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {applyTemplate(widget.display.value || '{data}', { data })}
              </p>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                {widget.display.label}
              </p>
            </div>
            {widget.icon && (
              <span className="text-2xl">{widget.icon}</span>
            )}
          </div>
        );

      case 'info':
        return (
          <div className="space-y-2">
            {widget.display.fields?.map((field, idx) => (
              <div key={idx} className="flex items-center justify-between">
                <span className="text-sm text-gray-600 dark:text-gray-400">
                  {field.label}
                </span>
                <span className="text-sm font-medium text-gray-900 dark:text-white">
                  {applyTemplate(field.value, data)}
                </span>
              </div>
            ))}
          </div>
        );

      default:
        return <div className="text-sm text-gray-500">Widget type not implemented</div>;
    }
  };

  // Widget size classes
  const sizeClasses = {
    small: 'col-span-1',
    medium: 'col-span-2',
    large: 'col-span-3'
  };

  return (
    <Card className={`p-4 ${sizeClasses[widget.size || 'medium']}`}>
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-semibold text-gray-900 dark:text-white flex items-center gap-2">
          {widget.icon && <span>{widget.icon}</span>}
          {widget.name}
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

export default GenericWidget;
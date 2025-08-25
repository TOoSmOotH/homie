import React, { useEffect, useState } from 'react';
import GenericWidget from '@/components/widgets/GenericWidget';
import { AlertCircle, Settings } from 'lucide-react';
import { Button } from '@/components/ui/Button';

interface ServiceDashboardProps {
  service: any;
  onOpenSettings: () => void;
}

const ServiceDashboard: React.FC<ServiceDashboardProps> = ({ service, onOpenSettings }) => {
  const [settings, setSettings] = useState<any>({});

  useEffect(() => {
    // Load service settings from config
    if (service.config) {
      setSettings(service.config);
    }
  }, [service]);

  // Check if service is configured
  if (!service.config?.url || !service.config?.api_key) {
    return (
      <div className="p-8 text-center">
        <AlertCircle className="h-12 w-12 text-yellow-500 mx-auto mb-4" />
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
          Service Not Configured
        </h3>
        <p className="text-gray-500 dark:text-gray-400 mb-4">
          Please configure the connection settings for {service.name}
        </p>
        <Button onClick={onOpenSettings}>
          <Settings className="h-4 w-4 mr-2" />
          Configure Service
        </Button>
      </div>
    );
  }

  // Get widgets from service definition
  const widgets = service.definition?.widgets || [];

  if (widgets.length === 0) {
    return (
      <div className="p-8 text-center">
        <p className="text-gray-500 dark:text-gray-400">
          No widgets configured for this service
        </p>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="mb-6">
        <h2 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
          <span className="text-2xl">{service.definition?.icon || '📦'}</span>
          {service.name} Dashboard
        </h2>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
          {service.description || service.definition?.description}
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {widgets.map((widget: any) => {
          // Check if widget should be shown based on settings
          const showKey = `show_${widget.id}`;
          if (settings[showKey] === false) {
            return null;
          }

          return (
            <GenericWidget
              key={widget.id}
              service={service}
              widget={widget}
              settings={settings}
            />
          );
        })}
      </div>

      {/* Quick Actions */}
      {service.definition?.quickActions && service.definition.quickActions.length > 0 && (
        <div className="mt-6">
          <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-3">
            Quick Actions
          </h3>
          <div className="flex flex-wrap gap-2">
            {service.definition.quickActions.map((action: any) => (
              <Button
                key={action.id}
                variant="outline"
                size="sm"
                onClick={() => executeAction(action)}
              >
                <span className="mr-2">{action.icon}</span>
                {action.name}
              </Button>
            ))}
          </div>
        </div>
      )}
    </div>
  );

  async function executeAction(action: any) {
    if (action.confirm && !confirm(`Execute action: ${action.name}?`)) {
      return;
    }

    try {
      const response = await fetch(`/api/services/${service.id}/action`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({ actionId: action.id })
      });

      const result = await response.json();
      if (result.success) {
        alert(`Action executed: ${result.message}`);
      } else {
        alert(`Action failed: ${result.error?.message}`);
      }
    } catch (error) {
      console.error('Error executing action:', error);
      alert('Failed to execute action');
    }
  }
};

export default ServiceDashboard;
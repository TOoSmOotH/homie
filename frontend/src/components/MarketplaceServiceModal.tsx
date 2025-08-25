import React from 'react';
import { Button } from '@/components/ui/Button';
import { X, Check, Link2, Key, Globe } from 'lucide-react';

interface ServiceFeature {
  id: string;
  name: string;
  description: string;
  icon: string;
  capabilities: string[];
}

interface ServiceConnection {
  type: string;
  auth: string;
  fields: Array<{
    key: string;
    label: string;
    type: string;
    required: boolean;
    placeholder?: string;
    description?: string;
    default?: any;
  }>;
}

interface MarketplaceService {
  id: string;
  serviceId: string;
  name: string;
  displayName: string;
  version: string;
  author: string;
  description: string;
  longDescription?: string;
  icon: string;
  category: string;
  tags: string[];
  featured: boolean;
  official: boolean;
  features?: ServiceFeature[];
  connection?: ServiceConnection;
  quickActions?: Array<{
    id: string;
    name: string;
    icon: string;
  }>;
}

interface Props {
  service: MarketplaceService;
  onClose: () => void;
  onConnect: (serviceId: string, config?: any) => void;
  isConnecting?: boolean;
}

const MarketplaceServiceModal: React.FC<Props> = ({ 
  service, 
  onClose, 
  onConnect,
  isConnecting = false 
}) => {
  // Debug: Log the service data to see what's being passed
  console.log('MarketplaceServiceModal - Service data:', service);
  
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white dark:bg-gray-800 rounded-lg max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="p-6 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-start justify-between">
            <div className="flex items-center space-x-4">
              <div className="text-4xl">{service.icon}</div>
              <div>
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                  {service.name || service.displayName}
                  {service.official && (
                    <span className="text-xs bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 px-2 py-0.5 rounded-full">
                      Official
                    </span>
                  )}
                </h2>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                  v{service.version} by {service.author}
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 p-2"
            >
              <X className="h-6 w-6" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto">
          <div className="p-6 space-y-6">
            {/* Description */}
            <div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                About
              </h3>
              <p className="text-gray-600 dark:text-gray-300">
                {service.longDescription || service.description}
              </p>
            </div>

            {/* Features */}
            {service.features && service.features.length > 0 && (
              <div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                  Features & Capabilities
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {service.features.map((feature) => (
                    <div 
                      key={feature.id}
                      className="border border-gray-200 dark:border-gray-700 rounded-lg p-4"
                    >
                      <div className="flex items-start space-x-3">
                        <div className="text-2xl flex-shrink-0">{feature.icon}</div>
                        <div className="flex-1">
                          <h4 className="font-medium text-gray-900 dark:text-white">
                            {feature.name}
                          </h4>
                          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                            {feature.description}
                          </p>
                          {feature.capabilities && (
                            <ul className="mt-2 space-y-1">
                              {feature.capabilities.map((capability, idx) => (
                                <li 
                                  key={idx}
                                  className="flex items-start text-sm text-gray-600 dark:text-gray-300"
                                >
                                  <Check className="h-4 w-4 text-green-500 mr-2 mt-0.5 flex-shrink-0" />
                                  {capability}
                                </li>
                              ))}
                            </ul>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Connection Requirements */}
            {service.connection && (
              <div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">
                  Connection Requirements
                </h3>
                <div className="bg-gray-50 dark:bg-gray-900/50 rounded-lg p-4">
                  <div className="flex items-center space-x-2 mb-3">
                    <Link2 className="h-5 w-5 text-gray-500" />
                    <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                      Connection Type: {service.connection.type.toUpperCase()}
                    </span>
                  </div>
                  <div className="flex items-center space-x-2 mb-3">
                    <Key className="h-5 w-5 text-gray-500" />
                    <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                      Authentication: {service.connection.auth.toUpperCase()}
                    </span>
                  </div>
                  <div className="space-y-2 mt-4">
                    <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
                      Required Information:
                    </p>
                    {service.connection.fields.map((field) => (
                      <div key={field.key} className="ml-4">
                        <div className="flex items-start text-sm">
                          <span className="font-medium text-gray-600 dark:text-gray-400 min-w-[100px]">
                            {field.label}:
                          </span>
                          <span className="text-gray-500 dark:text-gray-400 ml-2">
                            {field.description}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Quick Actions */}
            {service.quickActions && service.quickActions.length > 0 && (
              <div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">
                  Quick Actions Available
                </h3>
                <div className="flex flex-wrap gap-2">
                  {service.quickActions.map((action) => (
                    <div 
                      key={action.id}
                      className="flex items-center space-x-2 bg-gray-100 dark:bg-gray-700 px-3 py-2 rounded-lg"
                    >
                      <span className="text-lg">{action.icon}</span>
                      <span className="text-sm text-gray-700 dark:text-gray-300">
                        {action.name}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Tags */}
            <div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">
                Tags
              </h3>
              <div className="flex flex-wrap gap-2">
                {service.tags.map((tag, idx) => (
                  <span
                    key={idx}
                    className="text-sm bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 px-3 py-1 rounded-full"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2 text-sm text-gray-500 dark:text-gray-400">
              <Globe className="h-4 w-4" />
              <span>Connect to your existing {service.name} instance</span>
            </div>
            <div className="flex items-center gap-4">
              <Button
                variant="outline"
                onClick={onClose}
              >
                Cancel
              </Button>
              <Button
                onClick={() => {
                  // Auto-generate name with service display name
                  const autoName = service.displayName || service.name;
                  onConnect(service.serviceId || service.id, {
                    name: autoName
                  });
                }}
                disabled={isConnecting}
              >
                <Link2 className="h-4 w-4 mr-2" />
                {isConnecting ? 'Installing...' : 'Install Service'}
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MarketplaceServiceModal;
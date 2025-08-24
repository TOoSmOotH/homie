import React, { useState, useEffect } from 'react';
import { StatusCard } from '@/components/ui/StatusCard';
import { ServiceControls } from '@/components/ui/ServiceControls';
import { HealthIndicator } from '@/components/ui/HealthIndicator';

export interface ServiceEndpoint {
  id: string;
  name: string;
  type: 'radarr' | 'sonarr' | 'sabnzbd' | 'proxmox' | 'docker';
  baseUrl: string;
  port: number;
  apiKey?: string;
  username?: string;
  password?: string;
  useSSL: boolean;
  enabled: boolean;
  lastHealthCheck?: string;
  healthStatus?: 'healthy' | 'warning' | 'error';
}

export interface ServiceConfigProps {
  onServiceAdd?: (service: Omit<ServiceEndpoint, 'id' | 'lastHealthCheck' | 'healthStatus'>) => Promise<void>;
  onServiceUpdate?: (service: ServiceEndpoint) => Promise<void>;
  onServiceDelete?: (serviceId: string) => Promise<void>;
  onServiceTest?: (service: ServiceEndpoint) => Promise<{ success: boolean; message: string }>;
  className?: string;
}

export const ServiceConfig: React.FC<ServiceConfigProps> = ({
  onServiceAdd,
  onServiceUpdate,
  onServiceDelete,
  onServiceTest,
  className
}) => {
  const [services, setServices] = useState<ServiceEndpoint[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [editingService, setEditingService] = useState<ServiceEndpoint | null>(null);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [testResults, setTestResults] = useState<Record<string, { success: boolean; message: string }>>({});

  // Mock data loading
  useEffect(() => {
    const loadServices = async () => {
      setIsLoading(true);
      try {
        await new Promise(resolve => setTimeout(resolve, 1000));
        // Mock services data
        setServices([
          {
            id: '1',
            name: 'Radarr Main',
            type: 'radarr',
            baseUrl: '192.168.1.100',
            port: 7878,
            apiKey: 'radarr-api-key-123',
            useSSL: false,
            enabled: true,
            lastHealthCheck: '2023-12-01T10:30:00Z',
            healthStatus: 'healthy'
          },
          {
            id: '2',
            name: 'Sabnzbd Main',
            type: 'sabnzbd',
            baseUrl: '192.168.1.100',
            port: 8080,
            apiKey: 'sabnzbd-api-key-456',
            useSSL: false,
            enabled: true,
            lastHealthCheck: '2023-12-01T10:30:00Z',
            healthStatus: 'healthy'
          },
          {
            id: '3',
            name: 'Sonarr Main',
            type: 'sonarr',
            baseUrl: '192.168.1.100',
            port: 8989,
            apiKey: 'sonarr-api-key-789',
            useSSL: false,
            enabled: false,
            lastHealthCheck: '2023-11-30T15:45:00Z',
            healthStatus: 'error'
          }
        ]);
      } catch (error) {
        console.error('Failed to load services:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadServices();
  }, []);

  const handleServiceAction = async (action: string, serviceId: string) => {
    switch (action) {
      case 'edit':
        const service = services.find(s => s.id === serviceId);
        if (service) setEditingService(service);
        break;
      case 'delete':
        if (onServiceDelete) {
          await onServiceDelete(serviceId);
          setServices(prev => prev.filter(s => s.id !== serviceId));
        }
        break;
      case 'test':
        if (onServiceTest) {
          const service = services.find(s => s.id === serviceId);
          if (service) {
            const result = await onServiceTest(service);
            setTestResults(prev => ({ ...prev, [serviceId]: result }));
          }
        }
        break;
      case 'toggle':
        const serviceToToggle = services.find(s => s.id === serviceId);
        if (serviceToToggle && onServiceUpdate) {
          const updatedService = { ...serviceToToggle, enabled: !serviceToToggle.enabled };
          await onServiceUpdate(updatedService);
          setServices(prev => prev.map(s =>
            s.id === serviceId ? updatedService : s
          ));
        }
        break;
    }
  };

  const getServiceTypeIcon = (type: ServiceEndpoint['type']) => {
    const icons = {
      radarr: '🎬',
      sonarr: '📺',
      sabnzbd: '⬇️',
      proxmox: '🖥️',
      docker: '🐳'
    };
    return icons[type];
  };

  const getServiceTypeColor = (type: ServiceEndpoint['type']) => {
    const colors = {
      radarr: 'bg-purple-100 text-purple-800',
      sonarr: 'bg-blue-100 text-blue-800',
      sabnzbd: 'bg-green-100 text-green-800',
      proxmox: 'bg-orange-100 text-orange-800',
      docker: 'bg-cyan-100 text-cyan-800'
    };
    return colors[type];
  };

  const getStatusFromHealth = (healthStatus?: string, enabled?: boolean) => {
    if (!enabled) return 'inactive';
    switch (healthStatus) {
      case 'healthy': return 'active';
      case 'warning': return 'inactive';
      case 'error': return 'error';
      default: return 'inactive';
    }
  };

  const ServiceFormModal = ({ service, onClose, onSave }: {
    service?: ServiceEndpoint | null;
    onClose: () => void;
    onSave: (service: any) => void;
  }) => {
    const [formData, setFormData] = useState({
      name: service?.name || '',
      type: service?.type || 'radarr',
      baseUrl: service?.baseUrl || '',
      port: service?.port || 7878,
      apiKey: service?.apiKey || '',
      username: service?.username || '',
      password: service?.password || '',
      useSSL: service?.useSSL || false,
      enabled: service?.enabled ?? true
    });

    const handleSubmit = (e: React.FormEvent) => {
      e.preventDefault();
      onSave(formData);
      onClose();
    };

    const getDefaultPort = (type: string) => {
      const ports = { radarr: 7878, sonarr: 8989, sabnzbd: 8080, proxmox: 8006, docker: 2376 };
      return ports[type as keyof typeof ports] || 8080;
    };

    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg p-6 w-full max-w-md">
          <h3 className="text-lg font-medium mb-4">
            {service ? 'Edit Service' : 'Add New Service'}
          </h3>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">Name</label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">Type</label>
              <select
                value={formData.type}
                onChange={(e) => setFormData(prev => ({
                  ...prev,
                  type: e.target.value as any,
                  port: getDefaultPort(e.target.value)
                }))}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              >
                <option value="radarr">Radarr</option>
                <option value="sonarr">Sonarr</option>
                <option value="sabnzbd">Sabnzbd</option>
                <option value="proxmox">Proxmox</option>
                <option value="docker">Docker</option>
              </select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Host/IP</label>
                <input
                  type="text"
                  value={formData.baseUrl}
                  onChange={(e) => setFormData(prev => ({ ...prev, baseUrl: e.target.value }))}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Port</label>
                <input
                  type="number"
                  value={formData.port}
                  onChange={(e) => setFormData(prev => ({ ...prev, port: parseInt(e.target.value) }))}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">API Key</label>
              <input
                type="password"
                value={formData.apiKey}
                onChange={(e) => setFormData(prev => ({ ...prev, apiKey: e.target.value }))}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              />
            </div>

            <div className="flex items-center">
              <input
                type="checkbox"
                id="useSSL"
                checked={formData.useSSL}
                onChange={(e) => setFormData(prev => ({ ...prev, useSSL: e.target.checked }))}
                className="rounded border-gray-300 text-blue-600 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              />
              <label htmlFor="useSSL" className="ml-2 text-sm text-gray-700">Use SSL</label>
            </div>

            <div className="flex items-center">
              <input
                type="checkbox"
                id="enabled"
                checked={formData.enabled}
                onChange={(e) => setFormData(prev => ({ ...prev, enabled: e.target.checked }))}
                className="rounded border-gray-300 text-blue-600 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              />
              <label htmlFor="enabled" className="ml-2 text-sm text-gray-700">Enabled</label>
            </div>

            <div className="flex justify-end space-x-3">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700"
              >
                Save
              </button>
            </div>
          </form>
        </div>
      </div>
    );
  };

  const serviceControls = [
    {
      id: 'add',
      label: 'Add Service',
      icon: <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
      </svg>,
      onClick: () => setIsAddModalOpen(true),
      variant: 'success' as const
    }
  ];

  return (
    <div className={`space-y-6 ${className || ''}`}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Service Configuration</h2>
          <p className="text-gray-600">Manage service endpoints and connections</p>
        </div>
        <div className="flex items-center space-x-4">
          <span className="text-sm text-gray-500">
            {services.filter(s => s.enabled).length} of {services.length} enabled
          </span>
        </div>
      </div>

      {/* Service Controls */}
      <StatusCard
        title="Service Management"
        status="active"
      >
        <ServiceControls
          controls={serviceControls}
          size="md"
          orientation="horizontal"
        />
      </StatusCard>

      {/* Services List */}
      <div className="space-y-4">
        {services.map((service) => {
          const controls = [
            {
              id: 'edit',
              label: 'Edit',
              icon: <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
              </svg>,
              onClick: () => handleServiceAction('edit', service.id),
              variant: 'secondary' as const
            },
            {
              id: 'test',
              label: 'Test',
              icon: <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>,
              onClick: () => handleServiceAction('test', service.id),
              variant: 'primary' as const
            },
            {
              id: 'toggle',
              label: service.enabled ? 'Disable' : 'Enable',
              icon: service.enabled ? (
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 5.636a9 9 0 010 12.728m0 0l-2.829-2.829m2.829 2.829L21 21M15.536 8.464a5 5 0 010 7.072m0 0l-2.829-2.829m-4.243 2.829a4.978 4.978 0 01-1.414-2.83m-1.414 2.83L3 21m9-13.5a4.978 4.978 0 00-1.414-2.83M15 9a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
              ) : (
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                </svg>
              ),
              onClick: () => handleServiceAction('toggle', service.id),
              variant: service.enabled ? 'secondary' as const : 'success' as const
            },
            {
              id: 'delete',
              label: 'Delete',
              icon: <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>,
              onClick: () => handleServiceAction('delete', service.id),
              variant: 'danger' as const
            }
          ];

          return (
            <StatusCard
              key={service.id}
              title={
                <div className="flex items-center space-x-2">
                  <span className="text-lg">{getServiceTypeIcon(service.type)}</span>
                  <span>{service.name}</span>
                  <span className={`px-2 py-1 text-xs rounded-full ${getServiceTypeColor(service.type)}`}>
                    {service.type.toUpperCase()}
                  </span>
                </div>
              }
              status={getStatusFromHealth(service.healthStatus, service.enabled)}
              isLoading={isLoading}
            >
              <div className="space-y-3">
                {/* Service Details */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-sm">
                  <div>
                    <span className="text-gray-600">Endpoint:</span>
                    <span className="ml-1 font-mono text-xs">
                      {service.useSSL ? 'https' : 'http'}://{service.baseUrl}:{service.port}
                    </span>
                  </div>
                  <div>
                    <span className="text-gray-600">Status:</span>
                    <span className="ml-1 font-medium">
                      {service.enabled ? 'Enabled' : 'Disabled'}
                    </span>
                  </div>
                  <div>
                    <span className="text-gray-600">Health:</span>
                    <HealthIndicator
                      status={service.healthStatus === 'healthy' ? 'healthy' : service.healthStatus === 'warning' ? 'warning' : 'error'}
                      message={service.healthStatus || 'Unknown'}
                    />
                  </div>
                  <div>
                    <span className="text-gray-600">Last Check:</span>
                    <span className="ml-1 font-mono text-xs">
                      {service.lastHealthCheck ? new Date(service.lastHealthCheck).toLocaleString() : 'Never'}
                    </span>
                  </div>
                </div>

                {/* Test Results */}
                {testResults[service.id] && (
                  <div className={`p-3 rounded-md ${
                    testResults[service.id].success
                      ? 'bg-green-50 border border-green-200'
                      : 'bg-red-50 border border-red-200'
                  }`}>
                    <div className={`text-sm ${
                      testResults[service.id].success ? 'text-green-800' : 'text-red-800'
                    }`}>
                      {testResults[service.id].message}
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
        })}

        {services.length === 0 && !isLoading && (
          <div className="text-center py-8 text-gray-500">
            <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
            </svg>
            <h3 className="mt-2 text-sm font-medium text-gray-900">No services configured</h3>
            <p className="mt-1 text-sm text-gray-500">Get started by adding your first service.</p>
            <div className="mt-6">
              <button
                onClick={() => setIsAddModalOpen(true)}
                className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
              >
                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                Add Service
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Modals */}
      {isAddModalOpen && (
        <ServiceFormModal
          onClose={() => setIsAddModalOpen(false)}
          onSave={async (formData) => {
            if (onServiceAdd) {
              await onServiceAdd(formData);
              // Refresh services list
              window.location.reload();
            }
          }}
        />
      )}

      {editingService && (
        <ServiceFormModal
          service={editingService}
          onClose={() => setEditingService(null)}
          onSave={async (formData) => {
            if (onServiceUpdate) {
              const updatedService = { ...editingService, ...formData };
              await onServiceUpdate(updatedService);
              setServices(prev => prev.map(s =>
                s.id === editingService.id ? updatedService : s
              ));
            }
          }}
        />
      )}
    </div>
  );
};
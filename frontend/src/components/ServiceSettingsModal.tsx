import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/Button';
import { X, Save, RotateCcw, Eye, EyeOff, Wifi, CheckCircle, XCircle } from 'lucide-react';
import axios from 'axios';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { cn } from '@/utils/cn';

interface SettingsField {
  key: string;
  label: string;
  type: 'text' | 'password' | 'number' | 'boolean' | 'select' | 'url' | 'port' | 'path' | 'multiselect';
  default?: any;
  description?: string;
  required?: boolean;
  placeholder?: string;
  min?: number;
  max?: number;
  options?: Array<{ value: string; label: string }> | string;
  depends_on?: string;
  show_if?: boolean;
}

interface SettingsSection {
  id: string;
  name: string;
  icon: string;
  fields: SettingsField[];
}

interface ServiceSettings {
  sections: SettingsSection[];
}

interface Service {
  id: string;
  name: string;
  config?: any;
  definition?: {
    icon?: string;
    displayName?: string;
    manifest?: any;
    settings?: ServiceSettings;
    connection?: {
      fields: SettingsField[];
    };
  };
}

interface Props {
  service: Service;
  onClose: () => void;
}

const ServiceSettingsModal: React.FC<Props> = ({ service, onClose }) => {
  const queryClient = useQueryClient();
  const [activeSection, setActiveSection] = useState<string>('');
  const [settings, setSettings] = useState<Record<string, any>>({});
  const [showPasswords, setShowPasswords] = useState<Record<string, boolean>>({});
  const [hasChanges, setHasChanges] = useState(false);
  const [serviceName, setServiceName] = useState(service.name);
  const [connectionStatus, setConnectionStatus] = useState<'untested' | 'testing' | 'success' | 'failed'>('untested');
  const [vmLoading, setVmLoading] = useState(false);
  const [vms, setVms] = useState<any[]>([]);
  const hasProxmox = !!service.definition?.manifest?.api?.endpoints?.vms;

  // Initialize settings from service config
  useEffect(() => {
    if (service.config) {
      setSettings(service.config);
    }
    
    // Set first section as active - general by default
    setActiveSection('general');
  }, [service]);

  // Save settings mutation
  const saveMutation = useMutation({
    mutationFn: async (updatedSettings: Record<string, any>) => {
      const response = await axios.put(`/api/services/${service.id}`, {
        name: serviceName,
        config: updatedSettings
      });
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['services'] });
      setHasChanges(false);
    }
  });

  const handleFieldChange = (key: string, value: any) => {
    setSettings(prev => ({
      ...prev,
      [key]: value
    }));
    setHasChanges(true);
  };

  const handleSave = () => {
    saveMutation.mutate(settings);
  };

  const handleReset = () => {
    if (service.config) {
      setSettings(service.config);
    }
    setServiceName(service.name);
    setHasChanges(false);
  };

  const togglePasswordVisibility = (key: string) => {
    setShowPasswords(prev => ({
      ...prev,
      [key]: !prev[key]
    }));
  };

  const testConnection = async () => {
    setConnectionStatus('testing');
    try {
      const response = await axios.post(
        `/api/services/${service.id}/test`,
        {},
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem('token')}`
          }
        }
      );
      
      if (response.data.success) {
        setConnectionStatus('success');
        // Refresh services to update status
        queryClient.invalidateQueries({ queryKey: ['services'] });
      } else {
        setConnectionStatus('failed');
      }
    } catch (error) {
      console.error('Connection test failed:', error);
      setConnectionStatus('failed');
    }
  };

  const fetchProxmoxVms = async () => {
    if (!hasProxmox) return;
    setVmLoading(true);
    try {
      const response = await axios.post(`/api/services/${service.id}/data`, { endpoint: 'vms' });
      setVms(response.data.data || []);
    } catch (e) {
      console.error('Failed to load Proxmox VMs', e);
      setVms([]);
    } finally {
      setVmLoading(false);
    }
  };

  useEffect(() => {
    if (hasProxmox) {
      fetchProxmoxVms();
    }
  }, [hasProxmox]);

  const handleVmAction = async (actionId: 'start_vm' | 'stop_vm', vm: any) => {
    try {
      await axios.post(`/api/services/${service.id}/action`, {
        actionId,
        params: {
          node: vm.node,
          vmid: vm.vmid,
          type: vm.type
        }
      });
      await fetchProxmoxVms();
    } catch (e) {
      console.error('VM action failed:', e);
    }
  };

  const renderField = (field: SettingsField) => {
    const value = settings[field.key] ?? field.default ?? '';
    
    // Check if field should be shown based on dependencies
    if (field.depends_on && field.show_if !== undefined) {
      if (settings[field.depends_on] !== field.show_if) {
        return null;
      }
    }

    switch (field.type) {
      case 'boolean':
        return (
          <label className="flex items-center space-x-2 cursor-pointer">
            <input
              type="checkbox"
              checked={value}
              onChange={(e) => handleFieldChange(field.key, e.target.checked)}
              className="h-4 w-4 text-blue-600 rounded focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400"
            />
            <span className="text-sm text-gray-700 dark:text-gray-300">{field.label}</span>
          </label>
        );

      case 'select':
        return (
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              {field.label}
              {field.required && <span className="text-red-500 ml-1">*</span>}
            </label>
            <select
              value={value}
              onChange={(e) => handleFieldChange(field.key, e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:border-transparent"
            >
              {field.options !== 'dynamic' && Array.isArray(field.options) && field.options.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
            {field.description && (
              <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">{field.description}</p>
            )}
          </div>
        );

      case 'multiselect':
        return (
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              {field.label}
              {field.required && <span className="text-red-500 ml-1">*</span>}
            </label>
            <div className="space-y-2 max-h-32 overflow-y-auto border border-gray-300 dark:border-gray-600 rounded-lg p-2">
              {field.options === 'dynamic' ? (
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Options will be loaded from the service
                </p>
              ) : (
                Array.isArray(field.options) && field.options.map((option) => (
                  <label key={option.value} className="flex items-center space-x-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={Array.isArray(value) && value.includes(option.value)}
                      onChange={(e) => {
                        const currentValues = Array.isArray(value) ? value : [];
                        if (e.target.checked) {
                          handleFieldChange(field.key, [...currentValues, option.value]);
                        } else {
                          handleFieldChange(field.key, currentValues.filter(v => v !== option.value));
                        }
                      }}
                      className="h-4 w-4 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
                    />
                    <span className="text-sm text-gray-700 dark:text-gray-300">{option.label}</span>
                  </label>
                ))
              )}
            </div>
            {field.description && (
              <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">{field.description}</p>
            )}
          </div>
        );

      case 'number':
      case 'port':
        return (
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              {field.label}
              {field.required && <span className="text-red-500 ml-1">*</span>}
            </label>
            <input
              type="number"
              value={value}
              onChange={(e) => handleFieldChange(field.key, parseInt(e.target.value) || 0)}
              min={field.min}
              max={field.max}
              placeholder={field.placeholder}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:border-transparent"
            />
            {field.description && (
              <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">{field.description}</p>
            )}
          </div>
        );

      case 'password':
        return (
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              {field.label}
              {field.required && <span className="text-red-500 ml-1">*</span>}
            </label>
            <div className="relative">
              <input
                type={showPasswords[field.key] ? 'text' : 'password'}
                value={value}
                onChange={(e) => handleFieldChange(field.key, e.target.value)}
                placeholder={field.placeholder}
                className="w-full px-3 py-2 pr-10 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:border-transparent"
              />
              <button
                type="button"
                onClick={() => togglePasswordVisibility(field.key)}
                className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
              >
                {showPasswords[field.key] ? (
                  <EyeOff className="h-4 w-4" />
                ) : (
                  <Eye className="h-4 w-4" />
                )}
              </button>
            </div>
            {field.description && (
              <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">{field.description}</p>
            )}
          </div>
        );

      default:
        return (
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              {field.label}
              {field.required && <span className="text-red-500 ml-1">*</span>}
            </label>
            <input
              type="text"
              value={value}
              onChange={(e) => handleFieldChange(field.key, e.target.value)}
              placeholder={field.placeholder}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:border-transparent"
            />
            {field.description && (
              <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">{field.description}</p>
            )}
          </div>
        );
    }
  };

  const allSections = [
    // General settings section (always present)
    {
      id: 'general',
      name: 'General',
      icon: '⚙️',
      fields: []  // Will be handled specially in render
    },
    // Connection settings section
    ...(service.definition?.connection ? [{
      id: 'connection',
      name: 'Connection',
      icon: '🔌',
      fields: service.definition.connection.fields
    }] : []),
    // Other settings sections
    ...(service.definition?.settings?.sections || []),
    // Dynamic Proxmox VM section
    ...(hasProxmox ? [{ id: 'proxmox_vms', name: 'Proxmox VMs', icon: '🖥️', fields: [] as any[] }] : [])
  ];

  // Debug logging
  console.log('ServiceSettingsModal - Service:', service);
  console.log('ServiceSettingsModal - Definition:', service.definition);
  console.log('ServiceSettingsModal - All sections:', allSections);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white dark:bg-gray-800 rounded-lg max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="p-6 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
              <span className="text-2xl">{service.definition?.icon || '⚙️'}</span>
              {service.name} Settings
            </h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
            >
              <X className="h-6 w-6" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex flex-1 overflow-hidden">
          {/* Sidebar */}
          <div className="w-64 bg-gray-50 dark:bg-gray-900 border-r border-gray-200 dark:border-gray-700 overflow-y-auto">
            <nav className="p-4 space-y-2">
              {allSections.map((section) => (
                <button
                  key={section.id}
                  onClick={() => setActiveSection(section.id)}
                  className={`w-full text-left px-4 py-2 rounded-lg flex items-center space-x-3 transition-colors ${
                    activeSection === section.id
                      ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300'
                      : 'hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-700 dark:text-gray-300'
                  }`}
                >
                  <span className="text-xl">{section.icon}</span>
                  <span className="text-sm font-medium">{section.name}</span>
                </button>
              ))}
            </nav>
          </div>

          {/* Settings Panel */}
          <div className="flex-1 overflow-y-auto p-6">
            {allSections.map((section) => (
              <div
                key={section.id}
                className={activeSection === section.id ? 'block' : 'hidden'}
              >
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                  <span className="text-xl">{section.icon}</span>
                  {section.name}
                </h3>
                <div className="space-y-4">
                  {section.id === 'general' ? (
                    // General settings section with service name
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Service Name
                        <span className="text-red-500 ml-1">*</span>
                      </label>
                      <input
                        type="text"
                        value={serviceName}
                        onChange={(e) => {
                          setServiceName(e.target.value);
                          setHasChanges(true);
                        }}
                        placeholder="Enter service name"
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:border-transparent"
                      />
                      <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                        A friendly name to identify this service instance
                      </p>
                    </div>
                  ) : section.id === 'connection' ? (
                    <>
                      {/* Connection fields */}
                      {section.fields.map((field) => (
                        <div key={field.key}>
                          {renderField(field)}
                        </div>
                      ))}
                      
                      {/* Test Connection Button */}
                      <div className="mt-6 pt-6 border-t border-gray-200 dark:border-gray-700">
                        <div className="flex items-center justify-between">
                          <div>
                            <h4 className="text-sm font-medium text-gray-900 dark:text-white">Connection Status</h4>
                            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                              Test the connection to verify your settings are correct
                            </p>
                          </div>
                          <button
                            onClick={testConnection}
                            disabled={!settings.url || connectionStatus === 'testing'}
                            className={cn(
                              "flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors",
                              connectionStatus === 'testing' 
                                ? "bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 cursor-wait"
                                : connectionStatus === 'success'
                                ? "bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300"
                                : connectionStatus === 'failed'
                                ? "bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300"
                                : !settings.url
                                ? "bg-gray-100 dark:bg-gray-800 text-gray-400 dark:text-gray-500 cursor-not-allowed"
                                : "bg-blue-600 hover:bg-blue-700 text-white"
                            )}
                          >
                            {connectionStatus === 'testing' ? (
                              <>
                                <Wifi className="h-4 w-4 animate-pulse" />
                                Testing...
                              </>
                            ) : connectionStatus === 'success' ? (
                              <>
                                <CheckCircle className="h-4 w-4" />
                                Connected
                              </>
                            ) : connectionStatus === 'failed' ? (
                              <>
                                <XCircle className="h-4 w-4" />
                                Failed
                              </>
                            ) : (
                              <>
                                <Wifi className="h-4 w-4" />
                                Test Connection
                              </>
                            )}
                          </button>
                        </div>
                        
                        {/* Connection status message */}
                        {connectionStatus === 'success' && (
                          <div className="mt-3 p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
                            <p className="text-sm text-green-800 dark:text-green-200">
                              ✓ Successfully connected to the service
                            </p>
                          </div>
                        )}
                        
                        {connectionStatus === 'failed' && (
                          <div className="mt-3 p-3 bg-red-50 dark:bg-red-900/20 rounded-lg">
                            <p className="text-sm text-red-800 dark:text-red-200">
                              ✗ Could not connect to the service. Please check your settings.
                            </p>
                          </div>
                        )}
                      </div>
                    </>
                  ) : section.id === 'proxmox_vms' ? (
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <h4 className="text-sm font-medium text-gray-900 dark:text-white">Running VMs</h4>
                        <Button variant="outline" onClick={fetchProxmoxVms} disabled={vmLoading}>
                          {vmLoading ? 'Refreshing…' : 'Refresh'}
                        </Button>
                      </div>
                      {vmLoading ? (
                        <p className="text-sm text-gray-500 dark:text-gray-400">Loading VMs…</p>
                      ) : vms.length === 0 ? (
                        <p className="text-sm text-gray-500 dark:text-gray-400">No VMs found.</p>
                      ) : (
                        <div className="divide-y divide-gray-200 dark:divide-gray-700">
                          {vms.map((vm, idx) => (
                            <div key={idx} className="py-3 flex items-center justify-between">
                              <div>
                                <div className="text-sm font-medium text-gray-900 dark:text-gray-100">{vm.name || `${vm.type?.toUpperCase()} ${vm.vmid}`}</div>
                                <div className="text-xs text-gray-500 dark:text-gray-400">Node: {vm.node} • ID: {vm.vmid} • Status: {vm.status}</div>
                              </div>
                              <div className="flex items-center gap-2">
                                {vm.status === 'running' ? (
                                  <Button variant="outline" onClick={() => handleVmAction('stop_vm', vm)}>Stop</Button>
                                ) : (
                                  <Button onClick={() => handleVmAction('start_vm', vm)}>Start</Button>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  ) : (
                    // Regular fields for other sections
                    section.fields.map((field) => (
                      <div key={field.key}>
                        {renderField(field)}
                      </div>
                    ))
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <div className="text-sm text-gray-500 dark:text-gray-400">
              {hasChanges && "You have unsaved changes"}
            </div>
            <div className="flex items-center gap-4">
              <Button
                variant="outline"
                onClick={handleReset}
                disabled={!hasChanges}
              >
                <RotateCcw className="h-4 w-4 mr-2" />
                Reset
              </Button>
              <Button
                onClick={handleSave}
                disabled={!hasChanges || saveMutation.isPending}
              >
                <Save className="h-4 w-4 mr-2" />
                {saveMutation.isPending ? 'Saving...' : 'Save Changes'}
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ServiceSettingsModal;

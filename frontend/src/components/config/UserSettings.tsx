import React, { useState, useEffect } from 'react';
import { StatusCard } from '@/components/ui/StatusCard';
import { ServiceControls } from '@/components/ui/ServiceControls';

export interface UserPreferences {
  theme: 'light' | 'dark' | 'auto';
  dashboardLayout: 'grid' | 'list';
  refreshInterval: number;
  notifications: {
    enabled: boolean;
    types: {
      serviceStatus: boolean;
      downloadComplete: boolean;
      healthWarnings: boolean;
      systemAlerts: boolean;
    };
  };
  display: {
    itemsPerPage: number;
    compactView: boolean;
    showHealthIndicators: boolean;
    showQuickActions: boolean;
  };
}

export interface AppSettings {
  port: number;
  logLevel: 'error' | 'warn' | 'info' | 'debug';
  enableCors: boolean;
  enableHttps: boolean;
  backupEnabled: boolean;
  backupInterval: number;
  backupPath: string;
}

export interface UserSettingsProps {
  onPreferencesUpdate?: (preferences: UserPreferences) => Promise<void>;
  onAppSettingsUpdate?: (settings: AppSettings) => Promise<void>;
  className?: string;
}

export const UserSettings: React.FC<UserSettingsProps> = ({
  onPreferencesUpdate,
  onAppSettingsUpdate,
  className
}) => {
  const [activeTab, setActiveTab] = useState<'preferences' | 'app' | 'security'>('preferences');
  const [preferences, setPreferences] = useState<UserPreferences>({
    theme: 'auto',
    dashboardLayout: 'grid',
    refreshInterval: 30,
    notifications: {
      enabled: true,
      types: {
        serviceStatus: true,
        downloadComplete: true,
        healthWarnings: true,
        systemAlerts: true
      }
    },
    display: {
      itemsPerPage: 20,
      compactView: false,
      showHealthIndicators: true,
      showQuickActions: true
    }
  });

  const [appSettings, setAppSettings] = useState<AppSettings>({
    port: 3000,
    logLevel: 'info',
    enableCors: true,
    enableHttps: false,
    backupEnabled: true,
    backupInterval: 24,
    backupPath: '/backups'
  });

  const [isLoading, setIsLoading] = useState(false);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');

  // Load settings on component mount
  useEffect(() => {
    const loadSettings = async () => {
      // In real implementation, this would load from backend
      await new Promise(resolve => setTimeout(resolve, 500));
    };
    loadSettings();
  }, []);

  const handlePreferencesChange = (newPreferences: Partial<UserPreferences>) => {
    setPreferences(prev => ({ ...prev, ...newPreferences }));
    setSaveStatus('idle');
  };

  const handleAppSettingsChange = (newSettings: Partial<AppSettings>) => {
    setAppSettings(prev => ({ ...prev, ...newSettings }));
    setSaveStatus('idle');
  };

  const handleSavePreferences = async () => {
    setIsLoading(true);
    setSaveStatus('saving');
    try {
      if (onPreferencesUpdate) {
        await onPreferencesUpdate(preferences);
      }
      setSaveStatus('saved');
      setTimeout(() => setSaveStatus('idle'), 2000);
    } catch (error) {
      setSaveStatus('error');
      console.error('Failed to save preferences:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSaveAppSettings = async () => {
    setIsLoading(true);
    setSaveStatus('saving');
    try {
      if (onAppSettingsUpdate) {
        await onAppSettingsUpdate(appSettings);
      }
      setSaveStatus('saved');
      setTimeout(() => setSaveStatus('idle'), 2000);
    } catch (error) {
      setSaveStatus('error');
      console.error('Failed to save app settings:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const tabs = [
    { id: 'preferences', label: 'User Preferences' },
    { id: 'app', label: 'Application Settings' },
    { id: 'security', label: 'Security & Privacy' }
  ];

  const getSaveButtonText = () => {
    switch (saveStatus) {
      case 'saving': return 'Saving...';
      case 'saved': return 'Saved!';
      case 'error': return 'Error Saving';
      default: return 'Save Changes';
    }
  };

  const getSaveButtonVariant = () => {
    switch (saveStatus) {
      case 'saving': return 'secondary' as const;
      case 'saved': return 'success' as const;
      case 'error': return 'danger' as const;
      default: return 'primary' as const;
    }
  };

  return (
    <div className={`space-y-6 ${className || ''}`}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Settings</h2>
          <p className="text-gray-600">Manage your preferences and application configuration</p>
        </div>
      </div>

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
            </button>
          ))}
        </nav>
      </div>

      {/* Tab Content */}
      <div className="space-y-6">
        {activeTab === 'preferences' && (
          <div className="space-y-6">
            {/* Appearance */}
            <StatusCard
              title="Appearance"
              status="active"
            >
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Theme
                  </label>
                  <select
                    value={preferences.theme}
                    onChange={(e) => handlePreferencesChange({
                      theme: e.target.value as UserPreferences['theme']
                    })}
                    className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  >
                    <option value="light">Light</option>
                    <option value="dark">Dark</option>
                    <option value="auto">Auto (System)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Dashboard Layout
                  </label>
                  <select
                    value={preferences.dashboardLayout}
                    onChange={(e) => handlePreferencesChange({
                      dashboardLayout: e.target.value as UserPreferences['dashboardLayout']
                    })}
                    className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  >
                    <option value="grid">Grid</option>
                    <option value="list">List</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Refresh Interval (seconds)
                  </label>
                  <input
                    type="number"
                    value={preferences.refreshInterval}
                    onChange={(e) => handlePreferencesChange({
                      refreshInterval: parseInt(e.target.value)
                    })}
                    min="5"
                    max="300"
                    className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  />
                </div>
              </div>
            </StatusCard>

            {/* Display Options */}
            <StatusCard
              title="Display Options"
              status="active"
            >
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Items Per Page
                  </label>
                  <input
                    type="number"
                    value={preferences.display.itemsPerPage}
                    onChange={(e) => handlePreferencesChange({
                      display: { ...preferences.display, itemsPerPage: parseInt(e.target.value) }
                    })}
                    min="5"
                    max="100"
                    className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  />
                </div>

                <div className="space-y-3">
                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      id="compactView"
                      checked={preferences.display.compactView}
                      onChange={(e) => handlePreferencesChange({
                        display: { ...preferences.display, compactView: e.target.checked }
                      })}
                      className="rounded border-gray-300 text-blue-600 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                    />
                    <label htmlFor="compactView" className="ml-2 text-sm text-gray-700">
                      Compact View
                    </label>
                  </div>

                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      id="showHealthIndicators"
                      checked={preferences.display.showHealthIndicators}
                      onChange={(e) => handlePreferencesChange({
                        display: { ...preferences.display, showHealthIndicators: e.target.checked }
                      })}
                      className="rounded border-gray-300 text-blue-600 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                    />
                    <label htmlFor="showHealthIndicators" className="ml-2 text-sm text-gray-700">
                      Show Health Indicators
                    </label>
                  </div>

                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      id="showQuickActions"
                      checked={preferences.display.showQuickActions}
                      onChange={(e) => handlePreferencesChange({
                        display: { ...preferences.display, showQuickActions: e.target.checked }
                      })}
                      className="rounded border-gray-300 text-blue-600 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                    />
                    <label htmlFor="showQuickActions" className="ml-2 text-sm text-gray-700">
                      Show Quick Actions
                    </label>
                  </div>
                </div>
              </div>
            </StatusCard>

            {/* Notifications */}
            <StatusCard
              title="Notifications"
              status="active"
            >
              <div className="space-y-4">
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="notificationsEnabled"
                    checked={preferences.notifications.enabled}
                    onChange={(e) => handlePreferencesChange({
                      notifications: { ...preferences.notifications, enabled: e.target.checked }
                    })}
                    className="rounded border-gray-300 text-blue-600 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  />
                  <label htmlFor="notificationsEnabled" className="ml-2 text-sm font-medium text-gray-700">
                    Enable Notifications
                  </label>
                </div>

                {preferences.notifications.enabled && (
                  <div className="ml-6 space-y-3">
                    <div className="flex items-center">
                      <input
                        type="checkbox"
                        id="serviceStatus"
                        checked={preferences.notifications.types.serviceStatus}
                        onChange={(e) => handlePreferencesChange({
                          notifications: {
                            ...preferences.notifications,
                            types: { ...preferences.notifications.types, serviceStatus: e.target.checked }
                          }
                        })}
                        className="rounded border-gray-300 text-blue-600 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                      />
                      <label htmlFor="serviceStatus" className="ml-2 text-sm text-gray-700">
                        Service Status Changes
                      </label>
                    </div>

                    <div className="flex items-center">
                      <input
                        type="checkbox"
                        id="downloadComplete"
                        checked={preferences.notifications.types.downloadComplete}
                        onChange={(e) => handlePreferencesChange({
                          notifications: {
                            ...preferences.notifications,
                            types: { ...preferences.notifications.types, downloadComplete: e.target.checked }
                          }
                        })}
                        className="rounded border-gray-300 text-blue-600 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                      />
                      <label htmlFor="downloadComplete" className="ml-2 text-sm text-gray-700">
                        Download Completions
                      </label>
                    </div>

                    <div className="flex items-center">
                      <input
                        type="checkbox"
                        id="healthWarnings"
                        checked={preferences.notifications.types.healthWarnings}
                        onChange={(e) => handlePreferencesChange({
                          notifications: {
                            ...preferences.notifications,
                            types: { ...preferences.notifications.types, healthWarnings: e.target.checked }
                          }
                        })}
                        className="rounded border-gray-300 text-blue-600 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                      />
                      <label htmlFor="healthWarnings" className="ml-2 text-sm text-gray-700">
                        Health Warnings
                      </label>
                    </div>

                    <div className="flex items-center">
                      <input
                        type="checkbox"
                        id="systemAlerts"
                        checked={preferences.notifications.types.systemAlerts}
                        onChange={(e) => handlePreferencesChange({
                          notifications: {
                            ...preferences.notifications,
                            types: { ...preferences.notifications.types, systemAlerts: e.target.checked }
                          }
                        })}
                        className="rounded border-gray-300 text-blue-600 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                      />
                      <label htmlFor="systemAlerts" className="ml-2 text-sm text-gray-700">
                        System Alerts
                      </label>
                    </div>
                  </div>
                )}
              </div>
            </StatusCard>

            {/* Save Button */}
            <div className="flex justify-end">
              <button
                onClick={handleSavePreferences}
                disabled={isLoading}
                className={`px-4 py-2 text-sm font-medium rounded-md ${
                  saveStatus === 'saved'
                    ? 'bg-green-600 text-white'
                    : saveStatus === 'error'
                    ? 'bg-red-600 text-white'
                    : 'bg-blue-600 text-white hover:bg-blue-700'
                } disabled:opacity-50`}
              >
                {getSaveButtonText()}
              </button>
            </div>
          </div>
        )}

        {activeTab === 'app' && (
          <div className="space-y-6">
            {/* Server Settings */}
            <StatusCard
              title="Server Settings"
              status="active"
            >
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Port
                  </label>
                  <input
                    type="number"
                    value={appSettings.port}
                    onChange={(e) => handleAppSettingsChange({
                      port: parseInt(e.target.value)
                    })}
                    min="1"
                    max="65535"
                    className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Log Level
                  </label>
                  <select
                    value={appSettings.logLevel}
                    onChange={(e) => handleAppSettingsChange({
                      logLevel: e.target.value as AppSettings['logLevel']
                    })}
                    className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  >
                    <option value="error">Error</option>
                    <option value="warn">Warning</option>
                    <option value="info">Info</option>
                    <option value="debug">Debug</option>
                  </select>
                </div>

                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="enableCors"
                    checked={appSettings.enableCors}
                    onChange={(e) => handleAppSettingsChange({
                      enableCors: e.target.checked
                    })}
                    className="rounded border-gray-300 text-blue-600 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  />
                  <label htmlFor="enableCors" className="ml-2 text-sm text-gray-700">
                    Enable CORS
                  </label>
                </div>

                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="enableHttps"
                    checked={appSettings.enableHttps}
                    onChange={(e) => handleAppSettingsChange({
                      enableHttps: e.target.checked
                    })}
                    className="rounded border-gray-300 text-blue-600 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  />
                  <label htmlFor="enableHttps" className="ml-2 text-sm text-gray-700">
                    Enable HTTPS
                  </label>
                </div>
              </div>
            </StatusCard>

            {/* Backup Settings */}
            <StatusCard
              title="Backup Settings"
              status="active"
            >
              <div className="space-y-4">
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="backupEnabled"
                    checked={appSettings.backupEnabled}
                    onChange={(e) => handleAppSettingsChange({
                      backupEnabled: e.target.checked
                    })}
                    className="rounded border-gray-300 text-blue-600 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  />
                  <label htmlFor="backupEnabled" className="ml-2 text-sm font-medium text-gray-700">
                    Enable Automatic Backups
                  </label>
                </div>

                {appSettings.backupEnabled && (
                  <div className="ml-6 grid grid-cols-1 sm:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Backup Interval (hours)
                      </label>
                      <input
                        type="number"
                        value={appSettings.backupInterval}
                        onChange={(e) => handleAppSettingsChange({
                          backupInterval: parseInt(e.target.value)
                        })}
                        min="1"
                        max="168"
                        className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Backup Path
                      </label>
                      <input
                        type="text"
                        value={appSettings.backupPath}
                        onChange={(e) => handleAppSettingsChange({
                          backupPath: e.target.value
                        })}
                        className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                      />
                    </div>
                  </div>
                )}
              </div>
            </StatusCard>

            {/* Save Button */}
            <div className="flex justify-end">
              <button
                onClick={handleSaveAppSettings}
                disabled={isLoading}
                className={`px-4 py-2 text-sm font-medium rounded-md ${
                  saveStatus === 'saved'
                    ? 'bg-green-600 text-white'
                    : saveStatus === 'error'
                    ? 'bg-red-600 text-white'
                    : 'bg-blue-600 text-white hover:bg-blue-700'
                } disabled:opacity-50`}
              >
                {getSaveButtonText()}
              </button>
            </div>
          </div>
        )}

        {activeTab === 'security' && (
          <div className="space-y-6">
            <StatusCard
              title="Security & Privacy"
              status="active"
            >
              <div className="space-y-6">
                <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-md">
                  <div className="flex">
                    <div className="ml-3">
                      <h3 className="text-sm font-medium text-yellow-800">
                        Security Notice
                      </h3>
                      <div className="mt-2 text-sm text-yellow-700">
                        <p>
                          API keys and sensitive configuration data are encrypted at rest.
                          Ensure you keep your application updated and use strong passwords.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                <div>
                  <h4 className="text-sm font-medium text-gray-900 mb-3">Data Privacy</h4>
                  <div className="space-y-3 text-sm text-gray-600">
                    <p>• Service credentials are encrypted and stored locally</p>
                    <p>• No personal data is transmitted to external services</p>
                    <p>• All communication with home lab services stays within your network</p>
                    <p>• Log files can be configured to exclude sensitive information</p>
                  </div>
                </div>

                <div>
                  <h4 className="text-sm font-medium text-gray-900 mb-3">Security Best Practices</h4>
                  <div className="space-y-3 text-sm text-gray-600">
                    <p>• Use HTTPS when accessing the application remotely</p>
                    <p>• Keep your services updated with the latest security patches</p>
                    <p>• Use strong API keys and rotate them regularly</p>
                    <p>• Monitor access logs for unauthorized attempts</p>
                    <p>• Consider using VPN for remote access to your home lab</p>
                  </div>
                </div>
              </div>
            </StatusCard>
          </div>
        )}
      </div>
    </div>
  );
};
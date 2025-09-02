import React, { useEffect, useState } from 'react';
import { StatusCard } from '@/components/ui/StatusCard';

export interface AppSettings {
  port: number;
  logLevel: 'error' | 'warn' | 'info' | 'debug';
  enableCors: boolean;
  enableHttps: boolean;
  backupEnabled: boolean;
  backupInterval: number;
  backupPath: string;
}

interface SystemSettingsProps {
  onAppSettingsUpdate?: (settings: AppSettings) => Promise<void>;
  className?: string;
}

export const SystemSettings: React.FC<SystemSettingsProps> = ({ onAppSettingsUpdate, className }) => {
  const [activeTab, setActiveTab] = useState<'app' | 'security'>('app');
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

  useEffect(() => {
    const load = async () => {
      await new Promise((r) => setTimeout(r, 300));
    };
    load();
  }, []);

  const handleAppSettingsChange = (changes: Partial<AppSettings>) => {
    setAppSettings((prev) => ({ ...prev, ...changes }));
    setSaveStatus('idle');
  };

  const handleSaveAppSettings = async () => {
    setIsLoading(true);
    setSaveStatus('saving');
    try {
      if (onAppSettingsUpdate) await onAppSettingsUpdate(appSettings);
      setSaveStatus('saved');
      setTimeout(() => setSaveStatus('idle'), 2000);
    } catch (e) {
      console.error(e);
      setSaveStatus('error');
    } finally {
      setIsLoading(false);
    }
  };

  const getSaveButtonText = () => {
    switch (saveStatus) {
      case 'saving':
        return 'Saving...';
      case 'saved':
        return 'Saved!';
      case 'error':
        return 'Error Saving';
      default:
        return 'Save Changes';
    }
  };

  return (
    <div className={`space-y-6 ${className || ''}`}>
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Settings</h2>
          <p className="text-gray-600 dark:text-gray-400">Manage your application configuration</p>
        </div>
      </div>

      <div className="border-b border-gray-200 dark:border-gray-700">
        <nav className="flex space-x-8">
          <button
            onClick={() => setActiveTab('app')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'app'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Application Settings
          </button>
          <button
            onClick={() => setActiveTab('security')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'security'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Security & Privacy
          </button>
        </nav>
      </div>

      <div className="space-y-6">
        {activeTab === 'app' && (
          <div className="space-y-6">
            <StatusCard title="Server Settings" status="active">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Port</label>
                  <input
                    type="number"
                    value={appSettings.port}
                    onChange={(e) => handleAppSettingsChange({ port: parseInt(e.target.value) })}
                    min="1"
                    max="65535"
                    className="block w-full rounded-md border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 px-3 py-2 text-sm text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-primary-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Log Level</label>
                  <select
                    value={appSettings.logLevel}
                    onChange={(e) => handleAppSettingsChange({ logLevel: e.target.value as AppSettings['logLevel'] })}
                    className="block w-full rounded-md border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 px-3 py-2 text-sm text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-primary-500"
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
                    onChange={(e) => handleAppSettingsChange({ enableCors: e.target.checked })}
                    className="rounded border-gray-300 text-blue-600 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  />
                  <label htmlFor="enableCors" className="ml-2 text-sm text-gray-700 dark:text-gray-300">Enable CORS</label>
                </div>

                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="enableHttps"
                    checked={appSettings.enableHttps}
                    onChange={(e) => handleAppSettingsChange({ enableHttps: e.target.checked })}
                    className="rounded border-gray-300 text-blue-600 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  />
                  <label htmlFor="enableHttps" className="ml-2 text-sm text-gray-700 dark:text-gray-300">Enable HTTPS</label>
                </div>
              </div>
            </StatusCard>

            <StatusCard title="Backup Settings" status="active">
              <div className="space-y-4">
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="backupEnabled"
                    checked={appSettings.backupEnabled}
                    onChange={(e) => handleAppSettingsChange({ backupEnabled: e.target.checked })}
                    className="rounded border-gray-300 text-blue-600 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  />
                  <label htmlFor="backupEnabled" className="ml-2 text-sm font-medium text-gray-700 dark:text-gray-300">
                    Enable Automatic Backups
                  </label>
                </div>

                {appSettings.backupEnabled && (
                  <div className="ml-6 grid grid-cols-1 sm:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Backup Interval (hours)</label>
                      <input
                        type="number"
                        value={appSettings.backupInterval}
                        onChange={(e) => handleAppSettingsChange({ backupInterval: parseInt(e.target.value) })}
                        min="1"
                        max="168"
                        className="block w-full rounded-md border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 px-3 py-2 text-sm text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-primary-500"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Backup Path</label>
                      <input
                        type="text"
                        value={appSettings.backupPath}
                        onChange={(e) => handleAppSettingsChange({ backupPath: e.target.value })}
                        className="block w-full rounded-md border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 px-3 py-2 text-sm text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-primary-500"
                      />
                    </div>
                  </div>
                )}
              </div>
            </StatusCard>

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
            <StatusCard title="Security & Privacy" status="active">
              <div className="space-y-6">
                <div className="p-4 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-md">
                  <div className="ml-1">
                    <h3 className="text-sm font-medium text-yellow-800 dark:text-yellow-200">Security Notice</h3>
                    <div className="mt-2 text-sm text-yellow-700 dark:text-yellow-300">
                      <p>API keys and sensitive configuration data are encrypted at rest. Keep Homie updated and use strong passwords.</p>
                    </div>
                  </div>
                </div>

                <div>
                  <h4 className="text-sm font-medium text-gray-900 dark:text-gray-100 mb-3">Data Privacy</h4>
                  <div className="space-y-3 text-sm text-gray-600 dark:text-gray-400">
                    <p>• Service credentials are encrypted and stored locally</p>
                    <p>• No personal data is transmitted to external services</p>
                    <p>• All communication with home lab services stays within your network</p>
                    <p>• Log files can be configured to exclude sensitive information</p>
                  </div>
                </div>

                <div>
                  <h4 className="text-sm font-medium text-gray-900 dark:text-gray-100 mb-3">Security Best Practices</h4>
                  <div className="space-y-3 text-sm text-gray-600 dark:text-gray-400">
                    <p>• Use HTTPS when accessing the application remotely</p>
                    <p>• Keep services updated with the latest security patches</p>
                    <p>• Use strong API keys and rotate them regularly</p>
                    <p>• Monitor access logs for unauthorized attempts</p>
                    <p>• Consider VPN for remote access</p>
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

export default SystemSettings;

